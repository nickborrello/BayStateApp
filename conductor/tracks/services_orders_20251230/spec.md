# Track Spec: Services & Order Management

## Goal
Complete the hybrid product/service model by building full services management and order tracking. This enables the business to handle local services (propane refills, knife sharpening, equipment rentals) as first-class citizens alongside products, and provides order management for both customers and admins.

## Requirements
- **Services CRUD:** Admin portal for adding/editing services with pricing, descriptions, and availability.
- **Services Storefront:** Customer-facing pages to browse and reserve services.
- **Checkout Flow:** Complete order creation with customer information and order confirmation.
- **Order Management:** Admin interface to view, track, and fulfill orders.
- **Campaign Controls:** Admin toggles to manage promotional banners and seasonal modes.

## Technical Constraints
- Next.js (App Router) with Server Components
- TypeScript (Strict Mode)
- Supabase (PostgreSQL, Auth)
- shadcn/ui + Tailwind CSS
- Zod + React Hook Form for admin forms
- Zustand for cart state (already implemented)
