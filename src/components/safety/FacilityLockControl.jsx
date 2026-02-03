/**
 * 시설 잠금 컨트롤 컴포넌트
 */

import { useState } from 'react';
import './FacilityLockControl.css';

export function FacilityLockControl({ 
  onLock, 
  onUnlock, 
  loading = false,
  currentLockStatus = null 
}) {
  const [selectedFacility, setSelectedFacility] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const facilities = [
    { id: 'main_entrance', name: '정문' },
    { id: 'parking', name: '주차장' },
    { id: 'community_center', name: '주민센터' },
    { id: 'playground', name: '놀이터' },
    { id: 'gym', name: '피트니스센터' },
  ];

  const handleLockToggle = async () => {
    if (!selectedFacility) {
      alert('시설을 선택해주세요.');
      return;
    }

    const action = isLocked ? onUnlock : onLock;
    if (action) {
      try {
        await action(selectedFacility, !isLocked);
        setIsLocked(!isLocked);
      } catch (error) {
        console.error('Lock control failed:', error);
      }
    }
  };

  return (
    <div className="facility-lock-control">
      <h3 className="facility-lock-control__title">
        🔐 시설 잠금 제어
      </h3>
      
      <div className="facility-lock-control__body">
        <div className="facility-lock-control__select-wrapper">
          <select
            className="facility-lock-control__select"
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            disabled={loading}
          >
            <option value="">시설 선택</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </div>

        <div className="facility-lock-control__actions">
          <button
            className={`facility-lock-control__btn facility-lock-control__btn--lock ${
              isLocked ? 'facility-lock-control__btn--active' : ''
            }`}
            onClick={() => {
              if (selectedFacility) {
                setIsLocked(true);
                onLock && onLock(selectedFacility, true);
              }
            }}
            disabled={loading || !selectedFacility}
          >
            🔒 잠금
          </button>
          <button
            className={`facility-lock-control__btn facility-lock-control__btn--unlock ${
              !isLocked ? 'facility-lock-control__btn--active' : ''
            }`}
            onClick={() => {
              if (selectedFacility) {
                setIsLocked(false);
                onUnlock && onUnlock(selectedFacility, false);
              }
            }}
            disabled={loading || !selectedFacility}
          >
            🔓 해제
          </button>
        </div>
      </div>

      {loading && (
        <p className="facility-lock-control__status">처리 중...</p>
      )}
    </div>
  );
}
