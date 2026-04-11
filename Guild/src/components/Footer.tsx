import React from 'react';
import { Link } from '@tanstack/react-router';
import { Twitter, Disc, Github, Instagram, ArrowUpRight } from 'lucide-react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer-fortress">
      {/* Top Decorative Scanning Line */}
      <div className="footer-scan-line"></div>

      <div className="footer-container">

        {/* LEFT: BRAND IDENTITY */}
        <div className="f-col-brand">
          <Link to="/" className="f-logo-wrap">
            <div className="f-spartan-crest">
              <span className="f-lambda">Λ</span>
            </div>
            <div className="f-title-group">
              <span className="f-main-title">GUILD</span>
              <span className="f-tagline">TACTICAL INTERFACE</span>
            </div>
          </Link>
          <p className="f-summary">
            The all-in-one platform to manage your gaming guild.
            Fast, reliable, and built to keep your team organized.
          </p>
        </div>

        {/* RIGHT: SYSTEM NAV */}
        <div className="f-col-nav">
          <div className="f-nav-group">
            <span className="f-label">NETWORK_CHANNELS</span>
            <div className="f-social-links">
              <Link to="/" className="f-icon-link"><Twitter size={28} /></Link>
              <Link to="/" className="f-icon-link"><Disc size={28} /></Link>
              <Link to="/" className="f-icon-link"><Github size={28} /></Link>
              <Link to="/" className="f-icon-link"><Instagram size={28} /></Link>
            </div>
          </div>

          <div className="f-nav-group">
            <span className="f-label">LINKS</span>
            <Link to="/" className="f-root-link">
              HOME <ArrowUpRight size={14} className="f-arrow" />
            </Link>
          </div>
        </div>
      </div>

      {/* CENTERED WHITE COPYRIGHT */}
      <div className="f-bottom-strip">
        <div className="f-strip-inner">
          <span className="f-copyright">© 2026 // PROTOCOL_01</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;