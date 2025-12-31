# Spec: Database Security Hardening

## Overview
This track addresses critical security linter errors detected in the Supabase database. These errors involve disabled Row Level Security (RLS) on public tables and a view defined with `SECURITY DEFINER`, which can bypass RLS policies.

## Requirements
1. **Enable RLS** on all tables in the `public` schema that are exposed to PostgREST.
   - Tables: `categories`, `product_types`, `services`, `brands`, `site_settings`, `products`.
2. **Define RLS Policies**:
   - For storefront-essential tables (`products`, `categories`, `brands`, `services`, `product_types`): Enable public read access (SELECT for `anon` and `authenticated`).
   - For admin-managed tables (`site_settings`): Enable public read access but restrict write access (INSERT, UPDATE, DELETE) to `admin` roles.
3. **Fix View Security**:
   - Redefine `products_published` view to use `SECURITY INVOKER` (or ensure it respects RLS). By default, views in Postgres should be `SECURITY INVOKER` unless specified otherwise. We will ensure it is explicitly safe.

## Acceptance Criteria
- [ ] No `ERROR` level security linter warnings for missing RLS on the specified tables.
- [ ] No `ERROR` level security linter warnings for `SECURITY DEFINER` on the `products_published` view.
- [ ] Storefront functionality (product listing, category browsing) remains operational for unauthenticated users.
- [ ] Admin panel functionality (updating site settings) remains operational for authorized users.
