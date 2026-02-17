// src/pages/LookupJob.tsx
import React, { useState, useEffect, useRef, } from 'react';
import { useNavigate } from "react-router";
import { useParams } from 'react-router-dom';
import './LookupJob.css';
import api from '../../api/api';
import LoadingCircle from '../../components/LoadingCircle';


const LookupJob: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [jobId, setJobId] = useState('');
  const [searchJobId, setSearchJobId] = useState('');
  const [jobOutput, setJobOutput] = useState<string | null>(null);
  const [responseComplete, setResponseComplete] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set the jobId from URL parameter if it exists
  async function getJobStatus(id: string) {
    console.log('getting job status for id:', id);
    const result = await api.getJobStatus(id);
    console.log('Job Result:', result);
    if (result.status === 'success') {
      setJobOutput(result.data.execLogFileOutput);
      setResponseComplete(true);
      console.log("Clearing interval...")
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else if (result.status === 'processing' && result.execLogFileOutput) {
      // setTimeout(() => getJobStatus(id), 3000); // query again in 3 seconds
      setJobOutput(result.execLogFileOutput);
    } else if (result.status === 'waiting'){
      setJobOutput(`${result.message} Please come back later.`)
    } else if (result.status === 'error') {
      setResponseComplete(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }

  useEffect(() => {
    console.log('useEffect id:', id);
    if (id) {
      setJobId(id);
      getJobStatus(id);
      
      // Set up interval to poll job status
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        getJobStatus(id);
      }, 3000);
    } else {
      setJobId('');
      setJobOutput(null);
      setSearchJobId('');
    }

    // Cleanup function to clear interval on unmount or when id changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api.getJobStatus(searchJobId);

    if (result.status === 'error') {
      alert(result.error.message);
    } else { // only go to /lookup-job/[jobId] if the job exists
      setJobId(() => searchJobId);
      navigate(`/lookup-job/${searchJobId}`);
    }
  };


  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(jobOutput || '');
    setCopied(true);
  };

  const handleCancelJob = async () => {
    console.log('handleCancelJob jobId:', jobId);
    const result = await api.cancelJob(jobId);
    console.log('Job Result:', result);
    if (result.status === 'success') {
      alert('Job cancelled successfully');
      navigate(`/lookup-job`);
    } else {
      alert(result.error.message);
    }
  };

  return (
    <div className="lj-pageContainer">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {jobOutput && responseComplete ? 'Job completed' : jobOutput ? 'Job processing' : ''}
      </div>
      {
        jobId === '' && (
          <div className="lj-lookupBox">
            <h2 className="lj-title">Job Lookup</h2>
            <form onSubmit={handleSubmit} aria-label="Job lookup form">
              <div className="lj-formGroup">
                <label htmlFor="jobId" className="lj-label">Job ID To Search For:</label>
                <input
                  type="text"
                  id="jobId"
                  className="lj-input"
                  placeholder="Previous Job ID"
                  value={searchJobId}
                  onChange={(e) => setSearchJobId(e.target.value)}
                  aria-required="true"
                  aria-describedby="job-id-description"
                />
                <span id="job-id-description" className="sr-only">Enter the job ID from a previously submitted job</span>
              </div>
              <button type="submit" className="lj-submitButton" aria-label="Search for job">
                {
                  jobOutput === null && id != undefined ? (
                    <>
                      <LoadingCircle />
                      <span className="sr-only">Loading job status</span>
                    </>
                  ) : (
                    'Submit'
                  )
                }
              </button>
            </form>
            {
              jobOutput === null && id != undefined && (
                <div className="lj-output" role="status" aria-live="polite">
                  <h3 className="lj-outputTitle">Job Output</h3>
                  <p>Job is still being processed...</p>
                </div>
              )
            }
          </div>
        )
      }
      {
        jobId !== '' && jobOutput === null && (
          <div role="status" aria-live="polite" aria-atomic="true">
            <h1> Processing Job... </h1> 
            {
              !responseComplete && (
                <button onClick={handleCancelJob} aria-label="Cancel current job"> Cancel Job </button>
              )
            }
            <LoadingCircle />
            <span className="sr-only">Job is being processed, please wait</span>
          </div>
        )
      }
      
      {
          jobOutput && (
            <div className="lj-output" role="region" aria-label="Job output">
              <h3 className="lj-outputTitle">
                Job Output
                 {
                   copied ? (
                     <svg id='lj-checkbox' width="20" height="20" viewBox="0 0 24 24" fill="black" style={{marginLeft: '10px'}} aria-label="Copied to clipboard" role="img">
                       <title>Copied to clipboard</title>
                       <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                     </svg>
                   ) : (
                      <button 
                        onClick={handleCopyToClipboard} 
                        className="lj-copyIcon" 
                        aria-label="Copy job output to clipboard"
                        style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.2em', marginLeft: '10px'}}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="black" aria-hidden="true">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                      </button>
                   )
                 }
                
              </h3>
              <p> Job ID: <strong>{jobId}</strong></p> 
              {
                !responseComplete && (
                  <button onClick={handleCancelJob} aria-label="Cancel current job"> Cancel Job </button>
                )
              }
              <pre className="lj-outputContent" aria-label="Job output content">{jobOutput}</pre>
            </div>
          )
      }
    </div>
  );
};

export default LookupJob;
