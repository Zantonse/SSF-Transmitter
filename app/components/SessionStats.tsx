'use client';
import { useState, useEffect } from 'react';
import { TransmissionRecord } from '../types/history';

interface SessionStatsProps {
  history: TransmissionRecord[];
  sessionStart: number;
}

export default function SessionStats({ history, sessionStart }: SessionStatsProps) {
  const [now, setNow] = useState(0);

  // Initialize and update relative time every second
  useEffect(() => {
    const immediateId = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(immediateId);
      clearInterval(interval);
    };
  }, []);

  // Filter to session-only records
  const sessionRecords = history.filter((r) => r.timestamp >= sessionStart);
  const totalSent = sessionRecords.length;
  const successCount = sessionRecords.filter((r) => r.status === 'success').length;
  const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;

  const lastRecord = sessionRecords[0]; // history is newest-first
  const lastSentAgo = lastRecord ? formatRelativeTime(now - lastRecord.timestamp) : '—';

  const rateColorClass =
    successRate > 90 ? 'stat-green' : successRate > 70 ? 'stat-yellow' : totalSent > 0 ? 'stat-red' : '';

  if (totalSent === 0) return null;

  return (
    <div className="session-stats-bar">
      <div className="session-stat">
        <span className="session-stat-value">{totalSent}</span>
        <span className="session-stat-label">Sent</span>
      </div>
      <div className="session-stat-divider" />
      <div className="session-stat">
        <span className={`session-stat-value ${rateColorClass}`}>{successRate}%</span>
        <span className="session-stat-label">Success</span>
      </div>
      <div className="session-stat-divider" />
      <div className="session-stat">
        <span className="session-stat-value">{lastSentAgo}</span>
        <span className="session-stat-label">Last Sent</span>
      </div>
    </div>
  );
}

function formatRelativeTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
