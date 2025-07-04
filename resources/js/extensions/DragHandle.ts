import { NodeSelection, Plugin } from "@tiptap/pm/state";
import React from 'react';
import { EditorView } from "@tiptap/pm/view";
import { Editor, Extension, ReactRenderer } from "@tiptap/react";
import { GripVertical } from "lucide-react";

export interface DragHandleOptions {
  editor: Editor;

  dragHandleSpeed: number;
  dragHandlePosition:
    | "follow"
    | "center"
    | "top"
    | "bottom"
    | ((nodeRect: DOMRect, handleRect: DOMRect) => number);

  createDragHandleHTMLElement: (editor: Editor) => HTMLElement;
}

const DragHandleComponent: React.FC = () => {
  return React.createElement(GripVertical, { size: 20 });
};

function createDragHandle(editor: Editor) {
  const handle = new ReactRenderer(DragHandleComponent, {
    editor,
    className:
      "fixed top-0 left-0 will-change-transform cursor-grab text-muted-foreground p-1 rounded opacity-0 hover:bg-accent z-50",
    attrs: {
      tabindex: "-1",
      draggable: "",
      "data-drag-handle": "",
    },
    as: "button",
  });

  const htmlElement = handle.element as HTMLElement;

  htmlElement.draggable = true;

  return htmlElement;
}

function getElementAndNodePos(
  view: EditorView,
  coords: { left: number; top: number } = { left: 0, top: 0 },
): {
  element: Element;
  pos: number;
} | null {
  const bounds = view.dom.getBoundingClientRect();

  const nodePos = view.posAtCoords({
    top: Math.min(bounds.bottom, Math.max(bounds.top + 1, coords.top)),
    left: Math.min(bounds.right, Math.max(bounds.left + 1, coords.left)),
  })?.inside;

  if (nodePos == null || nodePos < 0) {
    return null;
  }

  const node = view.nodeDOM(nodePos);

  if (!node || !(node instanceof Element)) {
    return null;
  }

  const blockElement = node.closest('.ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6, .ProseMirror ul, .ProseMirror ol');
  if (!blockElement) {
    return null;
  }

  return {
    element: blockElement,
    pos: nodePos,
  };
}

function DragHandlePlugin(options: DragHandleOptions) {
  let handle: HTMLElement | null = null;

  let targetLeft: number;
  let prevTop: number;
  let targetTop: number;
  let prevTime: number;

  requestAnimationFrame(function animation(time) {
    const delta = time - prevTime;

    if (handle) {
      const distanceTop = targetTop - prevTop;
      const nextTop =
        prevTop + distanceTop / (Math.max(options.dragHandleSpeed, 1) * delta);

      handle.style.transform = `translate3d(${targetLeft - 40}px, ${nextTop}px, 0)`;
      prevTop = nextTop;
    }

    prevTime = time;

    requestAnimationFrame(animation);
  });

  const createDragStartHandler = (view: EditorView) => (event: DragEvent) => {
    view.focus();

    if (!event.dataTransfer) {
      return;
    }

    const data = getElementAndNodePos(view, {
      left: event.clientX,
      top: event.clientY,
    });

    if (!data) {
      return;
    }

    view.dispatch(
      view.state.tr.setSelection(
        NodeSelection.create(view.state.doc, data.pos),
      ),
    );

    const slice = view.state.selection.content();
    
    // Use the built-in clipboard serializer
    const text = slice.content.textBetween(0, slice.content.size, '\n');
    const html = document.createElement('div');
    html.appendChild(view.dom.cloneNode(true));

    event.dataTransfer.clearData();
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData("text/html", html.innerHTML);
    event.dataTransfer.setData("text/plain", text);
    event.dataTransfer.setDragImage(data.element, 0, 0);

    view.dragging = { slice, move: event.ctrlKey };
};

  const createMouseMoveHandler = (view: EditorView) => (event: MouseEvent) => {
    if (!view.editable || !handle) {
      return;
    }

    const data = getElementAndNodePos(view, {
      left: event.clientX,
      top: event.clientY,
    });

    if (!data) {
      return;
    }

    const rect = data.element.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();

    // Drag handle follows cursor
    if (options.dragHandlePosition === "follow") {
      targetTop = Math.min(
        rect.bottom - handleRect.height,
        Math.max(rect.top, event.clientY - handleRect.height / 2),
      );
    }

    // Drag handle centers on node
    else if (options.dragHandlePosition === "center") {
      targetTop = (rect.top + rect.bottom) / 2 - handleRect.height / 2;
    }

    // Drag handle anchors to top of node
    else if (options.dragHandlePosition === "top") {
      targetTop = rect.top;
    }

    // Drag handle anchors to bottom of node
    else if (options.dragHandlePosition === "bottom") {
      targetTop = rect.bottom - handleRect.height;
    }

    // Custom drag handle position
    else {
      targetTop = options.dragHandlePosition(rect, handleRect);
    }

    targetLeft = view.dom.getBoundingClientRect().left;

    showDragHandle();
  };

  const createClickHandler = (view: EditorView) => (event: MouseEvent) => {
    view.focus();

    view.dom.classList.remove("dragging");

    const data = getElementAndNodePos(view, {
      left: event.clientX,
      top: event.clientY,
    });

    if (!data) {
      return;
    }

    view.dispatch(
      view.state.tr.setSelection(
        NodeSelection.create(view.state.doc, data.pos),
      ),
    );
  };

  const hideDragHandle = () => handle?.classList.add("opacity-0");
  const showDragHandle = () => handle?.classList.remove("opacity-0");

  return new Plugin({
    view: (view) => {
      const parent = view.dom.parentElement;

      handle = options.createDragHandleHTMLElement(options.editor);

      const dragStartHandler = createDragStartHandler(view);
      const clickHandler = createClickHandler(view);
      const mouseMoveHandler = createMouseMoveHandler(view);

      handle.addEventListener("dragstart", dragStartHandler);
      handle.addEventListener("click", clickHandler);
      parent?.addEventListener("mousemove", mouseMoveHandler);

      parent?.addEventListener("mouseleave", hideDragHandle);
      document.addEventListener("scroll", hideDragHandle);

      const { left = 0, top = 0 } =
        getElementAndNodePos(view)?.element.getBoundingClientRect() ?? {};

      targetLeft = left;
      // eslint-disable-next-line no-multi-assign
      prevTop = targetTop = top;

      parent?.appendChild(handle);

      return {
        destroy: () => {
          handle?.removeEventListener("dragstart", dragStartHandler);
          handle?.removeEventListener("click", clickHandler);
          parent?.removeEventListener("mousemove", mouseMoveHandler);

          parent?.removeEventListener("mouseleave", hideDragHandle);
          document.removeEventListener("scroll", hideDragHandle);

          handle?.remove?.();
          handle = null;
        },
      };
    },
    props: {
      handleDOMEvents: {
        keydown: () => hideDragHandle(),
        dragstart: (view) => view.dom.classList.add("dragging"),
        drop: (view) => view.dom.classList.remove("dragging"),
        dragend: (view) => view.dom.classList.remove("dragging"),
      },
    },
  });
}

const DragHandles = Extension.create<Omit<DragHandleOptions, "editor">>({
  name: "draghandles",

  addOptions() {
    return {
      dragHandleSpeed: 3,
      dragHandlePosition: "follow",

      createDragHandleHTMLElement(editor: Editor) {
        const handle = createDragHandle(editor);

        handle.draggable = true;

        return handle;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      DragHandlePlugin({
        editor: this.editor as Editor,
        ...this.options,
      }),
    ];
  },
});

export default DragHandles;