'use client';

import { useState, useEffect } from 'react';
import { TransmissionRecord } from '../types/history';

interface EventTimelineProps {
  records: TransmissionRecord[];
}

export default function EventTimeline({ records }: EventTimelineProps) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const immediateId = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      clearTimeout(immediateId);
      clearInterval(interval);
    };
  }, []);

  if (records.length < 2 || now === 0) {
    return (
      <div className="timeline-empty-state">
        <p>Send events to see the timeline</p>
      </div>
    );
  }

  // Sort records oldest first for display
  const sortedRecords = [...records].reverse();

  const timestamps = sortedRecords.map((r) => r.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeSpan = maxTime - minTime || 1;

  const getPosition = (timestamp: number): number => {
    if (timeSpan <= 1) return 50;
    return 5 + ((timestamp - minTime) / timeSpan) * 90; // 5%-95% range
  };

  const getSize = (riskLevel: string): number => {
    switch (riskLevel) {
      case 'high': return 8;
      case 'medium': return 6;
      default: return 5;
    }
  };

  const getRelativeTime = (timestamp: number): string => {
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const svgWidth = Math.max(sortedRecords.length * 40, 300);

  return (
    <div className="timeline-container">
      <div className="timeline-wrapper">
        <svg
          className="timeline-svg"
          width={svgWidth}
          height={100}
          viewBox={`0 0 ${svgWidth} 100`}
        >
          {/* Timeline axis */}
          <line x1="20" y1="50" x2={svgWidth - 20} y2="50" stroke="var(--border-default)" strokeWidth="2" />

          {/* Markers */}
          {sortedRecords.map((record) => {
            const pct = getPosition(record.timestamp);
            const x = (pct / 100) * svgWidth;
            const size = getSize(record.riskLevel);
            const isLifecycle = record.providerId === 'risc';
            const isFailed = record.status === 'error';
            const color = `var(--${record.providerId}, #6366f1)`;

            return (
              <g key={record.id} className="timeline-marker">
                <title>
                  {record.eventType} | {record.provider} | {getRelativeTime(record.timestamp)} | {record.status}
                </title>
                {isLifecycle ? (
                  <rect
                    x={x - size}
                    y={50 - size}
                    width={size * 2}
                    height={size * 2}
                    transform={`rotate(45 ${x} 50)`}
                    fill={isFailed ? 'none' : color}
                    stroke={isFailed ? 'var(--accent-red)' : color}
                    strokeWidth={isFailed ? 2 : 0}
                  />
                ) : (
                  <circle
                    cx={x}
                    cy={50}
                    r={size}
                    fill={isFailed ? 'none' : color}
                    stroke={isFailed ? 'var(--accent-red)' : color}
                    strokeWidth={isFailed ? 2 : 0}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Time labels */}
      <div className="timeline-labels">
        <span className="timeline-label">
          {new Date(minTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="timeline-label">
          {new Date(maxTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
