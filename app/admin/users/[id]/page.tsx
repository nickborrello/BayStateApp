import { getProfile } from '@/lib/auth/roles'
import { UserRoleSelect } from '@/components/admin/user-role-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function UserDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const user = await getProfile(id)

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">User not found</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{user.full_name || 'User Details'}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-1">
                            <span className="font-semibold text-sm text-muted-foreground">ID</span>
                            <span>{user.id}</span>
                        </div>
                        <div className="grid gap-1">
                            <span className="font-semibold text-sm text-muted-foreground">Email</span>
                            <span>{user.email}</span>
                        </div>
                        <div className="grid gap-1">
                            <span className="font-semibold text-sm text-muted-foreground">Role</span>
                            <div className="max-w-[200px]">
                                <UserRoleSelect userId={user.id} currentRole={user.role} />
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <span className="font-semibold text-sm text-muted-foreground">Joined</span>
                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Order History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground italic">Order History (Coming Soon)</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
