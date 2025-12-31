# Track Spec: Migrate Legacy Data from ShopSite

## Overview
This track focuses on building a repeatable data synchronization tool integrated into the Admin Portal to migrate and refresh business data (Products, Orders, and Customers) from ShopSite to Supabase. This will allow non-technical owners to keep the new platform in sync with legacy records during the transition period.

## Functional Requirements

### 1. Admin Migration Dashboard
Create a new section in the `/admin` portal (`app/admin/migration/page.tsx`) that allows managers to:
- Configure ShopSite API credentials (URL, Merchant ID, Password/OAuth).
- Trigger an automated "Sync" process that downloads and processes data directly from ShopSite.
- View real-time progress and a history of previous syncs.

### 2. ShopSite API Client
Develop a robust API client in `lib/admin/migration/shopsite-client.ts` to:
- Authenticate and request data from `db_xml.cgi` (Products) and the Order Download API.
- Handle pagination/batching to prevent timeouts for large datasets.
- Securely manage credentials via environment variables or encrypted database settings.

### 3. Repeatable Ingestion Logic
Develop utility functions in `lib/admin/migration/` to transform and upsert the downloaded data into Supabase.

#### 1.1 Product Migration
- **Source:** XML export from ShopSite `db_xml.cgi`.
- **Target Table:** `products`.
- **Logic:**
    - Parse ShopSite Product XML.
    - Map `SKU` to `id` (or use internal UUID).
    - Map `Name`, `Price`, `Description`, `Graphic` (image URL).
    - Handle Inventory: Map `Quantity On Hand` to stock status.
    - Handle SEO: Map Google Merchant Center fields to product metadata.

#### 1.2 Customer Migration
- **Source:** "Registered Customer Export" (delimited text or XML) from ShopSite.
- **Target Table:** `profiles`.
- **Logic:**
    - Parse customer profiles (Name, Email, Billing Address).
    - Insert into `profiles` table.
    - **Note:** Password migration is not possible; users will need to reset passwords.

#### 1.3 Order Migration
- **Source:** XML export via `shopsiteorders.dtd`.
- **Target Tables:** `orders`, `order_items`.
- **Logic:**
    - Map `OrderNumber` to legacy reference.
    - Map `OrderDate` to `created_at`.
    - Map `GrandTotal`, `Tax`, `ShippingTotal`.
    - Link to migrated `profiles` using Email.
    - Link `order_items` to migrated `products` using `SKU`.

### 2. Verification Tools
- Scripts must include a "Dry Run" mode to validate mappings without database writes.
- Logging of all failed transitions with specific error reasons.

## Non-Functional Requirements
- **Idempotency:** Scripts should be re-runnable without creating duplicate records.
- **Performance:** Handle 300+ products and thousands of historical orders using Supabase batch inserts.

## Acceptance Criteria
- [ ] At least 95% of products from the ShopSite catalog are successfully imported.
- [ ] Historical orders are visible in the Admin Portal and linked to customers.
- [ ] No duplicate products or customers created during repeat runs.

## Out of Scope
- Real-time automated sync (requires ShopSite webhooks/polling, focusing on manual file-upload sync for now).
- Migration of ShopSite "Pages" or layout templates.
