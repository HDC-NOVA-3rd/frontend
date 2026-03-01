import React, { useState, useEffect } from 'react';
import { getMyAdminInfo } from '../../services/adminApi'; 
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getMyAdminInfo(); 
        console.log(profile);
        setProfile(profile);
      } catch (err) {
        console.error(err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!profile) return <div className="error">정보를 불러올 수 없습니다.</div>;

  return (
    <div className="info-container">
      <div className="info-header">
        <h2>내 정보 조회</h2>
      </div>
      <div className="info-card">
        <div className="info-row">
          <span className="label">아이디</span>
          <span className="value">{profile.loginId}</span>
        </div>
        <div className="info-row">
          <span className="label">이름</span>
          <span className="value">{profile.name}</span>
        </div>
        <div className="info-row">
          <span className="label">이메일</span>
          <span className="value">{profile.email}</span>
        </div>
        <div className="info-row">
          <span className="label">연락처</span>
          <span className="value">{profile.phoneNumber}</span>
        </div>
        <div className="info-row">
          <span className="label">권한</span>
          <span className="value badge">{profile.role}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;