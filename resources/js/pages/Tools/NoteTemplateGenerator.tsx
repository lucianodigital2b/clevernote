import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Copy, FileText, BookOpen, Brain, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';

interface NoteTemplateGeneratorProps {
  locale: string;
  meta: {
    title: string;
    description: string;
    keywords: string;
  };
}

const NoteTemplateGenerator: React.FC<NoteTemplateGeneratorProps> = ({ locale, meta }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [copied, setCopied] = useState(false);

  const getTexts = () => {
    const texts = {
      en: {
        pageTitle: 'Note Template Generator',
        pageSubtitle: 'Create customized note templates for different subjects and learning styles to improve your study efficiency.',
        backToTools: 'Back to Tools',
        howItWorks: 'How It Works',
        selectSubject: 'Select Subject',
        selectStyle: 'Select Note-Taking Style',
        customTopic: 'Custom Topic (Optional)',
        customTopicPlaceholder: 'Enter a specific topic or chapter...',
        generateTemplate: 'Generate Template',
        downloadTemplate: 'Download Template',
        copyTemplate: 'Copy Template',
        copied: 'Copied!',
        templatePreview: 'Template Preview',
        subjects: {
          mathematics: 'Mathematics',
          science: 'Science',
          history: 'History',
          literature: 'Literature',
          languages: 'Languages',
          business: 'Business',
          psychology: 'Psychology',
          computer_science: 'Computer Science'
        },
        styles: {
          cornell: 'Cornell Notes',
          outline: 'Outline Method',
          mapping: 'Mind Mapping',
          charting: 'Charting Method',
          sentence: 'Sentence Method'
        },
        steps: [
          {
            icon: 'Target',
            title: 'Choose Subject',
            description: 'Select your subject area to get relevant template structure'
          },
          {
            icon: 'Brain',
            title: 'Pick Style',
            description: 'Choose a note-taking method that matches your learning preference'
          },
          {
            icon: 'FileText',
            title: 'Generate & Use',
            description: 'Get your customized template and start taking better notes'
          }
        ],
        benefits: [
          'Structured learning approach',
          'Consistent note format',
          'Improved information retention',
          'Time-saving template creation',
          'Subject-specific optimization'
        ],
        getStarted: 'Ready to optimize your note-taking?',
        getStartedDesc: 'Join CleverNote and access advanced note-taking features with cloud sync and collaboration.',
        signUpFree: 'Sign Up Free'
      },
      es: {
        pageTitle: 'Generador de Plantillas de Notas',
        pageSubtitle: 'Crea plantillas de notas personalizadas para diferentes materias y estilos de aprendizaje para mejorar tu eficiencia de estudio.',
        backToTools: 'Volver a Herramientas',
        howItWorks: 'Cómo Funciona',
        selectSubject: 'Seleccionar Materia',
        selectStyle: 'Seleccionar Estilo de Toma de Notas',
        customTopic: 'Tema Personalizado (Opcional)',
        customTopicPlaceholder: 'Ingresa un tema o capítulo específico...',
        generateTemplate: 'Generar Plantilla',
        downloadTemplate: 'Descargar Plantilla',
        copyTemplate: 'Copiar Plantilla',
        copied: '¡Copiado!',
        templatePreview: 'Vista Previa de Plantilla',
        subjects: {
          mathematics: 'Matemáticas',
          science: 'Ciencias',
          history: 'Historia',
          literature: 'Literatura',
          languages: 'Idiomas',
          business: 'Negocios',
          psychology: 'Psicología',
          computer_science: 'Ciencias de la Computación'
        },
        styles: {
          cornell: 'Notas Cornell',
          outline: 'Método de Esquema',
          mapping: 'Mapas Mentales',
          charting: 'Método de Gráficos',
          sentence: 'Método de Oraciones'
        },
        steps: [
          {
            icon: 'Target',
            title: 'Elegir Materia',
            description: 'Selecciona tu área de materia para obtener una estructura de plantilla relevante'
          },
          {
            icon: 'Brain',
            title: 'Elegir Estilo',
            description: 'Elige un método de toma de notas que coincida con tu preferencia de aprendizaje'
          },
          {
            icon: 'FileText',
            title: 'Generar y Usar',
            description: 'Obtén tu plantilla personalizada y comienza a tomar mejores notas'
          }
        ],
        benefits: [
          'Enfoque de aprendizaje estructurado',
          'Formato de notas consistente',
          'Mejor retención de información',
          'Creación de plantillas que ahorra tiempo',
          'Optimización específica por materia'
        ],
        getStarted: '¿Listo para optimizar tu toma de notas?',
        getStartedDesc: 'Únete a CleverNote y accede a funciones avanzadas de toma de notas con sincronización en la nube y colaboración.',
        signUpFree: 'Registrarse Gratis'
      },
      pt: {
        pageTitle: 'Gerador de Modelos de Notas',
        pageSubtitle: 'Crie modelos de notas personalizados para diferentes matérias e estilos de aprendizagem para melhorar sua eficiência de estudo.',
        backToTools: 'Voltar às Ferramentas',
        howItWorks: 'Como Funciona',
        selectSubject: 'Selecionar Matéria',
        selectStyle: 'Selecionar Estilo de Anotações',
        customTopic: 'Tópico Personalizado (Opcional)',
        customTopicPlaceholder: 'Digite um tópico ou capítulo específico...',
        generateTemplate: 'Gerar Modelo',
        downloadTemplate: 'Baixar Modelo',
        copyTemplate: 'Copiar Modelo',
        copied: 'Copiado!',
        templatePreview: 'Visualização do Modelo',
        subjects: {
          mathematics: 'Matemática',
          science: 'Ciências',
          history: 'História',
          literature: 'Literatura',
          languages: 'Idiomas',
          business: 'Negócios',
          psychology: 'Psicologia',
          computer_science: 'Ciência da Computação'
        },
        styles: {
          cornell: 'Notas Cornell',
          outline: 'Método de Esquema',
          mapping: 'Mapas Mentais',
          charting: 'Método de Gráficos',
          sentence: 'Método de Sentenças'
        },
        steps: [
          {
            icon: 'Target',
            title: 'Escolher Matéria',
            description: 'Selecione sua área de matéria para obter estrutura de modelo relevante'
          },
          {
            icon: 'Brain',
            title: 'Escolher Estilo',
            description: 'Escolha um método de anotações que combine com sua preferência de aprendizado'
          },
          {
            icon: 'FileText',
            title: 'Gerar e Usar',
            description: 'Obtenha seu modelo personalizado e comece a fazer anotações melhores'
          }
        ],
        benefits: [
          'Abordagem de aprendizado estruturada',
          'Formato de notas consistente',
          'Melhor retenção de informações',
          'Criação de modelos que economiza tempo',
          'Otimização específica por matéria'
        ],
        getStarted: 'Pronto para otimizar suas anotações?',
        getStartedDesc: 'Junte-se ao CleverNote e acesse recursos avançados de anotações com sincronização na nuvem e colaboração.',
        signUpFree: 'Cadastre-se Grátis'
      },
      fr: {
        pageTitle: 'Générateur de Modèles de Notes',
        pageSubtitle: 'Créez des modèles de notes personnalisés pour différentes matières et styles d\'apprentissage pour améliorer votre efficacité d\'étude.',
        backToTools: 'Retour aux Outils',
        howItWorks: 'Comment Ça Marche',
        selectSubject: 'Sélectionner la Matière',
        selectStyle: 'Sélectionner le Style de Prise de Notes',
        customTopic: 'Sujet Personnalisé (Optionnel)',
        customTopicPlaceholder: 'Entrez un sujet ou chapitre spécifique...',
        generateTemplate: 'Générer le Modèle',
        downloadTemplate: 'Télécharger le Modèle',
        copyTemplate: 'Copier le Modèle',
        copied: 'Copié !',
        templatePreview: 'Aperçu du Modèle',
        subjects: {
          mathematics: 'Mathématiques',
          science: 'Sciences',
          history: 'Histoire',
          literature: 'Littérature',
          languages: 'Langues',
          business: 'Commerce',
          psychology: 'Psychologie',
          computer_science: 'Informatique'
        },
        styles: {
          cornell: 'Notes Cornell',
          outline: 'Méthode de Plan',
          mapping: 'Cartes Mentales',
          charting: 'Méthode de Graphiques',
          sentence: 'Méthode de Phrases'
        },
        steps: [
          {
            icon: 'Target',
            title: 'Choisir la Matière',
            description: 'Sélectionnez votre domaine de matière pour obtenir une structure de modèle pertinente'
          },
          {
            icon: 'Brain',
            title: 'Choisir le Style',
            description: 'Choisissez une méthode de prise de notes qui correspond à votre préférence d\'apprentissage'
          },
          {
            icon: 'FileText',
            title: 'Générer et Utiliser',
            description: 'Obtenez votre modèle personnalisé et commencez à prendre de meilleures notes'
          }
        ],
        benefits: [
          'Approche d\'apprentissage structurée',
          'Format de notes cohérent',
          'Meilleure rétention d\'informations',
          'Création de modèles qui fait gagner du temps',
          'Optimisation spécifique par matière'
        ],
        getStarted: 'Prêt à optimiser votre prise de notes ?',
        getStartedDesc: 'Rejoignez CleverNote et accédez aux fonctionnalités avancées de prise de notes avec synchronisation cloud et collaboration.',
        signUpFree: 'S\'inscrire Gratuitement'
      }
    };
    return texts[locale as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  const generateTemplate = () => {
    if (!selectedSubject || !selectedStyle) return;

    const templates = {
      cornell: {
        mathematics: `# ${customTopic || texts.subjects[selectedSubject as keyof typeof texts.subjects]} - Cornell Notes

**Date:** ___________  **Topic:** ${customTopic || '___________'}

---

## Notes Section
### Key Concepts:
- 
- 
- 

### Formulas & Equations:
- 
- 

### Problem-Solving Steps:
1. 
2. 
3. 

### Examples:
- 
- 

---

## Cue Section
**Questions:**
- 
- 

**Keywords:**
- 
- 

**Review Points:**
- 
- 

---

## Summary
**Main Takeaways:**


**Next Steps:**
`,
        science: `# ${customTopic || texts.subjects[selectedSubject as keyof typeof texts.subjects]} - Cornell Notes

**Date:** ___________  **Topic:** ${customTopic || '___________'}

---

## Notes Section
### Observations:
- 
- 

### Hypothesis:
- 

### Experimental Data:
- 
- 

### Results & Analysis:
- 
- 

### Conclusions:
- 

---

## Cue Section
**Key Questions:**
- 
- 

**Important Terms:**
- 
- 

**Review Points:**
- 
- 

---

## Summary
**Scientific Principles:**


**Applications:**
`,
        history: `# ${customTopic || texts.subjects[selectedSubject as keyof typeof texts.subjects]} - Cornell Notes

**Date:** ___________  **Topic:** ${customTopic || '___________'}

---

## Notes Section
### Timeline:
- 
- 

### Key Figures:
- 
- 

### Important Events:
- 
- 

### Causes & Effects:
- 
- 

### Context & Background:
- 

---

## Cue Section
**Discussion Questions:**
- 
- 

**Key Terms:**
- 
- 

**Connections:**
- 
- 

---

## Summary
**Historical Significance:**


**Lessons Learned:**
`
      },
      outline: {
        mathematics: `# ${customTopic || texts.subjects[selectedSubject as keyof typeof texts.subjects]} - Outline Notes

**Date:** ___________  **Topic:** ${customTopic || '___________'}

I. Main Concept
   A. Definition
      1. 
      2. 
   B. Key Properties
      1. 
      2. 

II. Formulas & Theorems
   A. Primary Formula
      1. Variables: 
      2. Applications: 
   B. Related Theorems
      1. 
      2. 

III. Problem-Solving Approach
   A. Step 1: 
   B. Step 2: 
   C. Step 3: 

IV. Examples
   A. Basic Example
      1. Problem: 
      2. Solution: 
   B. Advanced Example
      1. Problem: 
      2. Solution: 

V. Practice Problems
   A. 
   B. 
   C. 
`,
        science: `# ${customTopic || texts.subjects[selectedSubject as keyof typeof texts.subjects]} - Outline Notes

**Date:** ___________  **Topic:** ${customTopic || '___________'}

I. Scientific Concept
   A. Definition
      1. 
      2. 
   B. Background Theory
      1. 
      2. 

II. Experimental Method
   A. Hypothesis
      1. 
   B. Materials
      1. 
      2. 
   C. Procedure
      1. 
      2. 
      3. 

III. Observations & Data
   A. Qualitative Observations
      1. 
      2. 
   B. Quantitative Data
      1. 
      2. 

IV. Analysis & Conclusions
   A. Data Interpretation
      1. 
      2. 
   B. Scientific Conclusions
      1. 
      2. 

V. Applications
   A. Real-world Applications
      1. 
      2. 
   B. Further Research
      1. 
      2. 
`
      },
      mapping: {
        mathematics: `# ${customTopic || texts.subjects[selectedSubject as keyof typeof texts.subjects]} - Mind Map

**Date:** ___________  **Topic:** ${customTopic || '___________'}

                    [MAIN CONCEPT]
                           |
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   [FORMULAS]        [PROPERTIES]      [APPLICATIONS]
        │                 │                 │
    ┌───┼───┐         ┌───┼───┐         ┌───┼───┐
    │   │   │         │   │   │         │   │   │
   [ ] [ ] [ ]       [ ] [ ] [ ]       [ ] [ ] [ ]


**Key Relationships:**
- 
- 
- 

**Problem-Solving Connections:**
- 
- 

**Memory Aids:**
- 
- 
`,
        science: `# ${customTopic || texts.subjects[selectedSubject as keyof typeof texts.subjects]} - Mind Map

**Date:** ___________  **Topic:** ${customTopic || '___________'}

                    [SCIENTIFIC CONCEPT]
                           |
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   [THEORY]         [EXPERIMENT]       [APPLICATIONS]
        │                 │                 │
    ┌───┼───┐         ┌───┼───┐         ┌───┼───┐
    │   │   │         │   │   │         │   │   │
   [ ] [ ] [ ]       [ ] [ ] [ ]       [ ] [ ] [ ]


**Cause & Effect Relationships:**
- 
- 

**Scientific Connections:**
- 
- 

**Key Vocabulary:**
- 
- 
`
      }
    };

    const styleTemplates = templates[selectedStyle as keyof typeof templates];
    const template = styleTemplates?.[selectedSubject as keyof typeof styleTemplates] || 
                    `# ${customTopic || 'Study Notes'}

**Date:** ___________
**Subject:** ${texts.subjects[selectedSubject as keyof typeof texts.subjects]}
**Topic:** ${customTopic || '___________'}

## Main Points:
- 
- 
- 

## Key Concepts:
- 
- 

## Questions:
- 
- 

## Summary:

`;

    setGeneratedTemplate(template);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([generatedTemplate], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSubject}-${selectedStyle}-template.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`/tools/${locale}/note-template-generator`} />
      </Head>

      <div className="min-h-screen bg-white">
        <Navbar />
        
        {/* Header */}
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Link href={`/tools/${locale}`}>
                <Button variant="ghost" className="mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {texts.backToTools}
                </Button>
              </Link>
              
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {texts.pageTitle}
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {texts.pageSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                {texts.howItWorks}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {texts.steps.map((step, index) => {
                  const IconComponent = step.icon === 'Target' ? Target : step.icon === 'Brain' ? Brain : FileText;
                  return (
                    <div key={index} className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                        <IconComponent className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Template Generator */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Generator Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {texts.pageTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="subject">{texts.selectSubject}</Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder={texts.selectSubject} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(texts.subjects).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="style">{texts.selectStyle}</Label>
                      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder={texts.selectStyle} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(texts.styles).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="topic">{texts.customTopic}</Label>
                      <Textarea
                        id="topic"
                        placeholder={texts.customTopicPlaceholder}
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={generateTemplate}
                      disabled={!selectedSubject || !selectedStyle}
                      className="w-full"
                    >
                      {texts.generateTemplate}
                    </Button>

                    {/* Benefits */}
                    <div className="mt-8">
                      <h3 className="font-semibold text-gray-900 mb-3">Benefits:</h3>
                      <ul className="space-y-2">
                        {texts.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Template Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        {texts.templatePreview}
                      </span>
                      {generatedTemplate && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            {copied ? texts.copied : texts.copyTemplate}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadTemplate}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {texts.downloadTemplate}
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedTemplate ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                          {generatedTemplate}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select subject and style to generate your template</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-indigo-600">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                {texts.getStarted}
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                {texts.getStartedDesc}
              </p>
              <Link href={`/register/${locale}`}>
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                  {texts.signUpFree}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default NoteTemplateGenerator;