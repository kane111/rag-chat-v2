/**
 * Component Library Index
 * 
 * Exported components for the RAG Chat application implementing UX Design Requirements
 */

// Toast notifications for success/error/info feedback
export { ToastContainer, useToast, type ToastType, type ToastMessage } from "./Toast";

// Modal dialogs for confirmations (e.g., delete actions)
export { Modal } from "./Modal";

// File upload component with drag-and-drop and progress
export { FileUploadZone } from "./FileUploadZone";

// File type icons for visual indicators
export { FileIcon } from "./FileIcon";

// Individual file list item with metadata and actions
export { FileListItem, type FileMeta } from "./FileListItem";

// Unified chunks viewer for displaying file chunks and context chunks
export { ChunksViewer, type ContextItem } from "./ChunksViewer";

// Markdown viewer removed; handled in sidebar Preview tab

// Theme provider and toggle for light/dark mode support
export { ThemeProvider, useTheme } from "./ThemeProvider";
export { ThemeToggle } from "./ThemeToggle";
// Chat UI Components - reduced complexity refactoring
export { ChatHeader } from "./ChatHeader";
export { ChatMessages } from "./ChatMessages";
export { ChatInput } from "./ChatInput";

// Sidebar Components
export { SidebarContent } from "./SidebarContent";
export { FileChunksViewer } from "./FileChunksViewer";
