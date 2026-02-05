'use client';
import { useState, useEffect } from 'react';
import type { JWK } from 'jose';
import { generateKeyPair } from './utils/crypto';
import { SecurityProvider, SecurityEvent } from './types/providers';
import { PROVIDERS } from './config/providers';
import ProviderSelector from './components/ProviderSelector';
import EventButtonGrid from './components/EventButtonGrid';
import CopyButton from './components/CopyButton';

export default function Home() {
  const [config, setConfig] = useState({
    oktaDomain: '',
    issuerUrl: 'https://my-local-transmitter.com',
    subjectEmail: 'test-user@example.com',
  });

  const [providerId, setProviderId] = useState('crowdstrike');
  const [keys, setKeys] = useState<{ privatePem: string; publicJwk: JWK; kid: string } | null>(null);
  const [logs, setLogs] = useState<{ time: string; message: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const selectedProvider = PROVIDERS[providerId];

  // Apply theme class to document root
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [{ time, message, type }, ...prev]);
  };

  const handleGenerateKeys = async () => {
    addLog('Generating RSA-256 key pair...', 'info');
    const result = await generateKeyPair();
    setKeys(result);
    addLog(`Key pair generated. KID: ${result.kid}`, 'success');
    addLog('Update your JWKS endpoint with the public key below', 'info');
  };

  const handleProviderChange = (provider: SecurityProvider) => {
    setProviderId(provider.id);
    setConfig((prev) => ({ ...prev, issuerUrl: provider.defaultIssuer }));
    addLog(`Provider switched to ${provider.name}`, 'info');
  };

  const handleTransmit = async (event: SecurityEvent) => {
    if (!keys || !config.oktaDomain || !config.issuerUrl) {
      addLog('Missing configuration or keys', 'error');
      return;
    }

    setLoading(true);
    setLastPayload(null);
    addLog(`Transmitting ${event.label} via ${selectedProvider.name}...`, 'info');

    try {
      const res = await fetch('/api/transmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          privateKeyPem: keys.privatePem,
          keyId: keys.kid,
          providerId,
          eventId: event.id,
        }),
      });

      const data = await res.json();

      if (data.payload) {
        setLastPayload(data.payload);
      }

      if (data.success) {
        addLog(`Event transmitted successfully (HTTP ${data.status || 202})`, 'success');
      } else {
        // Log the error with details
        addLog(`Transmission failed: ${data.error || 'Unknown error'}`, 'error');

        if (data.errorDescription) {
          addLog(`Reason: ${data.errorDescription}`, 'error');
        }

        if (data.hint) {
          addLog(`Hint: ${data.hint}`, 'info');
        }

        if (data.debugInfo) {
          addLog(`Issuer: ${data.debugInfo.issuer}`, 'info');
          addLog(`Audience: ${data.debugInfo.audience}`, 'info');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Network error: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const providerColorClass = `provider-${providerId}`;

  return (
    <main className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Okta Logo */}
              <img
                src="/okta-logo.png"
                alt="Okta"
                className="okta-logo-img"
                height={32}
              />
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  SSF Transmitter
                </h1>
                <p className="text-xs text-[var(--text-muted)]">Shared Signals Framework for Identity Threat Protection</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="status-dot" />
              <span className="text-xs text-[var(--text-secondary)]">System Ready</span>
            </div>
            <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-3 space-y-6">
            {/* Configuration Card */}
            <div className="card p-6">
              <div className="section-header">
                <div className="section-number">01</div>
                <h2 className="section-title">Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="50" fill="var(--accent-blue)"/>
                      <circle cx="50" cy="50" r="20" fill="white"/>
                    </svg>
                    Okta Domain
                  </label>
                  <input
                    className="input-field"
                    placeholder="dev-12345.okta.com"
                    value={config.oktaDomain}
                    onChange={(e) => setConfig({ ...config, oktaDomain: e.target.value })}
                  />
                </div>

                <ProviderSelector
                  selectedProviderId={providerId}
                  onProviderChange={handleProviderChange}
                />

                <div className="md:col-span-2">
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Issuer URL</label>
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1"
                      placeholder="https://my-local-transmitter.com"
                      value={config.issuerUrl}
                      onChange={(e) => setConfig({ ...config, issuerUrl: e.target.value })}
                    />
                    <CopyButton text={config.issuerUrl} label="URL" compact />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2">Auto-populated when provider changes</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Target Subject</label>
                  <input
                    className="input-field"
                    placeholder="user@example.com"
                    value={config.subjectEmail}
                    onChange={(e) => setConfig({ ...config, subjectEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Key Management Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="section-header mb-0">
                  <div className="section-number">02</div>
                  <h2 className="section-title">Key Management</h2>
                </div>
                <button onClick={handleGenerateKeys} className="btn-primary flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                  Generate Keys
                </button>
              </div>

              {keys ? (
                <div className="space-y-4">
                  <div className="alert-warning">
                    <span className="alert-icon">!</span>
                    <span className="alert-text">
                      Copy the JWKS below and host it at your issuer&apos;s /.well-known/jwks.json endpoint
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      readOnly
                      className="jwks-output h-32"
                      value={JSON.stringify({ keys: [keys.publicJwk] }, null, 2)}
                    />
                    <div className="absolute top-2 right-2">
                      <CopyButton
                        text={JSON.stringify({ keys: [keys.publicJwk] }, null, 2)}
                        label="JWKS"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Key ID: {keys.kid}</span>
                    </div>
                    <CopyButton text={keys.kid} label="Key ID" />
                  </div>
                  <details className="collapsible-tip">
                    <summary>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      <span>Tip: How to host your JWKS</span>
                    </summary>
                    <div className="tip-content">
                      <p>Use <a href="https://www.npoint.io" target="_blank" rel="noopener noreferrer">npoint.io</a> to quickly host your JWKS:</p>
                      <ol>
                        <li>Go to <a href="https://www.npoint.io" target="_blank" rel="noopener noreferrer">npoint.io</a> and click &quot;Create JSON Bin&quot;</li>
                        <li>Paste your JWKS JSON and save</li>
                        <li>Copy the API endpoint URL (e.g., <code>https://api.npoint.io/abc123</code>)</li>
                        <li>Use this URL when configuring your SSF transmitter in Okta</li>
                      </ol>
                      <p className="tip-note">Note: GitHub Gists don&apos;t work because they return HTML instead of JSON with the correct Content-Type header.</p>
                    </div>
                  </details>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">No keys generated yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Click &quot;Generate Keys&quot; to create an RSA key pair</p>
                </div>
              )}
            </div>

            {/* Transmission Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="section-header mb-0">
                  <div className="section-number">03</div>
                  <h2 className="section-title">Transmission</h2>
                </div>
                <div className={`provider-indicator ${providerColorClass}`}>
                  <span style={{ color: 'var(--provider-color)' }}>{selectedProvider.name}</span>
                </div>
              </div>

              <EventButtonGrid
                events={selectedProvider.events}
                loading={loading}
                disabled={!keys}
                onEventClick={handleTransmit}
              />

              <p className="text-xs text-[var(--text-muted)] text-center mt-4">
                All events trigger Okta Identity Threat Protection via the user-risk-change schema
              </p>
            </div>

            {/* Payload Viewer */}
            {lastPayload && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="section-header mb-0">
                    <div className="section-number">04</div>
                    <h2 className="section-title">Last Payload</h2>
                  </div>
                  <CopyButton
                    text={JSON.stringify(lastPayload, null, 2)}
                    label="Payload"
                  />
                </div>
                <div className="json-viewer max-h-80 overflow-auto">
                  <pre className="text-[var(--accent-green)]">{JSON.stringify(lastPayload, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Activity Log */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-6">
              <div className="section-header">
                <div className="section-number">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h2 className="section-title">Activity Log</h2>
              </div>

              <div className="log-container h-[500px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mb-3 opacity-50">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <p className="text-sm text-[var(--text-muted)]">Waiting for activity...</p>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`log-entry ${log.type}`}>
                      <span className="log-timestamp">{log.time}</span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)] mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>Built for</span>
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" fill="var(--accent-blue)"/>
                <circle cx="50" cy="50" r="20" fill="white"/>
              </svg>
              <span className="font-semibold text-[var(--text-secondary)]">Okta Identity Threat Protection</span>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            Shared Signals Framework (SSF) Transmitter
          </div>
        </div>
      </footer>
    </main>
  );
}
