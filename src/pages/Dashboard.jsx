// This is the updated file: pages/Dashboard.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 hidden md:block min-h-screen">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="w-full shadow-sm">
          <Navbar />
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto">
        
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
