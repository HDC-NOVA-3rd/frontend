import React, { useState, useEffect } from 'react';
import { getMyApartmentInfo } from '../../services/adminApi';
import './CommonInfo.css';

const ApartmentPage = () => {
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const response = await getMyApartmentInfo();
        setApartment(response.data);
      } catch (error) {
        console.error("아파트 정보 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApartment();
  }, []);

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!apartment) return <div className="error">등록된 아파트 정보가 없습니다.</div>;

  return (
    <div className="info-container">
      <div className="info-header">
        <h2>내 아파트 정보</h2>
      </div>
      <div className="info-card apartment-card">
        <div className="apartment-main">
          <h3>{apartment.apartmentName}</h3>
          <p className="address">{apartment.address}</p>
        </div>
        <hr />
        <div className="info-grid">
          <div className="grid-item">
            <span className="label">단지 코드</span>
            <span className="value">{apartment.apartmentCode}</span>
          </div>
          <div className="grid-item">
            <span className="label">총 세대 수</span>
            <span className="value">{apartment.totalHouseholds} 세대</span>
          </div>
          <div className="grid-item">
            <span className="label">관리 사무소 번호</span>
            <span className="value">{apartment.officeNumber}</span>
          </div>
          <div className="grid-item">
            <span className="label">등록일</span>
            <span className="value">{apartment.createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentPage;