'use client';

import { useState } from 'react';
import { Megaphone, Home, Navigation, Paintbrush } from 'lucide-react';
import { BannersTab } from './banners-tab';
import { HomepageTab } from './homepage-tab';
import type { CampaignBannerSettings } from '@/lib/settings';

interface DesignTabsProps {
    initialBannerSettings: CampaignBannerSettings;
}

type TabId = 'banners' | 'homepage' | 'navigation' | 'branding';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    available: boolean;
}

const tabs: Tab[] = [
    { id: 'banners', label: 'Banners', icon: <Megaphone className="h-4 w-4" />, available: true },
    { id: 'homepage', label: 'Homepage', icon: <Home className="h-4 w-4" />, available: true },
    { id: 'navigation', label: 'Navigation', icon: <Navigation className="h-4 w-4" />, available: false },
    { id: 'branding', label: 'Branding', icon: <Paintbrush className="h-4 w-4" />, available: false },
];

export function DesignTabs({ initialBannerSettings }: DesignTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('banners');

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => tab.available && setActiveTab(tab.id)}
                            disabled={!tab.available}
                            className={`
                flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors
                ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : tab.available
                                        ? 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                                        : 'border-transparent text-muted-foreground/50 cursor-not-allowed'
                                }
              `}
                        >
                            {tab.icon}
                            {tab.label}
                            {!tab.available && (
                                <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'banners' && (
                    <BannersTab initialSettings={initialBannerSettings} />
                )}
                {activeTab === 'homepage' && <HomepageTab />}
                {activeTab === 'navigation' && (
                    <div className="text-center py-12 text-muted-foreground">
                        Navigation customization coming soon
                    </div>
                )}
                {activeTab === 'branding' && (
                    <div className="text-center py-12 text-muted-foreground">
                        Branding customization coming soon
                    </div>
                )}
            </div>
        </div>
    );
}
