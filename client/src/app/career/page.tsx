"use client";

import React, { Suspense } from 'react';
import Career from '../../views/Career';

export default function CareerRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-['Urbanist']">Loading careers...</div>}>
      <Career />
    </Suspense>
  );
}
