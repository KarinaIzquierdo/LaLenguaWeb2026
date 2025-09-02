import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../../hooks/useTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StudentChart = () => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151'; // Gris claro para oscuro, gris oscuro para claro
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'; // Cuadrícula más clara para oscuro, más oscura para claro

  const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        label: 'Nuevos Estudiantes por Mes',
        data: [60, 19, 13, 9, 22, 31],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
      },
      {
        label: 'Estudiantes Egresados por Mes',
        data: [10, 20, 30, 19, 50, 60],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 3,
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
            color: textColor // Color del texto de la leyenda
        }
      },
      title: {
        display: true,
        text: 'Rendimiento de Estudiantes',
        color: textColor // Color del título
      },
    },
    scales: {
        x: {
            ticks: {
                color: textColor // Color del texto del eje X
            },
            grid: {
                color: gridColor // Color de las líneas de la cuadrícula X
            }
        },
        y: {
            ticks: {
                color: textColor // Color del texto del eje Y
            },
            grid: {
                color: gridColor // Color de las líneas de la cuadrícula Y
            }
        }
    }
  };

  return (
    <div style={{ height: '400px' }}>
        <Bar data={data} options={options} />
    </div>
  )
};

export default StudentChart;
