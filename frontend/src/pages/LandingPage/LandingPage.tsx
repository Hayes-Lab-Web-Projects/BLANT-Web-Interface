// src/components/LandingPage.tsx
import React from 'react';
import './LandingPage.css'; // Make sure your CSS is imported
import BlantImage from '../../../public/blant.png';
import { useNavigate } from 'react-router';



const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const goToLookupJob = () => {
    navigate("/lookup-job");
  }

  return (
    <div className="landing-page">
      <h1>Welcome to the BLANT Web Interface</h1>
      <img
        src={BlantImage}
        alt="Network graph examples showing different graphlet patterns used in BLANT analysis"
        className="landing-image"
      />
      <div className='landing-page-buttons' role="group" aria-label="Main actions">
        <button onClick={goToLookupJob} className='os-navButton' aria-label="Navigate to lookup a previous job page">Lookup a Job</button>
      </div>
      
      <div className="info-text">
        <p>
          BLANT stands for <a href="https://academic.oup.com/bioinformatics/article/35/24/5363/5542947" target="_blank" rel="noopener noreferrer" aria-label="BLANT paper on Basic Local Alignment of Network Topology (opens in new tab)">Basic Local Alignment of Network Topology</a>.
          It is intended to form the basis of a seed-and-extend local alignment algorithm, but for networks: given an undirected network
          G, and a value of k, it samples connected k-node subgraphs called k-graphlets.
          More information about BLANT is available in the <a href="/blant/about" aria-label="About BLANT section"> About section </a> or our <a href="https://www.liebertpub.com/doi/abs/10.1089/cmb.2025.0095" target="_blank" rel="noopener noreferrer" aria-label="BLANT research paper (opens in new tab)">paper</a> on BLANT.
        </p>
        <h2> Web Tools </h2>
        <ul>
          <li>
            <a href="/blant/submit-job" aria-label="Community Detection tool">Community Detection Tool</a>, as described
            in our <a href="https://www.liebertpub.com/doi/abs/10.1089/cmb.2025.0095" target="_blank" rel="noopener noreferrer" aria-label="Community detection paper (opens in new tab)">paper</a>
          </li>
          <li> <a href="/blant/basic-blant-run" aria-label="Basic BLANT Run tool">Basic BLANT Run</a>: run <code>blant -k</code> on your own network </li>
          <li> Other BLANT-based tools will become available soon </li>
        </ul>
        <p>
          The most recent version of BLANT is always available on <a href="https://github.com/waynebhayes/BLANT" target="_blank" rel="noopener noreferrer" aria-label="BLANT GitHub repository (opens in new tab)">GitHub</a>. <br />
        </p>
        {/* <p>Our paper on BLANT is available <a href="https://www.liebertpub.com/doi/abs/10.1089/cmb.2025.0095" target="_blank">here</a>.</p> */}
      </div>
    </div>
  );
};

export default LandingPage;
