// src/components/BasicBlantRunOutput/BasicBlantRunOutput.tsx
// Shows a Basic BLANT Run job on the Lookup page: the results (blant's stdout) on top,
// and blant's "Note:" progress messages (stderr) in a collapsible log underneath.
import React, { useState } from 'react';
import './BasicBlantRunOutput.css';

export type BasicBlantRunState = 'running' | 'done' | 'failed';

interface BasicBlantRunOutputProps {
  jobId: string;
  state: BasicBlantRunState;
  results: string;
  progress: string;
  failureMessage?: string | null;
  onCancel?: () => void;
}

// blant's default output is one "<estimated count> <graphlet ID>" pair per line.
// Returns the rows, or null if the output isn't in that shape (then it is shown as plain text).
const parseResults = (results: string): [string, string][] | null => {
  const lines = results.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const rows: [string, string][] = [];
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length !== 2) return null;
    rows.push([parts[0], parts[1]]);
  }
  return rows;
};

const BasicBlantRunOutput: React.FC<BasicBlantRunOutputProps> = ({
  jobId, state, results, progress, failureMessage, onCancel,
}) => {
  const [copied, setCopied] = useState(false);
  const rows = parseResults(results);

  const handleCopy = () => {
    navigator.clipboard.writeText(results);
    setCopied(true);
  };

  return (
    <div className="bbr-container" role="region" aria-label="Basic BLANT Run job output">
      <h2 className="bbr-title">Basic BLANT Run</h2>
      <p className="bbr-jobId">Job ID: <strong>{jobId}</strong></p>

      {state === 'running' && (
        <div className="bbr-status" role="status" aria-live="polite">
          BLANT is running… results will appear here when it finishes.
          {onCancel && (
            <button onClick={onCancel} className="bbr-cancel" aria-label="Cancel current job">Cancel Job</button>
          )}
        </div>
      )}
      {state === 'failed' && (
        <div className="bbr-status bbr-status-failed" role="alert">
          {failureMessage || 'BLANT stopped with an error. See the progress log below.'}
        </div>
      )}

      <section className="bbr-section" aria-labelledby="bbr-results-heading">
        <div className="bbr-sectionHeader">
          <h3 id="bbr-results-heading">Results</h3>
          {results.trim() && (
            <button onClick={handleCopy} className="bbr-copy" aria-label="Copy results to clipboard">
              {copied ? 'Copied ✓' : 'Copy results'}
            </button>
          )}
        </div>

        {rows ? (
          <>
            <p className="bbr-hint">
              Each row is one graphlet type: how many times it appears in your network (estimated by
              sampling, so the numbers can vary slightly between runs) and BLANT's ID for that graphlet.
            </p>
            <div className="bbr-tableWrap">
              <table className="bbr-table">
                <thead>
                  <tr>
                    <th scope="col">Count (estimated)</th>
                    <th scope="col">Graphlet ID</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([count, id], i) => (
                    <tr key={i}>
                      <td>{count}</td>
                      <td>{id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : results.trim() ? (
          <pre className="bbr-pre" aria-label="Results">{results}</pre>
        ) : (
          <p className="bbr-empty">
            {state === 'running' ? 'Waiting for BLANT…' : 'BLANT did not produce any results.'}
          </p>
        )}
      </section>

      <details className="bbr-section bbr-progress" open={state !== 'done'}>
        <summary>Progress log {progress ? `(${progress.trim().split('\n').length} lines)` : ''}</summary>
        <pre className="bbr-pre" aria-label="Progress log">{progress || 'No progress messages yet.'}</pre>
      </details>
    </div>
  );
};

export default BasicBlantRunOutput;
