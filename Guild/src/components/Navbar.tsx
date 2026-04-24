import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore'; 
import './Navbar.css';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Auth State
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Theme State
  const { isLight, toggleTheme } = useAuthStore();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout(); 
  };

  return (
    <nav className="nav-fortress">
      <div className="nav-container">
        
        {/* BRAND SECTION */}
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <div className="helmet-frame">
            <span className="lambda">Λ</span>
          </div>
          <span className="brand-name">GUILD</span>
        </Link>

        {/* MOBILE TOGGLE (Hamburger) */}
        <div 
          className={`nav-toggle ${menuOpen ? 'is-active' : ''}`} 
          onClick={toggleMenu}
        >
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>

        {/* NAVIGATION LOGIC */}
        <ul className={`nav-menu ${menuOpen ? 'menu-open' : ''}`}>
          
          {/* THEME SWITCHER */}
          <li className="nav-item">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {isLight ? '🌙 DARK MODE' : '☀️ LIGHT MODE'}
            </button>
          </li>

          <li>
            <Link to="/" activeProps={{ className: 'active-link' }} onClick={closeMenu}>
              Home
            </Link>
          </li>

          {!user ? (
            <>
              <li>
                <Link to="/signup" activeProps={{ className: 'active-link' }} onClick={closeMenu}>
                  Sign-Up
                </Link>
              </li>
              <li>
                <Link to="/login" activeProps={{ className: 'active-link' }} onClick={closeMenu}>
                  Login
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/dashboard" activeProps={{ className: 'active-link' }} onClick={closeMenu}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" activeProps={{ className: 'active-link' }} onClick={closeMenu}>
                  Profile
                </Link>
              </li>
              <li>
                <button className="logout-btn" onClick={handleLogout}>
                  LOGOUT ({user.username.toUpperCase()})
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;