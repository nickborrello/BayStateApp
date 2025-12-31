# Migration Plan: ShopSite to Supabase (Automated API Sync)

## Phase 1: API Client & Infrastructure
- [x] Task: Develop ShopSite API Client in `lib/admin/migration/shopsite-client.ts` [2ec7f8a]
- [~] Task: Implement authentication for `db_xml.cgi` and Order Download API
- [ ] Task: Create settings UI in `app/admin/migration/page.tsx` for API credentials
- [ ] Task: Conductor - User Manual Verification 'API Client & Infrastructure' (Protocol in workflow.md)

## Phase 2: Product Synchronization
- [ ] Task: Develop `syncProducts` Server Action using the API client
- [ ] Task: Implement transformation and upsert logic for products
- [ ] Task: Add progress feedback to the Admin UI
- [ ] Task: Conductor - User Manual Verification 'Product Synchronization' (Protocol in workflow.md)

## Phase 3: Customer & Order Synchronization
- [ ] Task: Develop `syncCustomers` Server Action (download + upsert)
- [ ] Task: Develop `syncOrders` Server Action (download + relationship mapping)
- [ ] Task: Implement batch processing for historical orders
- [ ] Task: Conductor - User Manual Verification 'Customer & Order Synchronization' (Protocol in workflow.md)

## Phase 4: History & Diagnostics
- [ ] Task: Set up `migration_logs` table for sync auditing
- [ ] Task: Implement history view and error diagnostics in the dashboard
- [ ] Task: Final polish of the "Sync Now" UI and credential management
- [ ] Task: Conductor - User Manual Verification 'History & Diagnostics' (Protocol in workflow.md)
