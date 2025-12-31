# Implementation Plan: User Authentication & RBAC

## Phase 1: Database Schema & Authentication Middleware [checkpoint: e356511]

### 1.1 Profiles and Roles Schema
- [x] Task: Create migration `create_profiles_and_roles` for `profiles` table (linked to `auth.users`) 7624fd5
- [x] Task: Add `role` column with `admin` and `staff` constraints 7624fd5
- [x] Task: Add RLS policies for profile protection 7624fd5
- [x] Task: Write failing test for profile retrieval and role validation 7624fd5
- [x] Task: Implement `lib/auth/roles.ts` for role checking helpers 7624fd5

### 1.2 Authentication Middleware
- [x] Task: Write failing test for unauthorized access to `/admin` and `/account` 7624fd5
- [x] Task: Implement Next.js Middleware with Supabase Auth (SSR support) 7624fd5
- [x] Task: Implement role-based redirection logic for `/admin` routes 7624fd5
- [x] Task: Verify that `staff` cannot access `/admin/settings` or `/admin/users` 7624fd5

### 1.3 Phase Checkpoint
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Authentication Middleware' (Protocol in workflow.md)

---

## Phase 2: Customer Authentication Flow [checkpoint: ]

### 2.1 Sign Up and Login UI
- [x] Task: Create UI components for Login and Sign Up forms (shadcn/ui) 95d00d4
- [x] Task: Write failing tests for form validation (email, password strength) 95d00d4
- [x] Task: Implement email/password authentication flow 95d00d4
- [x] Task: Create `/login` and `/signup` pages 95d00d4

### 2.2 OAuth Integration
- [x] Task: Implement Google, Apple, and Facebook OAuth buttons b54932e
- [x] Task: Configure callback routes for social authentication b54932e
- [x] Task: Verify account linking (checking if email exists) b54932e

### 2.3 Password Reset & Session Management
- [x] Task: Implement "Forgot Password" flow with email reset link 28e3765
- [x] Task: Create password reset page 28e3765
- [x] Task: Implement "Logout" functionality across all headers 28e3765

### 2.4 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Customer Authentication Flow' (Protocol in workflow.md)

---

## Phase 3: Customer Dashboard & Account Management [checkpoint: ]

### 3.1 Account Layout and Profile
- [x] Task: Create `/account` layout with sidebar navigation dee4a58
- [x] Task: Write failing tests for profile update functionality dee4a58
- [x] Task: Implement profile editing (name, phone, email preferences) dee4a58

### 3.2 Address Management
- [x] Task: Create `addresses` table migration with primary flag f8c86c0
- [x] Task: Write failing tests for Address CRUD operations f8c86c0
- [x] Task: Build Address management UI in `/account/addresses` f8c86c0

### 3.3 Wishlist System
- [ ] Task: Create `wishlists` table migration (user_id, product_id)
- [ ] Task: Write failing tests for wishlist toggle and retrieval
- [ ] Task: Implement "Add to Wishlist" buttons in product cards and account view

### 3.4 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Customer Dashboard & Account Management' (Protocol in workflow.md)

---

## Phase 4: Recurring Buyer Features (Quick Buy) [checkpoint: ]

### 4.1 Purchase History Analysis
- [ ] Task: Create `lib/account/reorder.ts` to fetch frequently ordered items
- [ ] Task: Write failing test for "Frequently Bought" logic
- [ ] Task: Implement logic to surface items appearing in multiple orders

### 4.2 Quick Buy UI
- [ ] Task: Create `BuyAgainSection` component for the dashboard
- [ ] Task: Implement 1-click "Add to Cart" for reorder items
- [ ] Task: Integrate section into main `/account` dashboard view

### 4.3 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Recurring Buyer Features (Quick Buy)' (Protocol in workflow.md)

---

## Phase 5: Admin User Management [checkpoint: ]

### 5.1 RBAC Enforcement
- [ ] Task: Update admin layouts to hide "restricted" nav items for `staff`
- [ ] Task: Write failing test for server-side role enforcement on `/admin/users`

### 5.2 User Management UI
- [x] Task: Create `/admin/users` page for listing and searching customers c036412
- [x] Task: Implement role assignment (Staff/Admin) for internal users c036412
- [x] Add view for specific user's order history within admin panel c036412

### 5.3 Phase Checkpoint
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Admin User Management' (Protocol in workflow.md)
