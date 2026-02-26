import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// API 서비스
import { getResidentsByApartment } from "../../services/residentApi";
import { getComplaintsByApartment } from "../../services/complaintApi";
import { getBillExcel } from "../../services/billApi";
import { getMyApartmentInfo } from "../../services/adminApi";
import { getNoticeList } from "../../services/noticeApi";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    residents: [],
    bills: [],
    complaints: [],
    noticeCount: 0,
    aptInfo: null
  });

  // 1. 데이터 통합 로드
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [resRes, billRes, compRes, aptRes, noticeRes] = await Promise.all([
          getResidentsByApartment({ page: 0, size: 1000 }),
          getBillExcel(),
          getComplaintsByApartment(),
          getMyApartmentInfo(),
          getNoticeList()
        ]);

        setData({
          residents: resRes?.content || resRes || [],
          bills: billRes || [],
          complaints: Array.isArray(compRes) ? compRes : (compRes?.data || []),
          noticeCount: noticeRes?.totalElements || noticeRes?.length || 0,
          aptInfo: aptRes
        });
      } catch (error) {
        console.error("통계 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // 2. 고도화된 데이터 가공 로직
  const stats = useMemo(() => {
    const { residents, bills, complaints } = data;

    // [계산] 입주 세대수
    const householdCount = new Set(residents.map(r => `${r.dongNo}-${r.hoNo}`)).size;

    // [계산] 관리비 미납 및 월별 합산 로직
    const unpaidBills = bills.filter(b => b.status !== "PAID");
    const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // 월별 관리비 청구액 합산 { "2024-01": 5000000, ... }
    const monthlyBillMap = bills.reduce((acc, b) => {
      const month = b.billMonth; // "YYYY-MM" 형식 가정
      acc[month] = (acc[month] || 0) + b.totalPrice;
      return acc;
    }, {});

    // [계산] 민원 현황 및 월별 추이
    const compStatusStats = complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const monthlyCompMap = complaints.reduce((acc, c) => {
      const date = new Date(c.createdAt);
      const monthLabel = `${date.getMonth() + 1}월`;
      acc[monthLabel] = (acc[monthLabel] || 0) + 1;
      return acc;
    }, {});

    // 정렬된 라벨 생성을 위해 최근 6개월 추출
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return `${d.getMonth() + 1}월`;
    });

    return {
      residentCount: residents.length,
      householdCount,
      unpaidCount: unpaidBills.length,
      totalUnpaidAmount,
      compStatusStats,
      monthlyCompMap,
      monthlyBillMap,
      last6Months
    };
  }, [data]);

  // --- 차트 구성 (UI 최적화) ---

  // 1. 월별 민원 발생 추이 (Line - 그라데이션/커브 적용)
  const complaintLineData = {
    labels: stats.last6Months,
    datasets: [{
      label: '민원 발생 건수',
      data: stats.last6Months.map(m => stats.monthlyCompMap[m] || 0),
      borderColor: '#4318FF',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(67, 24, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(67, 24, 255, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#4318FF',
    }]
  };

  // 2. 월별 관리비 청구 추이 (Bar - 월별 합산 데이터 활용)
  const billBarData = {
    labels: Object.keys(stats.monthlyBillMap).sort().slice(-6),
    datasets: [{
      label: '월별 총 청구액',
      data: Object.keys(stats.monthlyBillMap).sort().slice(-6).map(k => stats.monthlyBillMap[k]),
      backgroundColor: '#6AD2FF',
      borderRadius: 8,
      barPercentage: 0.6,
    }]
  };

  // 3. 민원 처리 상태 (Doughnut)
  const doughnutData = {
    labels: ['접수', '배정', '처리중', '완료'],
    datasets: [{
      data: [
        stats.compStatusStats.RECEIVED || 0,
        stats.compStatusStats.ASSIGNED || 0,
        stats.compStatusStats.IN_PROGRESS || 0,
        stats.compStatusStats.COMPLETED || 0
      ],
      backgroundColor: ['#EE5D50', '#FFB547', '#4318FF', '#01B574'],
      hoverOffset: 10,
      cutout: '75%',
    }]
  };

  if (loading) return <div style={loadingStyle}>단지 데이터를 분석하고 있습니다...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#F4F7FE', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1B2559' }}>
          {data.aptInfo?.apartmentName || "단지"} 데이터 대시보드
        </h2>
        <p style={{ color: '#A3AED0' }}>단지 관리 현황을 실시간으로 분석한 통계입니다.</p>
      </header>

      {/* KPI 카드 섹션 */}
      <div style={gridStyle(4)}>
        <SummaryCard title="총 입주민" value={`${stats.residentCount}명`} sub={`${stats.householdCount}세대 거주`} color="#4318FF" />
        <SummaryCard title="누적 민원" value={`${data.complaints.length}건`} sub={`미처리 ${stats.compStatusStats.RECEIVED || 0}건`} color="#01B574" />
        <SummaryCard title="미납 고지" value={`${stats.unpaidCount}건`} sub="전체 미납 세대수" color="#EE5D50" />
        <SummaryCard title="미납 총액" value={`${stats.totalUnpaidAmount.toLocaleString()}원`} sub="연체료 제외" color="#FFB547" />
      </div>

      {/* 메인 차트 그리드 */}
      <div style={{ ...gridStyle(2), marginTop: '30px' }}>
        {/* 민원 추이 그래프 */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>월별 민원 발생 추이</h3>
          <div style={{ height: '300px' }}>
            <Line data={complaintLineData} options={chartOptions} />
          </div>
        </div>

        {/* 민원 상태 도넛 */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>민원 처리 현황</h3>
          <div style={{ height: '240px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
          </div>
          <div style={legendContainer}>
             <LegendItem color="#EE5D50" label="접수" />
             <LegendItem color="#FFB547" label="배정" />
             <LegendItem color="#4318FF" label="처리중" />
             <LegendItem color="#01B574" label="완료" />
          </div>
        </div>
      </div>

      {/* 하단 관리비 합산 바 차트 */}
      <div style={{ ...cardStyle, marginTop: '30px' }}>
        <h3 style={cardTitleStyle}>최근 6개월 관리비 청구 현황 (단지 전체 합산)</h3>
        <div style={{ height: '300px' }}>
          <Bar data={billBarData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

// --- 서브 컴포넌트 및 스타일 ---

const SummaryCard = ({ title, value, sub, color }) => (
  <div style={cardStyle}>
    <p style={{ color: '#A3AED0', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{title}</p>
    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1B2559' }}>{value}</h3>
    <p style={{ fontSize: '12px', color: color, fontWeight: '700', marginTop: '4px' }}>{sub}</p>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
    <span style={{ fontSize: '12px', color: '#707EAE' }}>{label}</span>
  </div>
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#F4F7FE' }, border: { display: false } },
    x: { grid: { display: false }, border: { display: false } }
  }
};

const gridStyle = (cols) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
  gap: '24px',
});

const cardStyle = {
  backgroundColor: '#fff',
  padding: '24px',
  borderRadius: '20px',
  boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)',
};

const cardTitleStyle = { fontSize: '18px', fontWeight: '700', color: '#1B2559', marginBottom: '20px' };

const legendContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: '15px',
  marginTop: '20px'
};

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  fontSize: '18px',
  color: '#4318FF',
  fontWeight: 'bold'
};

export default Statistics;