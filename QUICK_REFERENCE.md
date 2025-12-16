# Quick Reference Guide - UX Components

## Toast Notifications

### Basic Usage
```typescript
const toast = useToast();

// Success notification
toast.success("File uploaded successfully");

// Error notification
toast.error("Failed to upload file");

// Info notification
toast.info("Refreshing files...");

// Warning notification
toast.warning("This action cannot be undone");
```

### Features
- Auto-dismisses after 3 seconds
- Manual dismiss button
- Multiple toasts stack
- Color-coded by type

---

## Modal Dialog

### Basic Usage
```typescript
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  title="Delete File?"
  description="This action cannot be undone."
  onClose={() => setIsOpen(false)}
  onConfirm={() => handleDelete()}
  confirmText="Delete"
  confirmVariant="danger"
/>
```

### Props
- `isOpen: boolean` - Controls visibility
- `title: string` - Modal title
- `description?: string` - Optional description
- `children?: ReactNode` - Optional body content
- `onClose: () => void` - Called on close/cancel
- `onConfirm?: () => void` - Called on confirm
- `confirmText?: string` - Button text (default: "Confirm")
- `confirmVariant?: "danger" | "primary"` - Button style
- `isDangerous?: boolean` - Danger styling indicator

---

## File Upload Zone

### Basic Usage
```typescript
<FileUploadZone
  onUpload={async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    await fetch("/api/upload", { method: "POST", body: formData });
  }}
  disabled={isUploading}
/>
```

### Features
- Drag and drop support
- Progress bar
- File type validation
- Automatic progress simulation

### Supported Files
- `.pdf` - PDF documents
- `.docx` - Word documents
- `.txt` - Text files

---

## File Icon

### Basic Usage
```typescript
<FileIcon filetype="pdf" />
<FileIcon filetype="docx" className="w-6 h-6" />
```

### Supported Types
- `pdf` → Red circle icon
- `docx` → Blue document icon
- `txt` → Gray text icon

### Props
- `filetype: string` - File type (pdf, docx, txt, etc.)
- `className?: string` - TailwindCSS classes (default: w-4 h-4)

---

## File List Item

### Basic Usage
```typescript
<FileListItem
  file={file}
  onDelete={(id) => handleDelete(id)}
  onShowChunks={(id) => fetchChunks(id)}
  onShowQuestions={(id) => fetchQuestions(id)}
  showingChunks={showChunksFor === file.id}
  showingQuestions={expandedFile === file.id}
  loadingChunks={loadingChunks.has(file.id)}
  loadingQuestions={loadingQuestions.has(file.id)}
/>
```

### Displays
- File icon and name
- File type, size, upload date
- Docling conversion status
- Action buttons (show chunks, show questions, delete)

---

## Conversation History

### Basic Usage
```typescript
<ConversationHistory
  conversations={conversations}
  activeId={conversationId}
  onSelect={(id) => setConversationId(id)}
  onRename={(id, title) => renameConversation(id, title)}
/>
```

### Features
- Lists all conversations
- Shows timestamps (relative format)
- Highlights active conversation
- Inline rename with Enter/Escape
- Scrollable for many conversations

### Props
- `conversations: ConversationItem[]` - List to display
- `activeId: number | null` - Currently selected ID
- `onSelect: (id: number) => void` - Selection handler
- `onRename: (id: number, title: string) => void` - Rename handler
- `onDelete?: (id: number) => void` - Optional delete handler

---

## Context Chunks

### Basic Usage
```typescript
<ContextChunks contexts={retrievedContexts} />
```

### Features
- Expandable/collapsible chunks
- Citation formatting: "Doc X · p.Y · Section"
- Smooth expand/collapse animation
- Scrollable content for long chunks

### Data Structure
```typescript
type ContextItem = {
  chunk: string;
  citation: {
    doc_id: string;
    page?: number | null;
    section?: string | null;
  };
};
```

---

## Keyboard Shortcuts

| Shortcut       | Action                                  |
| -------------- | --------------------------------------- |
| `Ctrl + Enter` | Submit query/send message               |
| `Enter`        | (in rename) Save conversation name      |
| `Escape`       | (in rename) Cancel rename / Close modal |
| `Tab`          | Navigate between elements               |
| `Shift + Tab`  | Navigate backwards                      |

---

## Color Scheme Reference

### By Use Case
| Use Case         | Color  | TailwindCSS                   |
| ---------------- | ------ | ----------------------------- |
| Success/Positive | Green  | `emerald-400` / `emerald-300` |
| Secondary        | Blue   | `sky-300` / `sky-400`         |
| Accent           | Purple | `purple-300` / `purple-400`   |
| Danger/Delete    | Red    | `rose-300` / `rose-400`       |
| Warning          | Yellow | `yellow-300` / `yellow-400`   |
| Neutral          | Gray   | `slate-400` / `slate-500`     |
| Background       | Dark   | `slate-900` / `black`         |

### Toast Colors
- Success: `bg-emerald-500/20 border-emerald-500/30 text-emerald-300`
- Error: `bg-rose-500/20 border-rose-500/30 text-rose-300`
- Info: `bg-sky-500/20 border-sky-500/30 text-sky-300`
- Warning: `bg-yellow-500/20 border-yellow-500/30 text-yellow-300`

---

## Common Patterns

### Show Toast on API Success
```typescript
try {
  const res = await fetch("/api/endpoint");
  if (res.ok) {
    toast.success("Operation completed");
  }
} catch (error) {
  toast.error("Operation failed");
}
```

### Confirm Before Delete
```typescript
const [deleteId, setDeleteId] = useState<number | null>(null);

<Modal
  isOpen={deleteId !== null}
  onConfirm={() => {
    if (deleteId) handleDelete(deleteId);
    setDeleteId(null);
  }}
  onClose={() => setDeleteId(null)}
/>

<button onClick={() => setDeleteId(file.id)}>Delete</button>
```

### Loading State in Button
```typescript
<button disabled={loading} className="disabled:opacity-60">
  {loading ? "Loading..." : "Submit"}
</button>
```

---

## Responsive Breakpoints

- **Mobile** (< 640px): Single column
- **Tablet** (640px - 1024px): Single to double column
- **Desktop** (≥ 1024px): Full multi-pane layout

Use `lg:` prefix for desktop-only styles.

---

## Accessibility Checklist

- [ ] All buttons have `aria-label` attributes
- [ ] Interactive elements are keyboard accessible
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus states are visible
- [ ] Modals have `role="dialog"`
- [ ] Live regions use `aria-live="polite"`
- [ ] Form fields have associated labels
- [ ] Error messages are announced to screen readers

---

## Troubleshooting

### Toast Not Appearing
- Ensure `<ToastContainer>` is rendered in the root component
- Check that `toast.success()`, `toast.error()`, etc. are called

### Modal Not Closing
- Verify `onClose` is updating the state properly
- Check that click-outside handler is not being prevented

### Upload Not Working
- Verify file type is `.pdf`, `.docx`, or `.txt`
- Check API endpoint is returning status 200
- Check browser console for errors

### Styling Not Applied
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`
- Restart dev server: `npm run dev`
