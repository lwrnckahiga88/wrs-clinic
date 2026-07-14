import { NavLink } from 'react-router-dom';

const items = [
  { to: '/patients', label: 'Patients', icon: '👤' },
  { to: '/appointments', label: 'Appts', icon: '📅' },
  { to: '/consultation', label: 'Consult', icon: '🩺' },
  { to: '/pharmacy', label: 'Pharmacy', icon: '💊' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/marketplace', label: 'Modules', icon: '🧩' }
];

const STATUS_STYLES = {
  online: 'bg-signal/90 text-white',
  offline: 'bg-white/20 text-white',
  checking: 'bg-amber/90 text-white'
};

const STATUS_LABEL = {
  online: 'Online',
  offline: 'Offline',
  checking: 'Checking…'
};

export default function Nav({ status = 'checking' }) {
  return (
    <>
      <div className="fixed top-0 inset-x-0 z-40 bg-wrs-teal text-white px-4 py-3 flex items-center justify-between shadow">
        <span className="font-mono font-semibold text-sm flex items-center gap-2">
          <span className="w-[7px] h-[7px] rounded-full bg-signal shadow-[0_0_0_3px_rgba(63,163,77,.35)]" />
          WRS CLINIC
        </span>
        <span className={`font-mono text-[11px] px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-rule grid grid-cols-7 font-mono text-[10px]">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 ${
                isActive ? 'text-teal-deep font-semibold' : 'text-ink-soft'
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
