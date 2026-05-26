This is a [Next.js](https://nextjs.org) project for a telehealth app.

## Tech Stack

- **TanStack Query** – I use this for server-state management because it handles caching, background refetching, and syncing server data with the UI, reducing the need for manual state handling.

- **Native `fetch()` API** – I chose fetch to keep the project lightweight and dependency-free. It also works well with Next.js optimizations like caching and SSR.

- **shadcn/ui** – I use this for reusable UI components because it’s flexible, accessible, and lets me fully control the styling instead of being locked into a design system.

- **Tailwind CSS** – I use Tailwind for fast, consistent styling without writing custom CSS, which speeds up development and keeps the UI consistent.

- **React Hook Form + Zod** – I use this combo for form handling and validation because it’s performant and type-safe, making forms easier to manage and less error-prone.

## Getting Started

First, install the dependencies
```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.