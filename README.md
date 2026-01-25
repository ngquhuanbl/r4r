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

5. **Auto-Connect System** (Optional)
   - When enabled, businesses are automatically connected to other businesses over time
   - New businesses receive up to 3 connections per day
   - Respects user rejections (won't connect to businesses the user has rejected)
   - Uses Supabase Realtime for instant UI updates when new connections are made

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for authentication and database)

### Environment Setup

Create a `.env.local` file in the root directory with the following:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_ID=user_id_of_admin
NEXT_PUBLIC_ENABLE_AUTO_CONNECT=true  # Optional: Enable automatic business connections
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL script in `schema.sql` in the Supabase SQL editor to set up the database schema
3. Enable Realtime for the `review_invitations` table (required for auto-connect feature):
   - Go to Supabase Dashboard → Database → Replication
   - Enable replication for the `review_invitations` table
   - Or run: `ALTER PUBLICATION supabase_realtime ADD TABLE review_invitations;`

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
- **State Management**: React Hooks and Server Components
- **API**: Next.js Server Actions

## Project Structure

```
/app                   # Next.js App Router files
  /(protected)         # Protected routes (requires authentication)
    /home              # Dashboard page
    /businesses        # Business management
    /invitations       # Invitation management
  /login               # Authentication pages
  /auth                # Auth callback handling
/components            # React components
  /common              # Common layout components
  /dashboard           # Dashboard-specific components
  /ui                  # Shadcn UI components
/lib                   # Utility functions and libraries
  /supabase            # Supabase client setup
```

## Credits

This project is a modernized version of a previous application, reimagined with current best practices and technologies.

Based on the [Next.js with Supabase](https://github.com/vercel/next.js/tree/canary/examples/with-supabase) starter template.
