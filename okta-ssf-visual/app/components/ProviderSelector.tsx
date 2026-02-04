'use client';

import { SecurityProvider } from '../types/providers';
import { PROVIDER_LIST } from '../config/providers';

interface ProviderSelectorProps {
  selectedProviderId: string;
  onProviderChange: (provider: SecurityProvider) => void;
}

export default function ProviderSelector({
  selectedProviderId,
  onProviderChange,
}: ProviderSelectorProps) {
  const selectedProvider = PROVIDER_LIST.find((p) => p.id === selectedProviderId);

  return (
    <div>
      <label className="block text-gray-600 mb-1">Security Provider</label>
      <select
        className="w-full border p-2 rounded"
        value={selectedProviderId}
        onChange={(e) => {
          const provider = PROVIDER_LIST.find((p) => p.id === e.target.value);
          if (provider) onProviderChange(provider);
        }}
      >
        {PROVIDER_LIST.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
      {selectedProvider && (
        <p className="text-xs text-gray-400 mt-1">{selectedProvider.description}</p>
      )}
    </div>
  );
}
