/**
 * Mock 데이터 - 백엔드 없이 UI 테스트용
 */

export const mockSafetyStatus = {
  apartmentId: 1,
  apartmentName: '래미안 아파트 1단지',
  electricStatus: 'normal',
  electricValue: 42.5,
  electricDescription: '전력 사용량 정상 범위',
  gasStatus: 'normal',
  gasValue: 12,
  gasDescription: '가스 누출 감지 없음',
  temperatureStatus: 'warning',
  temperatureValue: 38,
  temperatureDescription: '온도 다소 높음 - 주의 필요',
  fireStatus: 'normal',
  fireDescription: '화재 감지 없음',
  updatedAt: new Date().toISOString(),
};

export const mockEventLog = {
  logs: [
    {
      id: 1,
      status: 'warning',
      eventType: '온도 경고',
      description: '지하 주차장 B2 구역 온도 상승 감지',
      location: 'B2 주차장',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      status: 'normal',
      eventType: '시스템 점검',
      description: '정기 시스템 점검 완료',
      location: '관리사무소',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      status: 'normal',
      eventType: '센서 교체',
      description: '101동 가스 감지기 교체 완료',
      location: '101동',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      status: 'danger',
      eventType: '가스 누출 의심',
      description: '102동 3층 가스 농도 일시적 상승 (현재 정상)',
      location: '102동 3층',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      status: 'normal',
      eventType: '전력 복구',
      description: '103동 엘리베이터 전력 복구',
      location: '103동',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export const mockSensorLog = {
  logs: [
    {
      id: 1,
      status: 'warning',
      sensorType: 'temperature',
      sensorName: 'TEMP-B2-001',
      value: 38,
      unit: '°C',
      location: 'B2 주차장 입구',
      timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      status: 'normal',
      sensorType: 'electric',
      sensorName: 'ELEC-101-001',
      value: 42.5,
      unit: 'kW',
      location: '101동 전력실',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      status: 'normal',
      sensorType: 'gas',
      sensorName: 'GAS-102-003',
      value: 12,
      unit: 'ppm',
      location: '102동 3층',
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      status: 'normal',
      sensorType: 'fire',
      sensorName: 'FIRE-103-001',
      value: 0,
      unit: '',
      location: '103동 로비',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      status: 'normal',
      sensorType: 'temperature',
      sensorName: 'TEMP-101-002',
      value: 24,
      unit: '°C',
      location: '101동 복도',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
};
