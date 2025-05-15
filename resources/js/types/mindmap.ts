export interface MindmapNode {
    id: string;
    label: string;
    position?: { x: number; y: number };
    data?: Record<string, any>;
}

export interface MindmapEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    data?: Record<string, any>;
}

export interface Mindmap {
    id: number;
    title: string;
    note_id: number;
    user_id: number;
    nodes: MindmapNode[];
    edges: MindmapEdge[];
    created_at: string;
    updated_at: string;
    note?: {
        id: number;
        title: string;
    };
}