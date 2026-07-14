import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Consultation from './pages/Consultation';
import Pharmacy from './pages/Pharmacy';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import Marketplace from './pages/Marketplace';
import { watchConnectivity, runSync, checkGatewayHealth } from './sync';
import { seedIfEmpty } from './db';

export default function App() {
  // 'checking' | 'online' | 'offline' — reflects actual Gateway reachability,
  // not just navigator.onLine (which stays true even with a dead tunnel).
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    seedIfEmpty();

    const refreshHealth = async () => {
      setStatus((prev) => (prev === 'checking' ? 'checking' : prev));
      const healthy = await checkGatewayHealth();
      setStatus(healthy ? 'online' : 'offline');
    };

    refreshHealth();
    watchConnectivity(() => refreshHealth());
    const healthInterval = setInterval(refreshHealth, 15000);
    const syncInterval = setInterval(runSync, 15000); // retry sync every 15s while app is open
    return () => {
      clearInterval(healthInterval);
      clearInterval(syncInterval);
    };
  }, []);

  return (
    <HashRouter>
      <Nav status={status} />
      <main className="pt-14 pb-16 min-h-screen max-w-md mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/patients" replace />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/marketplace" element={<Marketplace />} />
        </Routes>
      </main>
    </HashRouter>
  );
}
