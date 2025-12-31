# Bay State Pet & Garden Supply - AI Assistant Guide

This file serves as the primary entry point for AI assistants (Gemini, Claude, etc.) working on this project.

## Project Overview

**Bay State Pet & Garden Supply** is a high-performance, mobile-first PWA e-commerce platform that combines modern digital efficiency with the authentic feel of a local community store. The platform enables non-technical owners to manage a 300+ brand catalog of pet supplies, garden tools, and farm products, alongside specialized services like propane refills.

### Core Mission
Transform a local store into a self-sustaining digital platform with:
- **Modern E-commerce Efficiency** – PWA capabilities, intelligent search, mobile-first design
- **Community Feel** – Warm, neighborly tone while remaining professional
- **Legacy Architecture** – Strict typing, modular structure, deep documentation for long-term maintainability

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Language** | TypeScript (Strict Mode) |
| **Framework** | Next.js (App Router) |
| **Backend/Data** | Supabase (PostgreSQL, Auth, Storage) |
| **Styling** | Tailwind CSS |
| **Components** | shadcn/ui |
| **Icons** | Lucide React |
| **State Management** | Zustand |
| **Forms/Validation** | React Hook Form + Zod |
| **Deployment** | Vercel |

> **Important:** Any changes to the tech stack must be documented in `conductor/tech-stack.md` *before* implementation.

---

## Conductor System

The `conductor/` directory is the operational brain of this project. It contains:

| File/Directory | Purpose |
|----------------|---------|
| `product.md` | Product vision, features, and architectural principles |
| `product-guidelines.md` | Tone, voice, and design language standards |
| `tech-stack.md` | Technology choices and rationale |
| `code_styleguides/` | Google-style coding standards for TS/JS/HTML/CSS |

---

## Code Style Standards

### TypeScript
- **`const` by default** – Use `let` only when reassignment needed; **`var` is forbidden**
- **Named exports only** – No default exports
- **Avoid `any`** – Prefer `unknown` or specific types
- **Triple equals** – Always use `===` and `!==`
- **No `_` prefixes** – Don't use underscore prefix for private properties
- **Semicolons required** – Explicitly end all statements

### CSS/HTML
- **Lowercase only** – All element names, attributes, selectors, properties
- **2-space indentation** – No tabs
- **Semantic HTML** – Use elements for their intended purpose
- **Class over ID** – Avoid ID selectors for styling
- **Hyphenated class names** – e.g., `.video-player`, `.site-navigation`

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Classes, Interfaces, Types | `UpperCamelCase` | `ProductCard`, `OrderStatus` |
| Functions, Methods, Variables | `lowerCamelCase` | `getProducts()`, `cartTotal` |
| Global Constants | `CONSTANT_CASE` | `MAX_CART_ITEMS` |
| CSS Classes | `kebab-case` | `.product-grid`, `.nav-item` |

---

## Product Guidelines Summary

### Tone & Voice
- **Expert & Neighborly** – Like a knowledgeable neighbor giving advice over the fence
- **Conversational but professional** – Avoid corporate jargon
- **Practical benefits** – "Keeps your barn dry" vs "High-grade moisture barrier"
- **Helpful error messages** – Forgiving, not technical

### Mobile-First Requirements
- **Touch targets:** Minimum 44px × 44px
- **Critical data above fold:** Price, stock status, "Add to Cart"
- **Persistent navigation:** Sticky cart, bottom nav bar

### Service Integration
- Services and products coexist in search results
- Service cards inject naturally into product grids
- Example: "Propane Refill" card appears in the "Grilling" category

---

## Key Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run linter
CI=true npm test     # Run tests (single execution)
```


---

## Emergency Procedures

| Scenario | First Steps |
|----------|-------------|
| **Critical Production Bug** | Create hotfix branch → Write failing test → Minimal fix → Deploy |
| **Data Loss** | Stop writes → Restore backup → Verify integrity → Document |
| **Security Breach** | Rotate all secrets → Review logs → Patch vulnerability → Notify users |

---

## Quick Reference Links

- **Product Vision:** `conductor/product.md`
- **Design Guidelines:** `conductor/product-guidelines.md`
- **Tech Stack:** `conductor/tech-stack.md`
- **Code Styles:** `conductor/code_styleguides/`
