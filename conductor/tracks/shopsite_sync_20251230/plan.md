# Migration Plan: ShopSite to Supabase (Automated API Sync)

## Phase 1: API Client & Infrastructure [checkpoint: 5190c69]
- [x] Task: Develop ShopSite API Client in `lib/admin/migration/shopsite-client.ts` [2ec7f8a]
- [x] Task: Implement authentication for `db_xml.cgi` and Order Download API [2ec7f8a]
- [x] Task: Create settings UI in `app/admin/migration/page.tsx` for API credentials [0c915e0]
- [x] Task: Conductor - User Manual Verification 'API Client & Infrastructure' (Protocol in workflow.md)

## Phase 2: Product Synchronization [checkpoint: 040d29d]
- [x] Task: Develop `syncProducts` Server Action using the API client [9c0c24b]
- [x] Task: Implement transformation and upsert logic for products [9c0c24b]
- [x] Task: Add progress feedback to the Admin UI
- [x] Task: Conductor - User Manual Verification 'Product Synchronization' (Protocol in workflow.md)

## Phase 3: Customer & Order Synchronization
- [x] Task: Develop `syncCustomers` Server Action (download + upsert)
- [x] Task: Develop `syncOrders` Server Action (download + relationship mapping)
- [x] Task: Implement batch processing for historical orders
- [ ] Task: Conductor - User Manual Verification 'Customer & Order Synchronization' (Protocol in workflow.md)

## Phase 4: History & Diagnostics
- [ ] Task: Set up `migration_logs` table for sync auditing
- [ ] Task: Implement history view and error diagnostics in the dashboard
- [ ] Task: Final polish of the "Sync Now" UI and credential management
- [ ] Task: Conductor - User Manual Verification 'History & Diagnostics' (Protocol in workflow.md)
