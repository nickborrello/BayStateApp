-- Product Pet Targeting: Enable pet-based product recommendations
-- Links products to pet types and stores additional targeting attributes

BEGIN;

-- ============================================================================
-- 1. Product-PetType Junction Table (Many-to-Many)
-- ============================================================================
-- Stores which products are suitable for which pet types
-- Auto-populated during ShopSite sync, can be manually overridden

CREATE TABLE IF NOT EXISTS product_pet_types (
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pet_type_id uuid NOT NULL REFERENCES pet_types(id) ON DELETE CASCADE,
    confidence text DEFAULT 'inferred' CHECK (confidence IN ('inferred', 'manual', 'verified')),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (product_id, pet_type_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_product_pet_types_product ON product_pet_types(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pet_types_pet_type ON product_pet_types(pet_type_id);

-- ============================================================================
-- 2. Product Pet Attributes (For Specific Recommendations)
-- ============================================================================
-- Stores life stage, size class, and special dietary needs for more precise matching

CREATE TABLE IF NOT EXISTS product_pet_attributes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
    life_stages text[] DEFAULT '{}', -- 'puppy', 'adult', 'senior', 'all'
    size_classes text[] DEFAULT '{}', -- 'small', 'medium', 'large', 'giant', 'all'
    special_needs text[] DEFAULT '{}', -- 'grain-free', 'sensitive-stomach', 'weight-management', etc.
    min_weight_lbs decimal(6,2), -- Minimum pet weight this product is suitable for
    max_weight_lbs decimal(6,2), -- Maximum pet weight this product is suitable for
    confidence text DEFAULT 'inferred' CHECK (confidence IN ('inferred', 'manual', 'verified')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for product lookups
CREATE INDEX IF NOT EXISTS idx_product_pet_attributes_product ON product_pet_attributes(product_id);

-- ============================================================================
-- 3. Enable RLS
-- ============================================================================

ALTER TABLE product_pet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pet_attributes ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see product-pet associations)
DROP POLICY IF EXISTS "Allow public read access to product_pet_types" ON product_pet_types;
CREATE POLICY "Allow public read access to product_pet_types"
    ON product_pet_types FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public read access to product_pet_attributes" ON product_pet_attributes;
CREATE POLICY "Allow public read access to product_pet_attributes"
    ON product_pet_attributes FOR SELECT
    USING (true);

-- Admin/Staff write access
DROP POLICY IF EXISTS "Allow admin write access to product_pet_types" ON product_pet_types;
CREATE POLICY "Allow admin write access to product_pet_types"
    ON product_pet_types FOR ALL
    USING (public.is_staff());

DROP POLICY IF EXISTS "Allow admin write access to product_pet_attributes" ON product_pet_attributes;
CREATE POLICY "Allow admin write access to product_pet_attributes"
    ON product_pet_attributes FOR ALL
    USING (public.is_staff());

-- ============================================================================
-- 4. Helper Function: Get Products for Pet Types
-- ============================================================================
-- Efficiently retrieve products matching one or more pet type IDs

CREATE OR REPLACE FUNCTION get_products_for_pet_types(pet_type_ids uuid[])
RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    price numeric,
    images text[],
    stock_status text,
    brand_id uuid,
    pet_type_id uuid
)
LANGUAGE sql
STABLE
AS $$
    SELECT DISTINCT ON (p.id)
        p.id,
        p.name,
        p.slug,
        p.price,
        p.images,
        p.stock_status,
        p.brand_id,
        ppt.pet_type_id
    FROM products p
    INNER JOIN product_pet_types ppt ON p.id = ppt.product_id
    WHERE ppt.pet_type_id = ANY(pet_type_ids)
      AND p.is_active = true
      AND p.stock_status = 'in_stock'
    ORDER BY p.id, p.is_featured DESC, p.created_at DESC;
$$;

-- ============================================================================
-- 5. Helper Function: Get Personalized Products for User
-- ============================================================================
-- Returns products matching the user's registered pets

CREATE OR REPLACE FUNCTION get_personalized_products(user_uuid uuid, result_limit int DEFAULT 12)
RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    price numeric,
    images text[],
    stock_status text,
    brand_id uuid,
    pet_name text,
    pet_type_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT DISTINCT ON (p.id)
        p.id,
        p.name,
        p.slug,
        p.price,
        p.images,
        p.stock_status,
        p.brand_id,
        up.name as pet_name,
        pt.name as pet_type_name
    FROM products p
    INNER JOIN product_pet_types ppt ON p.id = ppt.product_id
    INNER JOIN user_pets up ON up.pet_type_id = ppt.pet_type_id
    INNER JOIN pet_types pt ON pt.id = up.pet_type_id
    WHERE up.user_id = user_uuid
      AND p.is_active = true
      AND p.stock_status = 'in_stock'
    ORDER BY p.id, p.is_featured DESC, RANDOM()
    LIMIT result_limit;
$$;

-- ============================================================================
-- 6. Updated_at Trigger for product_pet_attributes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_pet_attributes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_pet_attributes_updated_at ON product_pet_attributes;
CREATE TRIGGER trigger_update_product_pet_attributes_updated_at
    BEFORE UPDATE ON product_pet_attributes
    FOR EACH ROW
    EXECUTE FUNCTION update_product_pet_attributes_updated_at();

COMMIT;
