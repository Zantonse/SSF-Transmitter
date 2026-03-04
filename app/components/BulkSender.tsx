'use client';

import { useState } from 'react';
import { QueuedEvent, BulkSendResult } from '../types/bulk';

interface BulkSenderProps {
  queue: QueuedEvent[];
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
  onSendAll: (delayMs: number) => Promise<BulkSendResult>;
  disabled: boolean;
}

export default function BulkSender({
  queue,
  onRemoveFromQueue,
  onClearQueue,
  onSendAll,
  disabled,
}: BulkSenderProps) {
  const [delay, setDelay] = useState(500);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BulkSendResult | null>(null);

  const handleSendAll = async () => {
    setSending(true);
    setResult(null);
    try {
      const sendResult = await onSendAll(delay);
      setResult(sendResult);
    } finally {
      setSending(false);
    }
  };

  const pendingCount = queue.filter((e) => e.status === 'pending').length;
  const sendingCount = queue.filter((e) => e.status === 'sending').length;
  const successCount = queue.filter((e) => e.status === 'success').length;
  const errorCount = queue.filter((e) => e.status === 'error').length;

  if (queue.length === 0) {
    return (
      <div className="bulk-sender-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <p>No events in queue</p>
        <span>Click the + button on events to add them</span>
      </div>
    );
  }

  return (
    <div className="bulk-sender">
      <div className="bulk-sender-header">
        <div className="bulk-sender-stats">
          <span className="bulk-stat">
            <span className="bulk-stat-value">{queue.length}</span>
            <span className="bulk-stat-label">Total</span>
          </span>
          {successCount > 0 && (
            <span className="bulk-stat success">
              <span className="bulk-stat-value">{successCount}</span>
              <span className="bulk-stat-label">Sent</span>
            </span>
          )}
          {errorCount > 0 && (
            <span className="bulk-stat error">
              <span className="bulk-stat-value">{errorCount}</span>
              <span className="bulk-stat-label">Failed</span>
            </span>
          )}
        </div>
        <button onClick={onClearQueue} className="bulk-clear-btn" title="Clear queue" disabled={sending}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div className="bulk-queue-list">
        {queue.map((item) => (
          <div key={item.id} className={`bulk-queue-item ${item.status}`}>
            <div className="bulk-queue-item-content">
              <div className="bulk-queue-item-label">{item.eventLabel}</div>
              <div className="bulk-queue-item-meta">
                <span className="bulk-queue-provider">{item.providerName}</span>
                <span className={`bulk-queue-risk risk-${item.riskLevel}`}>
                  {item.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="bulk-queue-item-status">
              {item.status === 'pending' && (
                <button
                  onClick={() => onRemoveFromQueue(item.id)}
                  className="bulk-remove-btn"
                  disabled={sending}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              {item.status === 'sending' && (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {item.status === 'success' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {item.status === 'error' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {sending && (
        <div className="bulk-progress">
          <div className="bulk-progress-bar">
            <div
              className="bulk-progress-fill"
              style={{ width: `${((successCount + errorCount) / queue.length) * 100}%` }}
            />
          </div>
          <span className="bulk-progress-text">
            Sending {sendingCount > 0 ? sendingCount : successCount + errorCount} of {queue.length}...
          </span>
        </div>
      )}

      {result && !sending && (
        <div className={`bulk-result ${result.failed > 0 ? 'has-errors' : 'success'}`}>
          <span>
            {result.success} of {result.total} events sent successfully
            {result.failed > 0 && ` (${result.failed} failed)`}
          </span>
        </div>
      )}

      <div className="bulk-sender-footer">
        <div className="bulk-delay-control">
          <label>Delay between sends:</label>
          <select
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            disabled={sending}
            className="bulk-delay-select"
          >
            <option value={100}>100ms</option>
            <option value={250}>250ms</option>
            <option value={500}>500ms</option>
            <option value={1000}>1 second</option>
            <option value={2000}>2 seconds</option>
          </select>
        </div>
        <button
          onClick={handleSendAll}
          disabled={disabled || sending || pendingCount === 0}
          className="btn-primary bulk-send-btn"
        >
          {sending ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send All ({pendingCount})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
