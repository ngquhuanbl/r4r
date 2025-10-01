"use client";

import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Paths } from '@/constants/paths';
import { useAppSelector } from '@/lib/redux/hooks';
import { authSelectors } from '@/lib/redux/slices/auth';

export const AdminNavItem = () => {
  const isAdmin = useAppSelector(authSelectors.selectIsAdmin);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  if (!isAdmin) return null;
  return (
    <li role="menuitem">
      <Link href={Paths.ADMIN} className="font-medium hover:text-primary">
        <Lock className="inline mr-2 align-top" size={20} />
        Admin
      </Link>
    </li>
  );
};
