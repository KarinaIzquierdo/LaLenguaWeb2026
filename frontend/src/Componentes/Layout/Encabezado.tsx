import './Header.css';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const location = useLocation();
  
  return (
    <header className="header-home">
      {/* Logo */}
      <div className="logo">
        The Tongue 😜    
      </div>

      {/* Navegación */}
      <nav className="nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        <a href="/#info" onClick={(e) => {
          e.preventDefault();
          window.location.href = '/#info';
          setTimeout(() => {
            const element = document.getElementById('info');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}>Info</a>
        <a href="/#contact" onClick={(e) => {
          e.preventDefault();
          window.location.href = '/#contact';
          setTimeout(() => {
            const element = document.getElementById('contact');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}>Contact</a>
        <Link to="/blog" className={location.pathname === '/blog' ? 'active blog-link' : 'blog-link'}>Blog</Link>
        <button onClick={onLoginClick} className="login-btn">
          <span className="btn-text">The Language</span>
          <span className="btn-hover">Login</span>
        </button>
      </nav>
    </header>
  );
}
