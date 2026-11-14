import React from 'react';
import { useAccount } from '@/hooks/use-account';
import Dashboard from '@/pages/Dashboard';
import SchoolDashboard from '@/pages/SchoolDashboard';
import SuperAdminSchools from '@/pages/SuperAdminSchools';

/** The landing page each staff role needs. */
export default function RoleHome() {
  const { userType, loading } = useAccount();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (userType === 'super_admin') return <SuperAdminSchools />;
  if (userType === 'headteacher') return <SchoolDashboard />;
  return <Dashboard />;
}