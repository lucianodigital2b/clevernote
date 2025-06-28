// components/TiptapToolbar.tsx
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2,
  Quote, List, ListOrdered, Link, Code, Undo2, Redo2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BubbleMenu } from '@tiptap/react'
import { useCallback, useState, useEffect } from 'react';

export default function TiptapToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const [shouldShow, setShouldShow] = useState(false);

  // Memoize the isActive function to prevent unnecessary re-renders
  const isActive = useCallback((name: string, attrs = {}) => {
    if (!editor) return '';
    return editor.isActive(name, attrs) ? 'bg-purple-50 dark:bg-purple-900 text-purple-700' : '';
  }, [editor]);

  useEffect(() => {
    setShouldShow(true);
    return () => setShouldShow(false);
  }, []);

  if (!shouldShow) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      shouldShow={({ view }) => {
        return shouldShow && view.state.selection.content().size > 0;
      }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow  p-1 flex gap-1 z-50 w-100"
    >
      <Button size="icon" variant="ghost" className={isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className={isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className={isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className={isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className={isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className={isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className={isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button  size="icon" variant="ghost" className={isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>

        <Quote className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className={isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className={isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => {
        const url = window.prompt('Enter URL');
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }}>
        <Link className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </Button>
    </BubbleMenu>
  );
}
