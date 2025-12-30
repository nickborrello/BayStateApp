'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional().nullable(),
  unit: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export async function createService(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
    price: formData.get('price') || null,
    unit: formData.get('unit') || null,
    is_active: formData.get('is_active') === 'on',
  };

  const validatedData = serviceSchema.parse(rawData);

  const { error } = await supabase.from('services').insert({
    name: validatedData.name,
    slug: validatedData.slug,
    description: validatedData.description,
    price: validatedData.price,
    unit: validatedData.unit,
    is_active: validatedData.is_active,
  });

  if (error) {
    throw new Error('Failed to create service');
  }

  revalidatePath('/admin/services');
  redirect('/admin/services');
}
