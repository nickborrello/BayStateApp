import { createClient } from '@/lib/supabase/server';
import { updateService, toggleServiceActive } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (!service) {
    notFound();
  }

  const updateServiceWithId = updateService.bind(null, id);
  const toggleActiveWithId = toggleServiceActive.bind(null, id, !service.is_active);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/services"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Services
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Service</CardTitle>
          <form action={toggleActiveWithId}>
            <Button
              type="submit"
              variant={service.is_active ? 'outline' : 'default'}
              size="sm"
            >
              {service.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Badge variant={service.is_active ? 'default' : 'secondary'}>
              {service.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <form action={updateServiceWithId} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={service.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={service.slug}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={service.description || ''}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (optional)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={service.price || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit (optional)</Label>
                <Input
                  id="unit"
                  name="unit"
                  defaultValue={service.unit || ''}
                />
              </div>
            </div>
            <Button type="submit">Update Service</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
