# YDS India Field Team Tracker

## Overview
A mobile-first Progressive Web App (PWA) for YDS India to manage field team operations including duty sessions, client visits, GPS tracking, and travel expense claims with manager approval workflows.

## Project State
**Current Status:** Complete MVP - All core features implemented

## Key Features
1. **Duty Sessions** - Start/End Day with GPS auto-ping every 60 seconds
2. **Visits Tracking** - Sales Meetings & Site Visits with geofence-validated check-in/out
3. **Proof Collection** - Required photo + note before checkout
4. **GPS-based Expenses** - Auto-calculated travel claims with accuracy rules
5. **Manager Approvals** - Review and approve/reject expense claims

## User Roles
- **ADMIN** - Full access, system configuration
- **MANAGER** - Team oversight, expense approvals, visit assignments
- **SALES** - Sales meetings, client visits
- **PROJECTS** - Site visits, project inspections

## Demo Accounts
All accounts use password: `Password123!`
- admin@yds.in (Admin)
- manager@yds.in (Manager)
- sales1@yds.in (Sales Rep)
- sales2@yds.in (Sales Rep)
- proj1@yds.in (Projects Rep)

## Tech Stack
- **Frontend:** React + TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** JWT tokens with 7-day expiry
- **Styling:** Material Design 3 principles, Roboto font

## Architecture

### Database Schema (11 tables)
- users, devices, clients, projects
- duty_sessions, location_points
- visits, visit_events
- expense_policies, expense_claims, expense_approvals
- audit_logs

### API Endpoints
- `/api/auth/*` - Login/logout
- `/api/sessions/*` - Duty session management
- `/api/visits/*` - Visit CRUD, check-in/out, photos, notes
- `/api/expenses/*` - Expense claims, manager approvals
- `/api/dashboard/manager` - Manager dashboard stats
- `/api/users`, `/api/clients`, `/api/projects` - Resource management

### Geolocation Rules
- **Geofence radius:** 150 meters (configurable)
- **GPS accuracy threshold:** 80 meters max for valid check-in
- **Ping interval:** 60 seconds while on duty
- **Expense auto-flagging:** NEEDS_APPROVAL when <10 valid GPS segments or >10 min gaps

### Expense Calculation
- Rate: ₹10/km (configurable via policy)
- Business travel = first check-in to last check-out
- Only counts GPS points with accuracy ≤80m and time gaps ≤10 min

## File Structure
```
client/src/
├── App.tsx           # Routes, providers
├── lib/
│   ├── auth.tsx      # Auth context, JWT storage
│   ├── geolocation.ts # GPS utilities
│   ├── theme.tsx     # Dark/light mode
│   └── queryClient.ts
├── pages/
│   ├── login.tsx
│   ├── dashboard.tsx
│   ├── visits.tsx
│   ├── visit-detail.tsx
│   ├── visit-create.tsx
│   ├── expense.tsx
│   └── manager.tsx
└── components/
    ├── layout/       # AppLayout, BottomNav, TopBar, GPSBanner
    ├── dashboard/    # DutyStatusCard, StatsGrid, QuickActions
    ├── visits/       # VisitCard, VisitList, CheckInSection, ProofSection
    ├── expense/      # ExpenseSummaryCard
    └── manager/      # ManagerStats, PendingApprovalCard, AssignVisitForm

server/
├── auth.ts          # JWT middleware, password hashing
├── routes.ts        # All API endpoints
├── storage.ts       # Database operations
├── utils.ts         # Haversine, expense calculation
└── seed.ts          # Demo data seeder

shared/
└── schema.ts        # Drizzle schema, types, relations
```

## Running the Project
```bash
npm run dev          # Start development server
npm run db:push      # Push schema changes
npx tsx server/seed.ts  # Seed demo data
```

## User Preferences
- Mobile-first responsive design
- Material Design 3 aesthetic
- PWA with offline capability intent
- Roboto font family
- Blue primary color (#1e40af)
