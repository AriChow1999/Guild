import React from 'react';
import './Home.css';

const Home: React.FC = () => {
  return (
    /* We use this class as a "Shield" to keep styles contained */
    <div className="home-territory"> 
      <div className="elite-wrapper">
        {/* ATMOSPHERIC GLOWS */}
        <div className="bg-glow top-right"></div>
        <div className="bg-glow center-left"></div>

        <header className="hero-elite">
          <div className="crest-frame">
            <span className="lambda">Λ</span>
          </div>
          <h1 className="main-title">GUILD</h1>
          <div className="status-bar">
            <span className="status-item">PROTOCOL: MFRN</span>
            <span className="separator">|</span>
            <span className="status-item">SYSTEM: ACTIVE</span>
          </div>
        </header>

        <section className="feature-spine">
          <div className="banner-row">
            <div className="banner-bg-text">01</div>
            <div className="banner-content">
              <div className="label">ARCHITECTURE</div>
              <h2>FASTIFY <span className="red-stroke">STRIKE</span></h2>
              <p>Sub-millisecond response times. A backend forged in Node.js and MongoDB, optimized for high-velocity warfare.</p>
            </div>
          </div>

          <div className="banner-row">
            <div className="banner-bg-text">02</div>
            <div className="banner-content">
              <div className="label">MODERATION</div>
              <h2>OSTRACISM <span className="red-stroke">PROTOCOL</span></h2>
              <p>Absolute control. Manage your guild with advanced banning, timeouts, and member-tier hierarchies.</p>
            </div>
          </div>

          <div className="banner-row">
            <div className="banner-bg-text">03</div>
            <div className="banner-content">
              <div className="label">REAL-TIME</div>
              <h2>TRANSIENT <span className="red-stroke">STATE</span></h2>
              <p>Simulated presence using Redis TTL logic. Watch the battle unfold without the friction of WebSockets.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;