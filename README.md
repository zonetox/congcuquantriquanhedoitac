# Partner Relationship Management

A Next.js 14 SaaS application built with TypeScript, Tailwind CSS, and Supabase.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, set up your environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── app/              # App Router directory
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # React components
├── lib/              # Utility functions and configurations
│   ├── utils.ts      # Utility functions (cn helper)
│   └── supabase/     # Supabase client configuration
└── public/           # Static assets
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a service
- **Lucide React** - Icon library
- **clsx & tailwind-merge** - Utility for conditional classes

