# EVD Dashboard Design Guide

This guide is the visual and interaction source of truth for the Kenya
Ebola dashboard app. Keep the product clean, neat, official, and less wordy.

The chosen direction is **Kenya Health Security Command**: a calm civic-health
dashboard that feels official enough for MoH, modern enough for DHA, and clear
enough for the public during an outbreak.

## Design Principles

- **Official first**: MoH, DHA, and NPHI identity must be visible and
  treated respectfully.
- **Data before decoration**: charts, numbers, maps, and source status carry
  the interface.
- **Less wordy**: short headings, compact labels, direct actions. Avoid long
  explanatory panels inside the app.
- **Audience separation**: public, executive, and operational users must never
  feel like they are seeing the same page with different labels.
- **Calm urgency**: use alert color only where risk or action requires it.
- **Provenance visible**: every metric family should show whether it is live,
  pending, preview, unavailable, or interim.
- **No sensitive leakage**: public surfaces are aggregate-only; operational
  variables belong behind auth.

## Concept Sources

Borrow selectively from these references:

- **Healthy Together / getdesign.md**: civic public-health technology, clear
  public communication, government platform confidence.
- **DHA website**: dark digital-health polish, cyan accents, official support
  actions such as Dial 719 and dg@nphi.go.ke.
- **MoH website**: formal navigation, public-health portal structure,
  accessibility posture, alerts/resources framing.
- **NPHI / emergency preparedness**: health-security and readiness tone.
- **eCitizen / Huduma**: simple official login and service-action patterns.
- **Uganda public EVD dashboard**: aggregate outbreak figures, hotline/report
  actions, public guidance, and safe public-facing stats.
- **DRC / Nigeria response dashboards**: EOC decision support, operational
  monitoring, action tracking, contact/lab/POE response workflows.

Do not copy any one reference wholesale. This app should feel Kenyan, official,
and purpose-built for outbreak surveillance.

## Brand System

Use official logos already in `public/`:

- `public/moh-kenya.png`
- `public/dhalogo.png`
- `public/nphi-kenya.png`

Logo rules:

- Keep original proportions.
- Do not recolor, crop, stretch, blur, or place logos on busy backgrounds.
- Header should stay compact and logo-led, with NPHI and DHA visible.
- MoH ownership and public/executive navigation can live in the footer.
- On compact mobile headers, show fewer words before shrinking logos.

## Color Tokens

Use semantic tokens, not raw one-off hex values in components.

```css
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #dbe4ee;

  --color-ink: #0f172a;
  --color-text: #16202a;
  --color-muted: #64748b;
  --color-faint: #94a3b8;

  --color-dha-cyan: #35459c;
  --color-navy: #071225;
  --color-alert: #b42318;
  --color-warning: #b7791f;
  --color-success: #1f7a4d;
  --color-info: #0369a1;

  --focus-ring: #35459c;
}
```

Color usage:

- **DHA cyan**: primary brand accent, navigation bars, selected states,
  active links, and subtle highlights.
- **Navy**: second brand color, executive command header, operational login
  surface, footer.
- **Alert red**: confirmed outbreak risk, deaths, critical warning states.
- **Green**: recoveries, completed follow-up, healthy/safe states.
- **Amber**: pending results, awaiting source, watch states.

Avoid:

- Purple/pink startup gradients.
- Decorative gradient blobs or glow effects.
- Overusing red across the whole app.
- One-note blue-only screens with no hierarchy.
- Low-contrast gray text.

## Typography

Use the existing system-friendly dashboard stack:

```css
font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

Type rules:

- Body text: 16px minimum on public pages; 14-16px in dense dashboard controls.
- Headings: 600-800 weight, compact, no negative letter spacing.
- Numbers: use tabular figures for KPIs, tables, and charts.
- Labels: short, uppercase only where it helps scanning.
- Keep line length readable: 60-75 characters on desktop, shorter on mobile.

Copy rules:

- Prefer "Current status" over long descriptive section headings.
- Prefer "Tests done" over "Total laboratory tests performed to date".
- Prefer "Report alert" over "Submit a disease surveillance alert".
- Do not add visible instructions that explain obvious UI behavior.

## Layout System

Use an 8px spacing rhythm:

- 4px: tiny gaps inside labels.
- 8px: icon/text gaps, label-to-value gaps inside compact blocks.
- 12px: secondary vertical list rhythm on public guidance blocks.
- 16px: component padding, compact card gaps, grid gaps, and heading-to-body spacing inside panels.
- 24px: section rhythm inside dashboards, panel block separation, card padding on dense surfaces.
- 32px: page block separation, hero grid gap, public info divider padding.
- 48px: public landing major section separation.

Container rules:

- Max content width: 1240px for dashboards and the public landing page.
- Public landing content aligns to the same readable grid as dashboards.
- Cards use 8px radius unless a local component needs less.
- Avoid nested cards.
- Avoid decorative panels that do not contain actionable or scannable content.

Responsive rules:

- Design mobile first, then expand to 768px, 1024px, and 1440px.
- Public landing breakpoints: `860px` (tablet stack) and `540px` (compact mobile).
- Mobile must show the most important status before secondary context.
- No horizontal page scroll.
- Charts that need width should use scroll wrappers with stable height.
- Touch targets must be at least 44px.

Public landing shell spacing:

| Surface | Desktop | Tablet (`<=860px`) | Mobile (`<=540px`) |
| --- | --- | --- | --- |
| Page padding | `32px 24px 64px` | `24px 16px 48px` | `16px 16px 40px` |
| Major section gap | `48px` | `40px` | inherits tablet |
| Section intro to content | `24px` | `20px` | inherits tablet |
| Hero copy padding | `clamp(32px, 5vw, 48px)` | inherits desktop | `24px 20px` |

Implementation lives in `app/globals.css` under `.public-*` classes used by
`components/PublicLanding.js`.

## Navigation

Primary routes:

- `/` - Public landing.
- `/executive` - Executive situation dashboard.
- `/operational` - Simulated sign-in + aggregate operational preview now, real auth later.

Header rules:

- Public page: compact NPHI/DHA header, no route tabs, with report/help
  actions handled by the page body or footer.
- Executive page: compact command header with refresh, timestamp,
  and source status.
- Operational page: official restricted-access header with login affordance.

Do not overload navigation. The app has three main surfaces; keep it that way.

## Page Direction

### Public Landing

Purpose: safe public outbreak communication.

Visual feel:

- Light, official, calm.
- DHA cyan header with navy support.
- Navy first-view update block.
- Uganda-style key metric cards for cumulative confirmed cases, admissions,
  recoveries, and deaths.
- Tabbed supporting sections for highlights, cases, tests, contacts, alerts,
  and points of entry.
- Public guidance in short, scannable blocks below the data.

First viewport should include:

- Official identity.
- Disease/outbreak name.
- General public subtitle in the hero (not the as-of timestamp).
- Updates band above key metrics: KNPHI situation-room label, Ebola Updates
  title with red underline, and live as-of timestamp.
- Key metrics immediately after the updates band.

Use content like:

- Key metrics: confirmed, admissions, recoveries, deaths.
- Highlights: new confirmed, suspected cases, tests done, travellers screened.
- Cases: suspected, probable, imported/local split when available, outcomes.
- Tests: total tested, pending results, positivity, result share.
- Contacts: listed and followed-up contacts, with simple progress meter.
- Alerts: screening alerts, suspected cases, report concern copy.
- Points of entry: traveller screening totals and busiest reporting POEs.
- Public guidance: what to do, help channels, and data safety.

Component rules:

- Use icon-led metric cards sparingly for the four public key metrics only.
- Metric card colors follow data meaning: cyan for confirmed, amber for
  admissions, green for recoveries, dark neutral/navy for deaths.
- Tabs use pill buttons with visible selected state and horizontal scroll on
  narrow screens.
- Use segmented bars, progress meters, and short ranked lists for public
  comprehension; avoid dense operational tables.
- Loading and error states must stay aggregate-only and must not reveal
  operational records.

Spacing rules:

- Keep all public landing spacing on the 8px rhythm. Do not introduce one-off
  values such as `14px`, `18px`, or `22px` unless a breakpoint explicitly
  requires a tighter mobile adjustment.
- Hero block:
  - Label to title: `16px` (`12px` on compact mobile).
  - Title to timestamp/meta: `16px` (`12px` on compact mobile).
  - Error/retry actions: `24px` above the action row.
  - Use semantic hooks: `public-hero__title`, `public-hero__meta`.
- Section headers (`public-section-head`):
  - Heading to supporting copy: `8px`.
  - Header block to content below: `24px` desktop, `20px` tablet.
- Key metric cards:
  - Grid gap: `16px`.
  - Card padding: `24px` desktop, `20px` tablet.
  - Internal stack gap: `16px`.
  - Value to label inside card: `8px`.
  - Delta pill padding: `8px 12px`; icon/header row gap: `16px`.
  - Featured breakdown row: `16px` top padding, `8px` top margin, `8px` gap
    between breakdown label and value.
- Tabs and tab panels:
  - Tab bar gap: `8px`; margin below tabs: `16px`.
  - Tab buttons: `44px` min-height, `16px` horizontal padding.
  - Tab content top padding: `8px`.
- Panel stats and sections:
  - Panel vertical rhythm: `24px` desktop, `20px` tablet.
  - Stat/section grid gap: `16px`.
  - Stat card padding: `20px` desktop, `16px` compact mobile.
  - Section card padding: `24px` desktop, `16px` compact mobile.
  - Stat label to value: `8px`; section title to content: `16px`
    (`12px` compact mobile).
- Share bars, meters, and ranked lists:
  - Share bar to legend: `16px`.
  - Meter caption row gap: `12px`; meter row to track: `12px`.
  - Ranked list item gap: `16px`; label row to bar: `8px`.
- Public guidance footer (`public-info`):
  - Top separation from data above: `48px` margin, `32px` divider padding.
  - Column gap: `32px` desktop, `24px` tablet.
  - Column heading to body: `16px` (`12px` compact mobile).
  - List item gap: `12px`.
- Loading placeholders: `24px` padding inside bordered states.

Avoid:

- Long disease education articles on the dashboard first screen.
- Line lists or facility-sensitive information.
- Dramatic imagery that increases panic.
- Executive-only controls or links in the public header.
- Cramped hero text or uneven card padding that breaks scan rhythm.

### Executive Dashboard

Purpose: daily leadership situation awareness.

Visual feel:

- Command-like but readable.
- Use a navy top band if helpful, with light data surfaces underneath.
- Dense enough for briefings, not crowded.

Must prioritize:

- Confirmed cases and 24-hour change.
- Admitted, recoveries, deaths, CFR.
- Lab tests and result status.
- POE screening and alerts.
- County/POE breakdowns where available.
- Source/provenance and last updated state.

Use:

- KPI strip.
- Two-column chart grid on desktop.
- Tables for exact values.
- Map for POE geography.
- Pill labels for live/pending/preview source states.

Avoid:

- Big marketing hero sections.
- Excessive explanatory copy.
- Filling pending sections with fake values.

### Operational Workspace

Purpose: restricted response-team work surface.

Current state:

- Real Better Auth sign-in, password reset, and session management.
- Signed-in users can enter the operational workspace.
- Admin users get the Users tab and `/users` account-management pages.
- Aggregate preview data only after authentication.
- No patient, contact, traveller, or facility-sensitive line lists.

Visual feel:

- eCitizen-like official access page.
- Navy or white official shell.
- Short message: "Operational workspace requires sign in."
- Clear login and account recovery actions.

Authenticated preview state:

- Compact top navigation for Summary, Laboratory, POE, Health facilities,
  Community, Contacts, EOC actions, and admin-only Users.
- Summary tab for aggregate queues, priority metrics, data quality flags, and
  action tracker context.
- Service-point tabs for cases, contacts, lab, POE, community, and action
  tracker detail.
- Data filters on each tab. Summary uses cross-cutting geography/service
  filters; service tabs use the fields that match their source data, such as
  lab, result status, sample source, POE, alert status, facility, case status,
  follow-up status, owner, deadline, and priority.
- Data quality flags and source status.
- Profile pages for display name, profile photo, and password updates.
- Header account menu with Profile and Logout once signed in.

Avoid:

- Returning to mock or simulated access controls.
- Showing contact, patient, traveller, or facility-sensitive line records.
- Filling the operational preview with unlabeled fake source values.

## Components

Preferred component set:

- `AppHeader`: shared official chrome.
- `PublicLanding`: aggregate public update page.
- `ExecutiveDashboard`: wrapper around the current dashboard shell.
- `OperationalWorkspace`: authenticated operational Summary, service-point
  tabs, and admin-only Users tab with scoped data filters.
- `StatusCard`: compact KPI/status tile.
- `SourcePill`: live/pending/preview/unavailable indicator.
- `DataPanel`: chart/table panel with title, source, and empty state.
- `ActionButton`: primary/secondary official actions.

Component rules:

- Cards should be content containers, not decoration.
- Section headings should be short.
- Buttons need clear text and visible focus.
- Icon buttons need accessible labels.
- Use one icon family; prefer lucide if icons are added.
- Empty states must explain data absence without sounding broken.

## Charts And Maps

Chart rules:

- Trends: line or bar chart.
- Comparisons: bar chart or table.
- Proportions: avoid pie/donut unless there are 2-4 stable categories.
- Always include a nearby legend or direct labels.
- Never rely on color alone; pair with labels/patterns/text.
- Use accessible contrast for series colors.
- Provide exact values through tables or tooltips.
- Show clear empty, pending, and error states.

Map rules:

- POE map should support quick scanning, not heavy GIS interaction.
- Use bubbles/markers with simple legend.
- Avoid over-layering. A map with unclear hierarchy is worse than a table.

## Data States

Every metric family must support:

- **Live**: backed by current source.
- **Interim**: temporary sourced or hardcoded value awaiting contract.
- **Preview**: UI shape exists; source not yet connected.
- **Pending**: source expected but unavailable.
- **Unavailable**: not applicable or not collected.
- **Error**: failed load with retry path where possible.

Do not hide missing data silently. Do not invent data.

## Accessibility

Minimum bar:

- Text contrast: 4.5:1 for normal text.
- Visible focus rings.
- Keyboard reachable controls.
- Skip link on public page.
- Semantic headings in order.
- Alt text for meaningful images/logos.
- Button text or aria-label for icon-only controls.
- Touch targets at least 44px.
- Reduced motion respected.

The public page should be especially accessible because it serves the broadest
audience.

## Motion

Use motion sparingly:

- 150-250ms for hover, focus, tabs, loading transitions.
- No decorative loops.
- No layout-shifting animations.
- Respect `prefers-reduced-motion`.

Allowed:

- Subtle active tab movement.
- Loading skeleton fade.
- Map marker hover/focus.
- Button state transitions.

Avoid:

- Pulsing alerts everywhere.
- Parallax.
- Decorative background animation.

## Imagery

Use real official assets when possible. For this app, imagery is secondary to
data and public guidance.

Allowed:

- Official logos.
- Carefully selected health/public-service images for the public landing if
  they improve trust and do not obscure content.
- Purpose-made documentary hero images for public and operational surfaces
  when each image matches its audience: civic surveillance for the public
  page and controlled laboratory response for the operational workspace.
- Hero images with intentional low-detail copy zones, a navy fallback, and a
  solid navy scrim that keeps all text and controls at accessible contrast.
- Responsive `background-size: cover` crops with breakpoint-specific focal
  positioning. Treat hero backgrounds as decorative; all meaning stays in
  the page copy, and no patient identity or readable operational data appears.
- On authentication pages, use a purpose-made documentary health-security
  image as the decorative identity pane and keep the form pane solid navy.
  Place the cyan eyebrow, white heading, and pale supporting text with the
  form so the access action remains legible and visually connected.
- Small illustrative icons for prevention/resource blocks.

Avoid:

- Generic or heavily blurred stock imagery behind critical text.
- Graphic disease imagery.
- Generic tech illustrations.
- Decorative blobs, orbs, and abstract gradients.

## Copy Tone

Voice:

- Official.
- Calm.
- Direct.
- Short.

Examples:

- "Current status"
- "As of"
- "Report an alert"
- "View executive dashboard"
- "Results pending"
- "Source awaiting publication"
- "Operational workspace requires sign in"
- "Sign in"
- "Forgot password"
- "User management"

Avoid:

- Marketing phrases like "transforming the future".
- Long paragraphs in dashboards.
- Alarmist wording.
- Internal data jargon on the public page.

## Implementation Guardrails

- Keep route responsibilities clear: public, executive, operational.
- Keep data fetching in API/data-source modules, not presentation components.
- Use semantic CSS variables for color, spacing, radius, and shadows.
- Do not add a UI framework unless the project explicitly chooses one.
- Preserve current Recharts usage for dashboard charts.
- Keep layout stable while data loads.
- Use responsive constraints for boards, KPI grids, chart heights, and maps.
- Public page must never expose operational variables.
- Public landing spacing is defined in `app/globals.css` (`.public-*`) and
  should stay aligned with this guide; update both files when changing public
  page rhythm.

## Design QA Checklist

Before considering a UI pass done:

- Public, executive, and operational pages feel distinct but related.
- Official logos are visible and correctly proportioned.
- The first screen is understandable in under 10 seconds.
- Copy is short and scannable.
- No card is decorative only.
- No nested card layouts.
- Data state is visible for live, pending, preview, and error content.
- Charts have labels, legends, and table/tooltip support.
- Mobile has no horizontal overflow.
- Keyboard focus is visible.
- Contrast passes for text and key data marks.
- Public landing spacing follows the 8px rhythm at desktop, tablet, and mobile.
- Public tab buttons and primary actions meet the 44px touch target minimum.
- No purple/pink startup gradients.
- No fake operational data.
