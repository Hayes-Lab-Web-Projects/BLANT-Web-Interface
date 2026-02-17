// src/components/Options.tsx
import React from 'react';
import './Options.css';
import { useState } from 'react'
import type { blantOptions } from '../../types/types';
import AccordionSection from '../AccordionSection';

interface OptionsProps {
  onDataChange: (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>, optionName: keyof blantOptions) => void;
  initialData: blantOptions;
}

const Options: React.FC<OptionsProps> = ({ onDataChange, initialData }) => {

  const [isActive, setIsActive] = useState<boolean>(false);
  return (
    <>
    <AccordionSection
      title="Advanced Options"
      isActive={isActive}
      isCompleted={true}
      isLocked={false}
      onClick={() => {setIsActive(!isActive);}}
    >

      <div className="os-stepContainer">
        <div className="os-optionsContainer">
          <div className="os-optionsGrid">
            <div className="os-inputGroup">
              <label htmlFor="graphletSize" className="os-labelWithInfo">
                Graphlet Size
                <span className="os-infoIcon" role="button" tabIndex={0} aria-label="Information about graphlet size">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">i</text>
                  </svg>
                  <span className="os-infoTooltip" role="tooltip">The number of nodes in the graphlets to sample (3-7) </span>
                </span>
              </label>
              <select 
                id="graphletSize" 
                className="os-selectInput" 
                value={initialData.graphletSize || 4} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onDataChange(e, 'graphletSize')}
                aria-label="Graphlet size selection"
                aria-describedby="graphlet-size-description"
              >
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
              </select>
              <span id="graphlet-size-description" className="sr-only">Select the number of nodes in the graphlets to sample, between 3 and 7</span>
            </div>
          </div>
          <div className="os-optionsGrid">
              <div className="os-inputGroup">
                <label htmlFor="density" className="os-labelWithInfo">
                  Edge Density
                  <span className="os-infoIcon" role="button" tabIndex={0} aria-label="Information about edge density">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">i</text>
                    </svg>
                    <span className="os-infoTooltip" role="tooltip">Lower bound on the edge density for communities to discover,<br />produces overlapping communities.</span>
                  </span>
                </label>
                <input 
                  type="number" 
                  id="density" 
                  className="os-numberInput" 
                  defaultValue={initialData.density} 
                  onChange={(e) => onDataChange(e, 'density')}
                  aria-label="Edge density"
                  aria-describedby="density-description"
                />
                <span id="density-description" className="sr-only">Lower bound on the edge density for communities to discover, produces overlapping communities</span>
              </div>
          </div>
          <div className="os-optionsGrid">
              <div className="os-inputGroup">
                <label htmlFor="fractionalOverlap" className="os-labelWithInfo">
                  Fractional Overlap
                  <span className="os-infoIcon" role="button" tabIndex={0} aria-label="Information about fractional overlap">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">i</text>
                    </svg>
                    <span className="os-infoTooltip" role="tooltip">Maximum allowed fractional overlap between a new cluster and any one previously discovered cluster <br/> (it can overlap by more than this with MULTIPLE previous clusters). If it overlaps more than this with any ONE previous cluster, it is discarded</span>
                  </span>
                </label>
                <input 
                  type="number" 
                  id="fractionalOverlap" 
                  className="os-numberInput" 
                  defaultValue={initialData.fractionalOverlap} 
                  onChange={(e) => onDataChange(e, 'fractionalOverlap')}
                  aria-label="Fractional overlap"
                  aria-describedby="fractional-overlap-description"
                />
                <span id="fractional-overlap-description" className="sr-only">Maximum allowed fractional overlap between a new cluster and any one previously discovered cluster. It can overlap by more than this with multiple previous clusters. If it overlaps more than this with any one previous cluster, it is discarded</span>
              </div>
          </div>
        </div>
      </div>
    </AccordionSection>
    
    </>
  );
};

export default Options;