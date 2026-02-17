// src/pages/SubmitJobPage.tsx
import React from 'react';
import './SubmitJob.css';
import NetworkSelection from '../../components/NetworkSelection';
import Options from '../../components/Options';
import Processing from '../../components/Processing';
import { useJobSubmission } from '../../context/JobSubmissionContext';
import { useNavigate } from 'react-router-dom';

const SubmitJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    blantOptions, 
    handleSubmit, 
    handleFileInputChange,
    handleBlantOptionsChange,
    isSubmitted,
    setIsSubmitted,
    email,
    setEmail,
    notifyCompletion,
    setNotifyCompletion,
  } = useJobSubmission();

  const handleSubmitJob = async () => {
      setIsSubmitted(true);
      try {
        await handleSubmit();
      } catch (error) {
        alert(String(error));
      }
      setIsSubmitted(false);

  }

  const handleBackToHome = () => {
    navigate('/');
  }

  const JobSubmissionMenu = (
    <div className="sjp-accordion" role="region" aria-label="Job submission form">
      <NetworkSelection 
        onDataChange={handleFileInputChange}
      />
        <div className="sjp-checkboxContainer" style={{ marginBottom: "1em" }}> 
          <label className="sjp-checkboxLabel">
            <input
              type="checkbox"
              checked={notifyCompletion}
              onChange={(e) => setNotifyCompletion(e.target.checked)}
              aria-describedby="email-notification-description"
            />
            Email me when the job is completed
          </label>
          <span id="email-notification-description" className="sr-only">Check this box to receive an email notification when your job completes</span>
        </div>
        {
          notifyCompletion && (
            <div className="sjp-emailContainer">
              <label htmlFor="email-input" className="sr-only">Email address for job completion notification</label>
              <input
                type="email"
                id="email-input"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                className="sjp-emailInput"
                placeholder="Enter your email"
                required
                aria-required="true"
                aria-label="Email address for job completion notification"
              />
            </div>
          )
        }

        <Options 
        onDataChange={handleBlantOptionsChange}
        initialData={blantOptions}
        />
        <div className="sjp-buttonContainer" role="group" aria-label="Form actions">
          <button onClick={handleBackToHome} className="os-navButton os-navButton-previous" aria-label="Return to home page">&larr; Back to Home </button>
          <button onClick={handleSubmitJob} className="os-navButton" aria-label="Submit job for processing">Submit &rarr;</button>
      </div>
    </div>
  )

  return (
    <div className="sjp-submitJobPage">
      <h1 className="sjp-pageTitle">Community Detection</h1>

      {
        isSubmitted ? (
          <div className="sjp-accordion" role="status" aria-live="polite" aria-atomic="true">
            <Processing />
          </div>
        ) : (
          JobSubmissionMenu
        )
      }
    </div>
  );
};

export default SubmitJobPage;
