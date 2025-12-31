import Link from "next/link"
import { getUsers } from "@/lib/admin/users"
import { UserRoleSelect } from "@/components/admin/user-role-select"
import { UserSearch } from "@/components/admin/user-search"
import { Button } from "@/components/ui/button"

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string }>
}) {
    const params = await searchParams
    const page = Number(params.page) || 1
    const search = params.q || ''

    const { users, count } = await getUsers({ page, search, limit: 10 })
    const totalPages = Math.ceil(count / 10)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                <UserSearch />
            </div>

            <div className="rounded-md border">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr className="text-left font-medium">
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 font-medium">{user.full_name || 'N/A'}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4">
                                        <UserRoleSelect userId={user.id} currentRole={user.role} />
                                    </td>
                                    <td className="p-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/users/${user.id}`}>
                                                View
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                    {page > 1 ? (
                        <Link href={`?page=${page - 1}&q=${search}`}>Previous</Link>
                    ) : (
                        <span>Previous</span>
                    )}
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                    {page < totalPages ? (
                        <Link href={`?page=${page + 1}&q=${search}`}>Next</Link>
                    ) : (
                        <span>Next</span>
                    )}
                </Button>
            </div>
        </div>
    )
}
