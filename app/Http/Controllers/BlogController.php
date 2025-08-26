<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * Display the blog index page
     */
    public function index(Request $request, string $locale): Response
    {
        // Validate locale
        $supportedLocales = ['en', 'es', 'pt', 'fr'];
        if (!in_array($locale, $supportedLocales)) {
            abort(404);
        }

        // For now, return static blog posts data
        // In the future, this will fetch from database
        $posts = [
            [
                'id' => 1,
                'title' => $this->getLocalizedTitle($locale, 'ultimate_guide_cornell_notes'),
                'slug' => 'ultimate-guide-cornell-note-taking-method',
                'excerpt' => $this->getLocalizedExcerpt($locale, 'cornell_notes_excerpt'),
                'featured_image' => '/images/blog/cornell-notes.jpg',
                'published_at' => '2024-01-15',
                'reading_time' => 8,
                'category' => $this->getLocalizedCategory($locale, 'study_techniques'),
                'tags' => ['note-taking', 'study-methods', 'productivity']
            ],
            [
                'id' => 2,
                'title' => $this->getLocalizedTitle($locale, 'science_backed_study_techniques'),
                'slug' => '10-science-backed-study-techniques',
                'excerpt' => $this->getLocalizedExcerpt($locale, 'study_techniques_excerpt'),
                'featured_image' => '/images/blog/study-techniques.jpg',
                'published_at' => '2024-01-12',
                'reading_time' => 12,
                'category' => $this->getLocalizedCategory($locale, 'study_techniques'),
                'tags' => ['science', 'research', 'learning']
            ],
            [
                'id' => 3,
                'title' => $this->getLocalizedTitle($locale, 'digital_vs_handwritten_notes'),
                'slug' => 'digital-vs-handwritten-notes-research',
                'excerpt' => $this->getLocalizedExcerpt($locale, 'digital_notes_excerpt'),
                'featured_image' => '/images/blog/digital-vs-handwritten.jpg',
                'published_at' => '2024-01-10',
                'reading_time' => 6,
                'category' => $this->getLocalizedCategory($locale, 'research'),
                'tags' => ['digital-notes', 'research', 'comparison']
            ]
        ];

        return Inertia::render('Blog/Index', [
            'posts' => $posts,
            'locale' => $locale,
            'meta' => [
                'title' => $this->getLocalizedMeta($locale, 'blog_title'),
                'description' => $this->getLocalizedMeta($locale, 'blog_description')
            ]
        ]);
    }

    /**
     * Display a specific blog post
     */
    public function show(Request $request, string $locale, string $slug): Response
    {
        // Validate locale
        $supportedLocales = ['en', 'es', 'pt', 'fr'];
        if (!in_array($locale, $supportedLocales)) {
            abort(404);
        }

        // For now, return static post data
        // In the future, this will fetch from database based on slug and locale
        $post = $this->getPostBySlug($locale, $slug);
        
        if (!$post) {
            abort(404);
        }

        return Inertia::render('Blog/Show', [
            'post' => $post,
            'locale' => $locale,
            'relatedPosts' => $this->getRelatedPosts($locale, $post['id'])
        ]);
    }

    /**
     * Get localized title
     */
    private function getLocalizedTitle(string $locale, string $key): string
    {
        $titles = [
            'en' => [
                'ultimate_guide_cornell_notes' => 'The Ultimate Guide to Cornell Note-Taking Method',
                'science_backed_study_techniques' => '10 Science-Backed Study Techniques That Actually Work',
                'digital_vs_handwritten_notes' => 'Digital vs. Handwritten Notes: What Research Says'
            ],
            'es' => [
                'ultimate_guide_cornell_notes' => 'La Guía Definitiva del Método Cornell para Tomar Notas',
                'science_backed_study_techniques' => '10 Técnicas de Estudio Respaldadas por la Ciencia',
                'digital_vs_handwritten_notes' => 'Notas Digitales vs. Manuscritas: Lo que Dice la Investigación'
            ],
            'pt' => [
                'ultimate_guide_cornell_notes' => 'O Guia Definitivo do Método Cornell para Anotações',
                'science_backed_study_techniques' => '10 Técnicas de Estudo Comprovadas pela Ciência',
                'digital_vs_handwritten_notes' => 'Notas Digitais vs. Manuscritas: O que a Pesquisa Diz'
            ],
            'fr' => [
                'ultimate_guide_cornell_notes' => 'Le Guide Ultime de la Méthode Cornell pour Prendre des Notes',
                'science_backed_study_techniques' => '10 Techniques d\'Étude Scientifiquement Prouvées',
                'digital_vs_handwritten_notes' => 'Notes Numériques vs. Manuscrites: Ce que Dit la Recherche'
            ]
        ];

        return $titles[$locale][$key] ?? $titles['en'][$key];
    }

    /**
     * Get localized excerpt
     */
    private function getLocalizedExcerpt(string $locale, string $key): string
    {
        $excerpts = [
            'en' => [
                'cornell_notes_excerpt' => 'Learn how to master the Cornell note-taking system to improve your study efficiency and information retention.',
                'study_techniques_excerpt' => 'Discover evidence-based study methods that have been proven to enhance learning and memory retention.',
                'digital_notes_excerpt' => 'Explore the pros and cons of digital versus handwritten notes based on scientific research.'
            ],
            'es' => [
                'cornell_notes_excerpt' => 'Aprende a dominar el sistema Cornell para mejorar tu eficiencia de estudio y retención de información.',
                'study_techniques_excerpt' => 'Descubre métodos de estudio basados en evidencia que mejoran el aprendizaje y la retención.',
                'digital_notes_excerpt' => 'Explora las ventajas y desventajas de las notas digitales versus manuscritas según la investigación.'
            ],
            'pt' => [
                'cornell_notes_excerpt' => 'Aprenda a dominar o sistema Cornell para melhorar sua eficiência de estudo e retenção de informações.',
                'study_techniques_excerpt' => 'Descubra métodos de estudo baseados em evidências que melhoram o aprendizado e a retenção.',
                'digital_notes_excerpt' => 'Explore as vantagens e desvantagens das notas digitais versus manuscritas segundo a pesquisa.'
            ],
            'fr' => [
                'cornell_notes_excerpt' => 'Apprenez à maîtriser le système Cornell pour améliorer votre efficacité d\'étude et la rétention d\'informations.',
                'study_techniques_excerpt' => 'Découvrez des méthodes d\'étude basées sur des preuves qui améliorent l\'apprentissage et la rétention.',
                'digital_notes_excerpt' => 'Explorez les avantages et inconvénients des notes numériques versus manuscrites selon la recherche.'
            ]
        ];

        return $excerpts[$locale][$key] ?? $excerpts['en'][$key];
    }

    /**
     * Get localized category
     */
    private function getLocalizedCategory(string $locale, string $key): string
    {
        $categories = [
            'en' => [
                'study_techniques' => 'Study Techniques',
                'research' => 'Research'
            ],
            'es' => [
                'study_techniques' => 'Técnicas de Estudio',
                'research' => 'Investigación'
            ],
            'pt' => [
                'study_techniques' => 'Técnicas de Estudo',
                'research' => 'Pesquisa'
            ],
            'fr' => [
                'study_techniques' => 'Techniques d\'Étude',
                'research' => 'Recherche'
            ]
        ];

        return $categories[$locale][$key] ?? $categories['en'][$key];
    }

    /**
     * Get localized meta information
     */
    private function getLocalizedMeta(string $locale, string $key): string
    {
        $meta = [
            'en' => [
                'blog_title' => 'CleverNote Blog - Study Tips, Note-Taking Techniques & Learning Strategies',
                'blog_description' => 'Discover effective study techniques, note-taking methods, and learning strategies to boost your academic performance with CleverNote.'
            ],
            'es' => [
                'blog_title' => 'Blog CleverNote - Consejos de Estudio, Técnicas de Notas y Estrategias de Aprendizaje',
                'blog_description' => 'Descubre técnicas de estudio efectivas, métodos para tomar notas y estrategias de aprendizaje para mejorar tu rendimiento académico con CleverNote.'
            ],
            'pt' => [
                'blog_title' => 'Blog CleverNote - Dicas de Estudo, Técnicas de Anotações e Estratégias de Aprendizagem',
                'blog_description' => 'Descubra técnicas de estudo eficazes, métodos de anotações e estratégias de aprendizagem para melhorar seu desempenho acadêmico com CleverNote.'
            ],
            'fr' => [
                'blog_title' => 'Blog CleverNote - Conseils d\'Étude, Techniques de Prise de Notes et Stratégies d\'Apprentissage',
                'blog_description' => 'Découvrez des techniques d\'étude efficaces, des méthodes de prise de notes et des stratégies d\'apprentissage pour améliorer vos performances académiques avec CleverNote.'
            ]
        ];

        return $meta[$locale][$key] ?? $meta['en'][$key];
    }

    /**
     * Get post by slug (mock data for now)
     */
    private function getPostBySlug(string $locale, string $slug): ?array
    {
        // This is mock data - in production, this would query the database
        $posts = [
            'ultimate-guide-cornell-note-taking-method' => [
                'id' => 1,
                'title' => $this->getLocalizedTitle($locale, 'ultimate_guide_cornell_notes'),
                'slug' => 'ultimate-guide-cornell-note-taking-method',
                'content' => $this->getPostContent($locale, 'cornell_notes'),
                'excerpt' => $this->getLocalizedExcerpt($locale, 'cornell_notes_excerpt'),
                'featured_image' => '/images/blog/cornell-notes.jpg',
                'published_at' => '2024-01-15',
                'reading_time' => 8,
                'category' => $this->getLocalizedCategory($locale, 'study_techniques'),
                'tags' => ['note-taking', 'study-methods', 'productivity'],
                'author' => [
                    'name' => 'CleverNote Team',
                    'avatar' => '/images/team/clevernote-team.jpg'
                ]
            ]
        ];

        return $posts[$slug] ?? null;
    }

    /**
     * Get post content (mock data)
     */
    private function getPostContent(string $locale, string $key): string
    {
        // This would typically come from a database or markdown files
        return '<p>This is sample blog post content. In production, this would contain the full article content.</p>';
    }

    /**
     * Get related posts
     */
    private function getRelatedPosts(string $locale, int $excludeId): array
    {
        // Mock related posts - in production, this would query the database
        return [
            [
                'id' => 2,
                'title' => $this->getLocalizedTitle($locale, 'science_backed_study_techniques'),
                'slug' => '10-science-backed-study-techniques',
                'featured_image' => '/images/blog/study-techniques.jpg',
                'published_at' => '2024-01-12',
                'reading_time' => 12
            ]
        ];
    }
}