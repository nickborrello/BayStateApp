import { createClient } from '@/lib/supabase/server';

export interface BannerMessage {
  text: string;
  linkText?: string;
  linkHref?: string;
}

export interface CampaignBannerSettings {
  enabled: boolean;
  messages: BannerMessage[];
  variant: 'info' | 'promo' | 'seasonal';
  cycleInterval: number; // Milliseconds between transitions
  // Legacy field for backwards compatibility
  message?: string;
  link_text?: string;
  link_href?: string;
}

export interface SiteSettings {
  campaign_banner: CampaignBannerSettings;
}

const defaultSettings: SiteSettings = {
  campaign_banner: {
    enabled: false,
    messages: [],
    variant: 'info',
    cycleInterval: 5000,
  },
};

/**
 * Normalizes campaign banner settings for backwards compatibility.
 * Converts legacy single-message format to new array format.
 */
function normalizeCampaignBanner(settings: CampaignBannerSettings): CampaignBannerSettings {
  // Ensure default values are present
  const normalized: CampaignBannerSettings = {
    ...defaultSettings.campaign_banner,
    ...settings,
  };

  // If messages array exists and has items, use it
  if (normalized.messages && normalized.messages.length > 0) {
    return normalized;
  }

  // Convert legacy single-message format to array format
  if (normalized.message) {
    return {
      ...normalized,
      messages: [{
        text: normalized.message,
        linkText: normalized.link_text,
        linkHref: normalized.link_href,
      }],
    };
  }

  return normalized;
}

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
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) {
    console.error(`Error updating setting ${key}:`, error.message, error.details, error.hint);
    return false;
  }

  return true;
}

/**
 * Fetches the campaign banner settings.
 */
export async function getCampaignBanner(): Promise<CampaignBannerSettings> {
  const settings = await getSetting('campaign_banner');
  return normalizeCampaignBanner(settings);
}

/**
 * Updates the campaign banner settings.
 */
export async function updateCampaignBanner(
  settings: CampaignBannerSettings
): Promise<boolean> {
  return updateSetting('campaign_banner', settings);
}
