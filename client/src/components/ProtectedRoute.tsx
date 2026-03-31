"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import BrandedLoading from './BrandedLoading';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    redirectPath?: string;
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles = ['admin'],
    redirectPath = '/admin/login',
    children
}) => {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || (allowedRoles.length > 0 && role && !allowedRoles.includes(role)))) {
            router.push(redirectPath);
        }
    }, [user, role, loading, allowedRoles, redirectPath, router]);

    if (loading || !user || (allowedRoles.length > 0 && role && !allowedRoles.includes(role))) {
        return <BrandedLoading fullPage size="lg" />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
