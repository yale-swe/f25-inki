// Temporary interface - will be replaced after merge
export interface Reading {
  id: string;
  title: string;
  author?: string;
  url?: string;
  description?: string;
  thumbnail?: string;
  isShared: boolean;
  sharedBy?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  readingProgress?: number;
}

export const dummyReadings: Reading[] = [
  {
    id: "1",
    title: "The Future of Web Development",
    author: "Jane Smith",
    url: "https://example.com/web-dev-future",
    description:
      "An in-depth look at emerging trends in web development, including AI integration and new frameworks.",
    thumbnail:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop",
    isShared: false,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    tags: ["web development", "AI", "trends"],
    readingProgress: 75,
  },
  {
    id: "2",
    title: "Understanding React Server Components",
    author: "Mike Johnson",
    url: "https://example.com/react-server-components",
    description:
      "A comprehensive guide to React Server Components and how they change the way we build React applications.",
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
    isShared: true,
    sharedBy: "alex_chen",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
    tags: ["React", "server components", "tutorial"],
    readingProgress: 30,
  },
  {
    id: "3",
    title: "TypeScript Best Practices",
    author: "Sarah Wilson",
    url: "https://example.com/typescript-best-practices",
    description:
      "Essential TypeScript patterns and practices for building maintainable applications.",
    thumbnail:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=300&h=200&fit=crop",
    isShared: false,
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
    tags: ["TypeScript", "best practices", "patterns"],
    readingProgress: 100,
  },
  {
    id: "4",
    title: "CSS Grid vs Flexbox: When to Use What",
    author: "David Brown",
    url: "https://example.com/css-grid-flexbox",
    description:
      "A detailed comparison of CSS Grid and Flexbox with practical examples and use cases.",
    thumbnail:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
    isShared: true,
    sharedBy: "emma_davis",
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
    tags: ["CSS", "Grid", "Flexbox", "layout"],
    readingProgress: 0,
  },
  {
    id: "5",
    title: "Building Accessible Web Applications",
    author: "Lisa Garcia",
    url: "https://example.com/accessible-web-apps",
    description:
      "Comprehensive guide to web accessibility, including WCAG guidelines and implementation strategies.",
    thumbnail:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=200&fit=crop",
    isShared: false,
    createdAt: "2024-01-11T11:30:00Z",
    updatedAt: "2024-01-11T11:30:00Z",
    tags: ["accessibility", "WCAG", "inclusive design"],
    readingProgress: 50,
  },
  {
    id: "6",
    title: "Next.js 15 New Features",
    author: "Tom Anderson",
    url: "https://example.com/nextjs-15-features",
    description:
      "Exploring the latest features in Next.js 15 and how they improve developer experience.",
    thumbnail:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=200&fit=crop",
    isShared: true,
    sharedBy: "maria_rodriguez",
    createdAt: "2024-01-10T13:20:00Z",
    updatedAt: "2024-01-10T13:20:00Z",
    tags: ["Next.js", "React", "framework"],
    readingProgress: 20,
  },
];
