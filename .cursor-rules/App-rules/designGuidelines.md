---
# designGuidelines.md

## Design Theme

- **Visual Style**: Professional, clean, and data-centric
- **Color Palette**: Inspired by BCRP branding — navy blue, gold, white, and neutral greys
- **Accessibility**: WCAG 2.1 AA compliant; all elements designed with proper contrast and semantic HTML

## Layout Structure

- **Two-column layout**:
  - Fixed sidebar for navigation
  - Dynamic main panel for content (charts, tables, summaries)
- **Grid System**: Used for Dashboard KPIs and Explore layout
- **Mobile Responsiveness**: Adaptive layout with collapsed sidebar and stackable components

## Spacing & Padding

- **Outer page padding**: `px-6 py-4`
- **Component gaps**: `gap-4` within cards, sections, and grids
- **Mobile adjustments**: Reduced padding to `px-4 py-2`

## Color Palette

- **Primary**: `#002B5B` (Navy Blue)
- **Secondary**: `#FBC02D` (Gold)
- **Neutral**: `#F5F5F5`, `#E0E0E0`, `#212121`
- **Accent**: `#00838F` (Teal), `#AED581` (Light Green)

## Typography

- **Font Family**: `Inter`, with system fallback
- **Headings**: `font-bold`, `text-2xl` for sections, `text-xl` for subheadings
- **Body Text**: `text-base`, line-height 1.5
- **Labels/Buttons**: `uppercase`, `text-sm`, medium weight

## Interactive Elements

- **Buttons**:
  - Style: `rounded-2xl`, Tailwind transitions, hover states
  - Primary: Navy with white text
  - Secondary: Border gold with navy text
- **Links**: Underlined on hover with subtle color shift
- **Forms**:
  - Rounded inputs, light shadow
  - Focus states with blue outline and background
  - Desktop-aligned buttons, full-width on mobile

## Charts & Tables

- **KPI Cards**: Shadowed with icon, label, and indicator symbol (▲▼●)
- **Charts**: Use `Recharts` or `ECharts` with accent color palette
  - Daily series: Line graphs
  - Monthly/yearly: Bar or area graphs
- **Tables**:
  - Alternating row shading, sticky headers
  - CSV export button aligned top-right
  - Units, series name, and frequency labels shown

## Iconography

- **Lucide Icons**: 20–24px, aligned with label text using `flex items-center gap-2`
- Consistent across sidebar, dropdowns, cards, and export options

## Animations

- **Page Transitions**: Fade-in via `Framer Motion`
- **Loaders**:
  - Spinners on API calls and Gemini generation
  - Skeletons for table/chart placeholders

## Data-First Design Constraint

⚠️ The design must clearly indicate when real BCRP data is being loaded or refreshed.  
❌ No visual placeholders should imply simulated or mocked values.
