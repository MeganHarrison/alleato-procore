import Link from 'next/link'
import { FileText, Database, Settings, Home } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/admin/documents/pipeline', label: 'Document Pipeline', icon: Database },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}