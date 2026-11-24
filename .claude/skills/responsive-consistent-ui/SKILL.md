---
name: responsive-consistent-ui
description: Design system and implementation standard for responsive layout adaptation, consistent design tokens, and shadcn/ui components across Zprofile Node
---

# Responsive Layout & Consistent UI Design Standard

This skill establishes mandatory rules and patterns for building responsive, accessible, and visually consistent user interfaces in Zprofile Node using **Next.js 16 (App Router)**, **Tailwind CSS**, and **shadcn/ui**.

---

### 1. Semantic Design Tokens & Theme Consistency
Never use hardcoded hex colors or arbitrary arbitrary values (`bg-[#ffffff]`, `text-[#111827]`, `border-gray-200`). Always use semantic Tailwind classes backed by HSL CSS variables in `src/app/globals.css`.

- **Surfaces & Backgrounds**:
  - Application background: `bg-background` with optional `.ambient-bg` for subtle gradient depth.
  - Cards & Elevated Panels: `bg-card text-card-foreground border-border`.
  - Glass overlay: `.glass-card` for sticky headers or floating toolbars.
- **Brand Colors (Zymr Identity)**:
  - Primary button / active state: `bg-primary text-primary-foreground hover:bg-primary/90`.
  - Accents: `bg-accent text-accent-foreground` for subtle highlight states.
  - Subdued elements: `bg-muted text-muted-foreground`.
- **Status Colors**:
  - Destructive: `bg-destructive text-destructive-foreground` (and `border-destructive/30 text-destructive` for alerts).
  - Success: `text-emerald-600 dark:text-emerald-400` / `bg-emerald-500/10`.
  - Warning: `text-amber-600 dark:text-amber-400` / `bg-amber-500/10`.
- **Dark Mode Compatibility**:
  - Every component must look seamless in both light and dark mode without requiring manual `dark:` overrides for standard surfaces. Rely on the semantic tokens (`background`, `card`, `border`, `foreground`).

---

### 2. Mobile-First Responsive Layout Strategy
All dashboard pages and public views must support viewport widths from mobile ($375\text{px}$) to ultra-wide ($1920\text{px}+$):

#### A. Breakpoint Conventions
- `sm` ($640\text{px}$): Mobile landscape & small phablets.
- `md` ($768\text{px}$): Tablets and navigation sidebar collapse/expand boundary.
- `lg` ($1024\text{px}$): Laptops and multi-column forms/tables.
- `xl` ($1280\text{px}$): Desktop dashboards and dense grids.

#### B. Dashboard Shell & Layout Structure
- Main container must adapt dynamically:
  ```tsx
  // src/components/layout/dashboard-shell.tsx
  <div className="ambient-bg flex min-h-screen bg-background text-foreground">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  </div>
  ```
- **Sidebar Behavior**:
  - Desktop ($\ge 768\text{px}$): Collapsible panel with hover peek and persistent preference in `localStorage` (`zprofile_sidebar_collapsed`).
  - Mobile ($< 768\text{px}$): Collapses into header drawer or off-canvas overlay; never push or clip the main viewport.

#### C. Responsive Grids & Column Stacking
- Form and stat card grids must stack vertically on mobile and expand on larger screens:
  ```tsx
  // Metric / Stat Cards Grid
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {stats.map(...)}
  </div>

  // Two-column Form / Profile Details
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
    <div className="lg:col-span-8 space-y-6">...</div>
    <div className="lg:col-span-4 space-y-6">...</div>
  </div>
  ```

#### D. Data Tables & Overflow Protection
- Raw HTML tables break mobile layouts by causing horizontal page blowout. Always wrap tables in a container with `overflow-x-auto`:
  ```tsx
  <div className="w-full overflow-x-auto rounded-md border border-border">
    <Table className="min-w-[640px]">
      <TableHeader>...</TableHeader>
      <TableBody>...</TableBody>
    </Table>
  </div>
  ```
- Truncate long strings (e.g. emails, titles) using `truncate max-w-[200px]` with `title="..."` attribute for tooltip visibility.

---

### 3. Component Hierarchy & Consistency Standards
Always use the standardized primitives in `src/components/ui/` rather than raw unstyled elements:

| Element | Component | Standard Usage |
| :--- | :--- | :--- |
| **Buttons** | `<Button>` | Default size `h-9 px-4`, small `h-8 px-3 text-xs`. Icons use `h-4 w-4 mr-2`. Always show `<Loader2 className="h-4 w-4 animate-spin mr-2" />` when `isLoading`. |
| **Card Panels** | `<Card>` | Standard layout: `<CardHeader>`, `<CardTitle className="text-base font-semibold">`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`. |
| **Modals** | `<Dialog>` | Always include `<DialogHeader>`, `<DialogTitle>`, `<DialogDescription>` for screen readers, and `<DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">`. |
| **Inputs** | `<Input>` | Wrap with `<div className="space-y-1.5"><Label htmlFor="id">...</Label><Input id="id" /></div>`. Apply `border-destructive` on validation errors. |
| **Badges** | `<Badge>` | Use variants `default`, `secondary`, `outline`, or `destructive`. Font size `text-xs font-medium`. |
| **Tabs** | `<Tabs>` | Use `<TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">` for responsive tab bars. |

---

### 4. Interactive States & Accessibility (a11y)
1. **Focus Rings**:
   All interactive elements must exhibit consistent keyboard focus indicators:
   ```css
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
   ```
2. **Hover & Active Transitions**:
   Use standardized micro-interactions:
   ```css
   transition-all duration-150 ease-in-out hover:bg-accent hover:text-accent-foreground
   ```
3. **Screen Reader Visibility**:
   Icon-only buttons must include `<span className="sr-only">Descriptive Action</span>` or `aria-label`.
4. **Hydration Mismatch Prevention**:
   Never render raw `new Date().toLocaleDateString()` directly on server/client boundaries. Use the centralized `formatDate()` helper from `@/lib/utils`.

---

### 5. Print & PDF Dossier Layout Standard
For client-facing talent profiles and resumes, ensure clean print rendering:
- Always apply `.no-print` to interactive controls (`aside`, `header`, action buttons, toasts).
- Use `src/app/globals.css` `@media print` utilities:
  - Background resets to pure `#ffffff`.
  - Content width forced to `100% !important` without sidebar margin clipping.
  - Zero drop shadows and clean `#e5e7eb` hairline borders.

---

### 6. Pre-Merge UI Consistency Checklist
Before finishing a frontend feature or submitting changes:
- [ ] **Viewport Inspection**: Tested on $375\text{px}$ (mobile), $768\text{px}$ (tablet), and $1280\text{px}$ (desktop).
- [ ] **Zero Horizontal Scroll**: No uncontained tables or fixed-pixel widths causing horizontal document scroll on mobile.
- [ ] **Dark / Light Mode**: Checked in both themes; high contrast maintained and no invisible text.
- [ ] **Unified Primitives**: Used components from `@/components/ui/` with consistent corner radius (`rounded-lg` / `rounded-xl`).
- [ ] **Responsive Dialog Footers**: Dialog buttons stack gracefully on mobile (`flex-col-reverse sm:flex-row`).
- [ ] **Loading & Disabled States**: Action buttons show spinners and are disabled during asynchronous operations.
- [ ] **Consistent Typography**: Follows standard heading scale (`text-2xl font-bold tracking-tight`, `text-lg font-semibold`, `text-sm font-medium`).
