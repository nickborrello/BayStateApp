# Track Plan: Migrate BayStateTools to Admin Panel

## Phase 1: Database Schema Bridge [checkpoint: ]

### 1.1 Create Products Published View
- [ ] Task: Write failing test for `products_published` view query
- [ ] Task: Create migration `create_products_published_view` with PostgreSQL view definition
- [ ] Task: Apply migration to Supabase and verify view returns expected columns

### 1.2 Update Storefront Data Layer
- [ ] Task: Write failing tests for `getFeaturedProducts` and `getProducts` using new view
- [ ] Task: Update `lib/data.ts` to query `products_published` instead of `products` table
- [ ] Task: Create union logic to include manually-added products from `products` table
- [ ] Task: Verify storefront displays products from ingestion pipeline

### 1.3 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Schema Bridge' (Protocol in workflow.md)

---

## Phase 2: Admin Navigation & Layout [checkpoint: ]

### 2.1 Extend Admin Sidebar
- [ ] Task: Write failing test for new admin navigation items
- [ ] Task: Update admin layout sidebar to include Pipeline, Quality, Analytics, Database sections
- [ ] Task: Create route group structure: `/admin/pipeline`, `/admin/quality`, `/admin/analytics`, `/admin/tools/database`

### 2.2 Create Placeholder Pages
- [ ] Task: Create placeholder `page.tsx` for each new admin route with basic layout
- [ ] Task: Verify navigation between all new sections works correctly

### 2.3 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Admin Navigation & Layout' (Protocol in workflow.md)

---

## Phase 3: Pipeline Management Module [checkpoint: ]

### 3.1 Pipeline Data Layer
- [ ] Task: Write failing tests for pipeline data fetching functions
- [ ] Task: Create `lib/pipeline.ts` with functions: `getProductsByStatus`, `getStatusCounts`, `updateProductStatus`, `bulkUpdateStatus`
- [ ] Task: Implement Supabase queries for `products_ingestion` table

### 3.2 Pipeline Status Views
- [ ] Task: Write failing tests for PipelineStatusTabs component
- [ ] Task: Create `PipelineStatusTabs` component with status counts (staging, scraped, consolidated, approved, published)
- [ ] Task: Create `PipelineProductCard` component showing "Register Name" vs "Clean Name"
- [ ] Task: Add indicator for "has scraped data" vs "manual only"

### 3.3 Product Finalization UI
- [ ] Task: Write failing tests for ProductFinalizationForm component
- [ ] Task: Create `ProductFinalizationForm` component for cleaning register data
- [ ] Task: Create `SourceDataPanel` component showing scraped sources (if available)
- [ ] Task: Create `RegisterDataPreview` showing raw imported data reference
- [ ] Task: Add placeholder "AI Assist" button (stub for future enhancement)

### 3.4 Pipeline Page Assembly
- [ ] Task: Build `/admin/pipeline/page.tsx` with status tabs and product grid
- [ ] Task: Implement status transition actions (Consolidate, Approve, Publish, Reject)
- [ ] Task: Add bulk selection and bulk actions toolbar
- [ ] Task: Add SKU/brand/status/date range filters

### 3.5 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Pipeline Management Module' (Protocol in workflow.md)

---

## Phase 4: Quality Assurance Module [checkpoint: ]

### 4.1 Quality Data Layer
- [ ] Task: Write failing tests for quality review functions
- [ ] Task: Create `lib/quality.ts` with functions: `getProductsWithIssues`, `getProductSources`, `updateConsolidatedField`
- [ ] Task: Define quality rules engine (missing name, price, images, etc.)

### 4.2 Quality UI Components
- [ ] Task: Write failing tests for QualityIssueCard component
- [ ] Task: Create `QualityIssueCard` component highlighting missing/invalid fields
- [ ] Task: Create `FieldCompletionIndicator` component for visual completeness
- [ ] Task: Create `FieldOverrideForm` component for manual corrections

### 4.3 Quality Page Assembly
- [ ] Task: Build `/admin/quality/page.tsx` with issue list and detail view
- [ ] Task: Implement quick-fix actions for common issues
- [ ] Task: Add issue severity filters (required vs recommended)

### 4.4 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Quality Assurance Module' (Protocol in workflow.md)

---

## Phase 5: Analytics & Reports Module [checkpoint: ]

### 5.1 Analytics Data Layer
- [ ] Task: Write failing tests for analytics aggregation functions
- [ ] Task: Create `lib/analytics.ts` with functions: `getStatusBreakdown`, `getPipelineThroughput`, `getDataCompleteness`
- [ ] Task: Implement SQL aggregations for metrics

### 5.2 Analytics UI Components
- [ ] Task: Write failing tests for analytics chart components
- [ ] Task: Create `StatusBreakdownChart` component (pie/bar chart of status counts)
- [ ] Task: Create `CompletenessChart` component (data quality metrics)
- [ ] Task: Create `ThroughputChart` component (products processed over time)

### 5.3 Analytics Page Assembly
- [ ] Task: Build `/admin/analytics/page.tsx` with dashboard layout
- [ ] Task: Add date range selector for filtering
- [ ] Task: Implement CSV export functionality

### 5.4 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Analytics & Reports Module' (Protocol in workflow.md)

---

## Phase 6: Database Browser [checkpoint: ]

### 6.1 Database Browser Components
- [ ] Task: Write failing tests for database browser queries
- [ ] Task: Create `DatabaseTable` component with pagination, search, sort
- [ ] Task: Create `JsonbEditor` component for inline JSONB editing
- [ ] Task: Create `ProductEditForm` component for full record editing

### 6.2 Database Browser Page
- [ ] Task: Build `/admin/tools/database/page.tsx` with data grid
- [ ] Task: Implement inline editing with save/cancel
- [ ] Task: Add bulk export functionality (CSV/JSON)
- [ ] Task: Add import functionality for bulk staging

### 6.3 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Database Browser' (Protocol in workflow.md)

---

## Phase 7: Final Integration & Cleanup [checkpoint: ]

### 7.1 Integration Testing
- [ ] Task: Write end-to-end tests for complete pipeline workflow (staging → published)
- [ ] Task: Verify storefront displays published products correctly
- [ ] Task: Test manual finalization workflow (no scraped data)
- [ ] Task: Test scraped data finalization workflow

### 7.2 Documentation & Cleanup
- [ ] Task: Update GEMINI.md with new admin modules documentation
- [ ] Task: Update conductor/tracks.md with migration completion
- [ ] Task: Document data flow: Local scraper → Supabase → Admin pipeline → Storefront
- [ ] Task: Clean up obsolete `products` table references

### 7.3 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 7: Final Integration & Cleanup' (Protocol in workflow.md)
