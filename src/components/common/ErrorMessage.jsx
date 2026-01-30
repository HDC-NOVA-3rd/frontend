/**
 * 에러 메시지 컴포넌트
 */

import './ErrorMessage.css';

export function ErrorMessage({ 
  error, 
  title = '오류가 발생했습니다',
  onRetry 
}) {
  const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.';

  return (
    <div className="error-message">
      <div className="error-message__icon">⚠️</div>
      <h3 className="error-message__title">{title}</h3>
      <p className="error-message__text">{errorMessage}</p>
      {onRetry && (
        <button className="error-message__retry-btn" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}
