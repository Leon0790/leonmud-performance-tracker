import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';
import { Menu, ChevronLeft } from 'lucide-react';

const ROOT_PATHS = ['/', '/marks', '/performance', '/reports', '/students/list', '/admin/payments'];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isSubPage = !ROOT_PATHS.includes(location.pathname);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top header */}
        <header className="lg:hidden flex items-center gap-3 px-3 py-3 border-b border-border bg-card sticky top-0 z-30">
          {isSubPage ? (
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted select-none">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted select-none">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-base font-bold">LeonMud Tracker</h1>
        </header>

        {/* Scrollable content — extra bottom padding on mobile for the tab bar */}
        <main className="flex-1 overflow-auto">
          <div className="lg:pb-0 pb-16">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom tab bar (mobile only) */}
      <BottomTabBar />
    </div>
  );
}