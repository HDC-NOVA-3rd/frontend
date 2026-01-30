/**
 * 제어 탭 - 시설 잠금 + 긴급 알림
 */

import { FacilityLockControl, AlertButton } from '../../components/safety';
import './ControlTab.css';

export function ControlTab({ 
  onLock, 
  onAlert, 
  lockLoading, 
  alertLoading 
}) {
  return (
    <div className="control-tab">
      <section className="control-tab__section">
        <h2 className="control-tab__section-title">시설 제어</h2>
        <div className="control-tab__grid">
          <FacilityLockControl
            onLock={onLock}
            onUnlock={onLock}
            loading={lockLoading}
          />
          <AlertButton
            onSend={onAlert}
            loading={alertLoading}
          />
        </div>
      </section>

      <section className="control-tab__section">
        <h2 className="control-tab__section-title">제어 안내</h2>
        <div className="control-tab__info">
          <div className="control-tab__info-item">
            <span className="control-tab__info-icon">🔐</span>
            <div className="control-tab__info-content">
              <h3>시설 잠금 제어</h3>
              <p>긴급 상황 시 공용 시설을 원격으로 잠그거나 해제할 수 있습니다.</p>
            </div>
          </div>
          <div className="control-tab__info-item">
            <span className="control-tab__info-icon">🚨</span>
            <div className="control-tab__info-content">
              <h3>긴급 알림 발송</h3>
              <p>전체 입주민에게 긴급 알림을 발송합니다. 신중하게 사용해주세요.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
