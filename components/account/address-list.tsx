'use client'

import { useState } from 'react'
import { Address } from '@/lib/account/types'
import { AddressForm } from './address-form'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, CheckCircle, MapPin } from 'lucide-react'
import { deleteAddressAction, setDefaultAddressAction } from '@/lib/account/actions'
import { Card, CardContent } from '@/components/ui/card'

export function AddressList({ initialAddresses }: { initialAddresses: Address[] }) {
    const [isAdding, setIsAdding] = useState(false)

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this address?')) return
        await deleteAddressAction(id)
    }

    async function handleSetDefault(id: string) {
        await setDefaultAddressAction(id)
    }

    return (
        <div className="space-y-6">
            {!isAdding && (
                <Button onClick={() => setIsAdding(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Address
                </Button>
            )}

            {isAdding && (
                <Card className="border-zinc-200">
                    <CardContent className="pt-6">
                        <div className="flex justify-between mb-4 items-center">
                            <h3 className="font-semibold">New Address</h3>
                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                        </div>
                        <AddressForm onSuccess={() => setIsAdding(false)} />
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {initialAddresses.map(addr => (
                    <Card key={addr.id} className={addr.is_default ? "border-zinc-900 ring-1 ring-zinc-900" : ""}>
                        <CardContent className="pt-6 relative">
                            {addr.is_default && (
                                <div className="absolute top-4 right-4 flex items-center text-xs font-medium text-zinc-900 bg-zinc-100 px-2 py-1 rounded-full">
                                    <CheckCircle className="mr-1 h-3 w-3" /> Default
                                </div>
                            )}
                            <div className="font-semibold pr-20">{addr.full_name}</div>
                            <div className="text-sm text-zinc-500 mt-2 space-y-0.5">
                                <div>{addr.address_line1}</div>
                                {addr.address_line2 && <div>{addr.address_line2}</div>}
                                <div>{addr.city}, {addr.state} {addr.zip_code}</div>
                                {addr.phone && <div className="mt-2 text-zinc-400">{addr.phone}</div>}
                            </div>

                            <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100">
                                {!addr.is_default && (
                                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)} className="h-8 px-2">
                                        Set Default
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" className="ml-auto h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(addr.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {initialAddresses.length === 0 && !isAdding && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 rounded-lg">
                        <div className="bg-zinc-50 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MapPin className="h-6 w-6 text-zinc-400" />
                        </div>
                        <h3 className="text-sm font-medium text-zinc-900">No addresses</h3>
                        <p className="text-sm text-zinc-500 mb-4">Add an address for faster checkout.</p>
                        <Button onClick={() => setIsAdding(true)} variant="outline">
                            Add Address
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
