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
      <div>
        <div className="eyebrow">Grows with the clinic, not before it</div>
        <h1 className="text-xl mt-1">Modules</h1>
      </div>

      {error && (
        <div className="bg-amber/10 border border-amber text-amber text-sm rounded-wrs p-3 font-mono">
          {error}
        </div>
      )}

      <div>
        <div className="text-xs text-ink-soft font-mono uppercase tracking-wide mb-2">Installed</div>
        <div className="grid grid-cols-1 gap-2">
          {data.installed.map((pkg) => {
            const name = typeof pkg === 'string' ? pkg : pkg.name;
            const desc = typeof pkg === 'string' ? null : pkg.description;
            return (
              <div key={name} className="border border-wrs-teal bg-[#F2FAF8] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{name}</span>
                  <span className="tag-mono bg-wrs-teal text-white">Active</span>
                </div>
                {desc && <p className="text-xs text-ink-soft">{desc}</p>}
              </div>
            );
          })}
          {data.installed.length === 0 && !error && (
            <div className="text-sm text-ink-soft">No packages reported yet.</div>
          )}
        </div>
      </div>

      <div>
        <div className="text-xs text-ink-soft font-mono uppercase tracking-wide mb-2">Available</div>
        <div className="grid grid-cols-1 gap-2">
          {data.available.map((pkg) => (
            <div key={pkg.name} className="border border-rule bg-white rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{pkg.label ?? pkg.name}</span>
                <span className="tag-mono bg-paper-dim text-ink-soft">{pkg.tier ?? 'available'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-3 space-y-2">
        <div className="text-xs text-ink-soft font-mono">
          Gateway URL — change this when your tunnel URL rotates, no rebuild needed.
        </div>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://your-tunnel.trycloudflare.com"
          className="w-full border border-rule rounded-lg px-3 py-2 text-sm bg-paper-dim/40 font-mono"
        />
        <div className="flex gap-2">
          <button
            onClick={saveUrl}
            className="flex-1 bg-ink text-paper rounded-full py-2 text-sm font-semibold"
          >
            Save & Reconnect
          </button>
          <button
            onClick={resetUrl}
            className="flex-1 bg-paper-dim text-ink-soft rounded-full py-2 text-sm font-semibold"
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
          className="w-full border border-wrs-teal text-wrs-teal rounded-full py-2 text-sm font-semibold"
        >
          Test Connection
        </button>
      </div>
    </div>
  );
}
