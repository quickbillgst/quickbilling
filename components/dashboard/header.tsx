'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout, tenant } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h2>
        {tenant && (
          <p className="text-sm text-slate-500 mt-1">
            {tenant.gstin ? `GSTIN: ${tenant.gstin}` : 'Unregistered Supplier'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5 text-slate-600" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-slate-500">
              {user?.firstName || 'User'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
