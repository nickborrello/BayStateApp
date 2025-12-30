import { createClient } from '@/lib/supabase/server';

export interface CampaignBannerSettings {
  enabled: boolean;
  message: string;
  link_text?: string;
  link_href?: string;
  variant: 'info' | 'promo' | 'seasonal';
}

export interface SiteSettings {
  campaign_banner: CampaignBannerSettings;
}

const defaultSettings: SiteSettings = {
  campaign_banner: {
    enabled: false,
    message: '',
    variant: 'info',
  },
};

/**
 * Fetches a site setting by key.
 */
export async function getSetting<K extends keyof SiteSettings>(
  key: K
): Promise<SiteSettings[K]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultSettings[key];
  }

  return data.value as SiteSettings[K];
}

/**
 * Updates a site setting.
 */
export async function updateSetting<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }

  return true;
}

/**
 * Fetches the campaign banner settings.
 */
export async function getCampaignBanner(): Promise<CampaignBannerSettings> {
  return getSetting('campaign_banner');
}

/**
 * Updates the campaign banner settings.
 */
export async function updateCampaignBanner(
  settings: CampaignBannerSettings
): Promise<boolean> {
  return updateSetting('campaign_banner', settings);
}
