'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ShopSiteClient, ShopSiteConfig } from '@/lib/admin/migration/shopsite-client';
import { transformShopSiteProduct, generateUniqueSlug } from '@/lib/admin/migration/product-sync';
import { transformShopSiteCustomer } from '@/lib/admin/migration/customer-sync';
import { transformShopSiteOrder, batchOrders } from '@/lib/admin/migration/order-sync';
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

/**
 * Sync customers from ShopSite to Supabase profiles.
 */
export async function syncCustomersAction(): Promise<SyncResult> {
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
    const config: ShopSiteConfig = {
        storeUrl: credentials.storeUrl,
        merchantId: credentials.merchantId,
        password: credentials.password,
    };

    const client = new ShopSiteClient(config);
    const shopSiteCustomers = await client.fetchCustomers();

    if (shopSiteCustomers.length === 0) {
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

    // Get existing emails to check for updates
    const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('email');

    const existingEmails = new Set((existingProfiles || []).map((p: { email: string }) => p.email?.toLowerCase()));

    for (const shopSiteCustomer of shopSiteCustomers) {
        try {
            const transformed = transformShopSiteCustomer(shopSiteCustomer);
            const isUpdate = existingEmails.has(transformed.email);

            // For legacy imports, we insert into profiles without creating auth users
            const { error } = await supabase
                .from('profiles')
                .upsert(transformed, {
                    onConflict: 'email',
                });

            if (error) {
                errors.push({
                    record: shopSiteCustomer.email,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                });
                failed++;
            } else {
                if (isUpdate) {
                    updated++;
                } else {
                    created++;
                    existingEmails.add(transformed.email);
                }
            }
        } catch (err) {
            errors.push({
                record: shopSiteCustomer.email,
                error: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            });
            failed++;
        }
    }

    revalidatePath('/admin/migration');

    return {
        success: failed === 0,
        processed: shopSiteCustomers.length,
        created,
        updated,
        failed,
        errors,
        duration: Date.now() - startTime,
    };
}

/**
 * Form action wrapper for syncCustomers.
 */
export async function syncCustomersFormAction(): Promise<void> {
    await syncCustomersAction();
}

/**
 * Sync orders from ShopSite to Supabase.
 * Maps orders to profiles and products using email and SKU.
 */
export async function syncOrdersAction(): Promise<SyncResult> {
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
    const config: ShopSiteConfig = {
        storeUrl: credentials.storeUrl,
        merchantId: credentials.merchantId,
        password: credentials.password,
    };

    const client = new ShopSiteClient(config);
    const shopSiteOrders = await client.fetchOrders();

    if (shopSiteOrders.length === 0) {
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

    // Build lookup maps for profiles and products
    const { data: profiles } = await supabase.from('profiles').select('id, email');
    const { data: products } = await supabase.from('products').select('id, sku');

    const profileIdMap = new Map<string, string>();
    (profiles || []).forEach((p: { id: string; email: string }) => {
        if (p.email) profileIdMap.set(p.email.toLowerCase(), p.id);
    });

    const productIdMap = new Map<string, string>();
    (products || []).forEach((p: { id: string; sku: string }) => {
        if (p.sku) productIdMap.set(p.sku, p.id);
    });

    // Check for existing legacy orders
    const { data: existingOrders } = await supabase
        .from('orders')
        .select('legacy_order_number');

    const existingOrderNumbers = new Set(
        (existingOrders || [])
            .map((o: { legacy_order_number: string }) => o.legacy_order_number)
            .filter(Boolean)
    );

    // Process orders in batches
    const orderBatches = batchOrders(shopSiteOrders, 25);

    for (const batch of orderBatches) {
        for (const shopSiteOrder of batch) {
            try {
                // Skip if already imported
                if (existingOrderNumbers.has(shopSiteOrder.orderNumber)) {
                    updated++;
                    continue;
                }

                const { order: orderData, items } = transformShopSiteOrder(
                    shopSiteOrder,
                    profileIdMap,
                    productIdMap
                );

                // Insert order
                const { data: newOrder, error: orderError } = await supabase
                    .from('orders')
                    .insert(orderData)
                    .select('id')
                    .single();

                if (orderError) {
                    errors.push({
                        record: shopSiteOrder.orderNumber,
                        error: orderError.message,
                        timestamp: new Date().toISOString(),
                    });
                    failed++;
                    continue;
                }

                // Insert order items
                if (items.length > 0 && newOrder) {
                    const orderItems = items.map(item => ({
                        ...item,
                        order_id: newOrder.id,
                    }));

                    const { error: itemsError } = await supabase
                        .from('order_items')
                        .insert(orderItems);

                    if (itemsError) {
                        errors.push({
                            record: `${shopSiteOrder.orderNumber} items`,
                            error: itemsError.message,
                            timestamp: new Date().toISOString(),
                        });
                        // Don't count as full failure, order was created
                    }
                }

                created++;
                existingOrderNumbers.add(shopSiteOrder.orderNumber);
            } catch (err) {
                errors.push({
                    record: shopSiteOrder.orderNumber,
                    error: err instanceof Error ? err.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                });
                failed++;
            }
        }
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin/migration');

    return {
        success: failed === 0,
        processed: shopSiteOrders.length,
        created,
        updated,
        failed,
        errors,
        duration: Date.now() - startTime,
    };
}

/**
 * Form action wrapper for syncOrders.
 */
export async function syncOrdersFormAction(): Promise<void> {
    await syncOrdersAction();
}
