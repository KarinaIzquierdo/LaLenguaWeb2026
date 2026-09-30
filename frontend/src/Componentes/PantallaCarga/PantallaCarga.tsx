import './PantallaCarga.css';

/**
 * Pantalla de carga inicial: logo de La Lengua con barra animada teal.
 * El fondo crema coincide con el de la imagen para que se vea continua.
 */
export default function PantallaCarga() {
  return (
    <div className="pantalla-carga" role="status" aria-label="Cargando La Lengua">
      <img src="/logo-carga.jpeg" alt="La Lengua — Escuela de inglés conversacional" className="carga-logo" />

      <div className="carga-barra">
        <div className="carga-relleno" />
      </div>

      <p className="carga-texto">Cargando tu aventura…</p>
    </div>
  );
}
