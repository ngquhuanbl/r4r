# R4R: Reputation for Reputation

A modern version of a business recommendation and review platform built with Next.js 14, App Router, Supabase, Tailwind CSS, and Shadcn components.

## Overview

R4R allows businesses to connect with each other, send review invitations, and exchange recommendations across different platforms (like social media or review sites).

### Key Features

1. **Business Recommendations System**
   - Businesses can recommend other businesses on various platforms
   - The system tracks the state of these recommendations
   - Users can submit reviews for businesses they've been connected with

2. **Invitation System**
   - Businesses can invite other users/businesses to review them
   - Invitations have statuses (accepted, pending, declined)
   - Reviews can be approved or rejected

3. **Multi-Platform Integration**
   - The app connects to multiple platforms (social media or review sites)
   - Users can associate their platform accounts with their app profile
   - Businesses can list their URLs for different platforms

4. **Relationship Management**
   - The app tracks relationships between users and businesses
   - Relationships have different statuses

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for authentication and database)

### Environment Setup

Create a `.env.local` file in the root directory with the following:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. Create a new Supabase project.
2. Apply migrations under [`supabase/migrations/`](supabase/migrations/) (Supabase CLI `supabase db push`, or run each file in timestamp order in the SQL Editor). See [`supabase/README.md`](supabase/README.md) and [`docs/supabase-and-local-development.md`](docs/supabase-and-local-development.md).

### Scripts

```bash
npm run lint        # ESLint (Next.js core config; not enforced on `next build` yet)
npm run typecheck   # TypeScript, no emit
npm test            # Vitest unit tests
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technology Stack

- **Frontend**: Next.js 14 with App Router, React, Tailwind CSS
- **UI Components**: Shadcn components
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **State Management**: Redux Toolkit (client) with SSR bootstrap in the protected layout; see [`docs/architecture-and-codebase.md`](docs/architecture-and-codebase.md)
- **API**: Next.js Server Actions

## Project Structure

```
/app/(protected)       # Authenticated shell (see docs/architecture-and-codebase.md)
  /(workspace)         # Route group: heavy Redux fetch for dashboard + business only
    /dashboard         # Locations grid (`?show=1` opens create-business)
    /business/[id]     # Single-business workspace
  /account, /billing   # Settings (no workspace data fetch)
/app/login             # Auth entry
/components            # UI by feature area (`business/` = workspace + create/manage dialogs)
/lib                   # Supabase clients, billing, connections, server helpers
/docs                  # Maintainer tech specs (`docs/README.md`)
/supabase/migrations   # Postgres schema (source of truth)
/supabase/scripts      # Optional dev resets only (see supabase/README.md)
```

## Credits

This project is a modernized version of a previous application, reimagined with current best practices and technologies.

Based on the [Next.js with Supabase](https://github.com/vercel/next.js/tree/canary/examples/with-supabase) starter template.
