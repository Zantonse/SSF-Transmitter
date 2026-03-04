'use client';

import { useState } from 'react';
import { TransmissionRecord } from '../types/history';
import CopyButton from './CopyButton';
import EventTimeline from './EventTimeline';

interface TransmissionHistoryProps {
  records: TransmissionRecord[];
  onReplay: (record: TransmissionRecord) => void;
  onClear: () => void;
}

export default function TransmissionHistory({
  records,
  onReplay,
  onClear,
}: TransmissionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ssf-history-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (records.length === 0) {
    return (
      <div className="history-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No transmission history yet</p>
        <span>Events you send will appear here</span>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="flex items-center gap-3">
          <span className="history-count">{records.length} event{records.length !== 1 ? 's' : ''}</span>
          <div className="history-view-toggle">
            <button
              onClick={() => setViewMode('list')}
              className={`history-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="List view"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`history-view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              title="Timeline view"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </button>
          </div>
        </div>
        <div className="history-actions">
          <button onClick={handleExport} className="history-action-btn" title="Export history">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button onClick={onClear} className="history-action-btn danger" title="Clear history">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 48px)' }}>
          <EventTimeline records={records} />
        </div>
      ) : (
      <div className="history-list">
        {records.map((record) => (
          <div key={record.id} className={`history-item ${record.status}`}>
            <div className="history-item-main" onClick={() => toggleExpand(record.id)}>
              <div className="history-item-status">
                {record.status === 'success' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
              </div>
              <div className="history-item-content">
                <div className="history-item-row">
                  <span className="history-event-label">{record.eventType}</span>
                  <span className={`history-risk-badge risk-${record.riskLevel}`}>
                    {record.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="history-item-meta">
                  <span className="history-provider">{record.provider}</span>
                  <span className="history-separator">•</span>
                  <span className="history-email">{record.userEmail}</span>
                </div>
                <div className="history-timestamp">{formatTimestamp(record.timestamp)}</div>
              </div>
              <div className="history-item-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReplay(record);
                  }}
                  className="history-replay-btn"
                  title="Replay this event"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`history-expand-icon ${expandedId === record.id ? 'expanded' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {expandedId === record.id && (
              <div className="history-item-details">
                {record.response?.error && (
                  <div className="history-error">
                    <strong>Error:</strong> {record.response.error}
                    {record.response.errorDescription && (
                      <div className="history-error-desc">{record.response.errorDescription}</div>
                    )}
                  </div>
                )}
                <div className="history-payload-header">
                  <span>Payload</span>
                  <CopyButton text={JSON.stringify(record.payload, null, 2)} label="JSON" compact />
                </div>
                <pre className="history-payload">{JSON.stringify(record.payload, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
