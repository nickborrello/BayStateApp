import { getCampaignBanner } from '@/lib/settings';
import { updateCampaignBannerAction } from './actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';

export default async function AdminSettingsPage() {
  const campaignBanner = await getCampaignBanner();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage storefront settings and campaigns
        </p>
      </div>

      {/* Campaign Banner Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Megaphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Campaign Banner</CardTitle>
              <CardDescription>
                Control the promotional banner shown at the top of the storefront
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={updateCampaignBannerAction} className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Banner Enabled</p>
                <p className="text-sm text-muted-foreground">
                  Show the promotional banner to customers
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={campaignBanner.enabled ? 'default' : 'secondary'}>
                  {campaignBanner.enabled ? 'Active' : 'Inactive'}
                </Badge>
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={campaignBanner.enabled}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Banner Message</Label>
              <Input
                id="message"
                name="message"
                defaultValue={campaignBanner.message}
                placeholder="🌱 Spring Sale — Save 20% on all garden supplies!"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Use emojis for visual appeal. Keep it short and actionable.
              </p>
            </div>

            {/* Link */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="link_text">Link Text (optional)</Label>
                <Input
                  id="link_text"
                  name="link_text"
                  defaultValue={campaignBanner.link_text || ''}
                  placeholder="Shop Now"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link_href">Link URL (optional)</Label>
                <Input
                  id="link_href"
                  name="link_href"
                  defaultValue={campaignBanner.link_href || ''}
                  placeholder="/products?category=garden"
                />
              </div>
            </div>

            {/* Variant */}
            <div className="space-y-2">
              <Label htmlFor="variant">Banner Style</Label>
              <select
                id="variant"
                name="variant"
                defaultValue={campaignBanner.variant}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="info">Info (Dark)</option>
                <option value="promo">Promo (Amber)</option>
                <option value="seasonal">Seasonal (Green)</option>
              </select>
            </div>

            {/* Preview */}
            {campaignBanner.enabled && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className={`rounded-lg py-2.5 px-4 text-center text-sm font-medium ${
                    campaignBanner.variant === 'info'
                      ? 'bg-zinc-900 text-white'
                      : campaignBanner.variant === 'promo'
                        ? 'bg-amber-500 text-zinc-900'
                        : 'bg-green-600 text-white'
                  }`}
                >
                  {campaignBanner.message}
                  {campaignBanner.link_text && (
                    <span className="ml-2 underline">{campaignBanner.link_text}</span>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" size="lg">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
