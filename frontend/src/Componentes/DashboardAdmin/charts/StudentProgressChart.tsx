import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../../hooks/useTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StudentProgressChart = () => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        label: 'Nivel Básico',
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: 'rgba(64, 255, 255, 1)',
        tension: 0.1,
      },
      {
        label: 'Nivel Intermedio',
        data: [28, 48, 40, 19, 86, 27],
        fill: false,
        borderColor: 'rgba(250, 56, 98, 1)',
        tension: 0.1,
      },
      {
        label: 'Nivel Avanzado',
        data: [10, 20, 30, 40, 50, 60],
        fill: false,
        borderColor: 'rgba(11, 157, 255, 1)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
        },
      },
      title: {
        display: true,
        text: 'Progreso Promedio de Estudiantes por Nivel',
        color: textColor,
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        ticks: {
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  return (
    <div style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default StudentProgressChart;
