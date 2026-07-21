import './Header.css';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header-home">
      {/* Logo */}
      <div className="logo">
        <div className="logo-brand">
          <img src="/Lengua-logo.png" alt="La Lengua" className="logo-image" />
          <span 
            className="logo-text" 
            style={{ 
              opacity: 1, 
              visibility: 'visible', 
              color: '#5a67d8',
              fontSize: '1.1rem',
              fontWeight: 900
            }}
          >
            La Lengua
          </span>
        </div>
      </div>

      {/* Mobile menu toggle */}
      <button
        className={`mobile-menu-toggle ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        type="button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navegación */}
      <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={closeMenu}>Home</Link>
        <a href="/#info" onClick={(e) => {
          e.preventDefault();
          closeMenu();
          window.location.href = '/#info';
          setTimeout(() => {
            const element = document.getElementById('info');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}>Info</a>
        <a href="/#contact" onClick={(e) => {
          e.preventDefault();
          closeMenu();
          window.location.href = '/#contact';
          setTimeout(() => {
            const element = document.getElementById('contact');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}>Contact</a>
        <Link to="/blog" className={location.pathname === '/blog' ? 'active blog-link' : 'blog-link'} onClick={closeMenu}>Blog</Link>
        <Link 
          to="/planes" 
          className={location.pathname === '/planes' ? 'active' : ''}
          onClick={closeMenu}
        >
          Planes
        </Link>
        <button onClick={() => { onLoginClick(); closeMenu(); }} className="login-btn">
          <span className="btn-text">La Lengua</span>
          <span className="btn-hover">Login</span>
        </button>
      </nav>
    </header>
  );
}
