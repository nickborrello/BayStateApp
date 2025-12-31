'use server';

import { revalidatePath } from 'next/cache';
import { updateCampaignBanner, type CampaignBannerSettings, type BannerMessage } from '@/lib/settings';

export async function updateCampaignBannerAction(formData: FormData) {
    // Parse messages from JSON string
    const messagesJson = formData.get('messages') as string;
    let messages: BannerMessage[] = [];

    try {
        messages = messagesJson ? JSON.parse(messagesJson) : [];
    } catch {
        messages = [];
    }

    const settings: CampaignBannerSettings = {
        enabled: formData.get('enabled') === 'on',
        messages,
        variant: (formData.get('variant') as 'info' | 'promo' | 'seasonal') || 'info',
        cycleInterval: parseInt(formData.get('cycleInterval') as string, 10) || 5000,
    };

    try {
        const success = await updateCampaignBanner(settings);

        if (!success) {
            return { success: false, error: 'Failed to update settings in database' };
        }

        revalidatePath('/admin/design');
        revalidatePath('/'); // Revalidate storefront to show updated banner
        return { success: true };
    } catch (error: any) {
        console.error('Action error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred' };
    }
}
