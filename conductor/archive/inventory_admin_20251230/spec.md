# Track Spec: Build the Inventory & Admin Foundation

## Goal
Establish the core data architecture and secure Admin Portal foundation for Bay State Pet & Garden Supply. This track focuses on the "Bus Factor" solution, enabling the business owner to manage inventory independently and safely.

## Requirements
- **Supabase Schema:** Define PostgreSQL tables for Brands, Products, and Services with appropriate relations and constraints.
- **Secure Admin Dashboard:** A protected `/admin` area behind Supabase Auth.
- **Inventory Management:** Forms for adding/editing products and services with strict Zod validation.
- **Safety Rails:** Implement constraints to prevent layout breaks (e.g., character limits, image size validation).

## Technical Constraints
- Next.js (App Router)
- TypeScript (Strict Mode)
- Supabase (PostgreSQL, Auth, Storage)
- shadcn/ui + Tailwind CSS
- Zod + React Hook Form