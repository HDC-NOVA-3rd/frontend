import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement, // 도넛 차트를 위해 필요
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// 차트 모듈 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  // 1. 선 그래프 데이터 (예: 월별 민원 발생 추이)
  const lineData = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
    datasets: [
      {
        label: '민원 발생 건수',
        data: [5, 12, 8, 15, 10, 20],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        tension: 0.4, // 선을 부드럽게
      },
    ],
  };

  // 2. 도넛 차트 데이터 (예: 미납/완납 비율)
  const doughnutData = {
    labels: ['완납', '미납', '연체'],
    datasets: [
      {
        data: [75, 15, 10],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)', // 초록
          'rgba(249, 115, 22, 0.6)', // 주황
          'rgba(239, 68, 68, 0.6)',  // 빨강
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '30px', fontWeight: 'bold' }}>아파트 통계 대시보드</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px' 
      }}>
        
        {/* 선 그래프 카드 */}
        <div style={cardStyle}>
          <h3>월별 민원 추이</h3>
          <Line data={lineData} options={{ responsive: true }} />
        </div>

        {/* 도넛 차트 카드 */}
        <div style={cardStyle}>
          <h3>관리비 납부 현황</h3>
          <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            <Doughnut data={doughnutData} options={{ responsive: true }} />
          </div>
        </div>

      </div>
    </div>
  );
};

// 간단한 카드 스타일
const cardStyle = {
  backgroundColor: '#fff',
  padding: '24px',
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

export default Statistics;