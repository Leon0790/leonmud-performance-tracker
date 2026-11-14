import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, LogOut, GraduationCap, FileText, CreditCard,
  BookUser, Trash2, CalendarCheck, BookOpen, School, Layers, Megaphone, ClipboardCheck, Wallet,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAccount } from '@/hooks/use-account';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const teacherNavItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Marks Entry', path: '/marks', icon: Users },
  { label: 'Performance', path: '/performance', icon: BarChart3 },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Students', path: '/students/list', icon: BookUser },
  { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { label: 'Lesson Plans', path: '/lesson-plans', icon: BookOpen },
  { label: 'Lesson Plan Access', path: '/lesson-plans/access', icon: Wallet },
  { label: 'Submit Assessments', path: '/school/submissions', icon: ClipboardCheck },
  { label: 'Announcements', path: '/school/announcements', icon: Megaphone },
  { label: 'Subscription', path: '/subscribe', icon: CreditCard },
];

const headteacherNavItems = [
  { label: 'School Dashboard', path: '/school', icon: School },
  { label: 'Teachers', path: '/school/teachers', icon: Users },
  { label: 'Classes', path: '/school/classes', icon: Layers },
  { label: 'Reviews', path: '/school/submissions', icon: ClipboardCheck },
  { label: 'Announcements', path: '/school/announcements', icon: Megaphone },
  { label: 'Learners', path: '/students/list', icon: BookUser },
  { label: 'Marks Entry', path: '/marks', icon: FileText },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Performance', path: '/performance', icon: BarChart3 },
  { label: 'Lesson Plan Access', path: '/lesson-plans/access', icon: BookOpen },
  { label: 'Subscription', path: '/subscribe', icon: CreditCard },
];

const superAdminNavItems = [
  { label: 'Schools', path: '/super-admin/schools', icon: School },
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Marks Entry', path: '/marks', icon: Users },
  { label: 'Performance', path: '/performance', icon: BarChart3 },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Students', path: '/students/list', icon: BookUser },
  { label: 'Lesson Plans', path: '/lesson-plans', icon: BookOpen },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard },
];

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  headteacher: 'Headteacher',
  teacher: 'Teacher',
};

export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { user, userType, schoolName } = useAccount();

  const navItems = userType === 'super_admin' ? superAdminNavItems : userType === 'headteacher' ? headteacherNavItems : teacherNavItems;

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const handleDeleteAccount = async () => {
    await base44.auth.logout('/');
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shrink-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight">LeonMud</h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">{schoolName || ROLE_LABEL[userType] || 'Performance Tracker'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        {user && (
          <div className="px-4 pb-1">
            <p className="text-xs text-sidebar-foreground/40 truncate">{user.email}</p>
            <p className="text-[11px] text-sidebar-foreground/30">{ROLE_LABEL[userType] || 'Teacher'}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove your access. All your data will be deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, Delete My Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}