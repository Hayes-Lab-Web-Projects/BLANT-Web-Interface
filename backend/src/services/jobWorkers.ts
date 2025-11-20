import { Worker, Job } from 'bullmq';
import { JobData } from '../../types/types';
import IORedis from 'ioredis';
import { spawn } from 'child_process';
import fs from 'fs';
import { updateJobInQueue } from '../config/queue';
import * as path from 'path';
require('dotenv').config();

console.log("Worker started");

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD,
});

const blantDirectory = process.env.BLANT_DIRECTORY;
const worker = new Worker('jobQueue', async (job: Job) => {
        console.log("Worker Started Processing Job: ", job.id);
        await jobWorker(job.id, job.data);
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

// Simple validation to ensure input is safe for shell execution (must be a number/simple string)
const sanitizeShellInput = (input: any): string => {
    const s = String(input);
    // Basic check: only allow simple characters, numbers, dots, and hyphens.
    // If complex paths/filenames are expected, this must be more robust.
    if (/^[a-zA-Z0-9.\-/_]+$/.test(s)) {
        return s;
    }
    // If validation fails, return a safe, empty string or throw error.
    console.warn(`Unsafe input detected and sanitized: ${s}`);
    return ''; 
};

const jobWorker = async (jobId: string, jobData: JobData) => {

        // Construct absolute paths
        const safeJobData = {
            networkName: sanitizeShellInput(jobData.networkName),
            extension: sanitizeShellInput(jobData.extension),
            graphletSize: sanitizeShellInput(jobData.graphletSize),
            fractionalOverlap: sanitizeShellInput(jobData.fractionalOverlap),
            density: sanitizeShellInput(jobData.density),
        }
        const safeJobId = sanitizeShellInput(jobId);


        const networkDir = path.resolve(`./process/${safeJobId}`, 'networks', `${safeJobData.networkName}${safeJobData.extension}`);

        const outputFile = path.resolve(`./process/${safeJobId}`, 'blant_runtime.log');

        const optionString = `cd ${blantDirectory} && source ./setup.sh && stdbuf -oL -eL ./scripts/blant-clusters.sh` 
                             + ` -o ${safeJobData.fractionalOverlap} ./blant ${safeJobData.graphletSize} ${safeJobData.density} ${networkDir}`;
        
        console.log(`Executing command for job ${safeJobId}:`, optionString);
        
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
                console.log(`Job ${safeJobId} stdout data.toString():`, data.toString());
                console.log(`Job ${safeJobId} stdout data:`, data);
                // logStream.write(data);
                writeToStream(data);
                await updateJobInQueue(safeJobId, { execLogFileOutput: stdout });
            });
            
            child.stderr.on('data', async (data: Buffer) => {
                stdout += data.toString();
                console.warn(`Job ${safeJobId} stderr:`, data.toString());
                logStream.write(data);
                await updateJobInQueue(safeJobId, { execLogFileOutput: stdout });
            });
            
            child.on('close', (code) => {
                logStream.end();
                if (code === 0) {
                    console.log(`Job ${safeJobId} completed successfully with code ${code}`);
                    resolve({ success: true, stdout });
                } else {
                    console.error(`Job ${safeJobId} failed with code ${code}`);
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                console.error(`Job ${safeJobId} error:`, error);
                logStream.end();
                reject(error);
            });
        });

}

export { worker, jobWorker };