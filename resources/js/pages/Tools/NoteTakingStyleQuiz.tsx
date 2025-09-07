import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';

interface NoteTakingStyleQuizProps {
    locale: string;
}

interface Question {
    id: number;
    question: string;
    options: { value: string; label: string; }[];
}

interface QuizResult {
    style: string;
    description: string;
    tips: string[];
    tools: string[];
}

const NoteTakingStyleQuiz: React.FC<NoteTakingStyleQuizProps> = ({ locale }) => {
    const { t } = useTranslation();
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResult, setShowResult] = useState<boolean>(false);
    const [result, setResult] = useState<QuizResult | null>(null);

    const getLocalizedText = (key: string) => {
        const texts: Record<string, Record<string, string>> = {
            en: {
                title: 'Note-Taking Style Quiz',
                description: 'Discover your optimal note-taking style and get personalized recommendations',
                start_quiz: 'Start Quiz',
                next_question: 'Next Question',
                previous_question: 'Previous Question',
                get_results: 'Get My Results',
                restart_quiz: 'Take Quiz Again',
                your_style: 'Your Note-Taking Style',
                recommended_tools: 'Recommended Tools',
                tips_for_you: 'Tips for You',
                question_of: 'Question {current} of {total}',
                // Questions
                q1: 'How do you prefer to organize information?',
                q1_a: 'Linear lists and bullet points',
                q1_b: 'Mind maps and visual diagrams',
                q1_c: 'Detailed paragraphs and essays',
                q1_d: 'Tables and structured formats',
                q2: 'When learning something new, you tend to:',
                q2_a: 'Write down key points as you hear them',
                q2_b: 'Draw connections between concepts',
                q2_c: 'Summarize everything in your own words',
                q2_d: 'Create systematic outlines',
                q3: 'Your ideal study environment includes:',
                q3_a: 'Quick reference sheets and checklists',
                q3_b: 'Colorful charts and visual aids',
                q3_c: 'Detailed written explanations',
                q3_d: 'Organized folders and categories',
                q4: 'When reviewing notes, you prefer:',
                q4_a: 'Scanning through bullet points quickly',
                q4_b: 'Following visual flow and connections',
                q4_c: 'Reading through comprehensive summaries',
                q4_d: 'Checking off completed topics systematically',
                q5: 'Your note-taking speed is usually:',
                q5_a: 'Very fast with abbreviations',
                q5_b: 'Moderate with sketches and symbols',
                q5_c: 'Slower but very detailed',
                q5_d: 'Steady with consistent formatting',
                // Results
                linear_style: 'Linear Note-Taker',
                linear_desc: 'You prefer structured, sequential note-taking with clear hierarchies and bullet points.',
                visual_style: 'Visual Note-Taker',
                visual_desc: 'You learn best through diagrams, mind maps, and visual representations of information.',
                narrative_style: 'Narrative Note-Taker',
                narrative_desc: 'You prefer detailed, comprehensive notes written in paragraph form with full explanations.',
                systematic_style: 'Systematic Note-Taker',
                systematic_desc: 'You excel with highly organized, categorized notes using consistent formatting and structure.'
            },
            es: {
                title: 'Quiz de Estilo de Toma de Notas',
                description: 'Descubre tu estilo óptimo de toma de notas y obtén recomendaciones personalizadas',
                start_quiz: 'Comenzar Quiz',
                next_question: 'Siguiente Pregunta',
                previous_question: 'Pregunta Anterior',
                get_results: 'Ver Mis Resultados',
                restart_quiz: 'Repetir Quiz',
                your_style: 'Tu Estilo de Toma de Notas',
                recommended_tools: 'Herramientas Recomendadas',
                tips_for_you: 'Consejos para Ti',
                question_of: 'Pregunta {current} de {total}',
                // Questions
                q1: '¿Cómo prefieres organizar la información?',
                q1_a: 'Listas lineales y viñetas',
                q1_b: 'Mapas mentales y diagramas visuales',
                q1_c: 'Párrafos detallados y ensayos',
                q1_d: 'Tablas y formatos estructurados',
                q2: 'Al aprender algo nuevo, tiendes a:',
                q2_a: 'Escribir puntos clave mientras escuchas',
                q2_b: 'Dibujar conexiones entre conceptos',
                q2_c: 'Resumir todo con tus propias palabras',
                q2_d: 'Crear esquemas sistemáticos',
                q3: 'Tu ambiente de estudio ideal incluye:',
                q3_a: 'Hojas de referencia rápida y listas de verificación',
                q3_b: 'Gráficos coloridos y ayudas visuales',
                q3_c: 'Explicaciones escritas detalladas',
                q3_d: 'Carpetas organizadas y categorías',
                q4: 'Al revisar notas, prefieres:',
                q4_a: 'Escanear viñetas rápidamente',
                q4_b: 'Seguir el flujo visual y las conexiones',
                q4_c: 'Leer resúmenes comprensivos',
                q4_d: 'Marcar temas completados sistemáticamente',
                q5: 'Tu velocidad de toma de notas es usualmente:',
                q5_a: 'Muy rápida con abreviaciones',
                q5_b: 'Moderada con bocetos y símbolos',
                q5_c: 'Más lenta pero muy detallada',
                q5_d: 'Constante con formato consistente',
                // Results
                linear_style: 'Tomador de Notas Lineal',
                linear_desc: 'Prefieres tomar notas estructuradas y secuenciales con jerarquías claras y viñetas.',
                visual_style: 'Tomador de Notas Visual',
                visual_desc: 'Aprendes mejor a través de diagramas, mapas mentales y representaciones visuales.',
                narrative_style: 'Tomador de Notas Narrativo',
                narrative_desc: 'Prefieres notas detalladas y comprensivas escritas en forma de párrafo con explicaciones completas.',
                systematic_style: 'Tomador de Notas Sistemático',
                systematic_desc: 'Sobresales con notas altamente organizadas y categorizadas usando formato y estructura consistentes.'
            },
            pt: {
                title: 'Quiz de Estilo de Anotações',
                description: 'Descubra seu estilo ideal de anotações e receba recomendações personalizadas',
                start_quiz: 'Iniciar Quiz',
                next_question: 'Próxima Pergunta',
                previous_question: 'Pergunta Anterior',
                get_results: 'Ver Meus Resultados',
                restart_quiz: 'Refazer Quiz',
                your_style: 'Seu Estilo de Anotações',
                recommended_tools: 'Ferramentas Recomendadas',
                tips_for_you: 'Dicas para Você',
                question_of: 'Pergunta {current} de {total}',
                // Questions
                q1: 'Como você prefere organizar informações?',
                q1_a: 'Listas lineares e marcadores',
                q1_b: 'Mapas mentais e diagramas visuais',
                q1_c: 'Parágrafos detalhados e ensaios',
                q1_d: 'Tabelas e formatos estruturados',
                q2: 'Ao aprender algo novo, você tende a:',
                q2_a: 'Anotar pontos-chave enquanto ouve',
                q2_b: 'Desenhar conexões entre conceitos',
                q2_c: 'Resumir tudo com suas próprias palavras',
                q2_d: 'Criar esquemas sistemáticos',
                q3: 'Seu ambiente de estudo ideal inclui:',
                q3_a: 'Folhas de referência rápida e checklists',
                q3_b: 'Gráficos coloridos e auxílios visuais',
                q3_c: 'Explicações escritas detalhadas',
                q3_d: 'Pastas organizadas e categorias',
                q4: 'Ao revisar anotações, você prefere:',
                q4_a: 'Escanear marcadores rapidamente',
                q4_b: 'Seguir fluxo visual e conexões',
                q4_c: 'Ler resumos abrangentes',
                q4_d: 'Marcar tópicos concluídos sistematicamente',
                q5: 'Sua velocidade de anotação é geralmente:',
                q5_a: 'Muito rápida com abreviações',
                q5_b: 'Moderada com esboços e símbolos',
                q5_c: 'Mais lenta mas muito detalhada',
                q5_d: 'Constante com formatação consistente',
                // Results
                linear_style: 'Anotador Linear',
                linear_desc: 'Você prefere anotações estruturadas e sequenciais com hierarquias claras e marcadores.',
                visual_style: 'Anotador Visual',
                visual_desc: 'Você aprende melhor através de diagramas, mapas mentais e representações visuais.',
                narrative_style: 'Anotador Narrativo',
                narrative_desc: 'Você prefere anotações detalhadas e abrangentes escritas em forma de parágrafo com explicações completas.',
                systematic_style: 'Anotador Sistemático',
                systematic_desc: 'Você se destaca com anotações altamente organizadas e categorizadas usando formatação e estrutura consistentes.'
            },
            fr: {
                title: 'Quiz de Style de Prise de Notes',
                description: 'Découvrez votre style optimal de prise de notes et obtenez des recommandations personnalisées',
                start_quiz: 'Commencer le Quiz',
                next_question: 'Question Suivante',
                previous_question: 'Question Précédente',
                get_results: 'Voir Mes Résultats',
                restart_quiz: 'Refaire le Quiz',
                your_style: 'Votre Style de Prise de Notes',
                recommended_tools: 'Outils Recommandés',
                tips_for_you: 'Conseils pour Vous',
                question_of: 'Question {current} sur {total}',
                // Questions
                q1: 'Comment préférez-vous organiser l\'information?',
                q1_a: 'Listes linéaires et puces',
                q1_b: 'Cartes mentales et diagrammes visuels',
                q1_c: 'Paragraphes détaillés et essais',
                q1_d: 'Tableaux et formats structurés',
                q2: 'En apprenant quelque chose de nouveau, vous tendez à:',
                q2_a: 'Noter les points clés en écoutant',
                q2_b: 'Dessiner des connexions entre concepts',
                q2_c: 'Résumer tout avec vos propres mots',
                q2_d: 'Créer des plans systématiques',
                q3: 'Votre environnement d\'étude idéal inclut:',
                q3_a: 'Fiches de référence rapide et listes de contrôle',
                q3_b: 'Graphiques colorés et aides visuelles',
                q3_c: 'Explications écrites détaillées',
                q3_d: 'Dossiers organisés et catégories',
                q4: 'En révisant vos notes, vous préférez:',
                q4_a: 'Scanner les puces rapidement',
                q4_b: 'Suivre le flux visuel et les connexions',
                q4_c: 'Lire des résumés complets',
                q4_d: 'Cocher les sujets terminés systématiquement',
                q5: 'Votre vitesse de prise de notes est généralement:',
                q5_a: 'Très rapide avec des abréviations',
                q5_b: 'Modérée avec des croquis et symboles',
                q5_c: 'Plus lente mais très détaillée',
                q5_d: 'Régulière avec un formatage cohérent',
                // Results
                linear_style: 'Preneur de Notes Linéaire',
                linear_desc: 'Vous préférez des notes structurées et séquentielles avec des hiérarchies claires et des puces.',
                visual_style: 'Preneur de Notes Visuel',
                visual_desc: 'Vous apprenez mieux à travers des diagrammes, cartes mentales et représentations visuelles.',
                narrative_style: 'Preneur de Notes Narratif',
                narrative_desc: 'Vous préférez des notes détaillées et complètes écrites sous forme de paragraphe avec des explications complètes.',
                systematic_style: 'Preneur de Notes Systématique',
                systematic_desc: 'Vous excellez avec des notes hautement organisées et catégorisées utilisant un formatage et une structure cohérents.'
            }
        };
        return texts[locale]?.[key] || texts.en[key] || key;
    };

    const questions: Question[] = [
        {
            id: 1,
            question: getLocalizedText('q1'),
            options: [
                { value: 'linear', label: getLocalizedText('q1_a') },
                { value: 'visual', label: getLocalizedText('q1_b') },
                { value: 'narrative', label: getLocalizedText('q1_c') },
                { value: 'systematic', label: getLocalizedText('q1_d') }
            ]
        },
        {
            id: 2,
            question: getLocalizedText('q2'),
            options: [
                { value: 'linear', label: getLocalizedText('q2_a') },
                { value: 'visual', label: getLocalizedText('q2_b') },
                { value: 'narrative', label: getLocalizedText('q2_c') },
                { value: 'systematic', label: getLocalizedText('q2_d') }
            ]
        },
        {
            id: 3,
            question: getLocalizedText('q3'),
            options: [
                { value: 'linear', label: getLocalizedText('q3_a') },
                { value: 'visual', label: getLocalizedText('q3_b') },
                { value: 'narrative', label: getLocalizedText('q3_c') },
                { value: 'systematic', label: getLocalizedText('q3_d') }
            ]
        },
        {
            id: 4,
            question: getLocalizedText('q4'),
            options: [
                { value: 'linear', label: getLocalizedText('q4_a') },
                { value: 'visual', label: getLocalizedText('q4_b') },
                { value: 'narrative', label: getLocalizedText('q4_c') },
                { value: 'systematic', label: getLocalizedText('q4_d') }
            ]
        },
        {
            id: 5,
            question: getLocalizedText('q5'),
            options: [
                { value: 'linear', label: getLocalizedText('q5_a') },
                { value: 'visual', label: getLocalizedText('q5_b') },
                { value: 'narrative', label: getLocalizedText('q5_c') },
                { value: 'systematic', label: getLocalizedText('q5_d') }
            ]
        }
    ];

    const calculateResult = (): QuizResult => {
        const scores = { linear: 0, visual: 0, narrative: 0, systematic: 0 };
        
        Object.values(answers).forEach(answer => {
            scores[answer as keyof typeof scores]++;
        });
        
        const maxScore = Math.max(...Object.values(scores));
        const winningStyle = Object.keys(scores).find(style => scores[style as keyof typeof scores] === maxScore) as string;
        
        const results: Record<string, QuizResult> = {
            linear: {
                style: getLocalizedText('linear_style'),
                description: getLocalizedText('linear_desc'),
                tips: [
                    'Use bullet points and numbered lists',
                    'Create clear hierarchies with indentation',
                    'Use abbreviations and symbols for speed',
                    'Review notes by scanning key points'
                ],
                tools: ['CleverNote Outline Mode', 'Digital notebooks', 'List-making apps', 'Quick capture tools']
            },
            visual: {
                style: getLocalizedText('visual_style'),
                description: getLocalizedText('visual_desc'),
                tips: [
                    'Use mind maps and concept diagrams',
                    'Add colors and visual elements',
                    'Draw connections between ideas',
                    'Use flowcharts and visual organizers'
                ],
                tools: ['Mind mapping software', 'CleverNote Visual Mode', 'Drawing tablets', 'Diagram tools']
            },
            narrative: {
                style: getLocalizedText('narrative_style'),
                description: getLocalizedText('narrative_desc'),
                tips: [
                    'Write detailed summaries in your own words',
                    'Use complete sentences and paragraphs',
                    'Include examples and explanations',
                    'Create comprehensive study guides'
                ],
                tools: ['Word processors', 'CleverNote Essay Mode', 'Voice-to-text apps', 'Long-form editors']
            },
            systematic: {
                style: getLocalizedText('systematic_style'),
                description: getLocalizedText('systematic_desc'),
                tips: [
                    'Use consistent formatting and templates',
                    'Organize notes into clear categories',
                    'Create systematic review schedules',
                    'Use tags and labels for organization'
                ],
                tools: ['CleverNote Organization System', 'Template-based apps', 'Database tools', 'Structured notebooks']
            }
        };
        
        return results[winningStyle];
    };

    const handleAnswerSelect = (value: string) => {
        setAnswers({ ...answers, [currentQuestion]: value });
    };

    const nextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            const quizResult = calculateResult();
            setResult(quizResult);
            setShowResult(true);
        }
    };

    const previousQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const restartQuiz = () => {
        setCurrentQuestion(0);
        setAnswers({});
        setShowResult(false);
        setResult(null);
    };

    if (showResult && result) {
        return (
            <AppLayout>
                <Head title={getLocalizedText('title')} />
                
                <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-12">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                    {getLocalizedText('your_style')}
                                </h1>
                                <div className="bg-green-100 text-green-800 px-6 py-3 rounded-full text-2xl font-bold inline-block">
                                    {result.style}
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <p className="text-lg text-gray-700 text-center max-w-3xl mx-auto">
                                    {result.description}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                        {getLocalizedText('tips_for_you')}
                                    </h3>
                                    <ul className="space-y-2">
                                        {result.tips.map((tip, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                                    {index + 1}
                                                </span>
                                                <span className="text-gray-700">{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                        {getLocalizedText('recommended_tools')}
                                    </h3>
                                    <ul className="space-y-2">
                                        {result.tools.map((tool, index) => (
                                            <li key={index} className="flex items-center">
                                                <span className="bg-blue-500 text-white rounded-full w-2 h-2 mr-3"></span>
                                                <span className="text-gray-700">{tool}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <button
                                    onClick={restartQuiz}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    {getLocalizedText('restart_quiz')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={getLocalizedText('title')} />
            
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            {getLocalizedText('title')}
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            {getLocalizedText('description')}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-gray-500">
                                    {getLocalizedText('question_of').replace('{current}', (currentQuestion + 1).toString()).replace('{total}', questions.length.toString())}
                                </span>
                                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 ml-4">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {questions[currentQuestion].question}
                            </h2>
                            
                            <div className="space-y-4">
                                {questions[currentQuestion].options.map((option, index) => (
                                    <label 
                                        key={index}
                                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                            answers[currentQuestion] === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${currentQuestion}`}
                                            value={option.value}
                                            checked={answers[currentQuestion] === option.value}
                                            onChange={() => handleAnswerSelect(option.value)}
                                            className="sr-only"
                                        />
                                        <span className="text-gray-800 font-medium">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex justify-between">
                            <button
                                onClick={previousQuestion}
                                disabled={currentQuestion === 0}
                                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {getLocalizedText('previous_question')}
                            </button>
                            
                            <button
                                onClick={nextQuestion}
                                disabled={!answers[currentQuestion]}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {currentQuestion === questions.length - 1 
                                    ? getLocalizedText('get_results')
                                    : getLocalizedText('next_question')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default NoteTakingStyleQuiz;