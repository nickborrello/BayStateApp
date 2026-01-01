-- Simplify Products Schema
-- Drops all ShopSite-specific columns and keeps only essential e-commerce fields

BEGIN;

-- ============================================================================
-- 1. Drop indexes on columns we're about to remove
-- ============================================================================

DROP INDEX IF EXISTS idx_products_shopsite_product_type;
DROP INDEX IF EXISTS idx_products_sku;

-- ============================================================================
-- 2. Drop non-essential columns
-- ============================================================================

ALTER TABLE products DROP COLUMN IF EXISTS sale_price;
ALTER TABLE products DROP COLUMN IF EXISTS cost;
ALTER TABLE products DROP COLUMN IF EXISTS long_description;
ALTER TABLE products DROP COLUMN IF EXISTS weight;
ALTER TABLE products DROP COLUMN IF EXISTS taxable;
ALTER TABLE products DROP COLUMN IF EXISTS gtin;
ALTER TABLE products DROP COLUMN IF EXISTS product_type;
ALTER TABLE products DROP COLUMN IF EXISTS fulfillment_type;
ALTER TABLE products DROP COLUMN IF EXISTS search_keywords;
ALTER TABLE products DROP COLUMN IF EXISTS google_product_category;
ALTER TABLE products DROP COLUMN IF EXISTS is_disabled;
ALTER TABLE products DROP COLUMN IF EXISTS availability;
ALTER TABLE products DROP COLUMN IF EXISTS quantity_on_hand;
ALTER TABLE products DROP COLUMN IF EXISTS low_stock_threshold;
ALTER TABLE products DROP COLUMN IF EXISTS out_of_stock_limit;
ALTER TABLE products DROP COLUMN IF EXISTS minimum_quantity;
ALTER TABLE products DROP COLUMN IF EXISTS shopsite_data;
ALTER TABLE products DROP COLUMN IF EXISTS categories;

-- ============================================================================
-- 3. Ensure SKU column exists and is unique (for import matching)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'sku'
    ) THEN
        ALTER TABLE products ADD COLUMN sku text;
    END IF;
END $$;

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_key'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);
    END IF;
END $$;

-- ============================================================================
-- 4. Ensure updated_at column exists
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE products ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- ============================================================================
-- 5. Create index on SKU for fast lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- ============================================================================
-- 6. Add comment documenting the minimal schema
-- ============================================================================

COMMENT ON TABLE products IS 'Minimal product catalog. Core fields only: id, sku, brand_id, name, slug, description, price, stock_status, images, is_featured, created_at, updated_at';

COMMIT;
