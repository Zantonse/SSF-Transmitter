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
      <label className="block text-sm text-[var(--text-secondary)] mb-2">Security Provider</label>
      <select
        className="select-field w-full"
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
        <p className="text-xs text-[var(--text-muted)] mt-2">{selectedProvider.description}</p>
      )}
    </div>
  );
}
