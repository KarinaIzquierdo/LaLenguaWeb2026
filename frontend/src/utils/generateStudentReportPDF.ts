import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AcademicDetail {
  estudiante: {
    nombres: string;
    apellidos: string;
    email?: string;
    correo_personal?: string;
    telefono?: string;
    cedula?: string;
    ciudad?: string;
    pais?: string;
    nivel_ingles?: string;
    especializacion?: string;
    activo: boolean;
    fecha_registro?: string;
  };
  suscripcion?: {
    plan: string;
    estado: string;
    clases_tomadas: number;
    clases_totales: number;
    progreso_porcentaje: number;
    dias_restantes: number;
  };
  gamificacion: {
    total_xp: number;
    total_dulces: number;
    reto_racha_actual: number;
    reto_mejor_racha: number;
  };
  asistencia: {
    stats: {
      total: number;
      presente: number;
      ausente: number;
      tardanza: number;
      justificado: number;
    };
    recientes: Array<{
      fecha: string;
      estado: string;
      observaciones?: string;
    }>;
  };
  clases: Array<{
    id: number;
    nombre: string;
    profesor: string;
    fecha: string;
    hora?: string;
    estado: string;
  }>;
  evaluaciones: Array<{
    id: number;
    titulo: string;
    tipo: string;
    estado: string;
    calificacion: number | null;
  }>;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

export const generateStudentReportPDF = (detail: AcademicDetail) => {
  const doc = new jsPDF();
  const estudiante = detail.estudiante;

  // Encabezado
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 100);
  doc.text('Reporte de Avance del Estudiante', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`${estudiante.nombres} ${estudiante.apellidos}`, 105, 28, { align: 'center' });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 34, { align: 'center' });

  let y = 45;

  // Información personal
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 100);
  doc.text('Información Personal', 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ['Nombre completo', `${estudiante.nombres} ${estudiante.apellidos}`],
      ['Email', estudiante.email || 'N/A'],
      ['Correo personal', estudiante.correo_personal || 'N/A'],
      ['Teléfono', estudiante.telefono || 'N/A'],
      ['Cédula', estudiante.cedula || 'N/A'],
      ['Ubicación', [estudiante.ciudad, estudiante.pais].filter(Boolean).join(', ') || 'N/A'],
      ['Nivel de inglés', estudiante.nivel_ingles || 'N/A'],
      ['Especialización', estudiante.especializacion || 'Sin asignar'],
      ['Estado', estudiante.activo ? 'Activo' : 'Inactivo'],
      ['Fecha de registro', formatDate(estudiante.fecha_registro)],
    ],
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 250] } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Suscripción y progreso
  if (detail.suscripcion) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 100);
    doc.text('Suscripción y Progreso', 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      body: [
        ['Plan', detail.suscripcion.plan],
        ['Estado', detail.suscripcion.estado],
        ['Clases tomadas', `${detail.suscripcion.clases_tomadas} / ${detail.suscripcion.clases_totales}`],
        ['Progreso', `${detail.suscripcion.progreso_porcentaje}%`],
        ['Días restantes', `${detail.suscripcion.dias_restantes}`],
      ],
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 250] } },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Gamificación
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 100);
  doc.text('Gamificación', 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ['XP total', `${detail.gamificacion.total_xp}`],
      ['Dulces', `${detail.gamificacion.total_dulces}`],
      ['Racha actual', `${detail.gamificacion.reto_racha_actual}`],
      ['Mejor racha', `${detail.gamificacion.reto_mejor_racha}`],
    ],
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 250] } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Asistencia
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 100);
  doc.text('Asistencia', 14, y);
  y += 8;

  if (detail.asistencia.stats.total > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Estado', 'Cantidad']],
      body: [
        ['Presente', `${detail.asistencia.stats.presente}`],
        ['Ausente', `${detail.asistencia.stats.ausente}`],
        ['Tardanza', `${detail.asistencia.stats.tardanza}`],
        ['Justificado', `${detail.asistencia.stats.justificado}`],
      ],
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    if (detail.asistencia.recientes.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text('Registros recientes', 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Estado', 'Observaciones']],
        body: detail.asistencia.recientes.map(a => [
          formatDate(a.fecha),
          a.estado,
          a.observaciones || '—',
        ]),
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('No hay registros de asistencia.', 14, y);
    y += 10;
  }

  // Clases
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 100);
  doc.text(`Clases Asignadas (${detail.clases.length})`, 14, y);
  y += 8;

  if (detail.clases.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Clase', 'Profesor', 'Fecha', 'Hora', 'Estado']],
      body: detail.clases.map(c => [
        c.nombre,
        c.profesor,
        formatDate(c.fecha),
        c.hora || '—',
        c.estado,
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('No tiene clases asignadas.', 14, y);
    y += 10;
  }

  // Evaluaciones
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 100);
  doc.text(`Evaluaciones (${detail.evaluaciones.length})`, 14, y);
  y += 8;

  if (detail.evaluaciones.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Título', 'Tipo', 'Estado', 'Calificación']],
      body: detail.evaluaciones.map(e => [
        e.titulo,
        e.tipo,
        e.estado,
        e.calificacion !== null ? `${e.calificacion}/100` : '—',
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('No tiene evaluaciones asignadas.', 14, y);
  }

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `The Language - Página ${i} de ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  const fileName = `reporte_${estudiante.nombres}_${estudiante.apellidos}.pdf`.replace(/\s+/g, '_').toLowerCase();
  doc.save(fileName);
};

export default generateStudentReportPDF;
