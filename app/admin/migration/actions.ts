'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ShopSiteClient, ShopSiteConfig } from '@/lib/admin/migration/shopsite-client';
import { transformShopSiteProduct, generateUniqueSlug } from '@/lib/admin/migration/product-sync';
import { SyncResult, MigrationError } from '@/lib/admin/migration/types';

const MIGRATION_SETTINGS_KEY = 'shopsite_migration';

interface MigrationCredentials {
    storeUrl: string;
    merchantId: string;
    password: string;
}

/**
 * Get saved ShopSite credentials from site_settings.
 */
export async function getCredentials(): Promise<MigrationCredentials | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', MIGRATION_SETTINGS_KEY)
        .single();

    if (error || !data) {
        return null;
    }

    return data.value as MigrationCredentials;
}

/**
 * Save ShopSite credentials to site_settings.
 */
export async function saveCredentialsAction(formData: FormData): Promise<void> {
    const supabase = await createClient();

    const credentials: MigrationCredentials = {
        storeUrl: formData.get('storeUrl') as string,
        merchantId: formData.get('merchantId') as string,
        password: formData.get('password') as string,
    };

    // Validate inputs
    if (!credentials.storeUrl || !credentials.merchantId || !credentials.password) {
        throw new Error('All fields are required');
    }

    // Upsert the credentials
    const { error } = await supabase
        .from('site_settings')
        .upsert({
            key: MIGRATION_SETTINGS_KEY,
            value: credentials,
        }, {
            onConflict: 'key',
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/admin/migration');
}

/**
 * Test the ShopSite connection with saved credentials.
 */
export async function testConnectionAction() {
    const credentials = await getCredentials();

    if (!credentials) {
        return { success: false, error: 'No credentials configured' };
    }

    const config: ShopSiteConfig = {
        storeUrl: credentials.storeUrl,
        merchantId: credentials.merchantId,
        password: credentials.password,
    };

    const client = new ShopSiteClient(config);
    const result = await client.testConnection();

    return result;
}

/**
 * Sync products from ShopSite to Supabase.
 * Uses upsert with SKU as the unique identifier for idempotency.
 */
export async function syncProductsAction(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: MigrationError[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    const credentials = await getCredentials();
    if (!credentials) {
        return {
            success: false,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [{ record: 'N/A', error: 'No credentials configured', timestamp: new Date().toISOString() }],
            duration: Date.now() - startTime,
        };
    }

    const supabase = await createClient();

    // Fetch products from ShopSite
    const config: ShopSiteConfig = {
        storeUrl: credentials.storeUrl,
        merchantId: credentials.merchantId,
        password: credentials.password,
    };

    const client = new ShopSiteClient(config);
    const shopSiteProducts = await client.fetchProducts();

    if (shopSiteProducts.length === 0) {
        return {
            success: true,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [],
            duration: Date.now() - startTime,
        };
    }

    // Get existing slugs to ensure uniqueness
    const { data: existingProducts } = await supabase
        .from('products')
        .select('slug, sku');

    const existingSlugs = new Set((existingProducts || []).map((p: { slug: string }) => p.slug));
    const existingSkus = new Set((existingProducts || []).map((p: { sku: string }) => p.sku).filter(Boolean));

    // Transform and upsert each product
    for (const shopSiteProduct of shopSiteProducts) {
        try {
            const transformed = transformShopSiteProduct(shopSiteProduct);

            // Check if product exists by SKU
            const isUpdate = existingSkus.has(shopSiteProduct.sku);

            // Generate unique slug for new products
            if (!isUpdate) {
                transformed.slug = generateUniqueSlug(transformed.slug, existingSlugs);
                existingSlugs.add(transformed.slug);
            }

            const { error } = await supabase
                .from('products')
                .upsert(transformed, {
                    onConflict: 'sku',
                });

            if (error) {
                errors.push({
                    record: shopSiteProduct.sku,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                });
                failed++;
            } else {
                if (isUpdate) {
                    updated++;
                } else {
                    created++;
                    existingSkus.add(shopSiteProduct.sku);
                }
            }
        } catch (err) {
            errors.push({
                record: shopSiteProduct.sku,
                error: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            });
            failed++;
        }
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/migration');

    return {
        success: failed === 0,
        processed: shopSiteProducts.length,
        created,
        updated,
        failed,
        errors,
        duration: Date.now() - startTime,
    };
}

/**
 * Form action wrapper for syncProducts.
 * This wrapper doesn't return a value, making it compatible with form action prop.
 */
export async function syncProductsFormAction(): Promise<void> {
    await syncProductsAction();
}
