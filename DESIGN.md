# DESIGN.md: JemberTrip Design System (iOS Liquid Glass & Pandalungan Editorial)

## 1. Visual Direction & Brand Essence
- **Brand Identity**: **JemberTrip**, direktori wisata digital Kabupaten Jember ("Pesona Bumi Pandalungan").
- **Aesthetic Persona**: **Apple iOS 18 Liquid Glass dan Editorial Travel Discovery**.
- **Design Read**: Reading this as: regional tourism directory and RAG travel assistant for travelers exploring Kabupaten Jember, in an iOS Liquid Glass and editorial travel style, dial `ENERGY 2 / RHYTHM 2 / MOTION 2`.
- **Dial**: `ENERGY 2 / RHYTHM 2 / MOTION 2`
- **Strict Zero-Gradient Rule**: `0%` color gradients (`no linear-gradient`, `no radial-gradient`, `no bg-gradient-*`). Depth and visual separation come from translucent solid fills, optical backdrop blur (`backdrop-filter: blur(24px) saturate(180%)`), `1px` specular inner/outer borders, and spring transitions.

## 2. Color Tokens (Solid & Translucent Surface Palette)

| Token | Hex / Value | Role & Contrast Compliance |
| :--- | :--- | :--- |
| `--color-page-bg` | `#F8FAFC` (`slate-50`) | Primary daylight canvas for reading destination photos and cards |
| `--color-surface-solid` | `#FFFFFF` | Card and modal solid base |
| `--color-liquid-light` | `rgba(255, 255, 255, 0.76)` | Primary iPhone Liquid Glass surface (`blur(24px) saturate(180%)`) |
| `--color-liquid-pill` | `rgba(255, 255, 255, 0.88)` | High-contrast floating badge and Dynamic Island pill surface |
| `--color-liquid-dark` | `rgba(15, 23, 42, 0.78)` | Dark translucent surface on hero photography (`slate-900` at 78% opacity) |
| `--color-primary` | `#E11D48` (`rose-600`) | Primary brand action and active morphing pill (`4.82:1` contrast on white) |
| `--color-secondary` | `#059669` (`emerald-600`) | Nature/Agro indicator and AI online status |
| `--color-accent` | `#D97706` (`amber-600`) | Rating star and hybrid recommendation badge |
| `--color-text-main` | `#0F172A` (`slate-900`) | Primary typography (`17.4:1` contrast on `#F8FAFC`) |
| `--color-text-muted` | `#475569` (`slate-600`) | Secondary body and metadata (`7.2:1` contrast on `#FFFFFF`) |

## 3. iPhone Liquid Glass Material Specification (Zero Gradients)
Optical refraction and specular rim lighting separate floating navigation and search controls from destination photography without using color gradients:
1. **Optical Backdrop Filter**: `backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);`
2. **Specular Rim Border**: `border: 1px solid rgba(255, 255, 255, 0.75);`
3. **Inner Specular Highlight & Ambient Shadow**:
   `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 10px 30px -10px rgba(15, 23, 42, 0.08);`

## 4. Morphing & Spring Physics (iOS Dynamic Island Motion)
- **Shared Layout Morphing**: Navigation tabs (`layoutId="nav-liquid-pill"`) and Category Filter pills (`layoutId="category-liquid-pill"`) morph across active states using Framer Motion shared layout projections.
- **Spring Physics Parameters**:
  - **Navigation & Segmented Pills**: `type: "spring", stiffness: 400, damping: 30, mass: 0.8`
  - **Card Hover & Tactile Press**: `cubic-bezier(0.22, 1, 0.36, 1)` with `active:scale-[0.97]`
- **Accessibility (`prefers-reduced-motion`)**: All decorative and layout animations disable or collapse into instant transitions when Reduced Motion is enabled in OS settings.

## 5. Typography & Layout Architecture
- **Font Stack**: Inter / SF Pro Display system stack (`font-sans`), with tabular numerals (`tabular-nums`) for destination counters, ratings, and ticket prices.
- **Touch Targets**: Minimum `44px x 44px` on all interactive buttons, category pills, and navigation links (`WCAG 2.5.5` & `R-03`).
- **Responsive Grid**:
  - Mobile (`< 640px`): 1-column cards with a portal slide-over navigation drawer.
  - Tablet (`640px - 1024px`): 2-column and 3-column grids with fluid padding.
  - Desktop (`> 1280px`): 3-column horizontal recommendation cards and 4-column destination catalog (`max-w-7xl`).

## 6. Design Decision Log (R-31 One-Line Reasons)
- **Why this color (`#E11D48` rose-600 + `#0F172A` slate-900 on `#F8FAFC`):** High-contrast warm crimson highlights primary travel actions against natural green/blue destination photography while passing WCAG AA (`4.82:1`).
- **Why this layout:** Visitors first search or filter by category, then compare personalized 3-column horizontal recommendations (`Rekomendasi Pilihan` & `Mungkin Anda Sukai`) before browsing the 4-column full catalog and Cak Jember chat prompt.
- **Why this typography:** System sans-serif (`Inter` / `SF Pro Display`) with `tabular-nums` keeps Indonesian and Pandalungan place names, addresses, and Rupiah ticket prices legible across mobile and desktop screens.
- **Why this spacing:** A `64px` (`space-y-16`) vertical section rhythm separates recommendation groups from the main catalog, while `16px-24px` (`gap-4 md:gap-6`) grid gaps group cards within each section.
- **Why use cards:** Each destination combines a 4:3 photograph, category badge, title, and street address into a single clickable unit linking to `/wisata/:id`.
- **Why use icons:** Functional Lucide icons (`MapPin`, `Search`, `Compass`, `Clock`, `Ticket`) label specific metadata fields (location, operating hours, ticket price) rather than decorating empty space.
