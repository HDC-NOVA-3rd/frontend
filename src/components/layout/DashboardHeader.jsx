/**
 * 대시보드 헤더 컴포넌트
 */

import { LastUpdatedIndicator } from '../common/LastUpdatedIndicator';
import './DashboardHeader.css';

export function DashboardHeader({ 
  title = '화재감시 대시보드',
  apartmentName,
  lastUpdated,
  onRefresh 
}) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <h1 className="dashboard-header__title">{title}</h1>
        {apartmentName && (
          <span className="dashboard-header__apartment">
            🏢 {apartmentName}
          </span>
        )}
      </div>
      
      <div className="dashboard-header__right">
        <LastUpdatedIndicator 
          timestamp={lastUpdated} 
          onRefresh={onRefresh}
        />
      </div>
    </header>
  );
}
