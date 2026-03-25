import React, { useState, useRef, useEffect } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { Upload, Download, RefreshCw, Link as LinkIcon, Wand2, Image as ImageIcon, Copy, Check, Save, Trash2, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SavedPost } from '../types';
import { savePost, updatePost, getPostsByType, deletePost } from '../lib/postService';

const PRESETS = {
  teknolojia: {
    title: 'TEKNOLOJIA',
    text: 'Ny olona rehetra manana iPhone tsy maintsy manana chargeur fa ny manana chargeur rehetra tsy voatery manana iPhone'
  },
  kolontsaina: {
    title: 'KOLONTSAINA',
    text: 'Ny miss rehetra tsy maintsy manja fa ny manja rehetra tsy voatery ho miss'
  },
  'fanatanjahan-tena': {
    title: 'FANATANJAHAN-TENA',
    text: 'Ny mpanao sport rehetra tsy maintsy mandany hery fa ny olona mandany hery rehetra tsy voatery manao sport'
  },
  fanabeazana: {
    title: 'FANABEAZANA',
    text: 'Ny profesora rehetra tsy maintsy manam-pahaizana fa ny manam-pahaizana rehetra tsy voatery ho profesora'
  },
  'toe-karena': {
    title: 'TOE-KARENA',
    text: 'Ny firenena mandroso rehetra tsy maintsy manana foto-drafitr\'asa fa ny firenena manana foto-drafitr\'asa rehetra tsy voatery mandroso'
  }
};

type Category = keyof typeof PRESETS | 'custom';

export function MisyFaTsyGenerator() {
  // Supabase/Auth states
  const [user, setUser] = useState<User | null>(null);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Generator states
  const [category, setCategory] = useState<Category>('teknolojia');
  const [title, setTitle] = useState(PRESETS.teknolojia.title);
  const [text, setText] = useState(PRESETS.teknolojia.text);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filterIntensity, setFilterIntensity] = useState(80);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Fixed square format: 1080x1080
  const SQUARE_SIZE = 1080;
  
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load saved MisyFaTsy posts
  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      setLoadingSavedPosts(true);
      const posts = await getPostsByType('misyfatsy', { limit: 20 });
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      setLoadingSavedPosts(false);
    }
  };

  // Handle category change - only update title, not text
  useEffect(() => {
    if (category !== 'custom') {
      setTitle(PRESETS[category].title);
    }
  }, [category]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };


  const createMisyFaTsyPost = async (post: SavedPost) => {
    const createdPost = await savePost(post);
    if (createdPost) {
      setSavedPosts([createdPost, ...savedPosts]);
    }
  };

  const updateMisyFaTsyPost = async (postId: string, post: SavedPost) => {
    const updatedPost = await updatePost(postId, post);

    if (!updatedPost) {
      throw new Error('Impossible de mettre à jour ce post. Il a peut-être été supprimé ou bloqué par les politiques RLS.');
    }

    setSavedPosts(savedPosts.map((savedPost) => (savedPost.id === postId ? updatedPost : savedPost)));
  };

  const handleSaveToLibrary = async () => {
    if (!title) {
      setSaveError('Veuillez entrer un titre avant d\'enregistrer');
      return;
    }

    if (!user) {
      setSaveError('Veuillez vous connecter pour enregistrer');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      // Convert preview to image
      if (!previewRef.current) throw new Error('Preview not available');
      const imageData = await toPng(previewRef.current);

      const newPost: SavedPost = {
        type: 'misyfatsy',
        title: title,
        imageUrl: imageData,
        authorName: user.displayName || 'Anonymous',
        metadata: {
          firebaseUid: user.uid,
          text: text,
          category: category,
          filterIntensity: filterIntensity
        }
      };

      if (editingPostId) {
        await updateMisyFaTsyPost(editingPostId, newPost);
      } else {
        await createMisyFaTsyPost(newPost);
      }
      setEditingPostId(null);
      setSaveError(null);
    } catch (error: any) {
      console.error('Failed to save:', error);
      setSaveError(error?.message || 'Échec de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedPost = async (postId: string | undefined) => {
    if (!postId || !confirm('Supprimer ce post?')) return;

    try {
      await deletePost(postId);
      await loadSavedPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setSaveError('Échec de la suppression');
    }
  };

  const handleLoadPost = (post: SavedPost) => {
    const canEditPost = Boolean(user?.uid && post.userId && user.uid === post.userId);
    setEditingPostId(canEditPost ? post.id || null : null);
    setImageUrl(post.imageUrl);
    setTitle(post.title);
    if (post.metadata?.text) setText(post.metadata.text as string);
    if (post.metadata?.category) setCategory(post.metadata.category as Category);
    if (post.metadata?.filterIntensity) setFilterIntensity(post.metadata.filterIntensity as number);
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    if (!previewRef.current) return;
    
    try {
      if (format === 'png') setIsDownloadingPng(true);
      else setIsDownloadingJpg(true);
      
      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const baseOptions = { 
        cacheBust: true, 
        pixelRatio: 2,
        width: SQUARE_SIZE,
        height: SQUARE_SIZE
      };

      let dataUrl: string;
      
      if (format === 'png') {
        dataUrl = await toPng(previewRef.current, {
          ...baseOptions,
          quality: 0.95
        });
      } else {
        // JPEG with optimized quality and white background
        dataUrl = await toJpeg(previewRef.current, {
          ...baseOptions,
          quality: 0.98,
          backgroundColor: '#ffffff'
        });
      }
        
      const link = document.createElement('a');
      const fileExtension = format === 'png' ? 'png' : 'jpg';
      
      // Generate professional filename with timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
      const titleSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      link.download = `MisyFaTsy_${titleSlug}_${timestamp}.${fileExtension}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(`Failed to download ${format}`, err);
    } finally {
      setIsDownloadingPng(false);
      setIsDownloadingJpg(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const randomizeFilter = () => {
    setFilterIntensity(Math.floor(Math.random() * 60) + 40); // Random between 40 and 100
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-xl text-white">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-misy-lime">
            <Wand2 className="w-5 h-5" />
            MisyFaTsy Studio
          </h2>

          <div className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-misy-teal focus:border-misy-teal transition-all outline-none"
              >
                <option value="teknolojia">TEKNOLOJIA</option>
                <option value="kolontsaina">KOLONTSAINA</option>
                <option value="fanatanjahan-tena">FANATANJAHAN-TENA</option>
                <option value="fanabeazana">FANABEAZANA</option>
                <option value="toe-karena">TOE-KARENA</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (category !== 'custom') setCategory('custom');
                }}
                className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-misy-teal focus:border-misy-teal transition-all outline-none uppercase"
                placeholder="EX: TEKNOLOJIA"
              />
            </div>

            {/* Text */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Texte principal</label>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (category !== 'custom') setCategory('custom');
                }}
                rows={4}
                className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-misy-teal focus:border-misy-teal transition-all outline-none resize-none"
                placeholder="Ny olona rehetra..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Image de fond</label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-4 bg-[#141414] hover:bg-[#1a1a1a] border border-dashed border-neutral-700 hover:border-misy-teal text-neutral-300 rounded-xl transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Upload className="w-6 h-6 text-neutral-500 group-hover:text-misy-teal transition-colors" />
                <span className="text-sm font-medium">{imageUrl ? 'Changer l\'image' : 'Glisser ou cliquer pour uploader'}</span>
              </button>
            </div>

            {/* Filter Intensity */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-neutral-400">Intensité du filtre bleu</label>
                <span className="text-sm text-misy-teal font-mono">{filterIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filterIntensity}
                onChange={(e) => setFilterIntensity(Number(e.target.value))}
                className="w-full accent-misy-teal"
              />
              <p className="text-xs text-neutral-500 mt-1">Contrôle l'intensité de la teinte bleue de l'image</p>
            </div>

            {/* Format - Fixed Square */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Format</label>
              <div className="w-full py-3 px-4 bg-[#141414] border border-neutral-800 rounded-xl text-white text-center font-medium">
                Carré - 1080 × 1080 px
              </div>
            </div>
            
            
            <button
              onClick={randomizeFilter}
              className="w-full py-3 px-4 bg-gradient-to-r from-misy-teal to-misy-baltic hover:opacity-90 text-white font-medium rounded-xl shadow-lg shadow-misy-teal/20 transition-all flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Surprise me (Filtre aléatoire)
            </button>
          </div>
        </div>
        
        {/* Actions */}
        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-xl text-white space-y-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-2 uppercase tracking-wider">Exporter</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload('png')}
              disabled={isDownloadingPng}
              className="w-full py-3 px-4 bg-[#141414] hover:bg-[#1a1a1a] border border-neutral-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDownloadingPng ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-misy-lime" />}
              PNG HD
            </button>
            <button
              onClick={() => handleDownload('jpg')}
              disabled={isDownloadingJpg}
              className="w-full py-3 px-4 bg-[#141414] hover:bg-[#1a1a1a] border border-neutral-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDownloadingJpg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-sky-400" />}
              JPG HD
            </button>
          </div>
          <button
            onClick={copyToClipboard}
            className="w-full py-3 px-4 bg-[#141414] hover:bg-[#1a1a1a] border border-neutral-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            {isCopied ? 'Lien copié !' : 'Copier le lien'}
          </button>

          {/* Save to Library */}
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving || !title || !user}
            title={!user ? "Sign in to save" : ""}
            className="w-full py-3 px-4 bg-gradient-to-r from-misy-teal to-misy-baltic hover:opacity-90 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {user ? (editingPostId ? 'Mettre à jour' : 'Enregistrer') : 'Se connecter'}
              </>
            )}
          </button>

          {saveError && (
            <div className="p-3 bg-red-900/30 border border-red-900 text-red-200 text-xs rounded-lg">
              {saveError}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-8 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            Live Preview
          </span>
          <span className="text-sm text-neutral-400 font-mono">{SQUARE_SIZE} × {SQUARE_SIZE}</span>
        </div>

        {/* Square container for preview */}
        <div className="w-full bg-[#0a0a0a] rounded-2xl border border-neutral-800 flex items-center justify-center p-4 md:p-8">
          {/* Wrapper that maintains aspect ratio and fits content */}
          <div 
            className="relative w-full shadow-2xl"
            style={{ 
              maxWidth: '700px',
              aspectRatio: '1 / 1',
              background: 'black'
            }}
          >
            {/* Scaled content wrapper - scales to fit parent */}
            <div 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${SQUARE_SIZE}px`, 
                height: `${SQUARE_SIZE}px`,
                transform: `scale(${700 / SQUARE_SIZE})`,
                transformOrigin: 'top left'
              }}
            >
              {/* This wrapper is what gets exported */}
              <div 
                ref={previewRef}
                className="w-full h-full relative overflow-hidden font-sans flex flex-col"
                style={{ width: `${SQUARE_SIZE}px`, height: `${SQUARE_SIZE}px` }}
              >
                {/* 1. Background Image with enhanced filters */}
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      filter: 'contrast(1.1) saturate(1.2)'
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                    <ImageIcon className="w-24 h-24 text-neutral-800" />
                  </div>
                )}

                {/* 2. PRIMARY GRADIENT OVERLAY - Cinematic gradient (controlled by filterIntensity) */}
                <div 
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(
                      180deg,
                      rgba(116,0,184,${0.2 + (filterIntensity / 100) * 0.4}) 0%,
                      rgba(72,191,227,${0.1 + (filterIntensity / 100) * 0.3}) 50%,
                      rgba(0,0,0,${0.5 + (filterIntensity / 100) * 0.25}) 100%
                    )`
                  }}
                ></div>

                {/* 2B. DIAGONAL GRADIENT OVERLAY - Additional depth */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(
                      135deg,
                      rgba(116,0,184,${0.1 + (filterIntensity / 100) * 0.2}) 0%,
                      rgba(0,0,0,0) 50%,
                      rgba(72,191,227,${0.08 + (filterIntensity / 100) * 0.15}) 100%
                    )`
                  }}
                ></div>

                {/* 2C. HORIZONTAL GRADIENT OVERLAY - Side lighting */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(
                      90deg,
                      rgba(116,0,184,${0.15 + (filterIntensity / 100) * 0.25}) 0%,
                      rgba(0,0,0,0) 40%,
                      rgba(72,191,227,${0.1 + (filterIntensity / 100) * 0.2}) 100%
                    )`
                  }}
                ></div>

                {/* 3. GRAIN TEXTURE - Cinematic noise effect */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' result='noise'/%3E%3C/filter%3E%3Crect width='400' height='400' fill='%23000' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                    opacity: 0.12
                  }}
                ></div>

                {/* 5. LIGHT LEAK OVERLAY - Purple/Blue accent (controlled by filterIntensity) */}
                <div 
                  className="absolute -top-20 -right-20 pointer-events-none transition-opacity duration-300"
                  style={{
                    width: '400px',
                    height: '400px',
                    background: `radial-gradient(circle, rgba(116,0,184,${0.3 + (filterIntensity / 100) * 0.4}) 0%, rgba(72,191,227,${0.15 + (filterIntensity / 100) * 0.35}) 40%, transparent 70%)`,
                    mixBlendMode: 'screen',
                    opacity: 0.15 + (filterIntensity / 100) * 0.35,
                    filter: 'blur(40px)'
                  }}
                ></div>

                {/* 5B. SECONDARY LIGHT LEAK - Bottom left corner */}
                <div 
                  className="absolute -bottom-20 -left-20 pointer-events-none"
                  style={{
                    width: '350px',
                    height: '350px',
                    background: `radial-gradient(circle, rgba(72,191,227,${0.2 + (filterIntensity / 100) * 0.3}) 0%, rgba(116,0,184,${0.1 + (filterIntensity / 100) * 0.2}) 40%, transparent 70%)`,
                    mixBlendMode: 'screen',
                    opacity: 0.12 + (filterIntensity / 100) * 0.28,
                    filter: 'blur(35px)'
                  }}
                ></div>

                {/* 6. DUST/PARTICLES EFFECT - Subtle floating particles */}
                <div 
                  className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-300"
                  style={{
                    opacity: 0.05 + (filterIntensity / 100) * 0.04
                  }}
                >
                  <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full" style={{animation: 'float 6s ease-in-out infinite'}}></div>
                  <div className="absolute top-1/4 right-20 w-0.5 h-0.5 bg-white rounded-full" style={{animation: 'float 8s ease-in-out infinite 1s'}}></div>
                  <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-white rounded-full" style={{animation: 'float 7s ease-in-out infinite 2s'}}></div>
                  <div className="absolute bottom-20 right-1/4 w-0.5 h-0.5 bg-white rounded-full" style={{animation: 'float 9s ease-in-out infinite 1.5s'}}></div>
                  <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-300 rounded-full" style={{animation: 'float 6.5s ease-in-out infinite 0.5s', opacity: 0.6}}></div>
                  <div className="absolute bottom-1/4 left-1/3 w-0.5 h-0.5 bg-purple-300 rounded-full" style={{animation: 'float 7.5s ease-in-out infinite 3s', opacity: 0.5}}></div>
                </div>

                {/* 6. Badge - Top Left */}
                <div className="absolute top-6 left-6 z-20">
                  <div 
                    style={{
                      background: `linear-gradient(135deg, rgb(116,0,184) 0%, rgb(72,191,227) 100%)`,
                      borderRadius: '999px',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: 'white',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Misy Fa Tsy
                  </div>
                </div>

                {/* 7. Decorative Gradient Line */}
                <div className="absolute top-24 left-8 z-20">
                  <div 
                    style={{
                      height: '3px',
                      width: '60px',
                      background: `linear-gradient(90deg, rgb(116,0,184) 0%, rgb(128,255,219) 100%)`
                    }}
                  ></div>
                </div>

                {/* 8. TITLE - Top Left, Below decorative line */}
                <div className="absolute top-32 left-8 right-8 z-20">
                  <h1 
                    style={{ 
                      fontSize: '42px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: 'white',
                      letterSpacing: '-1px',
                      lineHeight: '1.2',
                      textShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 12px rgba(128,255,219,0.2)'
                    }}
                  >
                    {title}
                  </h1>
                </div>

                {/* 9. MAIN TEXT CONTAINER - Glassmorphism */}
                <div className="absolute bottom-20 left-6 right-6 z-20" style={{ maxWidth: 'calc(100% - 48px)' }}>
                  {/* Container with glassmorphism */}
                  <div 
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '16px',
                      maxWidth: 'calc(100% - 32px)'
                    }}
                  >
                    {/* Badge label */}
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: 'rgb(72,191,227)',
                      letterSpacing: '1px',
                      marginBottom: '8px'
                    }}>
                      ✦ Misy Fa Tsy...
                    </div>

                    {/* Main text content */}
                    <p 
                      style={{ 
                        fontSize: '32px',
                        fontWeight: 600,
                        color: 'white',
                        lineHeight: '1.3',
                        textShadow: '0 0 12px rgba(128,255,219,0.4), 0 2px 8px rgba(0,0,0,0.5)',
                        wordWrap: 'break-word'
                      }}
                    >
                      {text}
                    </p>
                  </div>
                </div>

                {/* Subtle Vignette Effect */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>
                {/* Subtle Neon Border */}
                <div className="absolute inset-0 pointer-events-none border border-white/10 mix-blend-overlay"></div>

                {/* Floating animation keyframes */}
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
                    10% { opacity: 0.1; }
                    50% { transform: translateY(-20px) translateX(10px); opacity: 0.1; }
                    90% { opacity: 0; }
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Library Section */}
      <div className="lg:col-span-12 mt-8 pt-8 border-t border-neutral-800">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          Mes créations MisyFaTsy enregistrées
          {savedPosts.length > 0 && <span className="text-sm font-normal text-neutral-400">({savedPosts.length})</span>}
        </h3>
        
        {loadingSavedPosts && (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-500" />
          </div>
        )}
        
        {!loadingSavedPosts && savedPosts.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <p>Aucune création enregistrée. Créez et enregistrez votre première création MisyFaTsy!</p>
          </div>
        )}
        
        {!loadingSavedPosts && savedPosts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedPosts.map((post) => (
              <div key={post.id} className="group relative">
                <div 
                  className="relative bg-[#141414] rounded-lg overflow-hidden aspect-square cursor-pointer hover:opacity-75 transition-opacity border border-neutral-800"
                  onClick={() => handleLoadPost(post)}
                >
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="text-white text-sm font-bold truncate">{post.title}</div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400 truncate">{post.authorName}</p>
                  </div>
                  {user?.uid === post.userId && (
                    <button
                      onClick={() => handleDeleteSavedPost(post.id)}
                      className="text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
