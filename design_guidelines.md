# Design Guidelines: YDS India Field Team Tracking PWA

## Design Approach
**System**: Material Design 3 (Mobile-First Enterprise)
**Rationale**: Utility-focused productivity tool requiring clear data hierarchy, familiar mobile patterns, and robust form components for field workers operating in varied conditions.

## Core Design Principles
1. **Mobile-First Always**: Design for thumb-reach zones, large touch targets (min 48px), one-handed operation
2. **Field-Ready**: High contrast for outdoor visibility, clear status indicators, minimal cognitive load
3. **Data Clarity**: Information hierarchy that guides quick decision-making during active duty
4. **Progressive Disclosure**: Show critical info first, details on demand

## Typography System
- **Primary Font**: Roboto (via Google Fonts CDN)
- **Hierarchy**:
  - Page Headers: text-2xl font-semibold (mobile), text-3xl (desktop)
  - Section Headers: text-xl font-medium
  - Card Titles: text-lg font-medium
  - Body Text: text-base font-normal
  - Metadata/Status: text-sm font-medium
  - Captions: text-xs font-normal

## Layout System
**Spacing Scale**: Tailwind units of 2, 4, 6, 8, 12 (p-4, gap-6, mb-8, etc.)
- **Container**: max-w-7xl mx-auto px-4
- **Card Padding**: p-4 (mobile), p-6 (desktop)
- **Section Spacing**: mb-6 to mb-8
- **Form Field Gaps**: gap-4
- **Safe Zones**: Bottom navigation 64px clearance for thumb reach

## Component Library

### Navigation
**Bottom Tab Bar** (Fixed, mobile):
- Height: h-16
- Icons: 24px with labels below
- Active state: filled icon + primary accent
- Tabs: Dashboard, Visits, Expenses, (Manager tab conditional)

**Top App Bar**:
- Height: h-14
- Title: text-lg font-semibold
- Actions: icon buttons (40px touch target)
- Elevation: subtle shadow-md

### Status Components
**Duty Status Card** (Dashboard hero):
- Large status indicator: "On Duty" / "Off Duty"
- GPS accuracy badge (color-coded: green <30m, yellow 30-80m, red >80m)
- Session timer (hours:minutes)
- Primary action button (Start Day / End Day)
- Background: elevated card with shadow-lg

**GPS Warning Banner**:
- Full-width sticky top banner
- Yellow/orange background
- Icon + message: "Keep app open during travel for accurate expense"
- Dismissible but re-appears when app backgrounds

### Cards & Lists
**Visit Card** (List item):
- Compact horizontal layout
- Left: Visit type icon (meeting/site) in colored circle (w-12 h-12)
- Center: Title, client/project, time, location snippet
- Right: Status badge + chevron
- Padding: p-4, gap-3
- Divider: border-b between items

**Visit Detail Card**:
- Header: Visit type, title, status badge
- Map thumbnail: aspect-video, rounded-lg, mb-4, tap to open Google Maps
- Info grid: 2-column layout (label: value pairs)
- Action buttons: Full-width primary (Check In/Out), secondary (Add Photo/Note)
- Proof section: Photo thumbnails grid + notes list

### Forms
**Input Fields**:
- Height: h-12 (48px min touch target)
- Padding: px-4
- Border: border rounded-lg
- Focus: ring-2 ring-primary
- Label: text-sm font-medium mb-2
- Error state: border-red with text-sm text-red below

**Location Input**:
- Map picker OR address autocomplete
- Current location button (absolute positioned icon)
- Accuracy indicator below field

**Photo Upload**:
- Camera icon button: large square (min 80px)
- Thumbnail preview grid after capture
- Max 4 photos per visit shown inline

### Expense Components
**Expense Summary Card**:
- Split layout: Left (KM claimed), Right (Amount)
- Large numbers: text-3xl font-bold
- Status badge: prominent at top-right
- Exception reason: warning box if NEEDS_APPROVAL
- Timeline: visual track from start to end with icons

**Manager Approval Card**:
- User avatar + name
- Visit count + KM claimed
- Exception flags (red badges)
- Action buttons: Approve (green), Reject (red), Adjust (blue)
- Expandable details section

### Buttons
**Primary Action**: 
- h-12, px-6, rounded-lg, font-medium
- Full-width on mobile, auto-width on desktop
- High contrast background

**Secondary Action**:
- Outlined variant: border-2, background transparent

**Icon Buttons**:
- w-10 h-10 (40px), rounded-full
- Used for add photo, add note, map link

### Status Badges
- Inline-flex items-center, px-3 py-1, rounded-full, text-xs font-semibold
- Color system:
  - OPEN/PLANNED: blue
  - IN_PROGRESS: orange
  - COMPLETED/APPROVED: green
  - NEEDS_APPROVAL: yellow
  - REJECTED/CANCELLED: red

## Page Layouts

### Dashboard
- Sticky top: GPS warning banner (conditional)
- Hero: Duty Status Card (elevated, mb-6)
- Stats grid: 2-column (Visits Today, KM Today)
- Quick actions: 2-column button grid
- Recent visits list: last 3 with "View All" link

### Visits List
- Tab switcher: Today / Upcoming (sticky below app bar)
- Filter chips: horizontal scroll (All, Sales, Site)
- Card list: gap-2
- Floating action button: bottom-right (Create Visit)

### Visit Detail
- Map section: full-width, aspect-video
- Info cards: stacked with gap-4
- Check-in section: geofence status + accuracy indicator
- Proof section: photo grid (2 columns) + notes list
- Action bar: sticky bottom with primary button

### Manager Panel
- Summary cards: 3-column grid (on tablet/desktop, stacked mobile)
  - Users On Duty (count + names)
  - Pending Approvals (count + alert)
  - Exceptions (count + red badge)
- Pending list: approval cards with expand/collapse
- Assign visit: bottom sheet modal

## Animation (Minimal)
- Page transitions: slide (200ms)
- Card expand: smooth height transition
- Button press: scale(0.98)
- No decorative animations
- Loading states: skeleton screens for lists

## Icons
**Library**: Material Icons via CDN
**Common Icons**:
- Navigation: home, list, receipt, people
- Actions: add, edit, check, close, expand_more
- Status: check_circle, warning, error, info
- Location: location_on, my_location, map
- Media: photo_camera, note_add

## Responsive Breakpoints
- Mobile (default): < 768px
- Tablet: md: 768px (2-column grids, side-by-side layouts)
- Desktop: lg: 1024px (3-column grids, expanded cards)