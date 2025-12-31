# Specification: Mobile UX Optimization (Profile & Navigation)

## Overview
This track focuses on enhancing the mobile-first experience by optimizing the user profile settings and streamlining site-wide navigation. Currently, the top navbar persists on mobile, causing redundant navigation clutter, and the profile settings layout is not fully optimized for "barn-ready" touch interactions.

## Functional Requirements

### 1. Navigation Streamlining
- **Top Navbar:** Hide the `Header` component (top navbar) completely on viewports smaller than `md` (768px).
- **Redundancy Removal:** Ensure the bottom navigation bar and sticky cart provide all necessary navigation context for mobile users.

### 2. User Profile Mobile Optimization
- **Layout:** 
    - Convert all account-related forms (Profile, Address, etc.) from multi-column layouts to a single-column stack on mobile.
    - Transform the `AccountSidebar` into a horizontal scrollable tab bar on mobile viewports.
- **Touch Interactions:** 
    - Ensure all buttons, form inputs, and links in the account section meet the minimum **44px x 44px** touch target size.
    - Implement larger, high-contrast success and error banners for form submissions on mobile.
- **Simplification:** 
    - Remove non-essential decorative elements or secondary information from the mobile view of the account dashboard to maximize space for primary actions.

## Non-Functional Requirements
- **Performance:** Ensure no layout shift occurs when hiding the navbar or switching to the tabbed navigation.
- **Accessibility:** Maintain clear focus states and ARIA labels for the new horizontal scrollable tab bar.

## Acceptance Criteria
- [ ] Top navbar is invisible on screens < 768px.
- [ ] Bottom navigation and sticky cart are the only persistent navigation elements on mobile.
- [ ] Account settings forms are single-column and easily scrollable on mobile.
- [ ] Account navigation on mobile is a horizontal scrollable list of tabs.
- [ ] All interactive elements in the account section are at least 44px tall/wide on mobile.
- [ ] Success/Error messages are highly visible and easy to read on mobile devices.

## Out of Scope
- Redesigning the desktop version of the profile settings.
- Modifying the core logic of the account settings (data fetching/submission).
- Adding new account features beyond UI/UX optimizations.
