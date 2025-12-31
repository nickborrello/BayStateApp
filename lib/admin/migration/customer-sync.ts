/**
 * Customer Synchronization Utilities
 * 
 * Handles transformation and sync of customers from ShopSite to Supabase profiles.
 */

import { ShopSiteCustomer } from './types';

/**
 * Transform a ShopSite customer into the Supabase profiles table format.
 * Note: These are "legacy" profiles without auth users - customers will need to reset passwords.
 */
export function transformShopSiteCustomer(customer: ShopSiteCustomer): {
    email: string;
    full_name: string;
    legacy_shopsite_id: string;
    is_legacy_import: boolean;
} {
    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'ShopSite Customer';

    return {
        email: customer.email.toLowerCase().trim(),
        full_name: fullName,
        legacy_shopsite_id: customer.email, // Use email as the legacy ID
        is_legacy_import: true,
    };
}
