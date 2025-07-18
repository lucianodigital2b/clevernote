import { LucideIcon } from 'lucide-react';
import { Mindmap } from './mindmap';

export * from './mindmap';


export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}


export type Note = {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    icon: string;
    status: string;
    content: string;
    summary: string;
    transcription: string;
    folder_id?: number | null;
    user_id: number;
    flashcard_sets: FlashcardSet[];
    quizzes: Quiz[];
    mindmaps: Mindmap[];
    media?: MediaFile[];
};

export type MediaFile = {
    id: number;
    model_type: string;
    model_id: number;
    uuid: string;
    collection_name: string;
    name: string;
    file_name: string;
    mime_type: string;
    disk: string;
    conversions_disk: string;
    size: number;
    manipulations: any[];
    custom_properties: any;
    generated_conversions: any;
    responsive_images: any[];
    order_column: number;
    created_at: string;
    updated_at: string;
    original_url: string;
    preview_url: string;
};


export type Quiz = {
    id: number;
    title: string;
    description?: string;
    questions: QuizQuestion[];
    created_at: string;
    note?: {
        id: number;
        title: string;
    };
}

export type QuizOption = {
    id: string;
    text: string;
    is_correct: boolean;

}

export type QuizQuestion = {
    id: string;
    question: string;
    type: string;
    explanation?: string;
    options: QuizOption[];
    correctOptionId: string;
}

// Add Flashcard type
export type Flashcard = {
    id: number;
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard' | null;
    folder?: Folder | null;
    created_at: string;
    updated_at: string;
};

export type FlashcardSet = {
    id: number;
    name: string;
    description: string | null;
    flashcards_count: number;
    created_at: string;
    updated_at: string;
    flashcards: Flashcard[] | [];

};


export type Folder = {
    id: number;
    name: string;
    date: string;
    icon: string;
};

export type FolderWithNoteCount = {
    id: number;
    name: string;
    notes_count: number;
    children?: FolderWithNoteCount[];
};

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    tooltip?: string;

}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
