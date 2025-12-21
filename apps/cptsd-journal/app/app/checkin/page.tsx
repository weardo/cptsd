'use client';

import { useState } from 'react';
import CheckInFlow from '@/components/CheckInFlow';

export default function CheckInPage() {
  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Daily Check-in</h1>
        <CheckInFlow />
      </div>
    </div>
  );
}



