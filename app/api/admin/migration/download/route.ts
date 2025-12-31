/**
 * API Route to download raw ShopSite XML data
 * 
 * GET /api/admin/migration/download?type=products|orders|customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MIGRATION_SETTINGS_KEY = 'shopsite_migration';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type || !['products', 'orders', 'customers'].includes(type)) {
        return NextResponse.json(
            { error: 'Invalid type. Must be products, orders, or customers.' },
            { status: 400 }
        );
    }

    // Get credentials from Supabase
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', MIGRATION_SETTINGS_KEY)
        .single();

    if (error || !data) {
        return NextResponse.json(
            { error: 'No ShopSite credentials configured' },
            { status: 400 }
        );
    }

    const { storeUrl, merchantId, password } = data.value as {
        storeUrl: string;
        merchantId: string;
        password: string;
    };

    // Normalize URL
    let baseUrl = storeUrl.replace(/\/$/, '');
    if (baseUrl.endsWith('.cgi')) {
        const lastSlash = baseUrl.lastIndexOf('/');
        if (lastSlash !== -1) {
            baseUrl = baseUrl.substring(0, lastSlash);
        }
    }

    // Build auth header
    const authHeader = 'Basic ' + Buffer.from(`${merchantId}:${password}`).toString('base64');

    try {
        const response = await fetch(`${baseUrl}/db_xml.cgi?action=download&type=${type}`, {
            headers: { 'Authorization': authHeader },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `ShopSite returned ${response.status}: ${response.statusText}` },
                { status: 502 }
            );
        }

        const xmlContent = await response.text();

        // Return as downloadable XML file
        return new NextResponse(xmlContent, {
            headers: {
                'Content-Type': 'application/xml',
                'Content-Disposition': `attachment; filename="shopsite-${type}-${new Date().toISOString().split('T')[0]}.xml"`,
            },
        });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to fetch from ShopSite' },
            { status: 500 }
        );
    }
}
