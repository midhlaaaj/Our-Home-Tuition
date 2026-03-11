import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles = ['admin'],
    redirectPath = '/admin/login'
}) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#F8FAFC]">
                <div className="w-16 h-16 border-4 border-[#1B2A5A]/20 border-t-[#1B2A5A] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(role || ''))) {
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
