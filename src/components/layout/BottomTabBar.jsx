import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, ClipboardList, BookUser, FileText, CalendarCheck, CreditCard } from 'lucide-react';

const TEACHER_TABS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Marks', path: '/marks', icon: ClipboardList },
  { label: 'Students', path: '/students/list', icon: BookUser },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Attend.', path: '/attendance', icon: CalendarCheck },
];

const ADMIN_TABS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Marks', path: '/marks', icon: ClipboardList },
  { label: 'Students', path: '/students/list', icon: BookUser },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard },
];

export default function BottomTabBar() {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const TABS = user?.role === 'admin' ? ADMIN_TABS : TEACHER_TABS;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border flex items-stretch"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path ||
          (tab.path !== '/' && location.pathname.startsWith(tab.path));
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors select-none min-h-[56px] ${
              isActive
                ? 'text-sidebar-primary'
                : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80'
            }`}
          >
            <tab.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}