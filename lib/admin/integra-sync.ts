import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export interface IntegraProduct {
    sku: string;
    name: string;
    price: number;
}

export interface SyncAnalysis {
    totalInFile: number;
    existingOnWebsite: number;
    newProducts: IntegraProduct[];
}

/**
 * Parses an Integra Excel export.
 * Mapping:
 * - SKU_NO -> sku
 * - LIST_PRICE -> price
 * - DESCRIPTION1 + DESCRIPTION2 -> name
 */
export async function parseIntegraExcel(buffer: ArrayBuffer): Promise<IntegraProduct[]> {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    const products: IntegraProduct[] = rows.map((row) => {
        const sku = String(row['SKU_NO'] || row['SKU'] || '').trim();
        const price = parseFloat(String(row['LIST_PRICE'] || row['PRICE'] || '0'));

        const desc1 = String(row['DESCRIPTION1'] || row['NAME'] || '').trim();
        const desc2 = String(row['DESCRIPTION2'] || '').trim();
        const name = desc2 ? `${desc1} ${desc2}` : desc1;

        return {
            sku,
            name,
            price: isNaN(price) ? 0 : price,
        };
    }).filter(p => p.sku && p.name); // Basic validation

    return products;
}

/**
 * Compares Integra products against the live website products.
 */
export async function analyzeIntegraSync(integraProducts: IntegraProduct[]): Promise<SyncAnalysis> {
    const supabase = await createClient();

    // Fetch all existing SKUs from website
    // We might want to do this in batches if there are thousands, 
    // but for now we'll fetch them all or at least the ones in the file.
    const skusInFile = integraProducts.map(p => p.sku);

    const { data: existingProducts, error } = await supabase
        .from('products')
        .select('sku')
        .in('sku', skusInFile);

    if (error) {
        console.error('Error fetching existing products:', error);
        throw new Error('Failed to verify existing products');
    }

    const existingSkuSet = new Set(existingProducts?.map(p => p.sku) || []);

    const newProducts = integraProducts.filter(p => !existingSkuSet.has(p.sku));

    return {
        totalInFile: integraProducts.length,
        existingOnWebsite: existingSkuSet.size,
        newProducts,
    };
}

/**
 * Inserts missing products into the onboarding pipeline (products_ingestion).
 */
export async function addToOnboarding(products: IntegraProduct[]): Promise<{ success: boolean; count: number }> {
    const supabase = await createClient();

    const onboardingData = products.map(p => ({
        sku: p.sku,
        input: {
            name: p.name,
            price: p.price,
        },
        pipeline_status: 'staging',
        updated_at: new Date().toISOString(),
    }));

    // Use upsert to avoid duplicate key errors if some products were already in staging
    const { error, count } = await supabase
        .from('products_ingestion')
        .upsert(onboardingData, { onConflict: 'sku' });

    if (error) {
        console.error('Error adding to onboarding:', error);
        return { success: false, count: 0 };
    }

    return { success: true, count: onboardingData.length };
}
