import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../../hooks/useTheme';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentLevelDistributionChart = () => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';

  const data = {
    labels: ['Básico', 'Intermedio', 'Avanzado', 'Conversación'],
    datasets: [
      {
        label: 'Número de Estudiantes',
        data: [200, 250, 150, 100],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(253, 214, 115, 0.67)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
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
          color: textColor,
        },
      },
      title: {
        display: true,
        text: 'Distribución de Estudiantes por Nivel',
        color: textColor,
      },
    },
  };

  return (
    <div style={{ height: '400px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default StudentLevelDistributionChart;
