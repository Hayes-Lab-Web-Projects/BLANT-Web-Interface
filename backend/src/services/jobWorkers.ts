import { Worker, Job } from 'bullmq';
import { JobData, BASIC_BLANT_RUN_K_MIN, BASIC_BLANT_RUN_K_MAX } from '../../types/types';
import IORedis from 'ioredis';
import { spawn } from 'child_process';
import fs from 'fs';
import { getJobFromQueue, updateJobInQueue } from '../config/queue';
import * as path from 'path';
import nodemailer from 'nodemailer';

require('dotenv').config();

console.log("Worker started");

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD,
});

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
});

const sendEmail = (recipientEmail: string, subject: string, text: string) => {
  const mailOptions = {
      from: `BLANT Hayes Lab <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,   
      text: text,
  };
  transporter.sendMail(mailOptions).catch((error) => {
      console.error(`Error sending email:`, error);
  });
}

const blantDirectory = process.env.BLANT_DIRECTORY;
const worker = new Worker('jobQueue', async (job: Job) => {
        console.log("Worker Started Processing Job: ", job.id);
        if (job.data.tool === 'basicBlantRun') {
            await basicBlantRunWorker(job.id, job.data);
        } else {
            // community detection (also jobs queued before `tool` existed)
            await jobWorker(job.id, job.data);
        }
        console.log("Worker Completed Job: ", job.id);
    },
    {
        connection,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
        concurrency: 1,
        useWorkerThreads: true,
    },
);

worker.on('failed', (job: Job | undefined, error: Error, prev: string) => {

    console.error(`Job failed:`, { jobId: job?.id, error: error.message, prev });
});

worker.on('completed', (job: Job, returnvalue: any) => {

    console.log(`Job completed:`, { jobId: job.id, returnvalue });
});  

const jobWorker = async (jobId: string, jobData: JobData) => {

        // Construct absolute paths

        const networkDir = path.resolve(`./process/${jobId}`, 'networks', `${jobData.networkName}${jobData.extension}`);

        const outputFile = path.resolve(`./process/${jobId}`, 'blant_runtime.log');

        const optionString = `cd ${blantDirectory} && source ./setup.sh && stdbuf -oL -eL ./scripts/blant-clusters.sh` 
                             + ` -o ${jobData.fractionalOverlap} ./blant ${jobData.graphletSize} ${jobData.density} ${networkDir}`;
        
        console.log(`Executing command for job ${jobId}:`, optionString);
        
        return new Promise((resolve, reject) => {
            const child = spawn('/bin/bash', ['-c', optionString]);
            const logStream = fs.createWriteStream(outputFile, { flags: 'a', autoClose: false });

            let stdout = '';
            // let stderr = '';
            let fileDescriptor: number | null = null;
            let streamReady = true;

            logStream.on('open', (fd: number) => {
                fileDescriptor = fd;
            });

            const writeToStream = (data: Buffer) => {
                if (streamReady) {
                    streamReady = logStream.write(data);
                    if (fileDescriptor) {
                        fs.fdatasync(fileDescriptor, (err) => {
                            if (err) throw err;
                            console.log('Data flushed to disk.');
                
                            // wstream.end(); // Close the stream after flushing
                        });
                    }
                        
                    if (!streamReady) {
                        logStream.once('drain', () => {
                            streamReady = true;
                        });
                    }
                }
            };

            child.stdout.on('data', async (data: Buffer) => {
                const dataStr = data.toString();
                stdout += dataStr;
                // Optional: log in real-time
                console.log(`Job ${jobId} stdout data.toString():`, data.toString());
                console.log(`Job ${jobId} stdout data:`, data);
                // logStream.write(data);
                writeToStream(data);
                await updateJobInQueue(jobId, { execLogFileOutput: stdout });
            });
            
            child.stderr.on('data', async (data: Buffer) => {
                stdout += data.toString();
                console.warn(`Job ${jobId} stderr:`, data.toString());
                logStream.write(data);
                await updateJobInQueue(jobId, { execLogFileOutput: stdout });
            });
            
            child.on('close', async (code) => {
                logStream.end();
                const job = await getJobFromQueue(jobId);
                const email = job?.data.email;
                if (email) {
                    sendEmail(email, `[BLANT Hayes Lab] Job Completed (${jobId})`, `Job completed successfully with code ${code}. View the results here: https://hayeslab.ics.uci.edu/blant/lookup-job/${jobId}`);
                }

                if (code === 0) {
                    console.log(`Job ${jobId} completed successfully with code ${code}`);
                    resolve({ success: true, stdout });
                } else {
                    console.error(`Job ${jobId} failed with code ${code}`);
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                console.error(`Job ${jobId} error:`, error);
                logStream.end();
                reject(error);
            });
        });

}

// ---------------------------------------------------------------------------
// Basic BLANT Run: ./blant -k <k> network.el
// ---------------------------------------------------------------------------

const BASIC_BLANT_RUN_TIMEOUT_MS = 10 * 60 * 1000;   // kill blant after 10 minutes
const MAX_LIVE_OUTPUT_CHARS = 1_000_000;             // cap on output kept in Redis (full output stays in the log file)
const LIVE_OUTPUT_UPDATE_MS = 1000;                  // push output to Redis at most once a second

const basicBlantRunWorker = async (jobId: string, jobData: JobData) => {
    // Second safety check: never run blant with an unexpected k, even if the queue data was tampered with.
    const k = jobData.k;
    if (!Number.isInteger(k) || k < BASIC_BLANT_RUN_K_MIN || k > BASIC_BLANT_RUN_K_MAX) {
        throw new Error(`Invalid k for job ${jobId}: ${k}`);
    }
    if (!blantDirectory) {
        throw new Error('BLANT_DIRECTORY is not set.');
    }

    // Paths are built only from the server-generated job ID and the name multer accepted.
    const jobDir = path.resolve('./process', jobId);
    const networkPath = path.join(jobDir, 'networks', `${jobData.networkName}${jobData.extension}`);
    if (!networkPath.startsWith(jobDir + path.sep) || !fs.existsSync(networkPath)) {
        throw new Error(`Network file for job ${jobId} not found.`);
    }
    const outputFile = path.join(jobDir, 'blant_runtime.log');

    // Arguments are passed as an array: no shell, so nothing in them can be run as a command.
    const args = ['-k', String(k), networkPath];
    console.log(`Basic BLANT Run job ${jobId}: ./blant ${args.join(' ')} (cwd ${blantDirectory})`);

    return new Promise((resolve, reject) => {
        const child = spawn('./blant', args, {
            cwd: blantDirectory,
            // setup.sh is not needed for plain `blant -k` (it only adds helper-script folders to PATH),
            // but BLANT_HOME tells blant where its canon_maps lookup tables are.
            env: { ...process.env, BLANT_HOME: blantDirectory },
            timeout: BASIC_BLANT_RUN_TIMEOUT_MS,
            killSignal: 'SIGKILL',
        });
        const logStream = fs.createWriteStream(outputFile, { flags: 'a' });

        let output = '';
        let settled = false;
        let pendingUpdate: NodeJS.Timeout | null = null;
        let lastUpdate = 0;

        const pushOutput = () => {
            pendingUpdate = null;
            lastUpdate = Date.now();
            updateJobInQueue(jobId, { execLogFileOutput: output }).catch((err) =>
                console.error(`Job ${jobId}: could not update output in queue:`, err),
            );
        };

        const onData = (data: Buffer) => {
            logStream.write(data);
            output += data.toString();
            if (output.length > MAX_LIVE_OUTPUT_CHARS) {
                output = output.slice(-MAX_LIVE_OUTPUT_CHARS);
            }
            if (!pendingUpdate) {
                const wait = Math.max(0, LIVE_OUTPUT_UPDATE_MS - (Date.now() - lastUpdate));
                pendingUpdate = setTimeout(pushOutput, wait);
            }
        };

        child.stdout.on('data', onData);
        child.stderr.on('data', onData);

        const finish = (error: Error | null) => {
            if (settled) return;
            settled = true;
            if (pendingUpdate) clearTimeout(pendingUpdate);
            updateJobInQueue(jobId, { execLogFileOutput: output })
                .catch((err) => console.error(`Job ${jobId}: could not update output in queue:`, err))
                .finally(() => {
                    logStream.end(() => (error ? reject(error) : resolve({ success: true })));
                });
        };

        child.on('error', (error) => {
            console.error(`Job ${jobId} could not start blant:`, error);
            logStream.write(`\nCould not start BLANT: ${error.message}\n`);
            finish(error);
        });

        child.on('close', (code, signal) => {
            if (code === 0) {
                console.log(`Job ${jobId} completed successfully`);
                finish(null);
            } else if (signal === 'SIGKILL') {
                const message = `BLANT run timed out after ${BASIC_BLANT_RUN_TIMEOUT_MS / 60000} minutes.`;
                logStream.write(`\n${message}\n`);
                output += `\n${message}\n`;
                finish(new Error(message));
            } else {
                console.error(`Job ${jobId} failed with code ${code}`);
                finish(new Error(`blant exited with code ${code}`));
            }
        });
    });
};

export { worker, jobWorker, basicBlantRunWorker };