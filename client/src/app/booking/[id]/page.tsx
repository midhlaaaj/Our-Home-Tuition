"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import BookingDetails from '@/views/BookingDetails';

export default function BookingDetailsRoute() {
  const params = useParams();
  const id = params.id as string;
  
  return <BookingDetails id={id} />;
}
