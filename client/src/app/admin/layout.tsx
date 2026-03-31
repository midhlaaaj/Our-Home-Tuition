"use client";

import React from 'react';
import AdminLayout from '../../layout/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['admin']} redirectPath="/login">
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}
