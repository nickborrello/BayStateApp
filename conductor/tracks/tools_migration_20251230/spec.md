# Track Spec: Migrate BayStateTools to Admin Panel

## Overview

Migrate pipeline management, quality assurance, analytics, and database browser functionality into the BayStateApp admin panel. This workflow bridges the gap between the bare-bones register data and a rich storefront listing.

- **Staging:** Bulk Excel import of register data (SKU, Abbreviated Name, Price)
- **Enrichment:** Optional local scraping to fetch supplier data
- **Pipeline:** Finalize product details (Name cleanup, description, images) via manual or AI tools

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE DATABASE                             │
│                         products_ingestion                              │
│   ┌─────────┐   ┌─────────┐   ┌─────────────┐   ┌──────────┐   ┌──────────┐
│   │ staging │ → │ scraped │ → │ consolidated│ → │ approved │ → │ published│
│   └─────────┘   └─────────┘   └─────────────┘   └──────────┘   └──────────┘
└─────────────────────────────────────────────────────────────────────────┘
        ▲               ▲                ▲              ▲             ▲
        │               │                │              │             │
   ┌────┴────┐    ┌─────┴──────┐   ┌─────┴──────────────┴─────────────┴───┐
   │  LOCAL  │    │   LOCAL    │   │         VERCEL ADMIN PANEL          │
   │ Excel   │    │  Scraper   │   │                                     │
   │ Import  │    │ (Optional) │   │  • Clean up register names          │
   │ (SKU,   │    │            │   │  • Merge scraped data               │
   │  Name,  │    │            │   │  • AI-assisted completion           │
   │  Price) │    │            │   │  • Quality review                   │
   └─────────┘    └────────────┘   │  • Publish to storefront            │
                                   └─────────────────────────────────────┘
```

### Goals
1. **Unified Admin Experience** — All product pipeline tools accessible from `/admin/*`
2. **Schema Bridge** — Create a database view projecting published products to storefront format
3. **Register Data Pipeline** — transform "GRAIN FREE CK 5LB" → "Grain Free Chicken Recipe (5lb)"
4. **Decoupled Scraping** — Scraping is optional enrichment; pipeline works without it

## Pipeline Workflow

### Status Definitions

| Status | Description | Where It Happens |
|--------|-------------|------------------|
| `staging` | **Register Data only:** SKU, Price, "CAPS NAME" | Local Excel Import |
| `scraped` | Enriched with supplier data (images, desc) | Local scraper (optional) |
| `consolidated` | Data merged, names cleaned, validated | Admin pipeline |
| `approved` | Reviewed and approved for publication | Admin pipeline |
| `published` | Live on storefront | Admin pipeline |

### Finalization Methods

Products can be finalized (moved to `consolidated`) via:

1. **Manual Entry** — User manually cleans up the register name and adds description
2. **Scraped Data** — Use supplier listing to overwrite register data
3. **AI Assistance** — LLM helps infer full details from abbreviated register name

## Functional Requirements

### FR-1: Database Schema Bridge
- Create a PostgreSQL view `products_published` that:
  - Selects from `products_ingestion` where `pipeline_status = 'published'`
  - Projects `consolidated` JSONB fields into typed columns: `id`, `name`, `slug`, `description`, `price`, `images`, `stock_status`, `brand_id`
  - Includes computed `is_featured` based on consolidated data or defaults to `false`
- Update storefront data fetchers (`lib/data.ts`) to query from the view
- Preserve existing `products` table for manually-added products (union in view if needed)

### FR-2: Admin Navigation & Layout
- Add new admin sections nested under `/admin`:
  - `/admin/pipeline` — Product pipeline management
  - `/admin/quality` — Data quality review
  - `/admin/analytics` — Reports and metrics
  - `/admin/tools/database` — Direct data browser/editor
- Update admin sidebar navigation to include new sections
- Use existing shadcn/ui components and BayStateApp admin styling

### FR-3: Pipeline Management Module
- Display products grouped by `pipeline_status`
- **Staging Products:**
  - View "Raw" register data
  - Indicator showing if scraped data is available
- **Finalization Tools:**
  - **Register Data View:** Show the abbreviated CAPS name for reference
  - **Cleanup Form:** Input for clean customer-facing name
  - **AI Assist:** Button to auto-suggest clean name from register data
  - **Source Compare:** If scraped, show supplier data alongside register data
- **Workflow Actions:**
  - Consolidate: Save clean data
  - Approve: Mark ready for publication
  - Publish: Make live on storefront
  - Reject: Send back for rework
- Support bulk operations (approve all, publish selected)
- Filter by SKU, brand, status, date range

### FR-4: Quality Assurance Module
- Display products with missing or incomplete data
- Highlight required fields that are empty
- Validation rules:
  - Name required (must not be all-caps register name)
  - Price required and > 0
  - At least one image recommended
  - Description recommended
- Manual override/correction interface
- Approval workflow with notes

### FR-5: Analytics & Reports Module
- Pipeline status breakdown (count per status)
- Data completeness metrics (% of fields filled)
- Products processed per day/week
- Source coverage (which scrapers have data)
- Export capabilities (CSV)

### FR-6: Database Browser/Editor
- Tabular view of `products_ingestion` with search/filter
- JSONB field expansion and inline editing
- Edit `input`, `sources`, `consolidated` JSONB directly
- Bulk import/export functionality

## Non-Functional Requirements

### NFR-1: Performance
- Pipeline list should load <2s for 1000+ products
- Debounced search inputs
- Paginated results for large datasets

### NFR-2: Security
- All new routes protected by existing admin authentication
- Validate all user inputs before database writes

### NFR-3: Mobile Responsiveness
- Pipeline and quality views usable on tablet (1024px+)
- Core actions accessible on mobile (768px+)
- 44px+ touch targets maintained

## Acceptance Criteria

1. [ ] Database view `products_published` created and tested
2. [ ] Storefront displays products from ingestion pipeline
3. [ ] Pipeline page shows products by status with counts
4. [ ] Products can be manually finalized without scraped data
5. [ ] Products with scraped data show source comparison
6. [ ] Products can be moved through all pipeline stages
7. [ ] Quality issues can be reviewed and resolved
8. [ ] Basic analytics dashboard displays metrics
9. [ ] Database browser allows viewing and editing products
10. [ ] Existing admin functionality unaffected

## Out of Scope

- Scraper orchestration UI (scrapers run locally via BayStateTools)
- Real-time scraper monitoring
- Scraper configuration/credentials management
- **Full** AI implementation (UI buttons only, logic is separate track)
- Product image upload/optimization
- Tauri desktop wrapper
