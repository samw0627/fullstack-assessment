# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is a Stackline Full Stack Assignment — a Next.js 15 eCommerce app with intentional bugs to identify and fix. The app includes a product listing page with search/filtering, and a product detail page.

## Commands

```bash
yarn install       # Install dependencies
yarn dev           # Start dev server with Turbopack hot reload
yarn build         # Production build
yarn start         # Start production server
yarn lint          # Run ESLint
```

No test suite is configured.

## Architecture

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui

**Data layer:** No database. `sample-products.json` (~1000 products) is loaded into memory via `lib/products.ts`. The `ProductService` class handles all filtering, pagination, and lookup logic.

**API routes** (all GET, no auth):
- `GET /api/products` — paginated list with `search`, `category`, `subCategory`, `limit`, `offset` query params
- `GET /api/products/[sku]` — single product by `stacklineSku`
- `GET /api/categories` — all unique category names
- `GET /api/subcategories?category=X` — subcategories, optionally filtered

**Page flow:**
- `app/page.tsx` — product listing; fetches categories, subcategories, and products client-side; stores filter state in URL search params
- `app/product/page.tsx` — product detail; receives the entire product object as a serialized JSON query parameter (`?product=...`) from the listing page

**UI components:** `components/ui/` contains shadcn/ui primitives (Badge, Button, Card, Input, Select). New York style, Tailwind v4.

**Remote images:** Amazon CDN (`m.media-amazon.com`) is allowlisted in `next.config.ts` for Next.js Image optimization.

## Key Patterns

- Path alias `@/*` resolves to the project root (e.g., `@/lib/products`, `@/components/ui/button`)
- `cn()` utility in `lib/utils.ts` merges Tailwind classes (clsx + tailwind-merge)
- shadcn/ui components use `class-variance-authority` for variant styling
- Filter/search state lives in `URLSearchParams`, not React state
- Product data is passed between pages as URL-encoded JSON — a known architectural concern in this codebase
