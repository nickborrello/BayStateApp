import Link from 'next/link';
import {
  Package,
  Wrench,
  ShoppingCart,
  Home,
  Settings,
  GitBranch,
  BarChart3,
  Database,
  Tag,
  Users,
  Palette,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean; // If true, only show for admin role
}

interface NavSection {
  title?: string;
  items: NavItem[];
  adminOnly?: boolean; // If true, entire section is admin-only
}

const navSections: NavSection[] = [
  {
    items: [
      { href: '/admin', label: 'Overview', icon: <Home className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Store',
    items: [
      { href: '/admin/products', label: 'Products', icon: <Package className="h-5 w-5" /> },
      { href: '/admin/brands', label: 'Brands', icon: <Tag className="h-5 w-5" /> },
      { href: '/admin/services', label: 'Services', icon: <Wrench className="h-5 w-5" /> },
      { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Design',
    items: [
      { href: '/admin/design', label: 'Site Design', icon: <Palette className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Pipeline',
    items: [
      { href: '/admin/pipeline', label: 'Product Pipeline', icon: <GitBranch className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
      { href: '/admin/data', label: 'Data Explorer', icon: <Database className="h-5 w-5" /> },
    ],
  },
  {
    title: 'System',
    adminOnly: true, // Only admins can see this section
    items: [
      { href: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" />, adminOnly: true },
      { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, adminOnly: true },
    ],
  },
];

interface AdminSidebarProps {
  userRole?: 'admin' | 'staff' | 'customer';
}

export function AdminSidebar({ userRole = 'staff' }: AdminSidebarProps) {
  const isAdmin = userRole === 'admin';

  // Filter sections and items based on role
  const visibleSections = navSections
    .filter(section => !section.adminOnly || isAdmin)
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.adminOnly || isAdmin)
    }))
    .filter(section => section.items.length > 0);

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Manager Portal</h1>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {visibleSections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </h2>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 rounded px-4 py-2 hover:bg-gray-800 transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Role indicator */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Role</span>
          <span className={`px-2 py-0.5 rounded ${isAdmin ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'}`}>
            {userRole}
          </span>
        </div>
      </div>
    </div>
  );
}
