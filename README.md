# Stackline Full Stack Assignment

## System Bugs

## Bug 1: Invalid `next/image` src hostname for Amazon CDN

**Error:** `Invalid src prop` on `next/image` — hostname `images-na.ssl-images-amazon.com` not configured.

**Root cause:** `next.config.ts` only allowlisted `m.media-amazon.com`. Some products use `images-na.ssl-images-amazon.com` as their image CDN, which was not in `remotePatterns`.

**Fix:** Added `images-na.ssl-images-amazon.com` to the `remotePatterns` array in `next.config.ts`. 

**Justification for approach:** The error message itself dictates the fix — Next.js explicitly requires all external image hostnames to be allowlisted in remotePatterns for security (prevents your image optimization endpoint from being abused as an open proxy).                                                                               
   
The only decision was where to handle it:                                            
                  
  1. remotePatterns in next.config.ts (chosen) — the correct, idiomatic Next.js approach. Minimal change,
  no application logic touched.
  2. Replace <Image> with <img> — would silence the error but lose Next.js image optimization (lazy
  loading, format conversion, resizing). Worse outcome.


## Bug 2: Subcategories fetch ignores selected category
  File: app/page tsx:55                                       
                  
  fetch(`/api/subcategories`)  // ← missing ?category= param

  The selectedCategory state is never sent to the API, so subcategories always returns all subcategories
  across every category instead of filtering by the selected one. Should be:
  fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`)

## Bug 3: `useSearchParams` used without a Suspense boundary

**Error:** `useSearchParams() should be wrapped in a suspense boundary at page "/product"`

**Root cause:** `app/product/page.tsx` called `useSearchParams()` directly in the page component with no `<Suspense>` parent. In Next.js 15 App Router, components using `useSearchParams()` must be wrapped in `<Suspense>` — without it, Next.js throws during static rendering/build because the server has no access to URL search params.

**Fix:** Split the page into two components in `app/product/page.tsx`. The exported `ProductPage` is a thin shell that wraps `<ProductPageInner>` in a `<Suspense>` boundary. All existing logic (state, `useSearchParams`, JSX) lives in `ProductPageInner`.

## Bug 4: Clear Filters does not reset dropdown display

**Error:** Clicking "Clear Filters" clears React state and re-fetches unfiltered products, but the category and subcategory dropdowns continue showing the previously selected values.

**Root cause:** shadcn/ui `<Select>` is backed by Radix UI, which treats `value={undefined}` as a signal to switch from controlled to uncontrolled mode. Once uncontrolled, Radix ignores further `value` prop changes and preserves its last internal display value. The clear handler sets state to `undefined`, which propagates to the `value` prop and silently hands control back to Radix's internal state.

**Fix:** Changed `value={selectedCategory}` and `value={selectedSubCategory}` to `value={selectedCategory ?? ""}` and `value={selectedSubCategory ?? ""}` in `app/page.tsx`. Passing `""` keeps the component controlled at all times. Since no `<SelectItem>` has `value=""`, Radix correctly falls back to rendering the placeholder when the state is cleared.

## Bug 5: Changing top-level category briefly shows "No products found"

**Error:** When the user switches from one category to another while a subcategory is selected, the product list shows "No products found" instead of products for the new category.

**Root cause:** The subcategories `useEffect` only reset `selectedSubCategory` in the `else` branch (when category is cleared). When switching between categories, the stale subcategory value was never cleared. The products `useEffect` fires immediately with `new category + old subcategory`, which matches no products. The subcategory reset never happened so no subsequent fetch corrected it.

**Fix:** Moved `setSelectedSubCategory(undefined)` to the top of the `useEffect`, outside the `if/else`, so it runs unconditionally whenever `selectedCategory` changes — whether switching to a new category or clearing it entirely.

## Bug 6: TypeError when `imageUrls` or `featureBullets` is null on a product

**Error:** `Cannot read properties of undefined (reading '0')` at `product.imageUrls[0]` in `app/page.tsx` and equivalent crashes in `app/product/page.tsx`.

**Root cause:** Some products in the dataset have `null` or missing `imageUrls` and `featureBullets` fields. Directly accessing `[index]` or `.length` on `null`/`undefined` throws a TypeError at runtime.

**Fix:** Applied optional chaining (`?.`) to all unsafe accesses across both pages:
- `app/page.tsx` — `product.imageUrls[0]` → `product.imageUrls?.[0]`
- `app/product/page.tsx` — `product.imageUrls[selectedImage]` → `product.imageUrls?.[selectedImage]`; `product.imageUrls.length` → `product.imageUrls?.length ?? 0`; `product.featureBullets.length` → `product.featureBullets?.length ?? 0`

Optional chaining short-circuits to `undefined` when the value is null/undefined, which is falsy and safely skips the render without throwing.

## Enhancement 2: Paginated product listing with "Show More" (`app/page.tsx`)

**Problem:** The product listing was hardcoded to fetch and display only 20 items with no way to load more.

**Changes made:**
- Added `total` state populated from `data.total` in the API response to track how many products match the current filters.
- Added `offset` state, reset to `0` on every filter change and incremented by 20 on each "Show More" click.
- Added `loadingMore` state, separate from the initial `loading` state, so the page spinner and the "Show More" button disabled state don't interfere with each other.
- Added `handleLoadMore` function that fetches the next page and appends results to the existing list rather than replacing them.
- Added a "Show More" button below the product grid, visible only when `products.length < total` and auto-hidden once all results are loaded.
- Updated the count label from `Showing X products` to `Showing X of Y products`.

**Design decision:** Filter-driven fetches stay in the `useEffect` (always replace products and reset offset). "Show More" uses an explicit handler (always appends). This avoids a race condition where changing filters while `offset > 0` would otherwise trigger two competing fetches.

## Usability Issues
## Usability Issue 1: Filtering system

## Enhancements

## Enhancement 1: Product card layout alignment (`app/page.tsx`)

**Problem:** "View Details" buttons were misaligned across cards with different title lengths. Category/subcategory badges were visually cramped and could stretch incorrectly inside the card.

**Changes made:**
- Added `flex flex-col` to `Card` — establishes a vertical flex layout so children stack correctly and the footer can be anchored to the bottom.
- Added `flex-1` to `CardContent` — allows the content area to grow and fill available space, pushing `CardFooter` to the bottom consistently across all cards regardless of title length.
- Added `items-start mt-2` to the badge container (`CardDescription`) — prevents badges from stretching to the full height of the flex container, and adds consistent spacing between the title and the badges.

