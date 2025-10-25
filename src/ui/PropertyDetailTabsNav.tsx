import React from 'react';

interface TabsNavProps {
  active: string;
  onChange: (tab: string) => void;
}

// Lightweight extracted navigation bar for detail popup.
const tabs: { key: string; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'details', label: 'Facts and features' },
  { key: 'map', label: 'Location' }
];

const PropertyDetailTabsNav: React.FC<TabsNavProps> = ({ active, onChange }) => {
  return (
    <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e9e9e9', position: 'sticky', top: 0, zIndex: 10 }}>
      <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: '0 24px', borderBottom: '1px solid #e9e9e9' }}>
        {tabs.map(t => (
          <li key={t.key}
              style={{
                padding: '16px 0',
                marginRight: '32px',
                borderBottom: active === t.key ? '3px solid #1277e1' : '3px solid transparent',
                color: active === t.key ? '#1277e1' : '#2a2a33',
                fontWeight: active === t.key ? '700' : '400',
                cursor: 'pointer'
              }}
              onClick={() => onChange(t.key)}>
            {t.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PropertyDetailTabsNav;