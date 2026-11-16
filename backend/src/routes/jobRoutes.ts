import { Router } from 'express';
import {
    uploadMiddleware,
    validateSingleFileMiddleware,
    cleanupFileErrorHandler,
} from '../middlewares/upload';
import {
    // getJobResults,
    getJobStatus,
    submitJobController,
    submitBasicBlantRunController,
    cancelJob,
} from '../controllers/jobController';

const router: Router = Router();

router.post(
    '/preprocess',
    uploadMiddleware,
    validateSingleFileMiddleware,
    cleanupFileErrorHandler,
);

// Single endpoint for job submission that handles preprocessing and queueing
router.post(
    '/submitJob',
    uploadMiddleware, // uploads the file to the tmp directory and validates the extension, size, and format (fileFilter runs automatically once for each uploaded file)
    validateSingleFileMiddleware, // validates if the request contains a file to begin with, throws and error if not
    submitJobController,
    // cleanupFileErrorHandler,
);

// Basic BLANT Run: ./blant -k <k> network.el
// Same upload rules as community detection (.el only, 5 MB, one file).
router.post(
    '/submitBasicBlantRun',
    uploadMiddleware,
    validateSingleFileMiddleware,
    submitBasicBlantRunController,
);

router.post(
    '/cancelJob/:id',
    cancelJob,
);

router.get('/status/:id', getJobStatus);

// router.get('/cancelJob/:id', cancelJobController);

// Future endpoints
// router.get('/:id/zip', downloadZipJob);
// router.get('/:id', getJobResults);
// router.get('/api/jobs', lookupJobsController); <-- for admin page in future

export default router;
