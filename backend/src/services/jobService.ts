import { createHash, randomBytes } from 'crypto';
import { preprocess } from './preprocess';
import path from 'path';
import HttpError from '../middlewares/HttpError';
import { JobData, MulterFile, UploadedFiles } from '../../types/types';
import { addJobToQueue } from '../config/queue';

const _validateCreateJob = (file: MulterFile, networkFullName: string, extension: string): void => {

    if (!networkFullName) {
        throw new HttpError('Invalid file names: network must have valid names', { status: 400 });
    }
    const networkName = networkFullName.substring(0, networkFullName.lastIndexOf('.'));

    if (!networkName) {
        throw new HttpError(
            `Failed to extract network names from file: ${networkFullName}`, 
            { status: 400 }
        );
    }
    if (!extension) {
        throw new HttpError(`Invalid file extension for network: ${file.originalname}`, { status: 400 });
    }
};

/**
 * Creates a new job with the provided files and options
 * @param files The uploaded network files
 * @param density The density to run BLANT in
 * @param graphletSize The size of the graphlet to use for the job
 * @returns JobData or RedirectResponse
 */
const createJob = async (
    file: MulterFile,
    density: number,
    graphletSize: number,
    fractionalOverlap: number,
    email: string

): Promise<JobData> => {

    const networkFullName = file.originalname;
    const networkName = networkFullName.substring(0, networkFullName.lastIndexOf('.'));
    const timestamp = Date.now();
    const jobId = createHash('md5')
        .update(`${timestamp}-${networkName}`)
        .digest('hex');
    const extension = path.extname(file.originalname).toLowerCase();

    _validateCreateJob(file, networkFullName, extension);

    // Create job data
    const jobData: JobData = {
        id: jobId,
        status: 'preprocessing',
        jobLocation: `./process/${jobId}`, 
        extension,
        networkName,
        density,
        graphletSize,
        fractionalOverlap,
        email: email || null,
        attempts: 0,
        execLogFileOutput: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    console.log(`Created job data:`, JSON.stringify(jobData, null, 2));
    
    try {
        await preprocess(file, jobData);
        addJobToQueue(jobId, jobData);
        console.log('Preprocessing completed successfully');
        return jobData;
    } catch (error: any) {
        throw new HttpError(
            `Error during preprocessing: ${error.message}`,
            { status: 500, errorLog: error.stack }
        );
    }
};


/**
 * Creates a Basic BLANT Run job (`./blant -k <k> network.el`).
 * Reuses the same preprocessing (job folder + network copy) as community detection.
 * `k` must already be validated by the controller.
 */
const createBasicBlantRunJob = async (file: MulterFile, k: number): Promise<JobData> => {
    const networkFullName = file.originalname;
    const networkName = networkFullName.substring(0, networkFullName.lastIndexOf('.'));
    const extension = path.extname(file.originalname).toLowerCase();
    // Random component so two uploads of the same file in the same millisecond can't collide.
    const jobId = createHash('md5')
        .update(`${Date.now()}-${networkName}-${randomBytes(8).toString('hex')}`)
        .digest('hex');

    _validateCreateJob(file, networkFullName, extension);

    const jobData: JobData = {
        id: jobId,
        status: 'preprocessing',
        tool: 'basicBlantRun',
        k,
        jobLocation: `./process/${jobId}`,
        extension,
        networkName,
        email: null,
        attempts: 0,
        execLogFileOutput: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    try {
        await preprocess(file, jobData);
        // Run once: a failure (bad network, timeout) won't be fixed by retrying.
        await addJobToQueue(jobId, jobData, { attempts: 1 });
        return jobData;
    } catch (error: any) {
        throw new HttpError(
            `Error during preprocessing: ${error.message}`,
            { status: 500, errorLog: error.stack }
        );
    }
};

export { createJob, createBasicBlantRunJob };
