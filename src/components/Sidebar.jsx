import React from 'react';
import { NavLink } from 'react-router-dom';

const menu = [
  { name: 'Dashboard', path: '' },
  { name: 'Product Management', path: 'products' },
  { name: 'Order Management', path: 'orders' },
  { name: 'Inventory Log', path: 'inventory' },
  { name: 'Reports', path: 'reports' }, // Added Reports here
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen p-6">
      <nav className="flex flex-col gap-4">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50'
              }`
            }
            end={item.path === ''}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
