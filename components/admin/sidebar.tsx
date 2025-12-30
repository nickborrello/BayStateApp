import Link from 'next/link'
import { Package, Wrench, ShoppingCart, Home, Settings } from 'lucide-react'

export function AdminSidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Manager Portal</h1>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        <Link href="/admin" className="flex items-center space-x-3 rounded px-4 py-2 hover:bg-gray-800">
            <Home className="h-5 w-5" />
            <span>Overview</span>
        </Link>
        <Link href="/admin/products" className="flex items-center space-x-3 rounded px-4 py-2 hover:bg-gray-800">
          <Package className="h-5 w-5" />
          <span>Products</span>
        </Link>
        <Link href="/admin/services" className="flex items-center space-x-3 rounded px-4 py-2 hover:bg-gray-800">
          <Wrench className="h-5 w-5" />
          <span>Services</span>
        </Link>
        <Link href="/admin/orders" className="flex items-center space-x-3 rounded px-4 py-2 hover:bg-gray-800">
          <ShoppingCart className="h-5 w-5" />
          <span>Orders</span>
        </Link>
        <Link href="/admin/settings" className="flex items-center space-x-3 rounded px-4 py-2 hover:bg-gray-800">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  )
}
