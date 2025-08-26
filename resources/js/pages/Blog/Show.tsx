import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, Tag, ArrowLeft, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';

interface Author {
  name: string;
  avatar: string;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  reading_time: number;
  category: string;
  tags: string[];
  author: Author;
}

interface RelatedPost {
  id: number;
  title: string;
  slug: string;
  featured_image: string;
  published_at: string;
  reading_time: number;
}

interface BlogShowProps {
  post: BlogPost;
  locale: string;
  relatedPosts: RelatedPost[];
}

const BlogShow: React.FC<BlogShowProps> = ({ post, locale, relatedPosts }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : locale === 'pt' ? 'pt-BR' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTimeText = (minutes: number) => {
    const texts = {
      en: `${minutes} min read`,
      es: `${minutes} min de lectura`,
      pt: `${minutes} min de leitura`,
      fr: `${minutes} min de lecture`
    };
    return texts[locale as keyof typeof texts] || texts.en;
  };

  const getTexts = () => {
    const texts = {
      en: {
        backToBlog: 'Back to Blog',
        share: 'Share',
        relatedPosts: 'Related Posts',
        readMore: 'Read More',
        publishedBy: 'Published by'
      },
      es: {
        backToBlog: 'Volver al Blog',
        share: 'Compartir',
        relatedPosts: 'Artículos Relacionados',
        readMore: 'Leer Más',
        publishedBy: 'Publicado por'
      },
      pt: {
        backToBlog: 'Voltar ao Blog',
        share: 'Compartilhar',
        relatedPosts: 'Posts Relacionados',
        readMore: 'Ler Mais',
        publishedBy: 'Publicado por'
      },
      fr: {
        backToBlog: 'Retour au Blog',
        share: 'Partager',
        relatedPosts: 'Articles Connexes',
        readMore: 'Lire Plus',
        publishedBy: 'Publié par'
      }
    };
    return texts[locale as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <Head>
        <title>{post.title} | CleverNote Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.featured_image} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:author" content={post.author.name} />
        <meta property="article:section" content={post.category} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <link rel="canonical" href={`/blog/${locale}/${post.slug}`} />
      </Head>

      <div className="min-h-screen bg-white">
        <Navbar />
        
        {/* Back to Blog */}
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Link href={`/blog/${locale}`}>
                <Button variant="ghost" className="mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {texts.backToBlog}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Article Header */}
        <article className="pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              {/* Category Badge */}
              <div className="mb-4">
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                  {post.category}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
                <div className="flex items-center gap-2">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/avatars/300-1.jpg';
                    }}
                  />
                  <span className="text-sm">
                    {texts.publishedBy} <span className="font-medium">{post.author.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDate(post.published_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{getReadingTimeText(post.reading_time)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="ml-auto"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {texts.share}
                </Button>
              </div>

              {/* Featured Image */}
              <div className="mb-8">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/blog/default-blog-image.jpg';
                  }}
                />
              </div>

              {/* Article Content */}
              <div className="prose prose-lg max-w-none mb-8">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              {/* Tags */}
              <div className="mb-8">
                <Separator className="mb-6" />
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 md:px-6">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                  {texts.relatedPosts}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {relatedPosts.map((relatedPost) => (
                    <Card key={relatedPost.id} className="group hover:shadow-lg transition-all duration-300">
                      <CardHeader className="p-0">
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={relatedPost.featured_image}
                            alt={relatedPost.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/blog/default-blog-image.jpg';
                            }}
                          />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(relatedPost.published_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{getReadingTimeText(relatedPost.reading_time)}</span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {relatedPost.title}
                        </h3>
                        
                        <Link href={`/blog/${locale}/${relatedPost.slug}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <BookOpen className="w-4 h-4 mr-2" />
                            {texts.readMore}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  );
};

export default BlogShow;