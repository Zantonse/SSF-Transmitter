'use client';

import { SecurityEvent, RiskLevel } from '../types/providers';

interface EventButtonGridProps {
  events: SecurityEvent[];
  loading: boolean;
  disabled: boolean;
  onEventClick: (event: SecurityEvent) => void;
}

const severityColors: Record<RiskLevel, string> = {
  high: 'bg-red-600 hover:bg-red-700',
  medium: 'bg-orange-500 hover:bg-orange-600',
  low: 'bg-yellow-500 hover:bg-yellow-600',
};

const severityIcons: Record<RiskLevel, string> = {
  high: '🚨',
  medium: '⚠️',
  low: '📋',
};

export default function EventButtonGrid({
  events,
  loading,
  disabled,
  onEventClick,
}: EventButtonGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {events.map((event) => (
        <button
          key={event.id}
          onClick={() => onEventClick(event)}
          disabled={loading || disabled}
          className={`${severityColors[event.severity]} text-white p-3 rounded font-bold disabled:opacity-50 transition-colors text-left`}
        >
          <div className="flex items-center gap-2">
            <span>{severityIcons[event.severity]}</span>
            <span>{loading ? 'Sending...' : event.label}</span>
          </div>
          <p className="text-xs font-normal mt-1 opacity-80">{event.description}</p>
        </button>
      ))}
    </div>
  );
}
