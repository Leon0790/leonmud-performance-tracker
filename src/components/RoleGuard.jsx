import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAccount } from '@/hooks/use-account';

/** Keeps administrative screens to the staff roles allowed to use them. */
export default function RoleGuard({ allow = [], children }) {
  const { userType, loading } = useAccount();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!allow.includes(userType)) return <Navigate to="/" replace />;
  return children;
}