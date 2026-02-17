import React from 'react';

import { Link } from 'react-router-dom';
import './Header.css';
import SanaLogo from '../../../public/sana-logo-white.png';

const Header: React.FC = () => {
  return (
    <header className="header" role="banner">
      <div className="header-left">
        <a href="https://hayeslab.ics.uci.edu/" className="site-logo-container" aria-label="Hayes Lab Home (opens in new tab)" target="_blank" rel="noopener noreferrer">
          <img
            src={SanaLogo}
            alt="SANA Logo"
            className="sana-logo"
          />
          <span className="site-logo-text">Hayes Lab</span>
        </a>
      </div>
      <nav className="header-nav" role="navigation" aria-label="Main navigation">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About BLANT</Link>
        <Link to="/submit-job" className="nav-link">Submit New Job</Link>
        <Link to="/lookup-job" className="nav-link">Lookup Previous Job</Link>
        <Link to="/contact-us" className="nav-link">Contact Us</Link>
        {/* <Link to="/login" className="nav-link">Login/Register</Link> */}
      </nav>
    </header>
  );
};

export default Header;