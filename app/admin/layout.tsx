import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAdminAccess } from '@/lib/admin/access';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminQueryProvider } from '@/components/admin/AdminQueryProvider';

export const metadata = {
  title: 'Admin Portal | ChemCurious',
  description: 'Administrative management console for ChemCurious chemistry learning engine.',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Public admin routes that don't need shell or auth redirect
  if (pathname === '/admin/forbidden') {
    return (
      <AdminQueryProvider>
        {children}
      </AdminQueryProvider>
    );
  }

  const access = await getAdminAccess();

  if (!access.hasAccess) {
    if (access.reason === 'not_logged_in') {
      redirect('/auth?portal=admin&redirect=/admin/dashboard');
    }
    // If logged in but insufficient role
    redirect('/admin/forbidden');
  }

  return (
    <AdminQueryProvider>
      <AdminShell
        initialRole={access.role}
        initialName={access.userName}
        initialEmail={access.userEmail}
      >
        {children}
      </AdminShell>
    </AdminQueryProvider>
  );
}
