# AquaSense: Adaptive Water Intelligence

Decision-aware **Value of Information (VOI)** sensing and constrained water allocation for drought-stressed agriculture.

## The problem

During a drought, a basin authority must split a fixed water budget (`W_total`) across farm zones whose true water needs are uncertain, and it can afford only `K` field sensor visits before deciding. The usual rule of thumb is to *measure the zones you are most unsure about*. That is not the same as measuring the zones where **new information would change the allocation decision**. A zone with a wide but irrelevant uncertainty wastes a scarce sensor visit.

## What AquaSense does

1. **Models each zone** as a prior belief `N(μ_i, σ_i²)` with a crop-vulnerability weight `w_i`.
2. **Allocates water optimally** under the hard budget by minimizing weighted quadratic crop-stress loss `Σ w_i · (need_i − x_i)₊²` subject to `Σ x_i ≤ W_total`, `x_i ≥ 0`, using water-filling (bisection on the Lagrange multiplier).
3. **Ranks sensor targets by VOI** using a preposterior analysis. For each candidate zone *k*, it estimates the expected reduction in **basin-wide** loss from re-optimizing after observing zone *k*. The estimate uses 400 Monte Carlo worlds with common random numbers and a seeded PRNG, so results are deterministic and reproducible. The hidden ground truth is never consulted when ranking.
4. **Benchmarks against three baselines** on the same scenario and ground truth: demand-proportional, uncertainty-weighted, and the max-uncertainty sensing heuristic. It reports the loss proxy, Jain's fairness index, and budget compliance.
5. **Explains decisions** to three audiences (executive, agronomist, farmer cooperative) in four languages (English, Hindi, Spanish, Swahili), through a grounded Copilot (Gemini, with a deterministic offline fallback) and voice input and output.

In the *Indus-Ganges Heatwave* preset, VOI measures **Zone D**, the tipping-point zone, rather than the highest-variance **Zone A**, and lowers the simulated loss proxy relative to the max-uncertainty heuristic. When both strategies select the same zones (the Mahanadi and Deccan presets), the UI and Copilot say so instead of claiming an advantage.

> All results are a **simulated crop-stress loss proxy under synthetic scenarios**. They are not field-validated water savings.

## Architecture

```
server.ts                 Entry point: Gemini client, Vite (dev) / static dist (prod)
server/app.ts             Express app: security headers, rate limit, /api/gemini/copilot
server/copilot.ts         Request validation + whitelisting, prompt building, offline answers
server/rateLimit.ts       Per-IP fixed-window limiter
src/utils/simulationEngine.ts  Allocation optimizer, baselines, VOI engine (pure, deterministic)
src/utils/scenarios.ts    Preset basin scenarios + random scenario generator
src/components/           React UI (Dialog, PersonaSwitcher, panels, Copilot, voice, sandbox)
tests/                    Vitest suites (engine, server, components, accessibility)
```

## Getting started

Requires Node.js 20.19 or later.

```bash
npm install
cp .env.example .env.local   # optional: set GEMINI_API_KEY to enable the live Copilot
npm run dev                  # http://localhost:3000
```

Without `GEMINI_API_KEY`, the Copilot answers from the deterministic offline engine, which uses only the simulation's own numbers.

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with Vite middleware |
| `npm run build` / `npm start` | Production build / production server |
| `npm run typecheck` | `tsc --noEmit` in strict mode with unused-code checks |
| `npm test` / `npm run test:coverage` | Vitest suites / with V8 coverage |
| `npm run check` | Typecheck, tests and build (what CI runs) |

## Quality, security and accessibility

- **Testing:** unit tests for the optimizer, baselines and VOI (determinism, budget invariants, no ground-truth leakage); API tests with Supertest (validation, 413, 429, fallback, headers); component tests with Testing Library; and an automated **axe-core WCAG 2.1 A/AA** scan of every persona view.
- **Security:** strict schema validation and field whitelisting on the API (hidden ground truth never reaches the LLM); a 200 kB body limit; per-IP rate limiting; prompt-injection fencing; no upstream error details returned to clients; `nosniff`, `Referrer-Policy`, `Permissions-Policy`, a production Content-Security-Policy, and no `X-Powered-By`; upload type and size checks; and CI running `npm audit` with Dependabot updates.
- **Accessibility:** modal dialogs with focus trap, Escape to close and focus restore; a skip link; labelled controls; `aria-pressed` and `aria-expanded` on toggles; keyboard-operable zone cards; live regions for results and Copilot replies; text alternatives for charts and canvas; visible focus rings; `prefers-reduced-motion` support; `<html lang>` kept in sync with the selected language; and WCAG AA colour contrast.
- **Efficiency:** the simulation is a memoized pure function of the scenario (about 10 to 25 ms per run); common random numbers reuse the prior-loss evaluation across all VOI candidates; and blob URLs are revoked after use.

## Limitations

- Scenarios are synthetic, and the loss function is a proxy for crop stress, not a yield model.
- A sensor reading is modeled as revealing a zone's true need with 90% uncertainty reduction.
- VOI selects the top-K candidates greedily (myopically); it does not search jointly over sensor sets.
