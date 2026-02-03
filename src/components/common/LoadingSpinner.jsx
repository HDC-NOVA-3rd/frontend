/**
 * 로딩 스피너 컴포넌트
 */

import './LoadingSpinner.css';

export function LoadingSpinner({ size = 'medium', message = '로딩 중...' }) {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="loading-spinner__circle"></div>
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
}
