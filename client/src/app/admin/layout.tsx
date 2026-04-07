"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminLayout from '../../layout/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={['admin']} redirectPath="/admin/login">
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}
