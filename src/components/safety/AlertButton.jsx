/**
 * 알림 발송 버튼 컴포넌트
 */

import { useState } from 'react';
import './AlertButton.css';

export function AlertButton({ 
  onSend, 
  loading = false,
  disabled = false 
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleSendClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (onSend) {
      try {
        await onSend(alertMessage || '긴급 알림: 안전 관련 공지사항이 있습니다.');
        setShowConfirm(false);
        setAlertMessage('');
      } catch (error) {
        console.error('Alert send failed:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setAlertMessage('');
  };

  return (
    <div className="alert-button">
      {!showConfirm ? (
        <button
          className="alert-button__trigger"
          onClick={handleSendClick}
          disabled={disabled || loading}
        >
          🚨 긴급 알림 발송
        </button>
      ) : (
        <div className="alert-button__confirm">
          <h4 className="alert-button__confirm-title">
            긴급 알림을 발송하시겠습니까?
          </h4>
          <textarea
            className="alert-button__textarea"
            placeholder="알림 메시지를 입력하세요 (선택사항)"
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            rows={3}
          />
          <div className="alert-button__confirm-actions">
            <button
              className="alert-button__btn alert-button__btn--cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              취소
            </button>
            <button
              className="alert-button__btn alert-button__btn--confirm"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? '발송 중...' : '발송'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
