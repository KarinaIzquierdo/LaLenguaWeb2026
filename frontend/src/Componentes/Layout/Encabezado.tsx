import './Header.css';

export default function Header() {
  return (
    <header className="header-home">
      {/* Logo */}
      <div className="logo">
        The Language 😜    
      </div>

      {/* Navegación */}
      <nav className="nav">
        <a href="#" className="active">Home</a>
        <a href="#info">Info</a>
        <a href="#contact">Contact</a>
        <a href="#" className="login-btn">
          <span className="btn-text">The Language</span>
          <span className="btn-hover">Login</span>
        </a>
      </nav>
    </header>
  );
}
