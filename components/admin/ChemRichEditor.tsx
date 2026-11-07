'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Sparkles,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Undo2,
  Unlink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatChemText, htmlToPlainText } from '@/lib/admin/chemFormat';
import { uploadsApi, validateImageFile } from '@/lib/admin/api/uploads';
import { sanitizeHtml } from './SafeHtml';
import { cn } from '@/lib/utils';

// Global reference to the last active TipTap editor instance across fields
let activeEditorInstance: Editor | null = null;

export function setActiveEditor(ed: Editor | null) {
  activeEditorInstance = ed;
}

export function getActiveEditor(): Editor | null {
  return activeEditorInstance;
}

export interface ChemRichEditorProps {
  value: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
  maxLength?: number;
  id?: string;
  className?: string;
}

function ToolbarButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={label}
            aria-pressed={active ?? false}
            disabled={disabled ?? false}
            onClick={onClick}
            className={cn(
              'h-7 w-7 p-0 text-muted-foreground hover:text-foreground',
              active && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-semibold'
            )}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
          {shortcut ? ` (${shortcut})` : ''}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ImageUploadModal({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string, alt: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSelectFile = (f: File | null | undefined) => {
    if (!f) return;
    const error = validateImageFile(f);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!altText) setAltText(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleInsert = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      onInsert(res.url, altText.trim());
      onOpenChange(false);
      setFile(null);
      setPreview('');
      setAltText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Insert Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                document.getElementById('tiptap-image-upload')?.click();
              }
            }}
            onClick={() => document.getElementById('tiptap-image-upload')?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleSelectFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              'flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors',
              isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
            )}
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-40 rounded object-contain"
              />
            ) : (
              <div className="space-y-1 text-sm text-muted-foreground">
                <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="font-medium text-foreground">
                  Drag & drop an image, or click to browse
                </p>
                <p className="text-xs">Supports JPG, PNG, WebP or GIF (max 5 MB)</p>
              </div>
            )}
          </div>
          <input
            id="tiptap-image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleSelectFile(e.target.files?.[0])}
          />
          <div className="space-y-1.5">
            <Label htmlFor="tiptap-image-alt" className="text-xs font-semibold">
              Alternative description (Alt text)
            </Label>
            <Input
              id="tiptap-image-alt"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g. Molecular orbital diagram of O2"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!file || isUploading}
            onClick={handleInsert}
          >
            {isUploading ? 'Uploading...' : 'Insert into Editor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FormulaHelperBar({ editor }: { editor: Editor | null }) {
  const [shorthand, setShorthand] = useState('');
  const previewHtml = shorthand ? formatChemText(shorthand) : '';

  const insertFormula = () => {
    if (!editor || !previewHtml) return;
    editor.chain().focus().insertContent(previewHtml).run();
    setShorthand('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
      <span className="font-semibold text-muted-foreground">Formula Shorthand:</span>
      <Input
        value={shorthand}
        onChange={(e) => setShorthand(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            insertFormula();
          }
        }}
        placeholder="Type e.g. 2H2 + O2 -> 2H2O or Fe3+ or CuSO4.5H2O"
        className="h-7 text-xs font-mono min-w-[240px] flex-1 bg-background"
      />
      {previewHtml && (
        <div
          className="rounded bg-background border px-2 py-1 font-mono text-xs text-foreground shadow-xs"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
        />
      )}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!previewHtml || !editor}
        onClick={insertFormula}
        className="h-7 px-2.5 text-xs font-medium"
      >
        <Sparkles className="h-3 w-3 mr-1 text-primary" /> Insert
      </Button>
    </div>
  );
}

export function ChemRichEditor({
  value,
  onChange,
  placeholder = 'Enter formatted chemistry text...',
  minHeight = 120,
  compact = false,
  maxLength = 5000,
  id,
  className,
}: ChemRichEditorProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const isUpdatingFromProp = useRef(false);

  const editor = useEditor({
    immediatelyRender: false, // Critical for Next.js SSR hydration
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Subscript,
      Superscript,
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: sanitizeHtml(value || ''),
    onFocus: ({ editor: ed }) => {
      setActiveEditor(ed);
    },
    onUpdate: ({ editor: ed }) => {
      if (isUpdatingFromProp.current) return;
      const html = ed.isEmpty ? '' : ed.getHTML();
      const plain = htmlToPlainText(html);

      if (plain.length > maxLength) {
        toast.error(`Exceeded maximum limit of ${maxLength} characters.`);
        return;
      }
      onChange(sanitizeHtml(html), plain);
    },
  });

  // Sync external value updates
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml && (value || !editor.isEmpty)) {
      isUpdatingFromProp.current = true;
      editor.commands.setContent(sanitizeHtml(value || ''));
      isUpdatingFromProp.current = false;
    }
  }, [value, editor]);

  const handleAutoFormatChemistry = useCallback(() => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) return;
    const formattedHtml = formatChemText(text);
    editor.commands.setContent(sanitizeHtml(formattedHtml));
    toast.success('Auto-formatted chemical formulas and arrows');
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-card p-3 animate-pulse text-xs text-muted-foreground',
          className
        )}
        style={{ minHeight }}
      >
        Loading rich editor...
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card shadow-xs focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 transition-all overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Editor Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/70 bg-muted/30 p-1.5">
        {!compact && (
          <>
            <ToolbarButton
              label="Heading 2"
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Heading 3"
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <div className="h-4 w-px bg-border mx-0.5" />
          </>
        )}

        <ToolbarButton
          label="Bold"
          shortcut="Ctrl+B"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          shortcut="Ctrl+I"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          shortcut="Ctrl+U"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="font-semibold underline text-xs">U</span>
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* Chemistry Subscript & Superscript */}
        <ToolbarButton
          label="Subscript (Chemical formula)"
          active={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubIcon className="h-3.5 w-3.5 text-primary" />
        </ToolbarButton>
        <ToolbarButton
          label="Superscript (Ionic charge)"
          active={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SupIcon className="h-3.5 w-3.5 text-primary" />
        </ToolbarButton>

        <div className="h-4 w-px bg-border mx-0.5" />

        <ToolbarButton
          label="Align Left"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align Center"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align Right"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="h-4 w-px bg-border mx-0.5" />

        <ToolbarButton
          label="Bullet List"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered List"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="h-4 w-px bg-border mx-0.5" />

        <ToolbarButton
          label="Insert Image"
          onClick={() => setImageModalOpen(true)}
        >
          <ImagePlus className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          label="Auto-format Chemistry (subscripts & arrows)"
          onClick={handleAutoFormatChemistry}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        </ToolbarButton>

        <ToolbarButton
          label="Clear Formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            label="Undo"
            shortcut="Ctrl+Z"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            shortcut="Ctrl+Y"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      </div>

      {/* Tiptap content view */}
      <div
        className="p-3.5 flex-1 cursor-text bg-background"
        style={{ minHeight }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent
          id={id}
          editor={editor}
          className="prose prose-sm max-w-none focus:outline-none dark:prose-invert min-h-[80px]"
        />
      </div>

      {/* Embedded Formula Helper */}
      {!compact && (
        <div className="border-t border-border/60 p-2 bg-muted/20">
          <FormulaHelperBar editor={editor} />
        </div>
      )}

      {/* Image Upload Dialog */}
      <ImageUploadModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        onInsert={(url, alt) => {
          editor.chain().focus().setImage({ src: url, alt }).run();
        }}
      />
    </div>
  );
}
