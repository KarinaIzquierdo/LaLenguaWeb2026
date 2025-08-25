import "./Home.css";
import { useRef, useState } from "react";
import ScrollIndicator from "../ScrollIndicator/ScrollIndicator";
import ScrollReveal from "../ScrollReveal/ScrollReveal";
import CountrySelector from "../CountrySelector/CountrySelector";

export default function Home() {
  const containerRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    level: '',
    reason: '',
    source: '',
    contactMethod: ''
  });

  const handleCountryChange = (country: string) => {
    setFormData(prev => ({ ...prev, country }));
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    // Aquí puedes agregar la lógica para enviar los datos
  };

  return (
    <div className="home-container" ref={containerRef}>
      {/* Scroll Progress Indicator */}
      <ScrollIndicator />

      {/* Hero Section - Sin animación */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-3d">3D ART</span>
              <span className="title-trend">TREND</span>
            </h1>
            <div className="workshop-info">
              <h2>WORKSHOP STARTS AT</h2>
              <h2>5 PM EVERYDAY</h2>
              <h3 className="free-text">FREE FOR STUDENTS</h3>
            </div>
            <p className="description">
              This class will help students understand how powerful 3D is and
              how to take advantage of different techniques to translate 2D
              skills into full 3D scenes.
            </p>
          </div>
          <div className="hero-image">
            <img
              src="/Image/Chicasentada.jpg"
              alt="Chica sentada"
              className="character-img"
            />
          </div>
        </div>
      </section>

      {/* Programs Section - Con animación scroll reveal */}
      <ScrollReveal delay={0.1}>
        <section 
          id="info" 
          className="programs-section"
        >
        <div className="programs-header">
          <h2 className="section-subtitle">El futuro empieza aquí</h2>
          <h1 className="programs-title">
            CONOCE NUESTROS<br />
            <span className="programs-highlight">PROGRAMAS POR NIVEL</span>
          </h1>
        </div>

        <div className="programs-content">
          <div className="programs-text">
            <div className="program-info">
              <h3 className="program-name">
                PROGRAMA<br />
                <span className="program-highlight">JAMESTOWN</span>
                <br />
                POR NIVEL 1
              </h3>
              <div className="program-number">1</div>
            </div>

            <p className="program-description">
              Estos programas son ideales para quienes desean aprender inglés
              desde su nivel actual. Ya sea que empiecen sin conocimientos
              previos o tengan un nivel básico (A2) o intermedio (B1), están
              diseñados según los estándares del Marco Común Europeo de
              Referencia para las Lenguas (MCER).
            </p>

            <button className="info-button">Solicitar información</button>
          </div>

          <img
            src="/Image/Relajado.jpg"
            alt="Estudiante relajado"
            className="student-img"
          />
        </div>
        </section>
      </ScrollReveal>

      {/* Program Level 2 Section */}
      <ScrollReveal delay={0.2}>
      <section className="program-level2-section">
        <div className="program-level2-content">
          <img
            src="/Image/Chicarompecabezas.jpg"
            alt="Chica con rompecabezas"
            className="puzzle-img"
          />

          <div className="program-level2-text">
            <div className="program-level2-info">
              <h3 className="program-level2-name">
                PROGRAMA<br />
                <span className="program-highlight">JAMESTOWN</span>
                <br />
                POR NIVEL 2
              </h3>
              <div className="program-level2-number">2</div>
            </div>

            <p className="program-level2-description">
              Nuestra opción por nivel 2 es perfecta para quienes quieren
              aprender inglés desde su nivel actual, ya sea que no tengan
              conocimientos previos o tengan un nivel básico (A2) o intermedio
              (B1), y busquen mejorar sus habilidades.
            </p>

            <button className="info-button">Solicitar información</button>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* Program Level 3 Section */}
      <ScrollReveal delay={0.3}>
      <section className="program-level3-section">
        <div className="program-level3-content">
          <div className="program-level3-text">
            <div className="program-level3-info">
              <h3 className="program-level3-name">
                PROGRAMA<br />
                <span className="program-highlight">JAMESTOWN</span>
                <br />
                POR NIVEL 3
              </h3>
              <div className="program-level3-number">3</div>
            </div>

            <p className="program-level3-description">
              Estos programas son ideales para quienes quieren aprender inglés
              desde cero y avanzar de forma continua. Nuestra metodología se
              centra en el uso del idioma en situaciones reales, permitiendo a
              los estudiantes practicar y aprender habilidades útiles para su
              vida diaria, trabajo y estudios.
            </p>

            <button className="info-button">Solicitar información</button>
          </div>

          <img
            src="/Image/Exito.jpg"
            alt="Imagen de éxito"
            className="success-img"
          />
        </div>
      </section>
      </ScrollReveal>

      {/* Contact Form Section */}
      <ScrollReveal delay={0.4}>
      <section 
        id="contact" 
        className="contact-form-section"
      >
        <div className="contact-form-container">
          <h1 className="contact-title">
            ¿QUIERES
            <br />
            <span className="contact-highlight">
              TRANSFORMAR TU
              <br />
              VIDA?
            </span>
          </h1>

          <div className="form-card">
            <h2 className="form-title">Solicita información</h2>
            <p className="form-subtitle">¡Déjanos tus datos!</p>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row names-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Nombres*"
                    className="form-input"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Apellidos*"
                    className="form-input"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group phone-group">
                  <div className="phone-input">
                    <select className="country-code">
                      <option value="+57">🇨🇴 +57</option>
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="321 1234567"
                      className="form-input phone-number"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Ingresa tu email*"
                    className="form-input"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <select 
                    name="level"
                    className="form-select"
                    value={formData.level}
                    onChange={handleInputChange}
                  >
                    <option value="">Elige el programa que más se adapte a ti</option>
                    <option value="nivel1">Programa Jamestown Nivel 1</option>
                    <option value="nivel2">Programa Jamestown Nivel 2</option>
                    <option value="nivel3">Programa Jamestown Nivel 3</option>
                  </select>
                </div>
                <div className="form-group">
                  <select 
                    name="reason"
                    className="form-select"
                    value={formData.reason}
                    onChange={handleInputChange}
                  >
                    <option value="">Quiero aprender inglés por tema de:</option>
                    <option value="trabajo">Trabajo</option>
                    <option value="estudios">Estudios</option>
                    <option value="viajes">Viajes</option>
                    <option value="desarrollo">Desarrollo personal</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <select 
                    name="source"
                    className="form-select"
                    value={formData.source}
                    onChange={handleInputChange}
                  >
                    <option value="">¿Por cuál medio te enteraste de nosotros?</option>
                    <option value="redes">Redes sociales</option>
                    <option value="recomendacion">Recomendación</option>
                    <option value="google">Búsqueda en Google</option>
                    <option value="publicidad">Publicidad</option>
                  </select>
                </div>
                <CountrySelector 
                  onCountryChange={handleCountryChange}
                  onCityChange={handleCityChange}
                />
                <div className="form-group">
                  <select 
                    name="contactMethod"
                    className="form-select"
                    value={formData.contactMethod}
                    onChange={handleInputChange}
                  >
                    <option value="">¿Te contactamos por?</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="llamada">Llamada</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-button">
                ¡Empezar hoy!
              </button>
            </form>
          </div>
        </div>
      </section>
      </ScrollReveal>
    </div>
  );
}
