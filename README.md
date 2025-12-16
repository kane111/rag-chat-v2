This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## UX Design Requirements

### Knowledge Base
- **Sidebar listing**: All files displayed with metadata (filename, size, upload date)
- **Drag-and-drop upload**: Support for file uploads with progress bars and status indicators
- **File type icons**: Visual indicators for different file types (PDF, DOCX, TXT, etc.)
- **Confirmation modals**: Required for delete and update actions to prevent accidental changes

### Chat
- **Two-pane layout**: Left pane for conversation history, right pane for retrieved context and citations
- **Streaming responses**: Real-time response display with typing indicators
- **Expandable/collapsible context**: Retrieved context chunks can be expanded or collapsed for better readability
- **Conversation history**: Accessible via sidebar with timestamps and ability to rename conversations

### Global UX
- **Responsive design**: Fully functional on desktop and mobile devices
- **Accessibility support**: ARIA labels and keyboard navigation for all interactive elements
- **Toast notifications**: Success and error feedback using toast/notification components
- **Consistent styling**: Design system using TailwindCSS or Material UI for uniform appearance across the application

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
