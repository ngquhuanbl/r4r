'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/home">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}