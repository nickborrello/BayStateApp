/**
 * API Route to download raw ShopSite XML data
 * 
 * GET /api/admin/migration/download?type=products|orders|customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ShopSiteClient } from '@/lib/admin/migration/shopsite-client';

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

    // Build correct query string based on type
    let queryString = '';
    switch (type) {
        case 'products':
            queryString = 'clientApp=1&dbname=products&version=14.0';
            break;
        case 'orders':
            // XML Order Download API
            queryString = 'clientApp=1&dbname=orders&version=14.0&pay=yes';
            break;
        case 'customers':
            queryString = 'clientApp=1&dbname=registration';
            break;
        default:
            return NextResponse.json(
                { error: 'Invalid type' },
                { status: 400 }
            );
    }

    try {
        const response = await fetch(`${baseUrl}/db_xml.cgi?${queryString}`, {
            headers: { 'Authorization': authHeader },
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `ShopSite returned ${response.status}: ${response.statusText}` },
                { status: 502 }
            );
        }

        // Decode as utf-8 with replacement (ShopSite often returns ISO-8859-1 but we want to force valid UTF-8 for the app)
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        let xmlContent = decoder.decode(buffer);

        // For orders, ShopSite often prepends a custom Content-type header in the body
        if (type === 'orders' && xmlContent.startsWith('Content-type:')) {
            const headerEnd = xmlContent.indexOf('\n\n');
            if (headerEnd !== -1) {
                xmlContent = xmlContent.substring(headerEnd + 2);
            }
        }

        // Sanitize XML to fix ampersands and HTML entities
        xmlContent = ShopSiteClient.sanitizeXml(xmlContent);

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
