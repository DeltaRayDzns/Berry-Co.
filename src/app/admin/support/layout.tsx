import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/actions/auth'
import DashboardShell from '@/components/admin/dashboard-shell'

export default async function AdminSupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <DashboardShell
      name={admin.profile.full_name ?? admin.user.email ?? 'Admin'}
      avatarUrl={admin.profile.avatar_url}
    >
      {children}
    </DashboardShell>
  )
}
