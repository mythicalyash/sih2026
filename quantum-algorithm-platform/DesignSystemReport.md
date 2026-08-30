# Qubit.lab Design System Alignment Report

## 1. Executive Summary
This document details the extracted design tokens, typography specifications, color palettes, and UI component standards used across the **Qubit.lab Quantum Algorithm Platform**. All AI Tutor components (`AITutorView.tsx`, `AITutorPanel.tsx`) have been audited and updated to strictly conform to these tokens.

---

## 2. Token Directory

### 2.1 Typography Tokens
| Token Category | Font Family / Value | Applied To |
| :--- | :--- | :--- |
| `--font-sans` | `'Bricolage Grotesque', system-ui, sans-serif` | App body, UI controls, navigation, modal text |
| `--font-heading` | `'Instrument Serif', Georgia, serif` | Primary page headers (`h1`), hero statements |
| `--font-mono` | `'JetBrains Mono', monospace` | Circuit statevectors, Dirac matrices, Qiskit code blocks, metrics |

- **Heading Hierarchy**:
  - `H1`: 32px - 56px, `font-weight: 800`, `letter-spacing: -0.02em`, `line-height: 1.05`
  - `H2 / H3`: 16px - 18px, `font-weight: 700`, `letter-spacing: -0.02em`
  - `Eyebrow / Subhead`: 10px - 11px, `font-mono`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.14em`

### 2.2 Color Tokens & Theme System
| Variable Name | Hex Code | Semantic Role |
| :--- | :--- | :--- |
| `--background` | `#f7f4ee` | Main Parchment Background |
| `--foreground` | `#211f1b` | Primary Warm Espresso Body Text |
| `--card` | `#fffdf9` | Card Surface / Container Background |
| `--card-foreground` | `#211f1b` | Card Title & Primary Content |
| `--primary` | `#c96b2c` | Terracotta Orange (Primary Action Accent) |
| `--primary-foreground` | `#fffaf3` | Text on Primary Buttons |
| `--muted` | `#eee9df` | Soft Warm Beige Background Hover |
| `--muted-foreground` | `#746e64` | Subtitle / Muted Secondary Text |
| `--border` | `#ded7cb` | Subtle Surface Border Stroke |
| `--ring` | `#c96b2c` | Interactive Focus Outline |

### 2.3 Quantum Accent Tokens
- **Sage / Forest Green (`--green`)**: `#4f806d` — Online status, success badges, probability convergence.
- **Quantum Blue (`--blue`)**: `#0f62fe` — CNOT control gates, qubit amplitudes, vector state paths.
- **Terracotta Red (`--red`)**: `#b9573e` / `#da1e28` — Hadamard gates, error warnings.
- **Dark Active Slate**: `#282522` / `#182434` — User chat message bubbles, code block backgrounds, dark hero cards.

---

## 3. Reused Component Patterns

### 3.1 Buttons & Controls
- **Primary Button**: `bg-[#c96b2c] text-white hover:bg-[#b05a20] rounded-lg font-bold text-xs shadow-xs`
- **Secondary Dark Button**: `bg-[#282522] text-white hover:bg-[#38332d] rounded-lg font-bold text-xs`
- **Ghost / Outline Button**: `bg-[#fffdf9] border border-[#ded7cb] text-[#746e64] hover:border-[#c96b2c] hover:text-[#211f1b] rounded-lg text-xs`

### 3.2 Containers & Cards
- **Standard Card**: `bg-[#fffdf9] border border-[#ded7cb] rounded-xl shadow-xs p-4`
- **Dark Socratic Card**: `bg-[#182434] border border-[#2d4260] rounded-xl p-4 text-white shadow-xs`

---

## 4. UI/UX Harmonization Checklist for AI Tutor
- [x] Font families harmonized to `Bricolage Grotesque` and `JetBrains Mono`.
- [x] Color palette aligned with `--background`, `--card`, `--primary`, `--border`.
- [x] LaTeX math & Dirac notation formatted with high-contrast font styling.
- [x] Integrated 3D Interactive Q-Sphere visualizer alongside the circuit inspection grid.
- [x] Real-time Recharts statevector probability histogram integrated.
- [x] Mobile/Tablet tabbed interface for responsive viewports.
