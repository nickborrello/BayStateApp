'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  unit: z.string().optional().nullable(),
});

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
    price: formData.get('price') || null,
    unit: formData.get('unit') || null,
  };

  const validatedData = serviceSchema.parse(rawData);

  const { error } = await supabase
    .from('services')
    .update({
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description,
      price: validatedData.price,
      unit: validatedData.unit,
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to update service');
  }

  revalidatePath('/admin/services');
  redirect('/admin/services');
}

export async function toggleServiceActive(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to toggle service status');
  }

  revalidatePath('/admin/services');
  revalidatePath(`/admin/services/${id}/edit`);
}
