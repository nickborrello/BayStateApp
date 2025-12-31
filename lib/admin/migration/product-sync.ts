/**
 * Product Synchronization Utilities
 * 
 * Handles transformation and sync of products from ShopSite to Supabase.
 */

import { ShopSiteProduct } from './types';

/**
 * Generate a URL-friendly slug from a product name.
 * Optionally append SKU for uniqueness when needed.
 */
export function buildProductSlug(name: string, sku?: string): string {
    let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')          // Replace spaces with hyphens
        .replace(/-+/g, '-')           // Remove multiple consecutive hyphens
        .trim();

    if (sku) {
        slug = `${slug}-${sku.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
    }

    return slug;
}

/**
 * Transform a ShopSite product into the Supabase products table format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformShopSiteProduct(product: ShopSiteProduct): any {
    // Collect all images (primary + additional)
    const images: string[] = [];
    if (product.imageUrl) {
        images.push(product.imageUrl);
    }
    if (product.additionalImages) {
        images.push(...product.additionalImages);
    }

    // Determine stock status based on quantity and disabled state
    let stockStatus: 'in_stock' | 'out_of_stock' | 'pre_order' = 'out_of_stock';
    if (product.isDisabled) {
        stockStatus = 'out_of_stock';
    } else if (product.quantityOnHand > 0) {
        stockStatus = 'in_stock';
    } else if (product.availability?.toLowerCase().includes('pre')) {
        stockStatus = 'pre_order';
    }

    return {
        // Core fields
        sku: product.sku,
        name: product.name,
        slug: buildProductSlug(product.name),
        price: product.price,
        sale_price: product.saleAmount || null,
        description: product.description || null,
        stock_status: stockStatus,
        images,

        // Physical properties
        weight: product.weight || null,
        taxable: product.taxable ?? true,

        // ShopSite identifiers
        gtin: product.gtin || null,
        shopsite_product_id: product.productId || null,
        shopsite_guid: product.productGuid || null,
        shopsite_product_type: product.productType || null,

        // Status
        is_disabled: product.isDisabled ?? false,
        availability: product.availability || null,

        // Inventory controls
        minimum_quantity: product.minimumQuantity || 1,
        low_stock_threshold: product.lowStockThreshold || null,

        // SEO and legacy
        legacy_filename: product.fileName || null,
        search_keywords: product.searchKeywords || null,

        // Extended data as JSONB
        shopsite_data: {
            more_info_text: product.moreInfoText || null,
            brand: product.brand || null,
            raw_xml: product.rawXml || null,
        },
    };
}

/**
 * Generate a unique slug by appending a counter if the base slug exists.
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
    if (!existingSlugs.has(baseSlug)) {
        return baseSlug;
    }

    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;
    while (existingSlugs.has(uniqueSlug)) {
        counter++;
        uniqueSlug = `${baseSlug}-${counter}`;
    }

    return uniqueSlug;
}
