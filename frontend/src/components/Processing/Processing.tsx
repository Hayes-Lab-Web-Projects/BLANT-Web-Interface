// src/components/Processing.tsx
import React from 'react';
import './Processing.css'; // We will create this CSS file next
import LoadingCircle from '../LoadingCircle';

const Processing: React.FC = () => {
  return (
    <div className="pr-stepContainer" role="status" aria-live="polite" aria-atomic="true">
      <LoadingCircle />
      <h3 className="pr-statusText">Submitting Job...</h3>
      <span className="sr-only">Please wait while your job is being submitted</span>
    </div>
  );
};

export default Processing;
