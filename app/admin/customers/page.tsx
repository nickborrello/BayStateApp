'use client';

import { UserCircle } from 'lucide-react';

export default function CustomersPage() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="rounded-full bg-gray-100 p-6 mb-6">
                <UserCircle className="h-16 w-16 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Customers</h1>
            <p className="text-gray-500 max-w-md mb-6">
                Customer management is coming soon. You&apos;ll be able to view customer profiles,
                order history, and loyalty information.
            </p>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
                Coming Soon
            </span>
        </div>
    );
}
