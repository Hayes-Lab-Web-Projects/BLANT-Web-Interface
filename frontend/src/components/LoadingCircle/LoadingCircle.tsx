// src/components/LoadingCircle.tsx
import React from 'react';
import './LoadingCircle.css';

interface LoadingCircleProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  className?: string;
}

const LoadingCircle: React.FC<LoadingCircleProps> = ({ 
  size = 'medium', 
  color = '#3b82f6', 
  text,
  className = '' 
}) => {
  return (
    <div className={`loading-circle-container ${className}`} role="status" aria-live="polite">
      <div 
        className={`loading-circle loading-circle--${size}`}
        style={{ '--loading-color': color } as React.CSSProperties}
        aria-label="Loading"
        aria-hidden="false"
      >
        {/* <div className="loading-circle__spinner"></div> */}
      </div>
      {text && <p className="loading-circle__text">{text}</p>}
      <span className="sr-only">Loading, please wait</span>
    </div>
  );
};

export default LoadingCircle;
