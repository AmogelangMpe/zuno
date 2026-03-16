# ZunoBio — Personal Link Page Platform

A full-stack link page platform built with Next.js 14, Supabase, and Tailwind CSS.

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router) + TypeScript|
| Styling     | Tailwind CSS                        |
| Database    | Supabase (PostgreSQL)               |
| Auth        | Supabase Auth                       |
| File storage| Supabase Storage                    |
| Hosting     | Vercel                              |

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Go to **Storage** and create three public buckets:
   - `covers`
   - `avatars`
   - `link-images`

### 3. Set up environment variables
```bash
cp .env.example .env.local
```
Then fill in your values from the Supabase dashboard (**Settings > API**):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  ← Landing page
│   ├── layout.tsx                ← Root layout
│   ├── globals.css               ← Global styles
│   ├── auth/
│   │   ├── login/page.tsx        ← Login
│   │   └── signup/page.tsx       ← Sign up + create profile
│   ├── dashboard/
│   │   └── page.tsx              ← User dashboard + analytics
│   ├── edit/
│   │   └── page.tsx              ← In-app page editor
│   └── [username]/
│       └── page.tsx              ← Public profile page
├── components/
│   ├── editor/
│   │   ├── EditorClient.tsx      ← Editor shell + tabs
│   │   ├── ProfileEditor.tsx     ← Name, bio, photos
│   │   ├── SocialsEditor.tsx     ← Social links
│   │   ├── SectionsEditor.tsx    ← Sections + links
│   │   ├── ThemeEditor.tsx       ← Colours + presets
│   │   └── LinkForm.tsx          ← Add new link form
│   └── profile/
│       ├── ProfilePreview.tsx    ← The rendered public page
│       ├── SocialIcon.tsx        ← Platform icons
│       └── AnalyticsTracker.tsx  ← Records page views
├── lib/
│   ├── supabase/
│   │   ├── client.ts             ← Browser Supabase client
│   │   └── server.ts             ← Server Supabase client
│   └── utils.ts                  ← Helpers
├── types/
│   └── index.ts                  ← All TypeScript types
└── middleware.ts                 ← Auth route protection

supabase/
└── schema.sql                    ← Full database schema + RLS policies
```

---

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Change `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://zunobio.com`)
5. Deploy — Vercel handles everything automatically

---

## How It Works for Users

1. **Sign up** at `/auth/signup` — choose a username (becomes their public URL)
2. **Edit their page** at `/edit` — add photos, bio, social links, sections, links, theme
3. **Share** their public URL — `zunobio.com/theirusername`
4. **Track** views and clicks on their **dashboard**

---

## Roadmap Ideas

- [ ] Custom domain support per user
- [ ] Email collection / newsletter integration
- [ ] Link scheduling (show/hide by date)
- [ ] More analytics (country, device, referrer breakdown)
- [ ] Pro plan with premium themes
- [ ] QR code generator for each profile
