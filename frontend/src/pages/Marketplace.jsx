import { useEffect, useState } from 'react';
import { apiUrl, getApiBaseUrl, setApiBaseUrlOverride, clearApiBaseUrlOverride } from '../config';
import { checkGatewayHealth } from '../sync';

export default function Marketplace() {
  const [data, setData] = useState({ installed: [], available: [] });
  const [error, setError] = useState(null);
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/marketplace'), {
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error(`Gateway responded ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError('Could not reach the Gateway — check your connection below.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveUrl = async () => {
    if (urlInput.trim()) {
      setApiBaseUrlOverride(urlInput.trim());
    } else {
      clearApiBaseUrlOverride();
    }
    await load();
  };

  const resetUrl = async () => {
    clearApiBaseUrlOverride();
    setUrlInput('');
    await load();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold text-wrs-dark">Modules</h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3">{error}</div>
      )}

      <div>
        <div className="text-xs text-gray-500 mb-2">Installed</div>
        <div className="space-y-2">
          {data.installed.map((pkg) => (
            <div
              key={typeof pkg === 'string' ? pkg : pkg.name}
              className="bg-white rounded-xl shadow p-3 flex items-center justify-between"
            >
              <span className="font-medium text-sm">
                {typeof pkg === 'string' ? pkg : pkg.name}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
            </div>
          ))}
          {data.installed.length === 0 && !error && (
            <div className="text-sm text-gray-400">No packages reported yet.</div>
          )}
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-2">Available</div>
        <div className="space-y-2">
          {data.available.map((pkg) => (
            <div
              key={pkg.name}
              className="bg-white rounded-xl shadow p-3 flex items-center justify-between opacity-80"
            >
              <span className="font-medium text-sm">{pkg.label ?? pkg.name}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                {pkg.tier ?? 'available'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-3 space-y-2">
        <div className="text-xs text-gray-500">
          Gateway URL — change this when your tunnel URL rotates, no rebuild needed.
        </div>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://your-tunnel.trycloudflare.com"
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={saveUrl}
            className="flex-1 bg-wrs-teal text-white rounded-lg py-2 text-sm font-semibold"
          >
            Save & Reconnect
          </button>
          <button
            onClick={resetUrl}
            className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2 text-sm font-semibold"
          >
            Use Default
          </button>
        </div>
        <button
          onClick={async () => {
            const healthy = await checkGatewayHealth();
            setError(healthy ? null : 'Gateway unreachable at this URL.');
            if (healthy) load();
          }}
          className="w-full border border-wrs-teal text-wrs-teal rounded-lg py-2 text-sm font-semibold"
        >
          Test Connection
        </button>
      </div>
    </div>
  );
}
