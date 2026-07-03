import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Loader as Loader2,
  Image as ImageIcon,
  FileText,
  Ribbon,
  Award,
  Medal,
  Trophy,
  Crown,
  Target,
  Music,
  Heart,
  Sparkles,
  Dumbbell,
  Globe,
  TreePine,
  Film,
  Landmark,
  ScrollText,
  Car,
  Cpu,
  Languages,
  Lightbulb,
  GraduationCap,
  Users,
  Newspaper,
  User as UserIcon,
  LineChart,
  History,
  PawPrint,
  Dribbble as BasketballIcon,
} from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SavedPost } from '../types';
import {
  savePost,
  updatePost,
  getCustomCategoryIcons,
  saveCustomCategoryIcon,
  deleteCustomCategoryIcon,
} from '../lib/postService';

const CATEGORIES = [
  'sport', 'basket', 'nba', 'environnement', 'loisirs', 'cinema', 'politique',
  'géopolitique', 'géographie', 'histoire', 'animaux', 'voitures', 'technologie',
  'langues', 'savoir', 'philosophie', 'société', 'culture', 'actualités',
  'people', 'économie', 'musique', 'style de vie', 'santé',
];

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'sport': Dumbbell,
  'basket': BasketballIcon,
  'nba': BasketballIcon,
  'environnement': TreePine,
  'loisirs': Sparkles,
  'cinema': Film,
  'politique': Landmark,
  'géopolitique': Globe,
  'géographie': Globe,
  'histoire': History,
  'animaux': PawPrint,
  'voitures': Car,
  'technologie': Cpu,
  'langues': Languages,
  'savoir': GraduationCap,
  'philosophie': Lightbulb,
  'société': Users,
  'culture': ScrollText,
  'actualités': Newspaper,
  'people': UserIcon,
  'économie': LineChart,
  'musique': Music,
  'style de vie': Sparkles,
  'santé': Heart,
};

const CANVAS_W = 1080;
const CANVAS_H = 1620;

const RANK_COLORS: Record<number, string> = {
  5: '#FF6B00',
  4: '#FFB300',
  3: '#FFD700',
  2: '#CCFF00',
  1: '#39FF14',
};

const RANK_ICONS: Record<number, React.ComponentType<any>> = {
  5: Ribbon,
  4: Award,
  3: Medal,
  2: Trophy,
  1: Crown,
};

const ROW_H: Record<number, number> = { 5: 222, 4: 222, 3: 222, 2: 222, 1: 268 };

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

function PlaceholderIcon({ size }: { size: number }) {
  return (
    <svg
      width={size * 0.55}
      height={size * 0.55}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.18)"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M2 18l6-7 5 5 3-3 6 5" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

const initialItemsFactory = () =>
  [5, 4, 3, 2, 1].map(rank => ({
    rank,
    title: 'YOUR ITEM TITLE HERE',
    description: 'Your short description or key metric goes here. Keep it simple and easy to understand.',
    imageUrl: null as string | null,
  }));

interface Top5GeneratorProps {
  editingPost?: SavedPost | null;
  onClearEdit?: () => void;
}

export function Top5Generator({ editingPost, onClearEdit }: Top5GeneratorProps = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [categorySubtitle, setCategorySubtitle] = useState('YOUR CATEGORY HERE');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<Record<string, ReturnType<typeof initialItemsFactory>>>({});
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryIcon, setCustomCategoryIcon] = useState<string | null>(null);
  const [savedCategoryIcons, setSavedCategoryIcons] = useState<Record<string, string>>({});
  const [assignToCategory, setAssignToCategory] = useState<string>('');
  const customIconInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialItemsFactory);

  // Load saved items when selected category changes
  useEffect(() => {
    // Si on est en mode édition, on ne charge pas la catégorie locale par-dessus
    if (editingPost) return;
    if (selectedCategory) {
      const savedData = categoryData[selectedCategory] || initialItemsFactory();
      setItems(savedData);
    }
  }, [selectedCategory, editingPost]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load editing post data
  useEffect(() => {
    if (editingPost && editingPost.metadata) {
      setCategorySubtitle(editingPost.metadata.categorySubtitle as string || '');
      if (editingPost.metadata.items && Array.isArray(editingPost.metadata.items)) {
        setItems(editingPost.metadata.items as any[]);
      }
      setSelectedCategory(null);
      setIsCustomCategory(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingPost]);

  const persistCurrentCategory = () => {
    if (selectedCategory) {
      setCategoryData(prev => ({ ...prev, [selectedCategory]: items }));
    }
  };

  const handleSelectCategory = (cat: string) => {
    persistCurrentCategory();
    setIsCustomCategory(false);
    setSelectedCategory(cat);
    const lower = cat.toLowerCase();
    setCategorySubtitle(lower.charAt(0).toUpperCase() + lower.slice(1));
  };

  const handleSelectCustomCategory = () => {
    persistCurrentCategory();
    setSelectedCategory(null);
    setIsCustomCategory(true);
    setCategorySubtitle('Custom Category');
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [previewScale, setPreviewScale] = useState(0.42);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setPreviewScale(e.contentRect.width / CANVAS_W);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) loadSavedIcons(u.uid);
      else setSavedCategoryIcons({});
    });
    return unsub;
  }, []);

  const loadSavedIcons = async (userId: string) => {
    const icons = await getCustomCategoryIcons(userId);
    setSavedCategoryIcons(icons);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    setItems(prev => {
      const next = prev.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      if (selectedCategory) {
        setCategoryData(prevData => ({ ...prevData, [selectedCategory]: next }));
      }
      return next;
    });
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) handleItemChange(index, 'imageUrl', ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) setCustomCategoryIcon(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAssignIconToCategories = async () => {
    if (!customCategoryIcon || !assignToCategory || !user) return;
    const saved = await saveCustomCategoryIcon(user.uid, assignToCategory, customCategoryIcon);
    await loadSavedIcons(user.uid);
    if (saved) {
      alert(`Icône sauvegardée pour ${assignToCategory.charAt(0).toUpperCase() + assignToCategory.slice(1)} !`);
    } else {
      alert(`L'icône n'a pas pu être sauvegardée.`);
    }
  };

  const handleRemoveSavedIcon = async (category: string) => {
    if (!user) return;
    await deleteCustomCategoryIcon(user.uid, category);
    await loadSavedIcons(user.uid);
  };

  const exportOptions = {
    cacheBust: true,
    pixelRatio: 2,
    width: CANVAS_W,
    height: CANVAS_H,
    style: { transform: 'scale(1)', transformOrigin: 'top left' },
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    if (!previewRef.current) return;
    try {
      setIsDownloading(true);
      await new Promise(r => setTimeout(r, 100));
      const dataUrl =
        format === 'jpg'
          ? await toJpeg(previewRef.current, { ...exportOptions, quality: 0.95 })
          : await toPng(previewRef.current, { ...exportOptions, quality: 0.95 });
      const a = document.createElement('a');
      a.download = `top-5-${Date.now()}.${format}`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!user) { setSaveError('Please sign in to save posts'); return; }
    if (!items.every(i => i.imageUrl)) { setSaveError('Please upload an image for all 5 ranks.'); return; }
    setIsSaving(true);
    setSaveError(null);
    try {
      await new Promise(r => setTimeout(r, 100));
      const imageData = await toPng(previewRef.current!, { ...exportOptions, quality: 0.95 });
      const post: SavedPost = {
        type: 'top5',
        title: `Top 5: ${categorySubtitle}`,
        imageUrl: imageData,
        authorName: user.displayName || 'Anonymous',
        metadata: {
          firebaseUid: user.uid,
          categorySubtitle,
          // Conserver les URLs des images dans les metadata pour pouvoir les recharger plus tard
          items: items.map(i => ({ ...i })),
        },
      };
      
      if (editingPost && editingPost.id) {
        await updatePost(editingPost.id, post);
        alert('Updated successfully!');
      } else {
        await savePost(post);
        alert('Saved successfully!');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportTxt = () => {
    const txtContent = `TOP 5: ${categorySubtitle || 'YOUR CATEGORY HERE'}\n\n${items
      .map(item => `#${item.rank}\n${item.title}\n${item.description}\n`)
      .join('\n')}\n`;
    const blob = new Blob([`\uFEFF${txtContent}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `top5-${(categorySubtitle || 'export').replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const renderCategoryIcon = (side: 'left' | 'right') => {
    if (isCustomCategory && customCategoryIcon) {
      return (
        <img
          src={customCategoryIcon}
          alt="Custom Icon"
          style={{ width: 42, height: 42, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}
        />
      );
    }
    if (selectedCategory && savedCategoryIcons[selectedCategory]) {
      return (
        <img
          src={savedCategoryIcons[selectedCategory]}
          alt={`${selectedCategory} Icon`}
          style={{ width: 42, height: 42, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}
        />
      );
    }
    const Icon = selectedCategory ? (CATEGORY_ICONS[selectedCategory] ?? Target) : Target;
    return <Icon size={42} color="#888" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }} />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0a0a0a] text-white min-h-[calc(100vh-4rem)] p-6 rounded-2xl font-sans">

      {/* ── Controls ── */}
      <div className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            Top 5 Generator
          </h2>
          <p className="text-neutral-400 text-sm">Create breathtaking Top 5 rankings.</p>
        </div>

        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800">
          <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Category Subtitle</label>
          <textarea
            value={categorySubtitle}
            onChange={e => setCategorySubtitle(e.target.value)}
            rows={2}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none mb-4"
            placeholder="YOUR CATEGORY HERE"
          />

          <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Select Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : 'bg-[#0a0a0a] text-neutral-400 border border-neutral-800 hover:border-neutral-600'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={handleSelectCustomCategory}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isCustomCategory
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                  : 'bg-[#0a0a0a] text-neutral-400 border border-neutral-800 hover:border-neutral-600'
              }`}
            >
              Custom
            </button>
          </div>

          {isCustomCategory && (
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Custom Category Icon</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={customIconInputRef}
                  onChange={handleCustomIconUpload}
                />
                <div
                  onClick={() => customIconInputRef.current?.click()}
                  className="w-20 h-20 bg-[#0a0a0a] border border-neutral-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 transition-all overflow-hidden"
                >
                  {customCategoryIcon
                    ? <img src={customCategoryIcon} alt="Custom Icon" className="w-full h-full object-contain" />
                    : <ImageIcon className="w-6 h-6 text-neutral-600" />}
                </div>
                <div className="flex-grow flex flex-col gap-2">
                  <p className="text-xs text-neutral-400">Upload your custom icon or logo (PNG with transparency recommended)</p>
                  {customCategoryIcon && (
                    <>
                      <div className="flex gap-2">
                        <select
                          value={assignToCategory}
                          onChange={e => setAssignToCategory(e.target.value)}
                          className="flex-grow bg-[#0a0a0a] border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="">Sélectionner une catégorie...</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssignIconToCategories}
                          disabled={!assignToCategory}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs rounded transition-colors"
                        >
                          Sauvegarder
                        </button>
                      </div>
                      <button
                        onClick={() => setCustomCategoryIcon(null)}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider self-start"
                      >
                        Supprimer l'icône temporaire
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Saved Custom Icons */}
          {Object.keys(savedCategoryIcons).length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <label className="block text-xs text-neutral-500 mb-3 uppercase tracking-wider">Icônes personnalisées sauvegardées</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(savedCategoryIcons).map(([category, iconUrl]) => (
                  <div key={category} className="flex items-center gap-2 bg-[#0a0a0a] border border-neutral-800 rounded px-2 py-2">
                    <img src={iconUrl} alt={category} className="w-8 h-8 object-contain" />
                    <span className="text-xs text-neutral-300 flex-grow">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <button
                      onClick={() => handleRemoveSavedIcon(category)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(selectedCategory || isCustomCategory) && (
            <button
              onClick={() => {
                persistCurrentCategory();
                setSelectedCategory(null);
                setIsCustomCategory(false);
                setCustomCategoryIcon(null);
                setCategorySubtitle('YOUR CATEGORY HERE');
              }}
              className="mt-3 text-[10px] text-neutral-500 hover:text-emerald-500 transition-colors uppercase tracking-widest"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Item editors */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const color = RANK_COLORS[item.rank];
            return (
              <div key={item.rank} className="bg-[#141414] p-4 rounded-xl border border-neutral-800">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <span style={{ color }}>#{item.rank}</span>
                  <span className="text-neutral-400">Item Details</span>
                </h3>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={el => { fileInputRefs.current[index] = el; }}
                      onChange={e => handleImageUpload(index, e)}
                    />
                    <div
                      onClick={() => fileInputRefs.current[index]?.click()}
                      className="w-20 h-20 bg-[#0a0a0a] border border-neutral-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-all overflow-hidden"
                    >
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <ImageIcon className="w-6 h-6 text-neutral-600" />}
                    </div>
                  </div>
                  <div className="flex-grow flex flex-col gap-2">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => handleItemChange(index, 'title', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 outline-none text-sm"
                        placeholder="YOUR ITEM TITLE HERE"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Description</label>
                      <textarea
                        value={item.description}
                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 outline-none text-sm resize-none"
                        placeholder="Short description..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {saveError && (
          <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg border border-red-800">{saveError}</div>
        )}

        <div className="flex flex-col gap-3 pb-8">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleDownload('png')}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PNG
            </button>
            <button
              onClick={() => handleDownload('jpg')}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} JPEG
            </button>
            <button
              onClick={handleExportTxt}
              className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> TXT
            </button>
          </div>
          {editingPost ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={handleSaveToLibrary}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                Mettre à jour
              </button>
              <button
                onClick={() => {
                  if (onClearEdit) onClearEdit();
                  setItems(initialItemsFactory());
                  setCategorySubtitle('YOUR CATEGORY HERE');
                }}
                className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Annuler l'édition
              </button>
            </div>
          ) : (
            <button
              onClick={handleSaveToLibrary}
              disabled={isSaving}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {user ? 'Save to Library' : 'Sign in to Save'}
            </button>
          )}
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="lg:col-span-7 flex justify-center items-start overflow-auto">
        <div
          ref={containerRef}
          className="w-full max-w-[420px] xl:max-w-[460px] aspect-[2/3] relative border border-neutral-800 rounded-xl overflow-hidden shadow-2xl"
        >
          {/* CANVAS 1080 × 1620 */}
          <div
            ref={previewRef}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: `${CANVAS_W}px`,
              height: `${CANVAS_H}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              background: '#0a0a0f',
              fontFamily: 'Inter, system-ui, sans-serif',
              overflow: 'hidden',
            }}
          >
            {/* Top arc glow */}
            <div style={{
              position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
              width: 1100, height: 600,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(60,40,160,0.55) 0%, rgba(20,10,60,0.25) 55%, transparent 78%)',
              pointerEvents: 'none',
            }} />
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }} height="300" viewBox="0 0 1080 300" fill="none">
              <path d="M-30 300 Q540 -20 1110 300" stroke="rgba(90,60,200,0.2)" strokeWidth="1.5" fill="none" />
            </svg>

            {/* Sparkle dots */}
            {(
              [
                [108, 410, '#FFB300'], [972, 440, '#ffffff'],
                [52,  700, '#ffffff'], [1028, 680, '#FF6B00'],
                [78,  960, '#FFD700'], [1004, 940, '#ffffff'],
                [95, 1230, '#ffffff'], [986, 1210, '#CCFF00'],
                [125, 1470, '#39FF14'], [952, 1450, '#ffffff'],
              ] as [number, number, string][]
            ).map(([x, y, c], i) => (
              <div key={i} style={{
                position: 'absolute', left: x, top: y,
                width: 6, height: 6, borderRadius: '50%',
                background: c,
                boxShadow: `0 0 8px 2px ${c}99`,
                pointerEvents: 'none',
              }} />
            ))}

            {/* HEADER */}
            <div style={{ textAlign: 'center', paddingTop: 44, paddingBottom: 14 }}>
              <div style={{
                fontSize: 100, fontWeight: 900, fontStyle: 'italic',
                lineHeight: 1, letterSpacing: '-3px',
                background: 'linear-gradient(175deg, #ffffff 0%, #e8e8e8 30%, #b8b8b8 65%, #888 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.25)) drop-shadow(0 6px 18px rgba(0,0,0,0.95))',
              }}>
                TOP 5
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 30 }}>
                {renderCategoryIcon('left')}
                <span style={{
                  fontSize: 36, fontWeight: 900, letterSpacing: '5px',
                  color: '#aaaaaa', maxWidth: 700, textAlign: 'center', lineHeight: 1.3,
                }}>
                  {categorySubtitle || 'YOUR CATEGORY HERE'}
                </span>
                {renderCategoryIcon('right')}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                <div style={{
                  width: 260, height: 3, borderRadius: 2,
                  background: 'linear-gradient(90deg, #a855f7, #f97316)',
                }} />
              </div>
            </div>

            {/* CARD LIST */}
            <div style={{ padding: '30px 20px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {items.map(item => {
                const color = RANK_COLORS[item.rank];
                const rgb = hexToRgb(color);
                const rowH = ROW_H[item.rank];
                const IconComp = RANK_ICONS[item.rank];
                const isTop4 = item.rank >= 2 && item.rank <= 5;
                const isRank1 = item.rank === 1;

                const s = rowH / 222;
                const imgSize    = Math.round(176 * s);
                const badgeSize  = Math.round(65 * s);
                const rankColW   = Math.round(148 * s);
                const titleFont  = Math.round(34 * s);
                const descFont   = Math.round(22 * s);
                const barW       = Math.round(76 * s);
                const padV       = Math.round(20 * s);
                const rankNumberSize = isRank1 ? 140 : rankColW;
                const rankPadding = isRank1 ? 45 : 24;
                const marginLeft  = isRank1 ? 5 : 22;
                const persoTitleFont = isRank1 ? 36 : titleFont;

                const Separator = () => (
                  <div style={{
                    flexShrink: 0, width: 2, alignSelf: 'stretch',
                    margin: `0 ${isRank1 ? 13 : 18}px`,
                    display: 'flex', alignItems: 'center',
                  }}>
                    <div style={{
                      width: 2, height: '80%', borderRadius: 2,
                      background: `linear-gradient(180deg, transparent, ${color} 20%, ${color} 80%, transparent)`,
                      boxShadow: `0 0 8px rgba(${rgb},0.65)`,
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)',
                        width: 8, height: 8, borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 12px ${color}`,
                      }} />
                    </div>
                  </div>
                );

                return (
                  <div
                    key={item.rank}
                    style={{
                      height: rowH, borderRadius: 12,
                      border: `2px solid ${color}`,
                      background: 'rgba(255,255,255,0.04)',
                      boxShadow: `0 0 18px rgba(${rgb},0.35), 0 0 5px rgba(${rgb},0.18)`,
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden', position: 'relative',
                      flexShrink: 0,
                      padding: `${padV}px ${rankPadding}px`,
                      gap: 0,
                      boxSizing: 'border-box',
                      margin: isTop4 ? '0px 40px' : '0px 15px',
                    }}
                  >
                    {/* Glow dot */}
                    <div style={{
                      position: 'absolute', top: 8, right: 16,
                      width: 5, height: 5, borderRadius: '50%',
                      background: color, boxShadow: `0 0 8px ${color}`, opacity: 0.65,
                    }} />

                    {/* Icon box */}
                    <div style={{ flexShrink: 0, position: 'relative' }}>
                      <div style={{
                        width: imgSize, height: imgSize, borderRadius: 10,
                        background: '#1a1a2e', border: `1px solid rgba(${rgb},0.25)`,
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                          : <PlaceholderIcon size={imgSize} />}
                      </div>

                      {/* Badge */}
                      <div style={{
                        position: 'absolute', top: -badgeSize * 0.28, left: -badgeSize * 0.28,
                        width: badgeSize, height: badgeSize, borderRadius: '50%',
                        background: `radial-gradient(circle at 40% 40%, rgba(${rgb},0.5) 0%, rgba(10,10,20,0.65) 75%)`,
                        border: `2px solid ${color}`,
                        boxShadow: `0 0 14px rgba(${rgb},0.6), 0 0 4px rgba(${rgb},0.25)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconComp style={{
                          width: badgeSize * 0.75,
                          height: badgeSize * 0.75,
                          color,
                          strokeWidth: 2,
                          filter: `drop-shadow(0 0 3px ${color})`,
                        }} />
                      </div>
                    </div>

                    {/* Separator before rank number (ranks 2–5) */}
                    {!isRank1 && <Separator />}

                    {/* Rank number */}
                    <div style={{
                      width: rankNumberSize, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontSize: rankColW, fontWeight: 900, fontStyle: 'italic',
                        lineHeight: 1, color,
                        textShadow: `0 0 30px rgba(${rgb},0.7), 0 0 60px rgba(${rgb},0.3)`,
                        letterSpacing: '-2px', userSelect: 'none',
                      }}>
                        {item.rank}
                      </span>
                    </div>

                    {/* Separator after rank number (rank 1 only) */}
                    {isRank1 && <Separator />}

                    {/* Text content */}
                    <div style={{
                      flex: 1, marginLeft,
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      gap: 6, overflow: 'hidden',
                    }}>
                      <div style={{
                        fontSize: persoTitleFont, fontWeight: 800,
                        textTransform: 'uppercase', color: '#ffffff',
                        lineHeight: 1.1, letterSpacing: '0.3px',
                      }}>
                        {item.title || 'YOUR ITEM TITLE HERE'}
                      </div>

                      <div style={{
                        width: barW, height: 3, borderRadius: 2,
                        background: color, boxShadow: `0 0 7px rgba(${rgb},0.6)`,
                      }} />

                      <div style={{ fontSize: descFont, color: '#aaaaaa', lineHeight: 1.5, fontWeight: 400 }}>
                        {item.description || 'Your short description or key metric goes here.'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ground glow */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '90%', height: 120,
              background: 'radial-gradient(ellipse at 50% 100%, rgba(57,255,20,0.45) 0%, rgba(57,255,20,0.15) 40%, transparent 70%)',
              pointerEvents: 'none', zIndex: 10,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
