import './Header.css';

interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
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
        <button onClick={onLoginClick} className="login-btn">
          <span className="btn-text">The Language</span>
          <span className="btn-hover">Login</span>
        </button>
      </nav>
    </header>
  );
}
