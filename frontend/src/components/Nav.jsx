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
  online: 'bg-green-500 text-white',
  offline: 'bg-gray-400 text-white',
  checking: 'bg-amber-400 text-white'
};

const STATUS_LABEL = {
  online: 'Online',
  offline: 'Offline',
  checking: 'Checking…'
};

export default function Nav({ status = 'checking' }) {
  return (
    <>
      <div className="fixed top-0 inset-x-0 bg-wrs-teal text-white px-4 py-3 flex items-center justify-between shadow">
        <span className="font-semibold">🌍 WRS Clinic</span>
        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t grid grid-cols-7 text-xs">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${isActive ? 'text-wrs-teal font-semibold' : 'text-gray-500'}`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
