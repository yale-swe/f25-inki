This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tech Stack

### Frontend
- **TypeScript** with **Next.js** (React framework) and **TailwindCSS**
  - Next.js for server-side rendering, SEO-friendly so that the documents can be sharable amongst friends and peers
  - React to manage document viewing and annotation components
  - TailwindCSS is fast and easy to use for UI

### Document Processing
- **PDF.js** for client-side PDF rendering

### Backend & Database
- **Supabase** (PostgreSQL with real-time capabilities)
  - PostgreSQL database stores users, friend connections, documents, and annotations
  - Database triggers and WebSocket connections for real-time sync
  - Integrated file storage for PDF uploads and management
  - Real-time channels for live collaborative annotation viewing

### Authentication
- **Supabase Auth** with Google OAuth integration
  - Secure authentication for document access, sharing, and friend connections


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
