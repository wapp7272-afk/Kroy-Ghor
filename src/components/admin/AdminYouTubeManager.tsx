import React, { useState } from 'react';
import { 
  Youtube, 
  Play, 
  Save, 
  ExternalLink, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Video,
  Layers,
  Sliders,
  Tv
} from 'lucide-react';
import { SystemBannerSettings, YouTubeVideo } from '../../types';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../../utils/youtube';

interface AdminYouTubeManagerProps {
  settings: SystemBannerSettings;
  onUpdateSettings: (newSettings: SystemBannerSettings) => void;
  showToast?: (msg: string) => void;
}

export const AdminYouTubeManager: React.FC<AdminYouTubeManagerProps> = ({
  settings,
  onUpdateSettings,
  showToast = () => {},
}) => {
  const [videoUrl, setVideoUrl] = useState(settings.youtubeVideoUrl || 'https://www.youtube.com/watch?v=sU3FkmV9b70');
  const [channelUrl, setChannelUrl] = useState(settings.youtubeChannelUrl || 'https://www.youtube.com/@zeropicbd');
  const [sectionTitle, setSectionTitle] = useState(settings.youtubeSectionTitle || 'Featured YouTube Videos');
  const [sectionSubtitle, setSectionSubtitle] = useState(
    settings.youtubeSectionSubtitle ||
    'Watch authentic fragrance unboxings, batch code verification guides, and official product showcases directly from our channel.'
  );

  const [playlist, setPlaylist] = useState<YouTubeVideo[]>(() => {
    if (settings.youtubePlaylist && settings.youtubePlaylist.length > 0) {
      return settings.youtubePlaylist;
    }
    return [
      {
        id: 'yt-1',
        title: 'How to Identify 100% Original Perfumes & Check Batch Codes',
        urlOrId: 'sU3FkmV9b70',
        description: 'A comprehensive visual guide on verifying original batch codes, cellophane seals, and authentic fragrance flacons.',
        badge: 'Guide & Verification'
      },
      {
        id: 'yt-2',
        title: 'Top 5 Signature Fragrances For Men & Women in Bangladesh',
        urlOrId: 'dQw4w9WgXcQ',
        description: 'Expert fragrance review of Bleu de Chanel, Cool Water, and pure artisanal French EDP blends.',
        badge: 'Fragrance Review'
      },
      {
        id: 'yt-3',
        title: 'Zeropicbd Studio Unboxing & Lifestyle Haul',
        urlOrId: 'M7lc1UVf-VE',
        description: 'Unboxing our viral squishy silicone night lamps, luxury leather accessories, and collector building sets.',
        badge: 'Store Spotlight'
      }
    ];
  });

  // New video modal or inline adder
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoBadge, setNewVideoBadge] = useState('Spotlight');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extracted primary ID for preview
  const extractedPrimaryId = extractYouTubeId(videoUrl);
  const previewEmbedUrl = extractedPrimaryId ? getYouTubeEmbedUrl(extractedPrimaryId) : '';

  // Quick Preset Handlers
  const applyPreset = (type: 'perfume' | 'gadgets' | 'all') => {
    if (type === 'perfume') {
      setVideoUrl('https://www.youtube.com/watch?v=sU3FkmV9b70');
      setSectionTitle('Official Fragrance Spotlights & Unboxings');
      setSectionSubtitle('Real reviews of luxury perfumes, authentic batch checks, and designer scent breakdowns.');
    } else if (type === 'gadgets') {
      setVideoUrl('https://www.youtube.com/watch?v=M7lc1UVf-VE');
      setSectionTitle('Zeropicbd Lifestyle & Tech Showcase');
      setSectionSubtitle('Demos of ambient silicone glow lamps, Japanese building sets, and luxury accessories.');
    } else {
      setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      setSectionTitle('Featured YouTube Videos');
      setSectionSubtitle('Watch authentic fragrance unboxings, batch code verification guides, and official showcases.');
    }
    showToast(`✓ YouTube campaign preset loaded: ${type.toUpperCase()}`);
  };

  const handleAddPlaylistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      showToast('❌ Please provide both video title and URL / Video ID.');
      return;
    }

    const newItem: YouTubeVideo = {
      id: `yt-${Date.now()}`,
      title: newVideoTitle.trim(),
      urlOrId: newVideoUrl.trim(),
      badge: newVideoBadge.trim() || 'Spotlight',
      description: newVideoDesc.trim() || undefined
    };

    setPlaylist((prev) => [...prev, newItem]);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoBadge('Spotlight');
    setNewVideoDesc('');
    setIsAddingVideo(false);
    showToast('✓ Video added to playlist!');
  };

  const handleRemovePlaylistItem = (id: string) => {
    setPlaylist((prev) => prev.filter((item) => item.id !== id));
    showToast('Item removed from playlist');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedSettings: SystemBannerSettings = {
      ...settings,
      youtubeVideoUrl: videoUrl.trim(),
      youtubeChannelUrl: channelUrl.trim(),
      youtubeSectionTitle: sectionTitle.trim(),
      youtubeSectionSubtitle: sectionSubtitle.trim(),
      youtubePlaylist: playlist
    };

    onUpdateSettings(updatedSettings);

    setTimeout(() => {
      setIsSaving(false);
      showToast('🚀 YouTube Integration settings saved & live on homepage!');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500 fill-current" />
            <span>YouTube Video Player & Channel Manager</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamically configure the embedded YouTube player and official channel link shown on the homepage.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('perfume')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 transition-colors cursor-pointer"
          >
            Fragrance Focus
          </button>
          <button
            type="button"
            onClick={() => applyPreset('gadgets')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-200 transition-colors cursor-pointer"
          >
            Lifestyle & Gadgets
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Main Settings & Live Player Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Inputs (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Primary Video URL or ID */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                Featured YouTube Video URL or Video ID*
              </label>
              
              <div className="relative">
                <input
                  id="admin-youtube-url-input"
                  type="text"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or 11-char ID"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Extraction Status */}
              <div className="flex items-center justify-between text-xs pt-1">
                {extractedPrimaryId ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Detected Video ID: <strong className="text-white">{extractedPrimaryId}</strong>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Please enter a valid YouTube link or ID
                  </span>
                )}
                
                {extractedPrimaryId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${extractedPrimaryId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                  >
                    Test on YouTube <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Accepts full URLs (<code>youtube.com/watch?v=...</code>), short links (<code>youtu.be/...</code>), shorts (<code>youtube.com/shorts/...</code>), or plain 11-character video IDs.
              </p>
            </div>

            {/* Official Channel URL */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Official YouTube Channel URL*
                </label>
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1"
                >
                  Visit Channel <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                id="admin-youtube-channel-input"
                type="url"
                required
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://www.youtube.com/@primevaultzone"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-slate-400">
                This URL will be opened in a new tab when visitors click the prominent "Watch on YouTube" button.
              </p>
            </div>

            {/* Section Headings */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Section Heading Title
                </label>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Featured YouTube Videos"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Section Subtitle / Description
                </label>
                <textarea
                  rows={2}
                  value={sectionSubtitle}
                  onChange={(e) => setSectionSubtitle(e.target.value)}
                  placeholder="Watch authentic fragrance unboxings, batch code verification guides..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>
            </div>

          </div>

          {/* Right Live Embedded Player Preview (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-red-500" />
                  <span>Real-Time Player Preview</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/30">
                  Live Preview
                </span>
              </div>

              {/* 16:9 Responsive Preview Box */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
                {previewEmbedUrl ? (
                  <iframe
                    src={previewEmbedUrl}
                    title="Live Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0 absolute inset-0"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-500">
                    <Video className="w-8 h-8 mb-2 text-slate-600" />
                    <p className="text-xs font-semibold">Enter a valid YouTube URL to test</p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                ✅ <strong>Responsive 16:9 Player:</strong> This exact embedded player displays directly on your homepage with native full-screen, resolution controls, and audio features.
              </div>
            </div>
          </div>

        </div>

        {/* Playlist & Spotlight Videos Manager */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Featured Playlist & Spotlight Videos ({playlist.length})</span>
              </h4>
              <p className="text-xs text-slate-400">
                Visitors can browse and click these spotlight videos to switch the player immediately.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingVideo(!isAddingVideo)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingVideo ? 'Cancel' : 'Add Spotlight Video'}</span>
            </button>
          </div>

          {/* Add Video Form Drawer */}
          {isAddingVideo && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3 animate-fadeIn">
              <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Add New Video Spotlight
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Video Title*
                  </label>
                  <input
                    type="text"
                    required
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="e.g. Dior Sauvage vs Bleu de Chanel Comparison"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    YouTube URL or Video ID*
                  </label>
                  <input
                    type="text"
                    required
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="e.g. https://youtu.be/... or 11-char ID"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Category Badge
                  </label>
                  <input
                    type="text"
                    value={newVideoBadge}
                    onChange={(e) => setNewVideoBadge(e.target.value)}
                    placeholder="e.g. Unboxing, Review, Tutorial"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Brief Description
                  </label>
                  <input
                    type="text"
                    value={newVideoDesc}
                    onChange={(e) => setNewVideoDesc(e.target.value)}
                    placeholder="Brief highlights or batch code info..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingVideo(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPlaylistItem}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert to Playlist</span>
                </button>
              </div>
            </div>
          )}

          {/* Current Playlist Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {playlist.map((item, idx) => {
              const parsedId = extractYouTubeId(item.urlOrId);
              return (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 group hover:border-slate-700"
                >
                  <div className="flex gap-2.5 items-start flex-1 min-w-0">
                    <div className="w-14 h-10 rounded bg-slate-900 border border-white/10 shrink-0 overflow-hidden relative">
                      <img
                        src={`https://img.youtube.com/vi/${parsedId}/hqdefault.jpg`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 text-[9px] font-bold">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {parsedId}
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-slate-200 truncate">
                        {item.title}
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setVideoUrl(item.urlOrId)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                      title="Set as Featured Homepage Video"
                    >
                      Set Primary
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePlaylistItem(item.id)}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-950/60 transition-colors"
                      title="Delete Video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions Bar */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Changes take effect immediately on the homepage.
          </span>

          <button
            id="admin-save-youtube-btn"
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-purple-600 to-cyan-600 hover:from-red-500 hover:to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving YouTube Configuration...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save YouTube Integration</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
