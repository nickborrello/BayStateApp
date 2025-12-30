'use server';

import { revalidatePath } from 'next/cache';
import { updateCampaignBanner, type CampaignBannerSettings } from '@/lib/settings';

export async function updateCampaignBannerAction(formData: FormData) {
  const settings: CampaignBannerSettings = {
    enabled: formData.get('enabled') === 'on',
    message: (formData.get('message') as string) || '',
    link_text: (formData.get('link_text') as string) || undefined,
    link_href: (formData.get('link_href') as string) || undefined,
    variant: (formData.get('variant') as 'info' | 'promo' | 'seasonal') || 'info',
  };

  const success = await updateCampaignBanner(settings);

  if (!success) {
    throw new Error('Failed to update campaign banner');
  }

  revalidatePath('/admin/settings');
  revalidatePath('/'); // Revalidate storefront to show updated banner
}
