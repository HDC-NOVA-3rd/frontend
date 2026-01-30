/**
 * 탭 네비게이션 컴포넌트
 */

import './TabNav.css';

export function TabNav({ tabs = [], activeTab, onChange }) {
  return (
    <nav className="tab-nav">
      <div className="tab-nav__list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-nav__item ${
              activeTab === tab.id ? 'tab-nav__item--active' : ''
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="tab-nav__icon">{tab.icon}</span>}
            <span className="tab-nav__label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
