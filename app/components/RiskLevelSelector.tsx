'use client';

import { RiskLevel } from '../types/providers';

interface RiskLevelSelectorProps {
  selectedLevel: RiskLevel;
  onLevelChange: (level: RiskLevel) => void;
}

const riskLevels: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'var(--severity-high)' },
  { value: 'medium', label: 'Medium', color: 'var(--severity-medium)' },
  { value: 'low', label: 'Low', color: 'var(--severity-low)' },
];

export default function RiskLevelSelector({
  selectedLevel,
  onLevelChange,
}: RiskLevelSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)]">Risk Level:</span>
      <div className="flex gap-1">
        {riskLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => onLevelChange(level.value)}
            className={`risk-level-btn ${selectedLevel === level.value ? 'active' : ''}`}
            style={{
              '--btn-color': level.color,
            } as React.CSSProperties}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}
