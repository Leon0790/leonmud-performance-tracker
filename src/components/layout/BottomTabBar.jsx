import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, BookUser, FileText, CalendarCheck, CreditCard, BookOpen, School, Users, ClipboardCheck,
} from 'lucide-react';
import { useAccount } from '@/hooks/use-account';

const TEACHER_TABS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Marks', path: '/marks', icon: ClipboardList },
  { label: 'Students', path: '/students/list', icon: BookUser },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Plans', path: '/lesson-plans', icon: BookOpen },
];

const HEADTEACHER_TABS = [
  { label: 'School', path: '/school', icon: School },
  { label: 'Teachers', path: '/school/teachers', icon: Users },
  { label: 'Reviews', path: '/school/submissions', icon: ClipboardCheck },
  { label: 'Learners', path: '/students/list', icon: BookUser },
  { label: 'Plans', path: '/lesson-plans/access', icon: BookOpen },
];

const ADMIN_TABS = [
  { label: 'Schools', path: '/super-admin/schools', icon: School },
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Marks', path: '/marks', icon: ClipboardList },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard },
];

export default function BottomTabBar() {
  const location = useLocation();
  const { userType } = useAccount();

  const TABS = userType === 'super_admin' ? ADMIN_TABS : userType === 'headteacher' ? HEADTEACHER_TABS : TEACHER_TABS;

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