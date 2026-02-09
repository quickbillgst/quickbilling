'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FileText,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Receipt,
  GraduationCap,
  Upload
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Invoices', icon: FileText, href: '/dashboard/invoices' },
  { label: 'Payslips', icon: Receipt, href: '/dashboard/payslips' },
  { label: 'Certificates', icon: GraduationCap, href: '/dashboard/certificates' },
  { label: 'Products', icon: Package, href: '/dashboard/products' },
  { label: 'Customers', icon: Users, href: '/dashboard/customers' },
  { label: 'Payments', icon: CreditCard, href: '/dashboard/payments' },
  { label: 'Bulk Upload', icon: Upload, href: '/dashboard/invoices/bulk-upload' },
  { label: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' }
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, tenant } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-white border-r border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">Billing</h1>
        {tenant && (
          <p className="text-sm text-slate-400 mt-2">{tenant.businessName}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start text-slate-300 hover:text-white border-slate-700 bg-transparent"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
