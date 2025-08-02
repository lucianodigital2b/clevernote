
import React, { useState, useRef } from "react";
import { 
  Upload, 
  Youtube, 
  FileText,
  Send,
  Loader2
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const redirectToLogin = () => {
    setIsLoading(true);
    // Simulate processing time
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      redirectToLogin();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      redirectToLogin();
    }
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      redirectToLogin();
    }
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
            {t('powerful_features')}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
            {t('features_heading')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('features_description')}
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'upload' 
                  ? 'bg-white shadow-sm text-gray-700' 
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600 mr-2" />
              <span className="text-sm font-medium">{t('features_tab_pdf_word')}</span>
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex items-center px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'youtube' 
                  ? 'bg-white shadow-sm text-gray-700' 
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <Youtube className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{t('features_tab_youtube')}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              dragActive && activeTab === 'upload'
                ? "border-indigo-500 bg-indigo-50" 
                : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
            }`}
            onDragEnter={activeTab === 'upload' ? handleDrag : undefined}
            onDragLeave={activeTab === 'upload' ? handleDrag : undefined}
            onDragOver={activeTab === 'upload' ? handleDrag : undefined}
            onDrop={activeTab === 'upload' ? handleDrop : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Upload Tab Content */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-indigo-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isLoading ? (
                      t('features_upload_processing')
                    ) : (
                      <>
                        {t('features_upload_drop_files')}{" "}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading}
                          className="text-indigo-600 hover:text-indigo-700 underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('features_upload_browse')}
                        </button>
                      </>
                    )}
                  </h3>
                  <p className="text-gray-600">
                    {isLoading 
                      ? t('features_upload_processing_description')
                      : t('features_upload_description')
                    }
                  </p>
                </div>
              </div>
            )}

            {/* YouTube Tab Content */}
            {activeTab === 'youtube' && (
              <form onSubmit={handleYoutubeSubmit} className="space-y-6">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                  ) : (
                    <Youtube className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isLoading ? t('features_youtube_processing') : t('features_youtube_title')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {isLoading 
                      ? t('features_youtube_processing_description')
                      : t('features_youtube_description')
                    }
                  </p>
                </div>
                <div className="flex max-w-md mx-auto">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder={t('features_youtube_placeholder')}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            )}


          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
