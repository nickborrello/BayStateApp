# Plan: Mobile UX Optimization (Profile & Navigation)

## Phase 1: Navigation Streamlining [checkpoint: ]

### 1.1 Responsive Header Visibility
- [x] Task: Write Tests for `Header` component visibility across breakpoints (Jest/Playwright) [checkpoint: 3376a89]
- [x] Task: Update `Header` component (or `(storefront)/layout.tsx`) to be hidden on viewports `< 768px` using Tailwind classes (`hidden md:block`) [checkpoint: 3376a89]
- [x] Task: Verify that `MobileNav` and `StickyCart` remain functional and accessible [checkpoint: 3376a89]

### 1.2 Phase Checkpoint
- [x] Task: Conductor - User Manual Verification 'Navigation Streamlining' (Protocol in workflow.md)

---

## Phase 2: Account Navigation Refactor [checkpoint: ]

### 2.1 Account Sidebar Transformation
- [x] Task: Write Tests for `AccountSidebar` responsive transformation [checkpoint: 3376a89]
- [x] Task: Refactor `AccountSidebar` to use a horizontal scrollable list of links on mobile [checkpoint: 3376a89]
- [x] Task: Update `app/(storefront)/account/layout.tsx` to ensure proper spacing for the new mobile navigation tab bar [checkpoint: 3376a89]

### 2.2 Phase Checkpoint
- [x] Task: Conductor - User Manual Verification 'Account Navigation Refactor' (Protocol in workflow.md)

---

## Phase 3: Profile & Form Optimization [checkpoint: ]

### 3.1 Mobile-First Form Layouts
- [x] Task: Write Tests for `ProfileForm` and `AddressForm` mobile layout stacking [checkpoint: 3376a89]
- [x] Task: Update `ProfileForm`, `AddressForm`, and `AddressList` to use single-column layouts on mobile viewports [checkpoint: 3376a89]
- [x] Task: Ensure all `Input`, `Button`, and `Checkbox` components in the account section meet the 44px minimum touch target [checkpoint: 3376a89]

### 3.2 Enhanced Feedback UI
- [x] Task: Update form submission feedback (toast/banners) to use larger, mobile-optimized typography and high-contrast styling [checkpoint: 3376a89]
- [x] Task: Remove non-essential decorative elements from account pages on mobile [checkpoint: 3376a89]

### 3.3 Phase Checkpoint
- [x] Task: Conductor - User Manual Verification 'Profile & Form Optimization' (Protocol in workflow.md)

---

## Phase 4: Final Verification & Polish [checkpoint: ]

### 4.1 Integration & Accessibility
- [x] Task: Run full automated test suite to ensure no regressions in account functionality
- [x] Task: Conduct accessibility audit of the new mobile tab navigation (keyboard + screen reader)
- [x] Task: Perform manual verification on mobile simulator/real device

### 4.2 Phase Checkpoint
- [x] Task: Conductor - User Manual Verification 'Final Verification & Polish' (Protocol in workflow.md)