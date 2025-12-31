import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountSidebar } from '@/components/account/account-sidebar'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                <aside className="w-full md:w-64 shrink-0">
                    <div className="md:sticky md:top-24">
                        <AccountSidebar />
                    </div>
                </aside>
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
        </div>
    )
}
