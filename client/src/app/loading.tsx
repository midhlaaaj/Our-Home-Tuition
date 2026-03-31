"use client";

import React from 'react';
import BrandedLoading from '../components/BrandedLoading';

export default function Loading() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <BrandedLoading size="lg" />
        </div>
    );
}
