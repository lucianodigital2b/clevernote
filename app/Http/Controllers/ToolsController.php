<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ToolsController extends Controller
{
    /**
     * Display the tools index page
     */
    public function index(string $locale)
    {
        $tools = $this->getToolsData($locale);
        
        return Inertia::render('Tools/Index', [
            'tools' => $tools,
            'locale' => $locale,
            'meta' => $this->getMetaData($locale)
        ]);
    }

    /**
     * Display the Note Template Generator tool
     */
    public function noteTemplateGenerator(string $locale)
    {
        return Inertia::render('Tools/NoteTemplateGenerator', [
            'locale' => $locale,
            'meta' => $this->getToolMetaData('note-template-generator', $locale)
        ]);
    }

    /**
     * Display the Study Schedule Planner tool
     */
    public function studySchedulePlanner(string $locale)
    {
        return Inertia::render('Tools/StudySchedulePlanner', [
            'locale' => $locale,
            'meta' => $this->getToolMetaData('study-schedule-planner', $locale)
        ]);
    }

    /**
     * Display the Flashcard Creator tool
     */
    public function flashcardCreator(string $locale)
    {
        return Inertia::render('Tools/FlashcardCreator', [
            'locale' => $locale,
            'meta' => $this->getToolMetaData('flashcard-creator', $locale)
        ]);
    }

    /**
     * Display the Note-Taking Style Quiz tool
     */
    public function noteTakingStyleQuiz(string $locale)
    {
        return Inertia::render('Tools/NoteTakingStyleQuiz', [
            'locale' => $locale,
            'meta' => $this->getToolMetaData('note-taking-style-quiz', $locale)
        ]);
    }

    /**
     * Display the Productivity Calculator tool
     */
    public function productivityCalculator(string $locale)
    {
        return Inertia::render('Tools/ProductivityCalculator', [
            'locale' => $locale,
            'meta' => $this->getToolMetaData('productivity-calculator', $locale)
        ]);
    }

    /**
     * Get tools data for the index page
     */
    private function getToolsData(string $locale): array
    {
        $tools = [
            [
                'id' => 'note-template-generator',
                'icon' => 'FileText',
                'category' => 'templates',
                'featured' => true,
                'difficulty' => 'beginner',
                'estimatedTime' => 5
            ],
            [
                'id' => 'study-schedule-planner',
                'icon' => 'Calendar',
                'category' => 'planning',
                'featured' => true,
                'difficulty' => 'intermediate',
                'estimatedTime' => 15
            ],
            [
                'id' => 'flashcard-creator',
                'icon' => 'Brain',
                'category' => 'study',
                'featured' => true,
                'difficulty' => 'beginner',
                'estimatedTime' => 10
            ],
            [
                'id' => 'note-taking-style-quiz',
                'icon' => 'HelpCircle',
                'category' => 'assessment',
                'featured' => false,
                'difficulty' => 'beginner',
                'estimatedTime' => 8
            ],
            [
                'id' => 'productivity-calculator',
                'icon' => 'Calculator',
                'category' => 'productivity',
                'featured' => false,
                'difficulty' => 'intermediate',
                'estimatedTime' => 12
            ]
        ];

        // Add localized content to each tool
        return array_map(function ($tool) use ($locale) {
            return array_merge($tool, $this->getLocalizedToolContent($tool['id'], $locale));
        }, $tools);
    }

    /**
     * Get localized content for a specific tool
     */
    private function getLocalizedToolContent(string $toolId, string $locale): array
    {
        $content = [
            'en' => [
                'note-template-generator' => [
                    'title' => 'Note Template Generator',
                    'description' => 'Create customized note templates for different subjects and learning styles.',
                    'benefits' => ['Structured learning', 'Consistent format', 'Time-saving']
                ],
                'study-schedule-planner' => [
                    'title' => 'Study Schedule Planner',
                    'description' => 'Plan your study sessions with smart scheduling and progress tracking.',
                    'benefits' => ['Better time management', 'Goal tracking', 'Balanced learning']
                ],
                'flashcard-creator' => [
                    'title' => 'Flashcard Creator',
                    'description' => 'Generate interactive flashcards for effective memorization and review.',
                    'benefits' => ['Active recall', 'Spaced repetition', 'Memory retention']
                ],
                'note-taking-style-quiz' => [
                    'title' => 'Note-Taking Style Quiz',
                    'description' => 'Discover your optimal note-taking style and improve your learning efficiency.',
                    'benefits' => ['Personalized approach', 'Learning optimization', 'Style awareness']
                ],
                'productivity-calculator' => [
                    'title' => 'Productivity Calculator',
                    'description' => 'Calculate your study productivity and identify areas for improvement.',
                    'benefits' => ['Performance tracking', 'Efficiency insights', 'Goal optimization']
                ]
            ],
            'es' => [
                'note-template-generator' => [
                    'title' => 'Generador de Plantillas de Notas',
                    'description' => 'Crea plantillas de notas personalizadas para diferentes materias y estilos de aprendizaje.',
                    'benefits' => ['Aprendizaje estructurado', 'Formato consistente', 'Ahorro de tiempo']
                ],
                'study-schedule-planner' => [
                    'title' => 'Planificador de Horario de Estudio',
                    'description' => 'Planifica tus sesiones de estudio con programación inteligente y seguimiento de progreso.',
                    'benefits' => ['Mejor gestión del tiempo', 'Seguimiento de objetivos', 'Aprendizaje equilibrado']
                ],
                'flashcard-creator' => [
                    'title' => 'Creador de Tarjetas de Estudio',
                    'description' => 'Genera tarjetas de estudio interactivas para memorización y repaso efectivos.',
                    'benefits' => ['Recuerdo activo', 'Repetición espaciada', 'Retención de memoria']
                ],
                'note-taking-style-quiz' => [
                    'title' => 'Quiz de Estilo de Toma de Notas',
                    'description' => 'Descubre tu estilo óptimo de toma de notas y mejora tu eficiencia de aprendizaje.',
                    'benefits' => ['Enfoque personalizado', 'Optimización del aprendizaje', 'Conciencia del estilo']
                ],
                'productivity-calculator' => [
                    'title' => 'Calculadora de Productividad',
                    'description' => 'Calcula tu productividad de estudio e identifica áreas de mejora.',
                    'benefits' => ['Seguimiento del rendimiento', 'Insights de eficiencia', 'Optimización de objetivos']
                ]
            ],
            'pt' => [
                'note-template-generator' => [
                    'title' => 'Gerador de Modelos de Notas',
                    'description' => 'Crie modelos de notas personalizados para diferentes matérias e estilos de aprendizagem.',
                    'benefits' => ['Aprendizagem estruturada', 'Formato consistente', 'Economia de tempo']
                ],
                'study-schedule-planner' => [
                    'title' => 'Planejador de Cronograma de Estudos',
                    'description' => 'Planeje suas sessões de estudo com agendamento inteligente e acompanhamento de progresso.',
                    'benefits' => ['Melhor gestão do tempo', 'Acompanhamento de metas', 'Aprendizagem equilibrada']
                ],
                'flashcard-creator' => [
                    'title' => 'Criador de Flashcards',
                    'description' => 'Gere flashcards interativos para memorização e revisão eficazes.',
                    'benefits' => ['Recordação ativa', 'Repetição espaçada', 'Retenção de memória']
                ],
                'note-taking-style-quiz' => [
                    'title' => 'Quiz de Estilo de Anotações',
                    'description' => 'Descubra seu estilo ideal de anotações e melhore sua eficiência de aprendizagem.',
                    'benefits' => ['Abordagem personalizada', 'Otimização do aprendizado', 'Consciência do estilo']
                ],
                'productivity-calculator' => [
                    'title' => 'Calculadora de Produtividade',
                    'description' => 'Calcule sua produtividade de estudo e identifique áreas para melhoria.',
                    'benefits' => ['Acompanhamento de desempenho', 'Insights de eficiência', 'Otimização de metas']
                ]
            ],
            'fr' => [
                'note-template-generator' => [
                    'title' => 'Générateur de Modèles de Notes',
                    'description' => 'Créez des modèles de notes personnalisés pour différentes matières et styles d\'apprentissage.',
                    'benefits' => ['Apprentissage structuré', 'Format cohérent', 'Gain de temps']
                ],
                'study-schedule-planner' => [
                    'title' => 'Planificateur d\'Horaire d\'Étude',
                    'description' => 'Planifiez vos sessions d\'étude avec une programmation intelligente et un suivi des progrès.',
                    'benefits' => ['Meilleure gestion du temps', 'Suivi des objectifs', 'Apprentissage équilibré']
                ],
                'flashcard-creator' => [
                    'title' => 'Créateur de Cartes Mémoire',
                    'description' => 'Générez des cartes mémoire interactives pour une mémorisation et révision efficaces.',
                    'benefits' => ['Rappel actif', 'Répétition espacée', 'Rétention mémoire']
                ],
                'note-taking-style-quiz' => [
                    'title' => 'Quiz de Style de Prise de Notes',
                    'description' => 'Découvrez votre style optimal de prise de notes et améliorez votre efficacité d\'apprentissage.',
                    'benefits' => ['Approche personnalisée', 'Optimisation de l\'apprentissage', 'Conscience du style']
                ],
                'productivity-calculator' => [
                    'title' => 'Calculateur de Productivité',
                    'description' => 'Calculez votre productivité d\'étude et identifiez les domaines d\'amélioration.',
                    'benefits' => ['Suivi des performances', 'Insights d\'efficacité', 'Optimisation des objectifs']
                ]
            ]
        ];

        return $content[$locale][$toolId] ?? $content['en'][$toolId];
    }

    /**
     * Get meta data for the tools index page
     */
    private function getMetaData(string $locale): array
    {
        $meta = [
            'en' => [
                'title' => 'Free Productivity Tools | CleverNote',
                'description' => 'Discover free tools to enhance your note-taking, study planning, and productivity. Create templates, plan schedules, and optimize your learning process.',
                'keywords' => 'free tools, productivity, note-taking, study planner, flashcards, templates, learning tools'
            ],
            'es' => [
                'title' => 'Herramientas Gratuitas de Productividad | CleverNote',
                'description' => 'Descubre herramientas gratuitas para mejorar tu toma de notas, planificación de estudios y productividad. Crea plantillas, planifica horarios y optimiza tu proceso de aprendizaje.',
                'keywords' => 'herramientas gratuitas, productividad, toma de notas, planificador de estudios, tarjetas de estudio, plantillas, herramientas de aprendizaje'
            ],
            'pt' => [
                'title' => 'Ferramentas Gratuitas de Produtividade | CleverNote',
                'description' => 'Descubra ferramentas gratuitas para melhorar suas anotações, planejamento de estudos e produtividade. Crie modelos, planeje cronogramas e otimize seu processo de aprendizagem.',
                'keywords' => 'ferramentas gratuitas, produtividade, anotações, planejador de estudos, flashcards, modelos, ferramentas de aprendizagem'
            ],
            'fr' => [
                'title' => 'Outils Gratuits de Productivité | CleverNote',
                'description' => 'Découvrez des outils gratuits pour améliorer votre prise de notes, planification d\'études et productivité. Créez des modèles, planifiez des horaires et optimisez votre processus d\'apprentissage.',
                'keywords' => 'outils gratuits, productivité, prise de notes, planificateur d\'études, cartes mémoire, modèles, outils d\'apprentissage'
            ]
        ];

        return $meta[$locale] ?? $meta['en'];
    }

    /**
     * Get meta data for individual tools
     */
    private function getToolMetaData(string $toolId, string $locale): array
    {
        $toolContent = $this->getLocalizedToolContent($toolId, $locale);
        $baseMeta = $this->getMetaData($locale);
        
        return [
            'title' => $toolContent['title'] . ' | CleverNote',
            'description' => $toolContent['description'],
            'keywords' => $baseMeta['keywords'] . ', ' . strtolower($toolContent['title'])
        ];
    }
}