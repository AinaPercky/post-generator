import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, Wand2, Type, LayoutTemplate, Settings, AlertTriangle, Check, X, Save, Trash2 } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { GoogleGenAI } from '@google/genai';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SavedPost } from '../types';
import { savePost, getPostsByType, deletePost } from '../lib/postService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type TemplateType = 'hero' | 'split' | 'card' | 'quote' | 'warning' | 'versus';

export function RedPillGenerator() {
  // Supabase/Auth states
  const [user, setUser] = useState<User | null>(null);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Generator states
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUrl2, setImageUrl2] = useState<string | null>(null);
  const [title, setTitle] = useState('THE HARSH TRUTH');
  const [content, setContent] = useState('Most people are sleepwalking through life, trading their potential for temporary comfort.');
  const [punchline, setPunchline] = useState('WAKE UP.');
  const [template, setTemplate] = useState<TemplateType>('hero');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imagePosition, setImagePosition] = useState('center');
  const [enableLightRays, setEnableLightRays] = useState(false);
  const [enableRedPillTitle, setEnableRedPillTitle] = useState(true);
  const [titlePositionY, setTitlePositionY] = useState(12);
  const [bodyFontSize, setBodyFontSize] = useState(20);
  const [contentPositionY, setContentPositionY] = useState(50);
  const [enablePunchline, setEnablePunchline] = useState(true);
  const [punchlinePositionY, setPunchlinePositionY] = useState(90);
  const [customHighlights, setCustomHighlights] = useState('sleepwalking, comfort');
  const [highlightColor, setHighlightColor] = useState('#ff2e2e');
  const [highlightStyle, setHighlightStyle] = useState<'text' | 'background'>('text');
  const [versusLeft, setVersusLeft] = useState('NICE GUY');
  const [versusRight, setVersusRight] = useState('BAD BOY');
  const [versusLeftPoints, setVersusLeftPoints] = useState('Seeks approval\nAvoids conflict\nHides true intentions\nPlays it safe');
  const [versusRightPoints, setVersusRightPoints] = useState('Self-reliant\nEmbraces friction\nRadically honest\nTakes risks');
  const [versusImageMode, setVersusImageMode] = useState<'single' | 'split'>('split');
  
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load saved Red Pill posts on mount
  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      setLoadingSavedPosts(true);
      const posts = await getPostsByType('redpill', { limit: 20 });
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      setLoadingSavedPosts(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!title) {
      setSaveError('Please enter a title before saving');
      return;
    }

    if (!user) {
      setSaveError('Please sign in to save posts');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      // Convert preview to image
      if (!previewRef.current) throw new Error('Preview not available');
      const imageData = await toPng(previewRef.current);

      const newPost: SavedPost = {
        type: 'redpill',
        title: title,
        imageUrl: imageData,
        authorName: user.displayName || 'Anonymous',
        metadata: {
          firebaseUid: user.uid,
          content: content,
          punchline: punchline,
          template: template,
        }
      };

      const savedPost = await savePost(newPost);
      if (savedPost) {
        setSavedPosts([savedPost, ...savedPosts]);
        setSaveError(null);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveError('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedPost = async (postId: string | undefined) => {
    if (!postId || !confirm('Delete this post?')) return;

    try {
      await deletePost(postId);
      setSavedPosts(savedPosts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      setSaveError('Failed to delete post');
    }
  };

  const handleLoadPost = (post: SavedPost) => {
    setTitle(post.title);
    if (post.metadata?.content) setContent(post.metadata.content as string);
    if (post.metadata?.punchline) setPunchline(post.metadata.punchline as string);
    if (post.metadata?.template) setTemplate(post.metadata.template as TemplateType);
    // Note: image_url is the rendered PNG, not the source image
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl2(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateText = async () => {
    setIsGeneratingText(true);
    try {
      const parts: any[] = [
        { text: 'Generate a "Red Pill" style social media post. It should be motivational, slightly edgy, focusing on discipline, reality, or success. Return ONLY a JSON object with three string fields: "title" (short, uppercase, max 4 words), "content" (2-3 lines of hard-hitting truth), and "punchline" (a short, powerful closing sentence).' }
      ];

      if (imageUrl) {
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(';')[0].split(':')[1];
        parts.unshift({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
        parts[1].text = 'Analyze this image and generate a "Red Pill" style social media post that relates to the visual context (e.g., if it\'s a gym, focus on physical discipline; if it\'s an office, focus on escaping the corporate matrix). It should be motivational, slightly edgy, focusing on discipline, reality, or success. Return ONLY a JSON object with three string fields: "title" (short, uppercase, max 4 words), "content" (2-3 lines of hard-hitting truth), and "punchline" (a short, powerful closing sentence).';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
        }
      });
      
      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
        if (data.punchline) setPunchline(data.punchline);
      }
    } catch (error) {
      console.error('Failed to generate text:', error);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleDownload = async (format: 'png' | 'jpg' = 'png') => {
    if (!previewRef.current) return;
    try {
      setIsDownloading(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const options = { quality: 0.95, cacheBust: true, pixelRatio: 2 };
      const dataUrl = format === 'jpg' 
        ? await toJpeg(previewRef.current, options)
        : await toPng(previewRef.current, options);
        
      const link = document.createElement('a');
      link.download = `red-pill-post-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getSafeTitlePosition = () => {
    // Intelligently avoid the subject's face based on image alignment
    if (imagePosition === 'top') {
      // Face is at the top, avoid 0-45%
      return Math.max(45, titlePositionY);
    } else if (imagePosition === 'bottom') {
      // Face is at the bottom, avoid 55-100%
      return Math.min(55, titlePositionY);
    } else {
      // Face is in the center (center, left, right), avoid 30-70%
      if (titlePositionY > 30 && titlePositionY < 70) {
        return titlePositionY < 50 ? 30 : 70;
      }
    }
    return titlePositionY;
  };

  // Helper to highlight keywords in red
  const renderHighlightedText = (text: string, isPill: boolean = false) => {
    const keywords = ['truth', 'reality', 'discipline', 'wake up', 'matrix', 'weak', 'strong', 'pain', 'success', 'potential', 'comfort', 'sacrifice', 'hard', 'easy', 'focus', 'escape', 'system', 'control'];
    
    const words = text.split(' ');
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      const isKeyword = keywords.includes(cleanWord);
      
      if (isPill) {
        return (
          <span key={i} className={isKeyword ? 'text-[#FF4D4D] drop-shadow-[0_0_12px_rgba(255,77,77,0.8)] font-black' : 'text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}>
            {word}{' '}
          </span>
        );
      }

      return (
        <span key={i} className={isKeyword ? 'text-[#ff2e2e] drop-shadow-[0_0_8px_rgba(255,46,46,0.6)]' : ''}>
          {word}{' '}
        </span>
      );
    });
  };

  const renderBodyText = (text: string) => {
    if (!customHighlights.trim()) return <>{text}</>;
    
    const keywords = customHighlights.split(',').map(w => w.trim()).filter(w => w.length > 0);
    if (keywords.length === 0) return <>{text}</>;

    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    const escapedKeywords = sortedKeywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    
    const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
    
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const isMatch = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        if (highlightStyle === 'background') {
          return (
            <span key={i} className="text-black px-1.5 py-0.5 mx-0.5 font-black inline-block leading-tight border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: highlightColor }}>
              {part}
            </span>
          );
        }
        return (
          <span key={i} className="font-bold drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{ color: highlightColor, textShadow: `0 0 12px ${highlightColor}80` }}>
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0a0a0a] text-white min-h-[calc(100vh-4rem)] p-6 rounded-2xl font-sans">
      {/* Left Panel: Controls */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff2e2e]"></div>
            Red Pill Studio
          </h2>
          <p className="text-neutral-400 text-sm">Create cinematic, hard-hitting social media posts.</p>
        </div>

        {/* Upload */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Image Source{template === 'versus' && versusImageMode === 'split' ? 's' : ''}
          </h3>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef2}
            onChange={handleImageUpload2}
          />
          
          {template === 'versus' && (
            <div className="flex bg-[#0a0a0a] rounded-lg p-1 mb-3 border border-neutral-800">
              <button
                onClick={() => setVersusImageMode('single')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${versusImageMode === 'single' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Single Image
              </button>
              <button
                onClick={() => setVersusImageMode('split')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${versusImageMode === 'split' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Split Images
              </button>
            </div>
          )}

          {template === 'versus' && versusImageMode === 'split' ? (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-2 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white text-xs font-medium rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
              >
                <Upload className="w-4 h-4" />
                {imageUrl ? 'Change Left' : 'Upload Left'}
              </button>
              <button
                onClick={() => fileInputRef2.current?.click()}
                className="flex-1 py-3 px-2 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white text-xs font-medium rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
              >
                <Upload className="w-4 h-4" />
                {imageUrl2 ? 'Change Right' : 'Upload Right'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {imageUrl ? 'Change Image' : 'Upload Image'}
            </button>
          )}
        </div>

        {/* Image Controls */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 flex flex-col gap-4">
          <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Image Adjustments
          </h3>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Subject Position</label>
            <div className="grid grid-cols-3 gap-2">
              {['left', 'center', 'right', 'top', 'bottom'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setImagePosition(pos)}
                  className={`py-1.5 px-2 rounded text-xs font-medium capitalize transition-all ${
                    imagePosition === pos 
                      ? 'bg-[#ff2e2e] text-white' 
                      : 'bg-[#0a0a0a] text-neutral-400 border border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">Light Rays Effect</label>
            <button
              onClick={() => setEnableLightRays(!enableLightRays)}
              className={`w-10 h-5 rounded-full relative transition-colors ${enableLightRays ? 'bg-[#ff2e2e]' : 'bg-neutral-700'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${enableLightRays ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        {/* Text Controls */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <Type className="w-4 h-4" /> Content
            </h3>
            <button
              onClick={generateText}
              disabled={isGeneratingText}
              className="text-xs bg-[#ff2e2e]/10 text-[#ff2e2e] hover:bg-[#ff2e2e]/20 px-2 py-1 rounded flex items-center gap-1 transition-colors"
            >
              {isGeneratingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              AI Generate
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">Enable Red Pill Title</label>
            <button
              onClick={() => setEnableRedPillTitle(!enableRedPillTitle)}
              className={`w-10 h-5 rounded-full relative transition-colors ${enableRedPillTitle ? 'bg-[#ff2e2e]' : 'bg-neutral-700'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${enableRedPillTitle ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>

          {enableRedPillTitle && (
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  Title Vertical Position
                  {getSafeTitlePosition() !== titlePositionY && (
                    <span className="text-[9px] bg-[#ff2e2e]/20 text-[#ff2e2e] px-1.5 py-0.5 rounded border border-[#ff2e2e]/30" title="Auto-adjusted to avoid covering the subject's face">
                      Auto-Avoid
                    </span>
                  )}
                </label>
                <span className="text-xs text-neutral-400 font-mono">{getSafeTitlePosition()}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="98"
                value={titlePositionY}
                onChange={(e) => setTitlePositionY(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff2e2e]"
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-2 mt-2">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">Enable Punchline</label>
            <button
              onClick={() => setEnablePunchline(!enablePunchline)}
              className={`w-10 h-5 rounded-full relative transition-colors ${enablePunchline ? 'bg-[#ff2e2e]' : 'bg-neutral-700'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${enablePunchline ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>

          {enablePunchline && (
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-neutral-500 uppercase tracking-wider">Punchline Position</label>
                <span className="text-xs text-neutral-400 font-mono">{punchlinePositionY}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="98"
                value={punchlinePositionY}
                onChange={(e) => setPunchlinePositionY(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff2e2e]"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 mb-2 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-500 uppercase tracking-wider">Body Font Size</label>
              <span className="text-xs text-neutral-400 font-mono">{bodyFontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="48"
              value={bodyFontSize}
              onChange={(e) => setBodyFontSize(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff2e2e]"
            />
          </div>

          <div className="flex flex-col gap-2 mb-2 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-500 uppercase tracking-wider">Body Text Position</label>
              <span className="text-xs text-neutral-400 font-mono">{contentPositionY}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="98"
              value={contentPositionY}
              onChange={(e) => setContentPositionY(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff2e2e]"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider mt-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-[#ff2e2e] focus:ring-1 focus:ring-[#ff2e2e] outline-none transition-all"
            />
          </div>

          {template === 'versus' && (
            <div className="flex flex-col gap-4 mb-2 mt-2">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Concept 1 (Left)</label>
                  <input
                    type="text"
                    value={versusLeft}
                    onChange={(e) => setVersusLeft(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-[#ff2e2e] focus:ring-1 focus:ring-[#ff2e2e] outline-none transition-all mb-3"
                  />
                  <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Points (One per line)</label>
                  <textarea
                    value={versusLeftPoints}
                    onChange={(e) => setVersusLeftPoints(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-[#ff2e2e] focus:ring-1 focus:ring-[#ff2e2e] outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Concept 2 (Right)</label>
                  <input
                    type="text"
                    value={versusRight}
                    onChange={(e) => setVersusRight(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-[#ff2e2e] focus:ring-1 focus:ring-[#ff2e2e] outline-none transition-all mb-3"
                  />
                  <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Points (One per line)</label>
                  <textarea
                    value={versusRightPoints}
                    onChange={(e) => setVersusRightPoints(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-[#ff2e2e] focus:ring-1 focus:ring-[#ff2e2e] outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {template !== 'versus' && (
            <>
              <div>
                <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Body Text</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-[#ff2e2e] focus:ring-1 focus:ring-[#ff2e2e] outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Words to Highlight (comma separated)</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customHighlights}
                      onChange={(e) => setCustomHighlights(e.target.value)}
                      placeholder="e.g. sleepwalking, comfort"
                      className="flex-1 bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-[#ff2e2e] focus:ring-1 focus:ring-[#ff2e2e] outline-none transition-all"
                    />
                    <input
                      type="color"
                      value={highlightColor}
                      onChange={(e) => setHighlightColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                      title="Highlight Color"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHighlightStyle('text')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${highlightStyle === 'text' ? 'bg-[#ff2e2e] text-white' : 'bg-[#1a1a1a] text-neutral-400 hover:bg-[#2a2a2a]'}`}
                    >
                      Text Color
                    </button>
                    <button
                      onClick={() => setHighlightStyle('background')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${highlightStyle === 'background' ? 'bg-[#ff2e2e] text-white' : 'bg-[#1a1a1a] text-neutral-400 hover:bg-[#2a2a2a]'}`}
                    >
                      Background
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Punchline</label>
                <input
                  type="text"
                  value={punchline}
                  onChange={(e) => setPunchline(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-[#ff2e2e] focus:ring-1 focus:ring-[#ff2e2e] outline-none transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Templates */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> Layout Style
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(['hero', 'split', 'card', 'quote', 'warning', 'versus'] as TemplateType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
                  template === t 
                    ? 'bg-[#ff2e2e] text-white' 
                    : 'bg-[#0a0a0a] text-neutral-400 border border-neutral-800 hover:border-neutral-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload('png')}
              disabled={isDownloading || !imageUrl}
              className="flex-1 py-4 px-4 bg-[#ff2e2e] hover:bg-[#e62929] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(255,46,46,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              PNG
            </button>
            <button
              onClick={() => handleDownload('jpg')}
              disabled={isDownloading || !imageUrl}
              className="flex-1 py-4 px-4 bg-[#ff2e2e] hover:bg-[#e62929] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(255,46,46,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              JPG
            </button>
          </div>
          
          {/* Save to Library */}
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving || !title || !user}
            title={!user ? "Sign in to save" : ""}
            className="w-full py-4 px-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {user ? 'Save to Library' : 'Sign in to Save'}
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

      {/* Right Panel: Preview */}
      <div className="lg:col-span-8 flex items-center justify-center bg-[#111] rounded-xl border border-neutral-800 overflow-hidden p-4 lg:p-8">
        <div className="relative w-full max-w-[540px] aspect-square shadow-2xl">
          {/* 1080x1080 Canvas Container */}
          <div 
            ref={previewRef}
            className="absolute inset-0 bg-black overflow-hidden flex flex-col"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Background Image with Cinematic Filters */}
            {(imageUrl || (template === 'versus' && imageUrl2)) ? (
              <div className="absolute inset-0 z-0 bg-black flex">
                {/* 1. VARIABLE LAYER: Base Image(s) */}
                {template === 'versus' ? (
                  versusImageMode === 'split' ? (
                    <>
                      {/* Left Side (Nice Guy) */}
                      <div className="w-1/2 h-full relative overflow-hidden border-r border-neutral-800/50">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt="Left Background" 
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                            style={{
                              filter: 'contrast(1.1) saturate(0.2) brightness(0.6)',
                              objectPosition: imagePosition
                            }}
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-neutral-900"></div>
                        )}
                        {/* Left side specific overlay (cooler/darker) */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 mix-blend-multiply"></div>
                      </div>
                      
                      {/* Right Side (Bad Boy) */}
                      <div className="w-1/2 h-full relative overflow-hidden">
                        {imageUrl2 ? (
                          <img 
                            src={imageUrl2} 
                            alt="Right Background" 
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                            style={{
                              filter: 'contrast(1.4) saturate(0.8) brightness(0.7) sepia(0.3) hue-rotate(-15deg)',
                              objectPosition: imagePosition
                            }}
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[#1a0505]"></div>
                        )}
                        {/* Right side specific overlay (warmer/reddish) */}
                        <div className="absolute inset-0 bg-gradient-to-l from-[#ff2e2e]/20 to-black/40 mix-blend-overlay"></div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 w-full h-full">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Background" 
                          className="absolute inset-0 w-full h-full object-cover opacity-90"
                          style={{
                            filter: 'contrast(1.2) saturate(0.5) brightness(0.6)',
                            objectPosition: imagePosition
                          }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-neutral-900"></div>
                      )}
                      {/* Split Overlays over the single image */}
                      <div className="absolute inset-y-0 left-0 w-1/2 border-r border-neutral-800/50 bg-gradient-to-r from-black/80 to-black/40 mix-blend-multiply"></div>
                      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#ff2e2e]/20 to-black/40 mix-blend-overlay"></div>
                    </div>
                  )
                ) : (
                  <img 
                    src={imageUrl!} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-90 absolute inset-0"
                    style={{
                      filter: 'contrast(1.3) saturate(0.5) brightness(0.7) sepia(0.2) hue-rotate(-15deg)',
                      objectPosition: imagePosition
                    }}
                    crossOrigin="anonymous"
                  />
                )}
                
                {/* 2. CONSTANT RED PILL DESIGN LAYER (Applies over both) */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Dark cinematic gradient (top/bottom) */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/90"></div>
                  
                  {/* Vignette */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]"></div>
                  
                  {/* Subtle red glow accents (light leaks) */}
                  <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ff2e2e]/20 rounded-full blur-[100px] mix-blend-screen"></div>
                  <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-[#ff2e2e]/15 rounded-full blur-[120px] mix-blend-screen"></div>
                  
                  {/* Optional Light Rays */}
                  {enableLightRays && (
                    <>
                      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-white/10 to-transparent blur-2xl transform -skew-x-12 mix-blend-screen"></div>
                      <div className="absolute top-0 right-1/4 w-1/3 h-full bg-gradient-to-b from-[#ff2e2e]/15 to-transparent blur-3xl transform skew-x-12 mix-blend-screen"></div>
                    </>
                  )}

                  {/* Digital Textures: Scanlines */}
                  <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }}></div>
                  
                  {/* Digital Textures: Grain / Noise */}
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full opacity-[0.12] mix-blend-overlay">
                    <filter id="noiseFilter">
                      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
                  </svg>
                  
                  {/* Digital Textures: Matrix-style particles */}
                  <div className="absolute inset-0 opacity-20 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at center, #ff2e2e 1px, transparent 1.5px)', backgroundSize: '32px 32px', backgroundPosition: '0 0, 16px 16px' }}></div>
                  
                  {/* Glitch Edge / Inner Shadow */}
                  <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(255,46,46,0.2)]"></div>

                  {/* Layout-specific extra darkening if needed for readability */}
                  {template === 'split' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent w-3/4"></div>
                  )}
                  {template === 'card' && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>
                  )}
                  {template === 'quote' && (
                    <div className="absolute inset-0 bg-black/50"></div>
                  )}
                  {template === 'warning' && (
                    <div className="absolute inset-0 border-[12px] border-[#ff2e2e]/80 z-50 mix-blend-overlay"></div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 z-0 bg-neutral-900 flex items-center justify-center">
                <p className="text-neutral-600 font-medium">Upload an image to preview</p>
              </div>
            )}

            {/* Content Overlays based on Template */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col">
              
              {/* Absolute Red Pill Title */}
              {enableRedPillTitle && (
                <div 
                  className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-500"
                  style={{ top: `${getSafeTitlePosition()}%`, transform: `translateY(-${getSafeTitlePosition()}%)` }}
                >
                  <div className="relative group pointer-events-auto cursor-pointer">
                    {/* Outer Glow (Using box-shadow instead of blur for better export compatibility) */}
                    <div className="absolute inset-0 rounded-full shadow-[0_0_20px_5px_rgba(255,0,0,0.4)] pointer-events-none animate-pulse group-hover:shadow-[0_0_30px_10px_rgba(255,0,0,0.6)] transition-all duration-500"></div>
                    
                    {/* Pill Capsule */}
                    <div className="relative inline-flex items-center justify-center px-8 py-3 rounded-full bg-gradient-to-b from-[#cc0000] via-[#8a0000] to-[#4d0000] shadow-[0_0_15px_rgba(255,0,0,0.4),0_10px_20px_rgba(0,0,0,0.8),inset_0_2px_8px_rgba(255,255,255,0.5),inset_0_-4px_16px_rgba(0,0,0,0.9)] overflow-hidden border border-[#ff6666]/50 animate-glow-pulse">
                      
                      {/* Specular Highlight (Glossy reflection) */}
                      <div className="absolute top-[2%] left-[5%] right-[5%] h-[40%] bg-gradient-to-b from-white/40 to-white/0 rounded-full pointer-events-none"></div>
                      <div className="absolute top-[5%] left-[15%] right-[15%] h-[20%] bg-gradient-to-b from-white/60 to-white/0 rounded-full pointer-events-none blur-[1px]"></div>
                      
                      {/* Bottom ambient occlusion */}
                      <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

                      {/* Noise texture */}
                      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full opacity-[0.12] mix-blend-overlay pointer-events-none">
                        <filter id="pillNoise3">
                          <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch"/>
                        </filter>
                        <rect width="100%" height="100%" filter="url(#pillNoise3)"/>
                      </svg>

                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_5px_#fff] animate-pulse"></div>
                        <span className="font-black uppercase tracking-[0.25em] text-[16px] md:text-[18px] text-center leading-none mt-0.5 flex gap-2">
                          <span className="text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]">RED</span>
                          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">PILL</span>
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-black/90 shadow-[0_0_5px_rgba(0,0,0,0.8)] animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {template === 'hero' && (
                <div className="h-full w-full relative">
                  {/* Top: Title */}
                  {!enableRedPillTitle && (
                    <div className="absolute top-4 left-0 right-0 flex justify-center">
                      <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-[0.2em] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,1)] mt-2">
                        {renderHighlightedText(title)}
                      </h1>
                    </div>
                  )}
                  
                  {/* Center: Content */}
                  <div className="absolute left-0 right-0 flex justify-center px-4 transition-all duration-500"
                       style={{ top: `${contentPositionY}%`, transform: `translateY(-${contentPositionY}%)` }}>
                    <p className="text-center text-neutral-200 font-medium leading-relaxed max-w-[85%] drop-shadow-[0_4px_12px_rgba(0,0,0,1)]" style={{ fontSize: `${bodyFontSize}px` }}>
                      {renderBodyText(content)}
                    </p>
                  </div>
                  
                  {/* Bottom: Punchline */}
                  {enablePunchline && (
                    <div className="absolute left-0 right-0 flex justify-center z-40 transition-all duration-500"
                         style={{ top: `${punchlinePositionY}%`, transform: `translateY(-${punchlinePositionY}%)` }}>
                      <div className="inline-block bg-[#ff2e2e] text-white px-8 py-2.5 font-black uppercase tracking-[0.25em] text-xs md:text-sm shadow-[0_0_20px_rgba(255,46,46,0.5)] transform -skew-x-12">
                        <span className="block transform skew-x-12 drop-shadow-md">{punchline}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {template === 'split' && (
                <div className="h-full w-full relative">
                  <div className="absolute left-8 max-w-[65%] transition-all duration-500"
                       style={{ top: `${contentPositionY}%`, transform: `translateY(-${contentPositionY}%)` }}>
                    <div className="w-12 h-1 bg-[#ff2e2e] mb-6 shadow-[0_0_10px_rgba(255,46,46,0.8)]"></div>
                    {!enableRedPillTitle && (
                      <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
                        {renderHighlightedText(title)}
                      </h1>
                    )}
                    <p className="text-neutral-300 font-medium leading-relaxed drop-shadow-[0_4px_12px_rgba(0,0,0,1)]" style={{ fontSize: `${bodyFontSize}px` }}>
                      {renderBodyText(content)}
                    </p>
                  </div>
                  
                  {enablePunchline && (
                    <div className="absolute left-8 transition-all duration-500"
                         style={{ top: `${punchlinePositionY}%`, transform: `translateY(-${punchlinePositionY}%)` }}>
                      <div className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-[#ff2e2e] shadow-[0_0_8px_rgba(255,46,46,0.8)]"></div>
                        <p className="text-sm md:text-base font-black text-white uppercase tracking-[0.2em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                          {punchline}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {template === 'card' && (
                <div className="h-full w-full relative">
                  <div className="absolute left-0 right-0 flex justify-center transition-all duration-500"
                       style={{ top: `${contentPositionY}%`, transform: `translateY(-${contentPositionY}%)` }}>
                    <div className="w-full max-w-[85%] bg-black/80 backdrop-blur-md border border-neutral-800/80 p-8 flex flex-col items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                      {!enableRedPillTitle && (
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-6 pb-6 border-b border-neutral-800 w-full drop-shadow-md">
                          {renderHighlightedText(title)}
                        </h1>
                      )}
                      <p className="text-neutral-300 font-medium leading-relaxed" style={{ fontSize: `${bodyFontSize}px` }}>
                        {renderBodyText(content)}
                      </p>
                    </div>
                  </div>
                  
                  {enablePunchline && (
                    <div className="absolute left-0 right-0 flex justify-center transition-all duration-500"
                         style={{ top: `${punchlinePositionY}%`, transform: `translateY(-${punchlinePositionY}%)` }}>
                      <div className="inline-block bg-[#ff2e2e] text-black px-6 py-2 font-black uppercase tracking-widest text-xs md:text-sm shadow-[0_4px_15px_rgba(255,46,46,0.4)] rounded-sm">
                        {punchline}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {template === 'quote' && (
                <div className="h-full w-full relative">
                  <div className="absolute left-0 right-0 flex justify-center px-6 transition-all duration-500"
                       style={{ top: `${contentPositionY}%`, transform: `translateY(-${contentPositionY}%)` }}>
                    <div className="text-center">
                      <span className="text-6xl text-[#ff2e2e] font-serif leading-none block mb-4 drop-shadow-[0_0_15px_rgba(255,46,46,0.5)]">"</span>
                      <p className="font-bold text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,1)]" style={{ fontSize: `${bodyFontSize + 4}px` }}>
                        {renderBodyText(content)}
                      </p>
                    </div>
                  </div>
                  
                  {enablePunchline && (
                    <div className="absolute left-0 right-0 flex justify-center transition-all duration-500"
                         style={{ top: `${punchlinePositionY}%`, transform: `translateY(-${punchlinePositionY}%)` }}>
                      <div className="flex items-center justify-center gap-4">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-[#ff2e2e]"></div>
                        <p className="text-sm font-black text-[#ff2e2e] uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(255,46,46,0.6)]">
                          {punchline}
                        </p>
                        <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-[#ff2e2e]"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {template === 'warning' && (
                <div className="h-full w-full relative">
                  {!enableRedPillTitle && (
                    <div className="absolute top-4 left-4 right-4 bg-[#ff2e2e] text-black font-black uppercase tracking-widest text-center py-3 text-xl shadow-[0_0_20px_rgba(255,46,46,0.4)]">
                      {title}
                    </div>
                  )}
                  
                  <div className="absolute left-4 right-4 transition-all duration-500"
                       style={{ top: `${contentPositionY}%`, transform: `translateY(-${contentPositionY}%)` }}>
                    <div className="bg-black/95 p-6 border-l-4 border-[#ff2e2e] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                      <p className="text-white font-bold leading-snug drop-shadow-md" style={{ fontSize: `${bodyFontSize}px` }}>
                        {renderBodyText(content)}
                      </p>
                    </div>
                  </div>
                  
                  {enablePunchline && (
                    <div className="absolute left-8 transition-all duration-500"
                         style={{ top: `${punchlinePositionY}%`, transform: `translateY(-${punchlinePositionY}%)` }}>
                      <div className="inline-flex items-center gap-3 bg-black/80 border border-[#ff2e2e]/60 px-6 py-2 rounded-sm shadow-[0_0_15px_rgba(255,46,46,0.3)]">
                        <AlertTriangle className="w-5 h-5 text-[#ff2e2e] animate-pulse" />
                        <p className="text-xs md:text-sm font-black text-[#ff2e2e] uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(255,46,46,0.5)]">
                          {punchline}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {template === 'versus' && (
                <div className="h-full w-full relative flex items-center justify-center">
                  {!enableRedPillTitle && (
                    <div className="absolute top-8 left-0 right-0 flex justify-center z-50">
                      <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-[0.2em] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
                        {renderHighlightedText(title)}
                      </h1>
                    </div>
                  )}
                  
                  <div className="absolute left-0 right-0 flex flex-col items-center px-4 md:px-12 transition-all duration-500"
                       style={{ top: `${Math.min(90, contentPositionY + 8)}%`, transform: `translateY(-50%)`, width: '100%' }}>
                    
                    <div className="w-full max-w-2xl bg-transparent border border-white/20 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                      {/* Header */}
                      <div className="flex border-b border-white/20 relative">
                        <div className="flex-1 p-3 md:p-5 text-center bg-black/10">
                          <h2 className="text-lg md:text-xl font-bold text-neutral-300 uppercase tracking-widest drop-shadow-md">
                            {versusLeft}
                          </h2>
                        </div>
                        <div className="flex-1 p-3 md:p-5 text-center bg-gradient-to-b from-[#ff2e2e]/20 to-transparent">
                          <h2 className="text-lg md:text-xl font-bold text-[#ff2e2e] uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,46,46,0.6)]">
                            {versusRight}
                          </h2>
                        </div>
                        
                        {/* VS Badge */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center z-20 shadow-lg">
                          <span className="text-neutral-300 font-mono text-[10px] md:text-xs drop-shadow-md">VS</span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="flex">
                        <div className="flex-1 p-4 md:p-6 border-r border-white/20 bg-black/10">
                          <ul className="space-y-3 md:space-y-4">
                            {versusLeftPoints.split('\n').map((pt, i) => pt.trim() && (
                              <li key={i} className="flex items-start gap-2 md:gap-3 text-neutral-300">
                                <X className="w-3 h-3 md:w-4 md:h-4 text-neutral-500 shrink-0 mt-1 drop-shadow-md" />
                                <span className="text-xs md:text-base font-medium leading-snug drop-shadow-md" style={{ fontSize: `${Math.max(10, bodyFontSize * 0.75)}px` }}>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex-1 p-4 md:p-6 bg-gradient-to-b from-[#ff2e2e]/10 to-transparent">
                          <ul className="space-y-3 md:space-y-4">
                            {versusRightPoints.split('\n').map((pt, i) => pt.trim() && (
                              <li key={i} className="flex items-start gap-2 md:gap-3 text-white">
                                <Check className="w-3 h-3 md:w-4 md:h-4 text-[#ff2e2e] shrink-0 mt-1 drop-shadow-[0_0_5px_rgba(255,46,46,0.8)]" />
                                <span className="text-xs md:text-base font-bold leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ fontSize: `${Math.max(10, bodyFontSize * 0.75)}px` }}>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Library Section */}
      <div className="lg:col-span-12 mt-8 pt-8 border-t border-neutral-800">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          My Saved Red Pill Posts
          {savedPosts.length > 0 && <span className="text-sm font-normal text-neutral-400">({savedPosts.length})</span>}
        </h3>
        
        {loadingSavedPosts && (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-500" />
          </div>
        )}
        
        {!loadingSavedPosts && savedPosts.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <p>No saved posts yet. Create and save your first Red Pill post!</p>
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
                      title="Delete"
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

