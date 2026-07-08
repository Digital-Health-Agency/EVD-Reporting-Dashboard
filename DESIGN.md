# EVD Dashboard Design Guide

This guide is the visual and interaction source of truth for the Kenya
EVD/BVD dashboard app. Keep the product clean, neat, official, and less wordy.

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
  actions such as Dial 147 and helpdesk.
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
- Header should lead with MoH identity and include DHA/NPHI as partners.
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

  --color-dha-cyan: #1a9bd2;
  --color-navy: #071225;
  --color-alert: #b42318;
  --color-warning: #b7791f;
  --color-success: #1f7a4d;
  --color-info: #0369a1;

  --focus-ring: #1a9bd2;
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
- 8px: icon/text gaps.
- 16px: component padding and compact card gaps.
- 24px: section rhythm inside dashboards.
- 32px: page block separation.
- 48px: public landing section separation.

Container rules:

- Max content width: 1240px for dashboards.
- Public landing can use a slightly wider first viewport, but content still
  aligns to a readable grid.
- Cards use 8px radius unless a local component needs less.
- Avoid nested cards.
- Avoid decorative panels that do not contain actionable or scannable content.

Responsive rules:

- Design mobile first, then expand to 768px, 1024px, and 1440px.
- Mobile must show the most important status before secondary context.
- No horizontal page scroll.
- Charts that need width should use scroll wrappers with stable height.
- Touch targets must be at least 44px.

## Navigation

Primary routes:

- `/` - Public landing.
- `/executive` - Executive situation dashboard.
- `/operational` - Restricted operational placeholder now, real auth later.

Header rules:

- Public page: official MoH/DHA/NPHI header, minimal links, clear report/help
  action.
- Executive page: compact command header with disease tabs, refresh, timestamp,
  and source status.
- Operational page: official restricted-access header with login affordance.

Do not overload navigation. The app has three main surfaces; keep it that way.

## Page Direction

### Public Landing

Purpose: safe public outbreak communication.

Visual feel:

- Light, official, calm.
- DHA cyan header with navy support.
- One clear status block.
- Aggregate numbers only.
- Public guidance in short, scannable blocks.

First viewport should include:

- Official identity.
- Disease/outbreak name.
- Current status and as-of timestamp.
- Aggregate headline figures.
- Primary action: report/get help.
- Secondary action: view executive dashboard or resources.

Use content like:

- Current status
- Cases
- Tests
- Contacts
- POE screening
- What to do
- Hotline
- Resources

Avoid:

- Long disease education articles on the dashboard first screen.
- Line lists or facility-sensitive information.
- Dramatic imagery that increases panic.

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

- Simple locked placeholder.
- Real authentication later.
- No operational data shown before auth exists.

Visual feel:

- eCitizen-like official access page.
- Navy or white official shell.
- Short message: "Operational workspace requires sign in."
- Clear disabled or future sign-in action.

Future authenticated state:

- Sidebar or compact top navigation for response teams.
- Work queues for cases, contacts, lab, POE, community, and action tracker.
- Filters by period, county, subcounty, ward, facility, POE, and disease.
- Data quality flags and source status.

Avoid:

- Mock login that implies real access.
- Showing contact, patient, or facility-sensitive operational records.

## Components

Preferred component set:

- `AppHeader`: shared official chrome.
- `PublicLanding`: aggregate public update page.
- `ExecutiveDashboard`: wrapper around the current dashboard shell.
- `OperationalLocked`: restricted placeholder.
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
- Small illustrative icons for prevention/resource blocks.

Avoid:

- Dark blurred stock imagery behind critical text.
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
- "Last updated"
- "Report an alert"
- "View executive dashboard"
- "Results pending"
- "Source awaiting publication"
- "Operational workspace requires sign in"

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
- No purple/pink startup gradients.
- No fake operational data.
