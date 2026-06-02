# GeoChem Suite — Premium Enterprise Design System

Welcome to the **GeoChem Suite Design System**. This documentation details the design tokens, typography, visual guidelines, and layout components engineered to deliver an institutional‑trust-building, modern, and high‑performance scientific platform.

---

## 🌌 Brand & Aesthetic Identity
The visual system is designed to evoke a **futuristic geological laboratory** and a premium, high-density scientific operations environment. 

### 🎨 Color Palette (UNDP-Inspired)
- **Primary Blue:** `#1DA1E8` — Represents institutional trust, clarity, and technology.
- **Accent Gold/Yellow:** `#F4C430` — Represents precious metals, geological findings, and status highlights.
- **Dark Mode Backgrounds:** 
  - Base Background: `#050B12`
  - Surface Containers: `#07111C`
  - Muted Borders/Panels: `#0D1723`
- **Light Mode Backgrounds:**
  - Base Background: `#f8fafc`
  - Surface Containers: `#ffffff`
  - Muted Borders/Panels: `#e2e8f0`

### 🧪 Opacity Layering
Opacity blends are used extensively to create depth and modern layered surfaces:
- `rgba(29, 161, 232, 0.05)` — Subtlest primary background highlights
- `rgba(29, 161, 232, 0.08)` — Standard primary highlights
- `rgba(255, 255, 255, 0.03)` — Glass inner highlights (dark mode)

---

## ✍️ Typography
The typography leverages three curated Google Fonts to maximize legibility and technical aesthetic:
1. **Sora** (Display): Used for main dashboard headings, hero texts, and card titles (`font-display`).
2. **Space Grotesk** (Monospace/Technical): Used for numerical values, IDs, progress stages, and barcode readouts (`font-mono-grotesk`).
3. **Inter** (Body/Sans): Used for standard dense grid labels, lists, and general paragraphs (`font-sans`).

---

## 🎛 Spacing & Spacing System
We employ a strict layout spacing system aligned to a `4px / 8px` grid standard:
- `--space-1`: `0.25rem` (4px)
- `--space-2`: `0.5rem` (8px)
- `--space-3`: `0.75rem` (12px)
- `--space-4`: `1.0rem` (16px)
- `--space-5`: `1.5rem` (24px)
- `--space-6`: `2.0rem` (32px)
- `--space-8`: `3.0rem` (48px)

---

## 🔮 Glassmorphism & Elevation
Our design system balances glass elements conservatively to keep performance extremely high while achieving high visual polish.

### Classes
- `.glass` — Applied to the main navigation header and sidebars. Eases with a `12px` background blur and opacity overlays:
  - **Light Mode:** White glass (`rgba(255,255,255,0.7)`) with slate border.
  - **Dark Mode:** Deep cyan-blue glass (`rgba(7,17,28,0.6)`) with a custom gold/blue border tint.
- `--elevation-1`: Subtle card shadows.
- `--elevation-2`: Dialog modal popovers.
- `--elevation-3`: Large overlays and dropdowns.

---

## 📦 Key UI Components

### 1. `Card` (with `glass` support)
Import and render high‑performance cards:
```tsx
import { Card, CardContent } from "@/components/ui/card";

// Premium glassmorphic card:
<Card glass>
  <CardContent>Geochemical Analysis metrics...</CardContent>
</Card>
```

### 2. `Timeline` (Scientific progress steppers)
Used to render sample status, custody chain stages, and analytical workflows:
```tsx
import { Timeline } from "@/components/ui/timeline";

const steps = [
  { id: 1, label: "Sample Intake", status: "completed" },
  { id: 2, label: "Preparation", status: "active" },
  { id: 3, label: "ICP-MS Analysis", status: "pending" }
];

<Timeline steps={steps} orientation="horizontal" />
```

### 3. Utility Classes
- `.animate-fade-in` / `.animate-slide-up` — Smooth layout entries.
- `.hover-glow` — Glow borders on hover for cards.
- `.active-scale-spring` — Physical tap feedback on buttons/links.

---
