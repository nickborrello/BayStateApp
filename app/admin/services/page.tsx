import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        <Button asChild>
          <Link href="/admin/services/new">
            <Plus className="mr-2 h-4 w-4" /> Add Service
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => (
          <Card key={service.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {service.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={service.is_active ? 'default' : 'secondary'}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/services/${service.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {service.price ? `$${service.price}` : 'Contact'}
                {service.unit && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /{service.unit}
                  </span>
                )}
              </div>
              {service.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                  {service.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {(!services || services.length === 0) && (
          <p className="text-muted-foreground">No services found.</p>
        )}
      </div>
    </div>
  );
}
