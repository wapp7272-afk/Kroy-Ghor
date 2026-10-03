import React, { useState, useMemo } from 'react';
import { 
  Play, 
  ExternalLink, 
  Youtube, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  Tv, 
  CheckCircle2,
  Video,
  Layers,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { SystemBannerSettings, YouTubeVideo } from '../types';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../utils/youtube';

interface FeaturedYouTubeSectionProps {
  settings?: SystemBannerSettings;
  onOpenAdmin?: () => void;
  isAdminLoggedIn?: boolean;
}

// Default curated playlist if none provided in banner settings
const DEFAULT_PLAYLIST: YouTubeVideo[] = [
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
    title: 'Kroyghor Studio Unboxing & Lifestyle Haul',
    urlOrId: 'M7lc1UVf-VE',
    description: 'Unboxing our viral squishy silicone night lamps, luxury leather accessories, and collector building sets.',
    badge: 'Store Spotlight'
  }
];

export const FeaturedYouTubeSection: React.FC<FeaturedYouTubeSectionProps> = ({
  settings,
  onOpenAdmin,
  isAdminLoggedIn
}) => {
  // Configured primary video or first in playlist or fallback
  const primaryVideoUrlOrId = settings?.youtubeVideoUrl || 'sU3FkmV9b70';
  const channelUrl = settings?.youtubeChannelUrl || 'https://www.youtube.com/@kroyghor';
  const sectionTitle = settings?.youtubeSectionTitle || 'Featured YouTube Videos';
  const sectionSubtitle = settings?.youtubeSectionSubtitle || 
    'Watch authentic fragrance unboxings, batch code verification guides, and official product showcases directly from our channel.';

  const playlist: YouTubeVideo[] = useMemo(() => {
    if (settings?.youtubePlaylist && settings.youtubePlaylist.length > 0) {
      return settings.youtubePlaylist;
    }
    return DEFAULT_PLAYLIST;
  }, [settings?.youtubePlaylist]);

  // Currently playing video
  const [activeVideoId, setActiveVideoId] = useState<string>(() => {
    return extractYouTubeId(primaryVideoUrlOrId) || 'sU3FkmV9b70';
  });

  // When settings change dynamically from admin, keep active in sync if primary changes
  React.useEffect(() => {
    if (settings?.youtubeVideoUrl) {
      const extracted = extractYouTubeId(settings.youtubeVideoUrl);
      if (extracted) {
        setActiveVideoId(extracted);
      }
    }
  }, [settings?.youtubeVideoUrl]);

  const activeVideoEmbedUrl = useMemo(() => {
    return getYouTubeEmbedUrl(activeVideoId, false);
  }, [activeVideoId]);

  const activeVideoWatchUrl = useMemo(() => {
    return getYouTubeWatchUrl(activeVideoId);
  }, [activeVideoId]);

  // Find active video metadata if present in playlist
  const activeMeta = playlist.find((v) => extractYouTubeId(v.urlOrId) === activeVideoId);

  return (
    <section 
      id="featured-youtube-section" 
      className="relative py-12 sm:py-16 bg-gradient-to-b from-white via-slate-900 to-[#0b0f19] text-white overflow-hidden"
    >
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-red-600/10 via-purple-600/5 to-transparent pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= Header Bar ================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div className="space-y-2 max-w-2xl">
            {/* Top YouTube Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-black tracking-wider uppercase">
              <Youtube className="w-4 h-4 fill-red-500 text-white" />
              <span>Official YouTube Video Hub</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {sectionTitle}
            </h2>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              {sectionSubtitle}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Watch on YouTube Channel Button (Opens official channel in a new tab) */}
            <a
              id="watch-on-youtube-btn"
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
              title="Open Official YouTube Channel in New Tab"
            >
              <Youtube className="w-5 h-5 fill-white text-red-600 group-hover:scale-110 transition-transform" />
              <span>Watch on YouTube</span>
              <ArrowUpRight className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Direct Video Watch Link */}
            <a
              id="watch-current-video-btn"
              href={activeVideoWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white font-semibold text-xs transition-all"
              title="Open Current Video on YouTube"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open Video</span>
            </a>

            {/* Quick Admin Configure Shortcut */}
            {onOpenAdmin && (
              <button
                id="admin-youtube-edit-btn"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all"
                title="Manage YouTube Videos in Admin Portal"
              >
                <Tv className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Config</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= Main Video Player & Playlist Grid ================= */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Main Embedded Responsive Video Player (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border-2 border-red-500/20 shadow-[0_0_40px_rgba(220,38,38,0.15)] group">
              {activeVideoEmbedUrl ? (
                <iframe
                  id="youtube-embedded-player-frame"
                  src={activeVideoEmbedUrl}
                  title="Kroyghor Featured YouTube Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 absolute inset-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <Video className="w-12 h-12 mb-2 text-slate-600" />
                  <p className="text-sm font-semibold">No YouTube video URL configured.</p>
                  <p className="text-xs">Use the Admin Panel to set any YouTube URL or Video ID.</p>
                </div>
              )}
            </div>

            {/* Current Playing Details & Info Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                    <Flame className="w-3 h-3 fill-white" /> Now Playing
                  </span>
                  {activeMeta?.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {activeMeta.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {activeMeta?.title || 'Featured Kroyghor Video Spotlight'}
                </h3>
                {activeMeta?.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {activeMeta.description}
                  </p>
                )}
              </div>

              {/* Direct Channel Subscribe Banner */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Youtube className="w-4 h-4 fill-current" />
                  <span>Subscribe Channel</span>
                </a>
                <span className="text-[10px] text-slate-500 font-mono">
                  @kroyghor
                </span>
              </div>
            </div>
          </div>

          {/* Playlist & Spotlight Sidebar (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1 pb-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Layers className="w-4 h-4 text-red-400" />
                <span>Video Spotlights Playlist</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {playlist.length} Videos
              </span>
            </div>

            {/* Video List Items */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
              {playlist.map((video, idx) => {
                const videoId = extractYouTubeId(video.urlOrId);
                const isCurrent = videoId === activeVideoId;
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

                return (
                  <div
                    key={video.id || idx}
                    onClick={() => setActiveVideoId(videoId)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start group ${
                      isCurrent
                        ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                        : 'bg-slate-900/60 border-white/5 hover:bg-slate-850 hover:border-white/20'
                    }`}
                  >
                    {/* Thumbnail Preview */}
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                      <img
                        src={thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to high quality perfume poster if thumb fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCurrent ? 'bg-red-600 text-white' : 'bg-black/70 text-white group-hover:bg-red-600'
                        }`}>
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Title & Badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {video.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                            isCurrent
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {video.badge}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                            Playing
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-2 leading-snug">
                        {video.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Official Channel Trust Strip */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/30 to-purple-950/30 border border-red-500/20 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Official Kroyghor Content</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All fragrances showcased are verified authentic batch imported units. Subscribe to catch daily unboxings and discount drops!
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
