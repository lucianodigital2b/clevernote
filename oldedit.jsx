<div className={`flex-1 p-4 sm:p-6 lg:p-8 ${isChatOpen ? 'mr-[400px]' : ''}`}>
                    <div className="max-w-full">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => router.visit('/dashboard')}
                                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-white"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    {t('back')}
                                </Button>
                                <div className="hidden sm:block h-4 w-px bg-neutral-300" />
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {dayjs(currentNote.updated_at).fromNow()}
                                    </Badge>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-white">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>Auto-saved</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Badge variant="secondary" className="text-xs ">
                                            {wordCount} {wordCount === 1 ? t('word') : t('words')}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setIsFolderModalOpen(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Folder className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('folder')}</span>
                                    </Button>
                                    
                                    {/* Removed Document Viewer Toggle - Always visible now */}
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                            <Switch
                                                checked={isPublic}
                                                onCheckedChange={(checked) => {
                                                    setIsPublic(checked);
                                                    // Update the note immediately when share is toggled
                                                    axios.patch(`/notes/${note.id}`, {
                                                        content,
                                                        folder_id: selectedFolder,
                                                        is_public: checked,
                                                        _method: 'PUT'
                                                    })
                                                    .then(() => {
                                                    })
                                                    .catch((error) => {
                                                        console.log(error);
                                                        setIsPublic(!checked); // Revert the state on error
                                                    });
                                                }}
                                            />
                                            <span className="hidden sm:inline">{t('public_sharing')}</span>
                                            <span className="sm:hidden">Public</span>
                                        </label>
                                        {isPublic && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyPublicLink}
                                                className="flex items-center gap-1 text-xs"
                                            >
                                                <Copy className="w-3 h-3" />
                                                <span className="hidden sm:inline">{t('copy_link')}</span>
                                                <span className="sm:hidden">Copy</span>
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Note
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {isFailed && (note.content == null || note.content === '') ? (
                            <ProcessingState state="failed" onRetry={handleRetryProcessing} showRetryButton={false} />
                        ) : isProcessing ? (
                            <ProcessingState state="processing" />
                        ) : (
                            <>
                                {/* External Source Metadata */}
                                {currentNote.source_type && currentNote.source_type !== 'upload' && currentNote.external_metadata && (
                                    <div className="mb-6">
                                        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col gap-4">
                                                    {/* Video Player/Thumbnail */}
                                                    {(currentNote.external_metadata.thumbnail || currentNote.external_metadata.thumbnail_url) && (
                                                        <div className="w-full">
                                                            {!isVideoPlaying ? (
                                                                <div 
                                                                    className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:opacity-90 transition-opacity group"
                                                                    onClick={() => setIsVideoPlaying(true)}
                                                                >
                                                                    <img 
                                                                        src={currentNote.external_metadata.thumbnail || currentNote.external_metadata.thumbnail_url} 
                                                                        alt="Video thumbnail"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                                                        <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                                                                            <Play className="w-8 h-8 text-black" fill="black" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                                                                        Click to play video
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden bg-black">
                                                                    {currentNote.source_type === 'youtube' && currentNote.external_metadata.video_id && (
                                                                        <iframe
                                                                            width="100%"
                                                                            height="100%"
                                                                            src={`https://www.youtube.com/embed/${currentNote.external_metadata.video_id}?autoplay=1&rel=0`}
                                                                            title="YouTube video player"
                                                                            frameBorder="0"
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                            allowFullScreen
                                                                            className="rounded-lg"
                                                                        />
                                                                    )}
                                                                    {currentNote.source_type === 'vimeo' && currentNote.external_metadata.video_id && (
                                                                        <iframe
                                                                            width="100%"
                                                                            height="100%"
                                                                            src={`https://player.vimeo.com/video/${currentNote.external_metadata.video_id}?autoplay=1`}
                                                                            title="Vimeo video player"
                                                                            frameBorder="0"
                                                                            allow="autoplay; fullscreen; picture-in-picture"
                                                                            allowFullScreen
                                                                            className="rounded-lg"
                                                                        />
                                                                    )}
                                                                    {currentNote.source_type === 'tiktok' && currentNote.external_metadata.video_id && (
                                                                        <iframe
                                                                            width="100%"
                                                                            height="100%"
                                                                            src={`https://www.tiktok.com/embed/v2/${currentNote.external_metadata.video_id}`}
                                                                            title="TikTok video player"
                                                                            frameBorder="0"
                                                                            allow="autoplay; fullscreen"
                                                                            allowFullScreen
                                                                            className="rounded-lg"
                                                                        />
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setIsVideoPlaying(false)}
                                                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Metadata Info */}
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {currentNote.source_type === 'youtube' && '📺 YouTube'}
                                                                        {currentNote.source_type === 'vimeo' && '🎬 Vimeo'}
                                                                        {currentNote.source_type === 'tiktok' && '🎵 TikTok'}
                                                                        {currentNote.source_type === 'external' && '🔗 External'}
                                                                    </Badge>
                                                                    {currentNote.external_metadata.duration && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            <Clock className="w-3 h-3 mr-1" />
                                                                            {Math.floor(currentNote.external_metadata.duration / 60)}:{(currentNote.external_metadata.duration % 60).toString().padStart(2, '0')}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {!isVideoPlaying && (currentNote.external_metadata.thumbnail || currentNote.external_metadata.thumbnail_url) && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setIsVideoPlaying(true)}
                                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                        >
                                                                            <Play className="w-4 h-4 mr-1" />
                                                                            Play
                                                                        </Button>
                                                                    )}
                                                                    {currentNote.source_url && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => window.open(currentNote.source_url, '_blank')}
                                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                        >
                                                                            <ExternalLink className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Original Title */}
                                                            {currentNote.external_metadata.title && currentNote.external_metadata.title !== currentNote.title && (
                                                                <h3 className="font-medium text-sm text-neutral-700 dark:text-neutral-300 mb-1 line-clamp-2">
                                                                    {t('original_title')}: {currentNote.external_metadata.title}
                                                                </h3>
                                                            )}
                                                            
                                                            {/* Channel/Creator */}
                                                            {(currentNote.external_metadata.channel || currentNote.external_metadata.user_name) && (
                                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                                                                    {t('by')} {currentNote.external_metadata.channel || currentNote.external_metadata.user_name}
                                                                </p>
                                                            )}
                                                            
                                                            {/* Stats */}
                                                            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                                                                {currentNote.external_metadata.upload_date && (
                                                                    <span>{t('uploaded')} {dayjs(currentNote.external_metadata.upload_date).format('MMM DD, YYYY')}</span>
                                                                )}
                                                                {currentNote.external_metadata.view_count && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Eye className="w-3 h-3" />
                                                                        {currentNote.external_metadata.view_count.toLocaleString()} {t('views')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Title Section */}
                                <div className="mb-8">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 leading-tight">
                                        {currentNote.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                                        <span>{t('created')} {dayjs(currentNote.created_at).format('MMM DD, YYYY')}</span>
                                    </div>
                                </div>


                                <ValidationErrors errors={errors} />

                                {/* Audio Player Section */}
                                {currentNote.media && currentNote.media.filter(media => media.collection_name === 'note-audio').length > 0 && (
                                    <div className="mb-8">
                                        {currentNote.media
                                            .filter(media => media.collection_name === 'note-audio')
                                            .map((audioFile, index) => (
                                                <div key={audioFile.id} className="space-y-2">
                                                    {index > 0  && 
                                                        <>  
                                                            <Separator className="my-4" />
                                                            <div className="mt-4">
                                                                <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSubmitFeedback(true)}
                                                                    className="p-2 rounded-full bg-green-100 text-green-600"
                                                                >
                                                                    <ThumbsUp className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setFeedbackModalOpen(true)}
                                                                    className="p-2 rounded-full bg-red-100 text-red-600"
                                                                >
                                                                    <ThumbsDown className="w-5 h-5" />
                                                                </button>
                                                                </div>
                                                            
                                                            </div>
                                                        </>
                                                    }
                                                    <AudioPlayer
                                                        src={audioFile.original_url}
                                                        onPlay={e => console.log("onPlay")}
                                                        className="rounded-lg"
                                                        customAdditionalControls={[]}
                                                        showJumpControls={false}
                                                        showPlaybackRateControls={true}
                                                        playbackRates={[0.5, 1, 1.25, 1.5, 2]}
                                                        layout="horizontal-reverse"
                                                        style={{
                                                            backgroundColor: 'transparent',
                                                            boxShadow: 'none',
                                                            border: '1px solid rgb(229 231 235)',
                                                            borderRadius: '0.5rem',
                                                            '--rhap_theme-color': '#7c3aed',
                                                            '--rhap_bar-color': '#e5e7eb',
                                                            '--rhap_time-color': '#6b7280',
                                                            '--rhap_font-family': 'inherit',
                                                            '--rhap_main-controls-button-size': '32px',
                                                            '--rhap_button-height': '32px',
                                                            '--rhap_button-width': '32px',
                                                        } as React.CSSProperties}
                                                    />
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}

                                {/* Podcast Player Section - Positioned after AI Actions */}
                                {currentNote.podcast_status === 'completed' && (currentNote.podcast_url || currentNote.podcast_file_path) && (
                                    <div data-podcast-section className="mb-8">
                                        <div className="bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-orange-100 dark:bg-orange-900/30 w-8 h-8 rounded-full flex items-center justify-center">
                                                    <Mic className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-orange-900 dark:text-orange-100">Generated Podcast</h3>
                                                    <div className="flex items-center gap-4 text-xs text-orange-600 dark:text-orange-400">
                                                        {currentNote.podcast_duration && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {Math.floor(currentNote.podcast_duration / 60)}:{(currentNote.podcast_duration % 60).toString().padStart(2, '0')}
                                                            </span>
                                                        )}
                                                        {currentNote.podcast_file_size && (
                                                            <span>
                                                                {(currentNote.podcast_file_size / (1024 * 1024)).toFixed(1)} MB
                                                            </span>
                                                        )}
                                                        {currentNote.podcast_generated_at && (
                                                            <span>
                                                                Generated {dayjs(currentNote.podcast_generated_at).fromNow()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <AudioPlayer
                                                ref={podcastPlayerRef}
                                                src={currentNote.podcast_url || currentNote.podcast_file_path}
                                                onPlay={e => {
                                                    console.log("🎧 Podcast playing");
                                                    console.log("📁 Podcast file details:", {
                                                        url: currentNote.podcast_url,
                                                        file_path: currentNote.podcast_file_path,
                                                        duration: currentNote.podcast_duration,
                                                        file_size: currentNote.podcast_file_size,
                                                        generated_at: currentNote.podcast_generated_at,
                                                        note_id: currentNote.id,
                                                        note_title: currentNote.title
                                                    });
                                                    console.log("🔊 Audio element:", e.target);
                                                    console.log("📊 Audio source:", e.target.src);
                                                }}
                                                onLoadStart={e => {
                                                    console.log("📥 Podcast loading started from bucket");
                                                    console.log("🌐 Loading URL:", e.target.src);
                                                }}
                                                onLoadedData={e => {
                                                    console.log("✅ Podcast data loaded from bucket");
                                                    console.log("⏱️ Audio duration:", e.target.duration);
                                                    console.log("📦 Audio ready state:", e.target.readyState);
                                                }}
                                                onError={e => {
                                                    console.error("❌ Podcast loading error:", e);
                                                    console.error("🔗 Failed URL:", e.target.src);
                                                }}
                                                className="rounded-lg"
                                                customAdditionalControls={[]}
                                                showJumpControls={false}
                                                showPlaybackRateControls={true}
                                                playbackRates={[0.5, 0.75, 1, 1.25, 1.5, 2]}
                                                layout="horizontal-reverse"
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'none',
                                                    border: '1px solid rgb(251 146 60)',
                                                    borderRadius: '0.5rem',
                                                    '--rhap_theme-color': '#ea580c',
                                                    '--rhap_bar-color': '#fed7aa',
                                                    '--rhap_time-color': '#9a3412',
                                                    '--rhap_font-family': 'inherit',
                                                    '--rhap_main-controls-button-size': '32px',
                                                    '--rhap_button-height': '32px',
                                                    '--rhap_button-width': '32px',
                                                } as React.CSSProperties}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Main Content Layout - Note content only */}
                                <div className="w-full">
                                    {/* Note Content */}
                                    <div className="w-full">
                                        {/* Editor Container */}
                                        <div className="dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                                            {editor ? (
                                                <>
                                                    <div className=" dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                                        <TiptapToolbar editor={editor} />
                                                    </div>
                                                    <div className="p-6">
                                                        <EditorContent 
                                                            editor={editor} 
                                                            className="prose dark:prose-invert max-w-none min-h-[500px] focus:outline-none prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100 prose-p:text-neutral-700 dark:prose-p:text-neutral-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:ml-0" 
                                                            style={{
                                                                '--tw-prose-bullets': 'disc',
                                                            } as React.CSSProperties}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center p-12">
                                                    <div className="flex items-center gap-3">
                                                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                                                        <span className="text-neutral-600 dark:text-neutral-400">Loading editor...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-5">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleSubmitFeedback(true)}
                                        className="text-green-600 hover:bg-green-50"
                                    >
                                        <ThumbsUp className="w-4 h-4 mr-1" /> 
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setFeedbackModalOpen(true)}
                                        className="text-red-600 hover:bg-red-50"
                                    >
                                        <ThumbsDown className="w-4 h-4 mr-1" /> 
                                    </Button>
                                </div>
                                {/* Editor Toolbar */}
                                
                            </>
                        )}

                    </div>
                </div>