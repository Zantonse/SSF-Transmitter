'use client';

import { SecurityEvent, RiskLevel } from '../types/providers';

interface EventButtonGridProps {
  events: SecurityEvent[];
  loading: boolean;
  disabled: boolean;
  queuedEventIds: string[];
  onEventClick: (event: SecurityEvent) => void;
  onPreviewClick: (event: SecurityEvent) => void;
  onAddToQueue: (event: SecurityEvent) => void;
}

const severityLabels: Record<RiskLevel, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

export default function EventButtonGrid({
  events,
  loading,
  disabled,
  queuedEventIds,
  onEventClick,
  onPreviewClick,
  onAddToQueue,
}: EventButtonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event) => {
        const isInQueue = queuedEventIds.includes(event.id);
        return (
          <div key={event.id} className={`event-btn-wrapper severity-${event.severity}`}>
            <button
              onClick={() => onEventClick(event)}
              disabled={loading || disabled}
              className={`event-btn severity-${event.severity}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `var(--severity-color)`,
                        color: 'white',
                        opacity: 0.9,
                      }}
                    >
                      {severityLabels[event.severity]}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    {loading ? 'Transmitting...' : event.label}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {event.description}
                  </p>
                </div>
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center">
                  {loading ? (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue(event);
              }}
              disabled={disabled}
              className={`add-to-queue-btn ${isInQueue ? 'in-queue' : ''}`}
              title={isInQueue ? 'In queue' : 'Add to queue'}
            >
              {isInQueue ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreviewClick(event);
              }}
              disabled={disabled}
              className="preview-btn"
              title="Preview payload"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
