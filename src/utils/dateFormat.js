/**
 * 날짜 포맷팅 유틸리티
 * date-fns 없이 Intl.DateTimeFormat API를 사용합니다.
 * 브라우저 지원: Chrome 24+, Firefox 29+, Safari 10+
 */

// 짧은 날짜 형식 (01/30 14:30)
const shortFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// 긴 날짜 형식 (2026. 01. 30. 14:30:45)
const longFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

// 시간만 (14:30:45)
const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

// 날짜만 (2026. 01. 30.)
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * 짧은 날짜 형식으로 포맷 (01/30 14:30)
 * @param {string | Date | number} dateInput - 날짜 입력값
 * @returns {string} - 포맷된 날짜 문자열
 */
export const formatShortDate = (dateInput) => {
  if (!dateInput) return '-';
  try {
    return shortFormatter.format(new Date(dateInput));
  } catch {
    return '-';
  }
};

/**
 * 긴 날짜/시간 형식으로 포맷 (2026. 01. 30. 14:30:45)
 * @param {string | Date | number} dateInput - 날짜 입력값
 * @returns {string} - 포맷된 날짜 문자열
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '-';
  try {
    return longFormatter.format(new Date(dateInput));
  } catch {
    return '-';
  }
};

/**
 * 시간만 포맷 (14:30:45)
 * @param {string | Date | number} dateInput - 날짜 입력값
 * @returns {string} - 포맷된 시간 문자열
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return '-';
  try {
    return timeFormatter.format(new Date(dateInput));
  } catch {
    return '-';
  }
};

/**
 * 날짜만 포맷 (2026. 01. 30.)
 * @param {string | Date | number} dateInput - 날짜 입력값
 * @returns {string} - 포맷된 날짜 문자열
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  try {
    return dateFormatter.format(new Date(dateInput));
  } catch {
    return '-';
  }
};

/**
 * 상대 시간 표시 (방금 전, N분 전, N시간 전, N일 전)
 * @param {string | Date | number} dateInput - 날짜 입력값
 * @returns {string} - 상대 시간 문자열
 */
export const getTimeAgo = (dateInput) => {
  if (!dateInput) return '-';

  try {
    const now = new Date();
    const date = new Date(dateInput);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 0) return '방금 전'; // 미래 시간 처리
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  } catch {
    return '-';
  }
};
