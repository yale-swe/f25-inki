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
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
