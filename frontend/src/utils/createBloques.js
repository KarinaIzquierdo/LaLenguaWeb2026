// Script para crear los bloques iniciales con datos completos
const createInitialBloques = () => {
  const bloques = [
    {
      id: 'A1_Mañana',
      nivel: 'A1',
      turno: 'Mañana',
      profesores: ['María García', 'Carlos López', 'Ana Martínez'],
      clases: [
        'Introducción al Inglés',
        'Saludos y Presentaciones',
        'Números y Fechas',
        'Familia y Amigos',
        'Comida y Bebidas',
        'Rutina Diaria',
        'Tiempo y Clima',
        'Direcciones Básicas'
      ],
      misiones: [
        'Vocabulario Básico',
        'Gramática Fundamental',
        'Conversación Inicial',
        'Pronunciación Básica'
      ],
      horarios: ['8:00 AM - 9:30 AM', '9:45 AM - 11:15 AM', '11:30 AM - 1:00 PM']
    },
    {
      id: 'A1_Tarde',
      nivel: 'A1',
      turno: 'Tarde',
      profesores: ['Juan Pérez', 'Laura Silva', 'Roberto Díaz'],
      clases: [
        'Introducción al Inglés',
        'Saludos y Presentaciones',
        'Números y Fechas',
        'Familia y Amigos',
        'Comida y Bebidas',
        'Rutina Diaria',
        'Tiempo y Clima',
        'Direcciones Básicas'
      ],
      misiones: [
        'Vocabulario de Viaje',
        'Gramática Básica',
        'Conversación Práctica',
        'Listening Básico'
      ],
      horarios: ['2:00 PM - 3:30 PM', '3:45 PM - 5:15 PM', '5:30 PM - 7:00 PM']
    },
    {
      id: 'A1_Noche',
      nivel: 'A1',
      turno: 'Noche',
      profesores: ['Patricia Ruiz', 'Miguel Torres', 'Elena Vega'],
      clases: [
        'Introducción al Inglés',
        'Saludos y Presentaciones',
        'Números y Fechas',
        'Familia y Amigos',
        'Comida y Bebidas',
        'Rutina Diaria',
        'Tiempo y Clima',
        'Direcciones Básicas'
      ],
      misiones: [
        'Vocabulario Nocturno',
        'Gramática Esencial',
        'Conversación Básica',
        'Reading Básico'
      ],
      horarios: ['7:00 PM - 8:30 PM', '8:45 PM - 10:15 PM']
    }
  ];

  // Guardar bloques en localStorage
  localStorage.setItem('bloques_data', JSON.stringify(bloques));
  
  // Crear algunas asignaciones de ejemplo
  const assignments = {
    '33': 'A1_Tarde', // andresfelipe@thelanguage.co
    '32': 'A1_Mañana', // Otro usuario de ejemplo
  };
  
  localStorage.setItem('user_blocks_assignment', JSON.stringify(assignments));
  
  console.log('✅ Bloques creados exitosamente');
  console.log('📊 Bloques disponibles:', bloques.length);
  console.log('👥 Asignaciones creadas:', Object.keys(assignments).length);
  
  return bloques;
};

// Ejecutar la creación
if (typeof window !== 'undefined') {
  createInitialBloques();
} else {
  module.exports = { createInitialBloques };
}
