'use client';
import { useState } from 'react';
import type { JWK } from 'jose';
import { generateKeyPair } from './utils/crypto';
import { SecurityProvider, SecurityEvent } from './types/providers';
import { PROVIDERS } from './config/providers';
import ProviderSelector from './components/ProviderSelector';
import EventButtonGrid from './components/EventButtonGrid';

export default function Home() {
  const [config, setConfig] = useState({
    oktaDomain: '',
    issuerUrl: 'https://my-local-transmitter.com',
    subjectEmail: 'test-user@example.com',
  });

  const [providerId, setProviderId] = useState('custom');
  const [keys, setKeys] = useState<{ privatePem: string; publicJwk: JWK; kid: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);

  const selectedProvider = PROVIDERS[providerId];

  const addLog = (msg: string) => setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleGenerateKeys = async () => {
    addLog('Generating new RSA Key Pair...');
    const result = await generateKeyPair();
    setKeys(result);
    addLog(`Keys generated! Key ID: ${result.kid}`);
    addLog('IMPORTANT: You must update npoint.io with the new JSON below!');
  };

  const handleProviderChange = (provider: SecurityProvider) => {
    setProviderId(provider.id);
    setConfig((prev) => ({ ...prev, issuerUrl: provider.defaultIssuer }));
    addLog(`Switched to ${provider.name} - issuer URL updated`);
  };

  const handleTransmit = async (event: SecurityEvent) => {
    if (!keys || !config.oktaDomain || !config.issuerUrl) {
      addLog('Error: Missing configuration or keys.');
      return;
    }

    setLoading(true);
    setLastPayload(null);
    addLog(`Transmitting ${selectedProvider.name} - ${event.label} to Okta...`);

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
        addLog(`Success! Event accepted by Okta (Status: ${data.status || 202})`);
      } else {
        console.error('Transmission Failed:', data);
        const detailMsg = data.details ? `Details: ${data.details}` : '';
        addLog(`Error: ${data.error} (Status: ${data.status}) ${detailMsg}`);

        if (data.debugAudience) {
          addLog(`Debug: Sent to Audience: ${data.debugAudience}`);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Network Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-mono text-sm">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Okta SSF Visual Transmitter</h1>

        {/* Configuration Section */}
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">1. Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 mb-1">Okta Domain</label>
              <input
                className="w-full border p-2 rounded"
                placeholder="dev-12345.okta.com"
                value={config.oktaDomain}
                onChange={(e) => setConfig({ ...config, oktaDomain: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">e.g. craigverzosa.oktapreview.com</p>
            </div>
            <ProviderSelector selectedProviderId={providerId} onProviderChange={handleProviderChange} />
            <div className="col-span-2">
              <label className="block text-gray-600 mb-1">Issuer URL (matches Okta config)</label>
              <input
                className="w-full border p-2 rounded"
                placeholder="https://my-local-transmitter.com"
                value={config.issuerUrl}
                onChange={(e) => setConfig({ ...config, issuerUrl: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Auto-filled when provider changes, but can be customized</p>
            </div>
            <div className="col-span-2">
              <label className="block text-gray-600 mb-1">Target Subject (Email)</label>
              <input
                className="w-full border p-2 rounded"
                value={config.subjectEmail}
                onChange={(e) => setConfig({ ...config, subjectEmail: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Key Management */}
        <div className="bg-white p-6 rounded shadow space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">2. Key Management</h2>
            <button
              onClick={handleGenerateKeys}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Generate New Keys
            </button>
          </div>

          {keys && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                <strong>Action Required:</strong> Copy the JSON below and update your npoint.io / Mocky bin.
              </div>
              <textarea
                readOnly
                className="w-full h-32 border p-2 rounded bg-gray-100 text-xs"
                value={JSON.stringify({ keys: [keys.publicJwk] }, null, 2)}
              />
              <p className="text-gray-500 text-xs">Key ID: {keys.kid}</p>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="bg-white p-6 rounded shadow space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">3. Transmission</h2>
            <span className={`px-3 py-1 rounded text-white text-xs ${selectedProvider.color}`}>
              {selectedProvider.name}
            </span>
          </div>
          <EventButtonGrid
            events={selectedProvider.events}
            loading={loading}
            disabled={!keys}
            onEventClick={handleTransmit}
          />
          <p className="text-xs text-gray-500 text-center mt-2">
            All events use the Okta ITP user-risk-change schema and can trigger Identity Threat Protection detections.
          </p>
        </div>

        {/* Payload Viewer */}
        {lastPayload && (
          <div className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">4. Last Transmitted Payload</h2>
            <div className="bg-gray-800 text-cyan-300 p-4 rounded text-xs font-mono overflow-auto max-h-96">
              <pre>{JSON.stringify(lastPayload, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-gray-900 text-green-400 p-6 rounded shadow h-64 overflow-y-auto">
          <h3 className="text-gray-500 mb-2 border-b border-gray-700 pb-2">Activity Log</h3>
          {logs.map((log, i) => (
            <div key={i} className="mb-1 break-words">
              {log}
            </div>
          ))}
          {logs.length === 0 && <span className="text-gray-600">Waiting for action...</span>}
        </div>
      </div>
    </main>
  );
}
