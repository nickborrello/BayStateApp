'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ShopSiteClient, ShopSiteConfig } from '@/lib/admin/migration/shopsite-client';
import { transformShopSiteProduct, generateUniqueSlug } from '@/lib/admin/migration/product-sync';
import { transformShopSiteCustomer } from '@/lib/admin/migration/customer-sync';
import { transformShopSiteOrder, batchOrders } from '@/lib/admin/migration/order-sync';
import { SyncResult, MigrationError } from '@/lib/admin/migration/types';
import { startMigrationLog, completeMigrationLog, updateMigrationProgress } from '@/lib/admin/migration/history';

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
    const MAX_ERRORS = 50;
    const errors: MigrationError[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    const addError = (record: string, message: string) => {
        if (errors.length < MAX_ERRORS) {
            errors.push({
                record,
                error: message,
                timestamp: new Date().toISOString(),
            });
        } else if (errors.length === MAX_ERRORS) {
            errors.push({
                record: '...',
                error: 'Too many errors, truncating log',
                timestamp: new Date().toISOString(),
            });
        }
    };

    const logId = await startMigrationLog('products');

    const credentials = await getCredentials();
    if (!credentials) {
        const result = {
            success: false,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [{ record: 'N/A', error: 'No credentials configured', timestamp: new Date().toISOString() }],
            duration: Date.now() - startTime,
        };
        if (logId) await completeMigrationLog(logId, result);
        return result;
    }

    // Fetch products from ShopSite
    const config: ShopSiteConfig = {
        storeUrl: credentials.storeUrl,
        merchantId: credentials.merchantId,
        password: credentials.password,
    };

    const client = new ShopSiteClient(config);
    let shopSiteProducts = [];
    try {
        shopSiteProducts = await client.fetchProducts();
    } catch (err) {
        const result = {
            success: false,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [{ record: 'N/A', error: err instanceof Error ? err.message : 'Failed to fetch products', timestamp: new Date().toISOString() }],
            duration: Date.now() - startTime,
        };
        if (logId) await completeMigrationLog(logId, result);
        return result;
    }

    const result = await processProducts(shopSiteProducts, logId ?? undefined);
    return result;
}

/**
 * Shared logic for processing ShopSite products.
 */
async function processProducts(shopSiteProducts: any[], logId?: string): Promise<SyncResult> {
    const startTime = Date.now();
    const MAX_ERRORS = 50;
    const errors: MigrationError[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    const addError = (record: string, message: string) => {
        if (errors.length < MAX_ERRORS) {
            errors.push({
                record,
                error: message,
                timestamp: new Date().toISOString(),
            });
        }
    };

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

    const supabase = await createClient();

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
                addError(shopSiteProduct.sku, error.message);
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
            addError(shopSiteProduct.sku, err instanceof Error ? err.message : 'Unknown error');
            failed++;
        }

        // Update progress every 10 records
        if ((created + updated + failed) % 10 === 0 && logId) {
            await updateMigrationProgress(logId, {
                success: true,
                processed: shopSiteProducts.length,
                created,
                updated,
                failed,
                errors: [],
                duration: Date.now() - startTime,
            });
        }
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/migration');

    const result = {
        success: failed === 0,
        processed: shopSiteProducts.length,
        created,
        updated,
        failed,
        errors,
        duration: Date.now() - startTime,
    };

    if (logId) await completeMigrationLog(logId, result);

    return result;
}

/**
 * Form action wrapper for syncProducts.
 */
export async function syncProductsFormAction(): Promise<void> {
    await syncProductsAction();
}

/**
 * Sync customers from ShopSite to Supabase profiles.
 */
export async function syncCustomersAction(): Promise<SyncResult> {
    const startTime = Date.now();
    const logId = await startMigrationLog('customers');

    const credentials = await getCredentials();
    if (!credentials) {
        const result = {
            success: false,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [{ record: 'N/A', error: 'No credentials configured', timestamp: new Date().toISOString() }],
            duration: Date.now() - startTime,
        };
        if (logId) await completeMigrationLog(logId, result);
        return result;
    }

    const config: ShopSiteConfig = {
        storeUrl: credentials.storeUrl,
        merchantId: credentials.merchantId,
        password: credentials.password,
    };

    const client = new ShopSiteClient(config);
    let shopSiteCustomers = [];
    try {
        shopSiteCustomers = await client.fetchCustomers();
    } catch (err) {
        const result = {
            success: false,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [{ record: 'N/A', error: err instanceof Error ? err.message : 'Failed to fetch customers', timestamp: new Date().toISOString() }],
            duration: Date.now() - startTime,
        };
        if (logId) await completeMigrationLog(logId, result);
        return result;
    }

    const result = await processCustomers(shopSiteCustomers, logId ?? undefined);
    return result;
}

/**
 * Shared logic for processing ShopSite customers.
 */
async function processCustomers(shopSiteCustomers: any[], logId?: string): Promise<SyncResult> {
    const startTime = Date.now();
    const MAX_ERRORS = 50;
    const errors: MigrationError[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    const addError = (record: string, message: string) => {
        if (errors.length < MAX_ERRORS) {
            errors.push({
                record,
                error: message,
                timestamp: new Date().toISOString(),
            });
        }
    };

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

    const supabase = await createClient();

    // Get existing emails to check for updates
    const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('email');

    const existingEmails = new Set((existingProfiles || []).map((p: any) => p.email?.toLowerCase()));

    for (const shopSiteCustomer of shopSiteCustomers) {
        try {
            const transformed = transformShopSiteCustomer(shopSiteCustomer);
            const isUpdate = existingEmails.has(transformed.email);

            const { error } = await supabase
                .from('profiles')
                .upsert(transformed, {
                    onConflict: 'email',
                });

            if (error) {
                addError(shopSiteCustomer.email, error.message);
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
            addError(shopSiteCustomer.email, err instanceof Error ? err.message : 'Unknown error');
            failed++;
        }

        if ((created + updated + failed) % 10 === 0 && logId) {
            await updateMigrationProgress(logId, {
                success: true,
                processed: shopSiteCustomers.length,
                created,
                updated,
                failed,
                errors: [],
                duration: Date.now() - startTime,
            });
        }
    }

    revalidatePath('/admin/migration');

    const result = {
        success: failed === 0,
        processed: shopSiteCustomers.length,
        created,
        updated,
        failed,
        errors,
        duration: Date.now() - startTime,
    };

    if (logId) await completeMigrationLog(logId, result);

    return result;
}

/**
 * Form action wrapper for syncCustomers.
 */
export async function syncCustomersFormAction(): Promise<void> {
    await syncCustomersAction();
}

/**
 * Sync orders from ShopSite to Supabase.
 */
export async function syncOrdersAction(): Promise<SyncResult> {
    const startTime = Date.now();
    const logId = await startMigrationLog('orders');

    const credentials = await getCredentials();
    if (!credentials) {
        const result = {
            success: false,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [{ record: 'N/A', error: 'No credentials configured', timestamp: new Date().toISOString() }],
            duration: Date.now() - startTime,
        };
        if (logId) await completeMigrationLog(logId, result);
        return result;
    }

    const config: ShopSiteConfig = {
        storeUrl: credentials.storeUrl,
        merchantId: credentials.merchantId,
        password: credentials.password,
    };

    const client = new ShopSiteClient(config);
    let shopSiteOrders = [];
    try {
        shopSiteOrders = await client.fetchOrders();
    } catch (err) {
        const result = {
            success: false,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [{ record: 'N/A', error: err instanceof Error ? err.message : 'Failed to fetch orders', timestamp: new Date().toISOString() }],
            duration: Date.now() - startTime,
        };
        if (logId) await completeMigrationLog(logId, result);
        return result;
    }

    const result = await processOrders(shopSiteOrders, logId ?? undefined);
    return result;
}

/**
 * Shared logic for processing ShopSite orders.
 */
async function processOrders(shopSiteOrders: any[], logId?: string): Promise<SyncResult> {
    const startTime = Date.now();
    const MAX_ERRORS = 50;
    const errors: MigrationError[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    const addError = (record: string, message: string) => {
        if (errors.length < MAX_ERRORS) {
            errors.push({
                record,
                error: message,
                timestamp: new Date().toISOString(),
            });
        }
    };

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

    const supabase = await createClient();

    // Build lookup maps for profiles and products
    const { data: profiles } = await supabase.from('profiles').select('id, email');
    const { data: products } = await supabase.from('products').select('id, sku');

    const profileIdMap = new Map<string, string>();
    (profiles || []).forEach((p: any) => {
        if (p.email) profileIdMap.set(p.email.toLowerCase(), p.id);
    });

    const productIdMap = new Map<string, string>();
    (products || []).forEach((p: any) => {
        if (p.sku) productIdMap.set(p.sku, p.id);
    });

    const { data: existingOrders } = await supabase
        .from('orders')
        .select('legacy_order_number');

    const existingOrderNumbers = new Set(
        (existingOrders || [])
            .map((o: any) => o.legacy_order_number)
            .filter(Boolean)
    );

    const orderBatches = batchOrders(shopSiteOrders, 25);

    for (const batch of orderBatches) {
        for (const shopSiteOrder of batch) {
            try {
                if (existingOrderNumbers.has(shopSiteOrder.orderNumber)) {
                    updated++;
                    continue;
                }

                const { order: orderData, items } = transformShopSiteOrder(
                    shopSiteOrder,
                    profileIdMap,
                    productIdMap
                );

                const { data: newOrder, error: orderError } = await supabase
                    .from('orders')
                    .insert(orderData)
                    .select('id')
                    .single();

                if (orderError) {
                    addError(shopSiteOrder.orderNumber, orderError.message);
                    failed++;
                    continue;
                }

                if (items.length > 0 && newOrder) {
                    const orderItems = items.map(item => ({
                        ...item,
                        order_id: newOrder.id,
                    }));

                    const { error: itemsError } = await supabase
                        .from('order_items')
                        .insert(orderItems);

                    if (itemsError) {
                        addError(`${shopSiteOrder.orderNumber} items`, itemsError.message);
                    }
                }

                created++;
                existingOrderNumbers.add(shopSiteOrder.orderNumber);
            } catch (err) {
                addError(shopSiteOrder.orderNumber, err instanceof Error ? err.message : 'Unknown error');
                failed++;
            }

            if ((created + updated + failed) % 10 === 0 && logId) {
                await updateMigrationProgress(logId, {
                    success: true,
                    processed: shopSiteOrders.length,
                    created,
                    updated,
                    failed,
                    errors: [],
                    duration: Date.now() - startTime,
                });
            }
        }
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin/migration');

    const result = {
        success: failed === 0,
        processed: shopSiteOrders.length,
        created,
        updated,
        failed,
        errors,
        duration: Date.now() - startTime,
    };

    if (logId) await completeMigrationLog(logId, result);

    return result;
}

/**
 * Handle manual XML file upload for migration.
 */
export async function syncUploadedXmlAction(formData: FormData): Promise<SyncResult> {
    const file = formData.get('xmlFile') as File;
    const type = formData.get('syncType') as 'products' | 'orders' | 'customers';

    if (!file || !type) {
        throw new Error('File and sync type are required');
    }

    const xmlText = await file.text();
    const logId = await startMigrationLog(type);

    // We reuse the parsing logic from ShopSiteClient
    // but without needing a configuration since we have the XML directly
    // @ts-ignore - Partial config is fine for parsing only
    const client = new ShopSiteClient({ storeUrl: 'http://local', merchantId: 'local', password: 'local' });

    let result: SyncResult;

    switch (type) {
        case 'products':
            const products = (client as any).parseProductsXml(xmlText);
            result = await processProducts(products, logId ?? undefined);
            break;
        case 'orders':
            const orders = (client as any).parseOrdersXml(xmlText);
            result = await processOrders(orders, logId ?? undefined);
            break;
        case 'customers':
            const customers = (client as any).parseCustomersXml(xmlText);
            result = await processCustomers(customers, logId ?? undefined);
            break;
        default:
            throw new Error('Invalid sync type');
    }

    return result;
}

/**
 * Form action wrapper for syncOrders.
 */
export async function syncOrdersFormAction(): Promise<void> {
    await syncOrdersAction();
}
