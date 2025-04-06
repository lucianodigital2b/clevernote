// extensions/SectionBlock.ts
import { Node, mergeAttributes } from '@tiptap/core';

export const SectionBlock = Node.create({
  name: 'sectionBlock',

  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {};
  },

  parseHTML() {
    return [
      {
        tag: 'div.section-block',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'section-block border rounded p-4 mb-4',
      }),
      0,
    ];
  },
});
