// src/components/AccordionSection.tsx
import React from 'react';
import './AccordionSection.css';

interface AccordionSectionProps {
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean; // New prop to lock the section
  onClick: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  isActive,
  isCompleted,
  isLocked,
  onClick,
  children,
}) => {
  const sectionClasses = [
    'as-section',
    isActive ? 'as-active' : '',
    isCompleted ? 'as-completed' : '',
    isLocked ? 'as-locked' : '', // Add new class if locked
  ]
    .join(' ')
    .trim();

  // Only allow clicks if the section is completed AND not locked
  const isClickable = isCompleted && !isLocked;

  return (
    <div className={sectionClasses}>
      <button
        className="as-header"
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        aria-expanded={isActive}
        aria-controls={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        aria-disabled={!isClickable}
      >
        <span>{title}</span>
        <span aria-hidden="true">{isActive ? '▲' : isCompleted ? '▼' : ''}</span>
      </button>
      {isActive && (
        <div 
          id={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="as-content"
          role="region"
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionSection;
