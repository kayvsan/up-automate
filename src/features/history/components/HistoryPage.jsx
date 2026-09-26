import React, { useEffect, useState } from 'react';
import { useApp } from '../../../shared/hooks/useApp';
import { fetchPosts, fetchPostAnalytics } from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Calendar, CheckCircle, Clock, AlertCircle, X, BarChart3, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HistoryPage = () => {
  const { apiKey, workspaces, activeWorkspace } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postAnalytics, setPostAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (selectedPost && selectedPost.status === 'published') {
      loadAnalytics(selectedPost._id);
    } else {
      setPostAnalytics(null);
    }
  }, [selectedPost]);

  const loadAnalytics = async (postId) => {
    try {
      setLoadingAnalytics(true);
      let targetKey = apiKey;
      if (viewAll && selectedPost?.workspaceLabel) {
         const ws = workspaces.find(w => w.label === selectedPost.workspaceLabel);
         if (ws) targetKey = ws.apiKey;
      }
      const res = await fetchPostAnalytics(targetKey, postId);
      setPostAnalytics(res.data || null);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    // Reset page to 1 when toggling viewAll
    setPage(1);
  }, [viewAll]);

  useEffect(() => {
    loadPosts();
  }, [apiKey, viewAll, page]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      if (viewAll) {
        let allPosts = [];
        const promises = workspaces.map(async (ws) => {
          try {
            const res = await fetchPosts(ws.apiKey, { limit: 20, page });
            const pts = res.data.posts || res.data.data || [];
            allPosts = [...allPosts, ...pts.map(p => ({ ...p, workspaceLabel: ws.label }))];
          } catch (e) {
            console.error(`Failed loading history for ${ws.label}`);
          }
        });
        await Promise.allSettled(promises);
        allPosts.sort((a, b) => new Date(b.createdAt || b.scheduledFor || 0) - new Date(a.createdAt || a.scheduledFor || 0));
        setPosts(allPosts);
        setTotalPages(1); // Simple fallback for multi-workspace
      } else {
        const res = await fetchPosts(apiKey, { limit: 20, page });
        const pts = res.data.posts || res.data.data || [];
        setPosts(pts.map(p => ({ ...p, workspaceLabel: activeWorkspace?.label })));
        if (res.data.pagination?.pages) {
          setTotalPages(res.data.pagination.pages);
        } else {
          setTotalPages(1);
        }
      }
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published': 
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#34d399] border-2 border-black text-black px-2.5 py-1 rounded-full font-black text-[10px] shadow-sm uppercase tracking-wider">
            <CheckCircle size={14} /> Published
          </div>
        );
      case 'scheduled': 
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#fef08a] border-2 border-black text-black px-2.5 py-1 rounded-full font-black text-[10px] shadow-sm uppercase tracking-wider">
            <Calendar size={14} /> Scheduled
          </div>
        );
      case 'failed': 
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#f87171] border-2 border-black text-black px-2.5 py-1 rounded-full font-black text-[10px] shadow-sm uppercase tracking-wider">
            <AlertCircle size={14} /> Failed
          </div>
        );
      default: 
        return (
          <div className="inline-flex items-center gap-1.5 bg-gray-200 border-2 border-black text-black px-2.5 py-1 rounded-full font-black text-[10px] shadow-sm uppercase tracking-wider">
            <Clock size={14} /> {status}
          </div>
        );
    }
  };

  const getPlatformBadge = (platform) => {
    const isIg = platform === 'instagram';
    const isTt = platform === 'tiktok';
    const bgColor = isIg ? 'bg-[#f472b6]' : isTt ? 'bg-[#a78bfa]' : 'bg-gray-300';
    return (
      <span key={platform} className={`${bgColor} border-2 border-black text-black px-2 py-0.5 rounded-md font-bold text-[10px] shadow-sm capitalize tracking-wide`}>
        {platform}
      </span>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", visualDuration: 0.6, bounce: 0.4 }}
      className="max-w-6xl mx-auto pb-20"
    >
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Post History</h1>
          <p className="text-base sm:text-lg text-muted-foreground">Monitor your automated social media posts</p>
        </div>
        
        {workspaces.length > 1 && (
          <div className="flex bg-white rounded-xl border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <button 
              onClick={() => setViewAll(false)}
              className={`px-6 py-2.5 text-sm font-black transition-colors border-r-4 border-black ${!viewAll ? 'bg-[#fef08a] text-black' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              Active Workspace
            </button>
            <button 
              onClick={() => setViewAll(true)}
              className={`px-6 py-2.5 text-sm font-black transition-colors ${viewAll ? 'bg-[#fef08a] text-black' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              All Workspaces
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <p className="font-bold text-xl animate-pulse">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel text-center p-20">
          <h3 className="font-extrabold text-2xl mb-2">No posts found</h3>
          <p className="text-muted-foreground">You haven't scheduled or published any posts yet.</p>
        </div>
      ) : (
        <>
        {/* ── DESKTOP/TABLET TABLE ── */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-left border-collapse bg-background">
            <thead>
              <tr className="bg-secondary border-b-2 border-black">
                <th className="p-4 font-black uppercase text-sm border-r-2 border-black w-24">Media</th>
                <th className="p-4 font-black uppercase text-sm border-r-2 border-black w-1/3">Caption</th>
                <th className="p-4 font-black uppercase text-sm border-r-2 border-black w-32">Status</th>
                <th className="p-4 font-black uppercase text-sm border-r-2 border-black w-40">Platforms</th>
                {viewAll && <th className="p-4 font-black uppercase text-sm border-r-2 border-black w-32">Workspace</th>}
                <th className="p-4 font-black uppercase text-sm w-40">Date</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, index) => {
                const isLast = index === posts.length - 1;
                return (
                  <tr key={post._id} className={`hover:bg-secondary/20 transition-colors cursor-pointer ${!isLast ? 'border-b-2 border-black' : ''}`} onClick={() => setSelectedPost(post)}>
                    <td className="p-4 border-r-2 border-black align-top">
                      <div className="w-20 h-20 bg-secondary border-2 border-black rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                        {post.mediaItems?.[0]?.url ? (
                          post.mediaItems[0].type === 'video' || post.mediaItems[0].url.match(/\.(mp4|mov|webm|mkv)$/i) ? (
                            <a href={post.mediaItems[0].url} target="_blank" rel="noopener noreferrer" className="relative w-full h-full bg-black block group cursor-pointer">
                              <video src={post.mediaItems[0].url} className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity" muted playsInline />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                              </div>
                            </a>
                          ) : (
                            <img src={post.mediaItems[0].url} alt="Media" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Media'; }} />
                          )
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">None</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 border-r-2 border-black align-top">
                      <p className="font-bold text-sm whitespace-pre-wrap line-clamp-3 leading-snug">
                        {post.content || <span className="italic text-muted-foreground">No caption</span>}
                      </p>
                    </td>
                    <td className="p-4 border-r-2 border-black align-top">{getStatusBadge(post.status)}</td>
                    <td className="p-4 border-r-2 border-black align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {post.platforms?.map(p => getPlatformBadge(p.platform))}
                      </div>
                    </td>
                    {viewAll && (
                      <td className="p-4 border-r-2 border-black align-top">
                        {post.workspaceLabel && (
                          <span className="text-[10px] font-black bg-white border-2 border-black px-2 py-1 uppercase rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            {post.workspaceLabel}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="p-4 align-top text-sm">
                      <strong className="block text-foreground font-black mb-0.5">
                        {post.scheduledFor ? format(new Date(post.scheduledFor), 'MMM dd, yyyy') : 'Immediate'}
                      </strong>
                      <span className="text-xs text-muted-foreground font-bold">
                        {post.scheduledFor ? format(new Date(post.scheduledFor), 'HH:mm') : ''}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── MOBILE CARD LIST ── */}
        <div className="sm:hidden flex flex-col gap-3">
          {posts.map((post) => (
            <div key={post._id} className="bg-background border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setSelectedPost(post)}>
              <div className="flex items-start gap-3 p-3">
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-secondary border-2 border-black rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  {post.mediaItems?.[0]?.url ? (
                    post.mediaItems[0].type === 'video' || post.mediaItems[0].url.match(/\.(mp4|mov|webm|mkv)$/i) ? (
                      <a href={post.mediaItems[0].url} target="_blank" rel="noopener noreferrer" className="relative w-full h-full bg-black flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </a>
                    ) : (
                      <img src={post.mediaItems[0].url} alt="Media" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80?text=Media'; }} />
                    )
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">None</span>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm line-clamp-2 leading-snug mb-2">
                    {post.content || <span className="italic text-muted-foreground">No caption</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {getStatusBadge(post.status)}
                    {post.platforms?.map(p => getPlatformBadge(p.platform))}
                  </div>
                </div>
              </div>
              <div className="px-3 pb-3 flex items-center justify-between border-t border-black/10 pt-2">
                <span className="text-xs font-bold text-muted-foreground">
                  {post.scheduledFor ? format(new Date(post.scheduledFor), 'MMM dd, yyyy · HH:mm') : 'Immediate'}
                </span>
                {viewAll && post.workspaceLabel && (
                  <span className="text-[10px] font-black bg-secondary border border-black/30 px-2 py-0.5 uppercase rounded">{post.workspaceLabel}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      )}
      
      {/* Pagination Controls */}
      {!viewAll && totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border-2 border-black rounded-lg font-black text-sm uppercase disabled:opacity-50 transition-transform active:translate-y-1"
          >
            Previous
          </button>
          <span className="font-bold text-sm bg-[#fef08a] px-3 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Page {page} of {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border-2 border-black rounded-lg font-black text-sm uppercase disabled:opacity-50 transition-transform active:translate-y-1"
          >
            Next
          </button>
        </div>
      )}
      
      {/* Post Details Modal */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-lg max-h-[90vh] bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b-2 border-black bg-white shrink-0 z-10">
                <h2 className="text-2xl font-black">Post Details</h2>
                <button onClick={() => setSelectedPost(null)} className="p-2 bg-gray-100 hover:bg-[#fef08a] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black rounded-xl transition-all">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-white">

              {selectedPost.mediaItems?.[0]?.url && (
                <div className="w-full h-48 bg-secondary border-2 border-black rounded-xl overflow-hidden mb-6 flex items-center justify-center">
                  {selectedPost.mediaItems[0].type === 'video' || selectedPost.mediaItems[0].url.match(/\.(mp4|mov|webm|mkv)$/i) ? (
                    <video src={selectedPost.mediaItems[0].url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={selectedPost.mediaItems[0].url} alt="Media" className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-wider">Status</p>
                    <div>{getStatusBadge(selectedPost.status)}</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-wider">Schedule / Date</p>
                    <p className="font-bold text-sm">
                      {selectedPost.scheduledFor ? format(new Date(selectedPost.scheduledFor), 'MMM dd, yyyy · HH:mm') : 'Immediate'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-wider">Platforms</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPost.platforms?.map(p => getPlatformBadge(p.platform))}
                  </div>
                </div>

                {selectedPost.workspaceLabel && (
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-wider">Workspace</p>
                    <span className="text-sm font-bold bg-[#fef08a] border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                      {selectedPost.workspaceLabel}
                    </span>
                  </div>
                )}

                {selectedPost.status === 'published' && (
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-wider flex items-center gap-1"><BarChart3 size={14} /> Analytics</p>
                    {loadingAnalytics ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-gray-50 border-2 border-black p-4 rounded-xl">
                        <Loader2 size={16} className="animate-spin" /> Fetching insights...
                      </div>
                    ) : postAnalytics?.syncStatus === 'pending' ? (
                      <div className="bg-[#fef08a] border-2 border-black p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
                        <Clock className="shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="font-black text-sm mb-1">Analytics Pending</p>
                          <p className="text-xs font-bold text-gray-700">{postAnalytics.message || 'Analytics are being synced from the platform. Please try again in a few moments.'}</p>
                        </div>
                      </div>
                    ) : postAnalytics?.analytics ? (
                      <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-center">
                          <p className="text-xl sm:text-2xl font-black text-black leading-none mb-1.5">{postAnalytics.analytics.likes || 0}</p>
                          <p className="text-[10px] uppercase font-black text-gray-600 tracking-wider">Likes</p>
                        </div>
                        <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-center">
                          <p className="text-xl sm:text-2xl font-black text-black leading-none mb-1.5">{postAnalytics.analytics.comments || 0}</p>
                          <p className="text-[10px] uppercase font-black text-gray-600 tracking-wider">Cmmts</p>
                        </div>
                        <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-center">
                          <p className="text-xl sm:text-2xl font-black text-black leading-none mb-1.5">{postAnalytics.analytics.shares || 0}</p>
                          <p className="text-[10px] uppercase font-black text-gray-600 tracking-wider">Shares</p>
                        </div>
                        <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-center">
                          <p className="text-xl sm:text-2xl font-black text-black leading-none mb-1.5">{postAnalytics.analytics.views || postAnalytics.analytics.impressions || 0}</p>
                          <p className="text-[10px] uppercase font-black text-gray-600 tracking-wider">Views</p>
                        </div>
                        <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-center">
                          <p className="text-xl sm:text-2xl font-black text-black leading-none mb-1.5">{postAnalytics.analytics.saves || 0}</p>
                          <p className="text-[10px] uppercase font-black text-gray-600 tracking-wider">Saves</p>
                        </div>
                        <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-center">
                          <p className="text-xl sm:text-2xl font-black text-black leading-none mb-1.5">{postAnalytics.analytics.engagementRate ? `${postAnalytics.analytics.engagementRate}%` : '0%'}</p>
                          <p className="text-[10px] uppercase font-black text-gray-600 tracking-wider">Eng.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-muted-foreground bg-gray-50 border-2 border-black p-4 rounded-xl">No analytics data available yet.</p>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-wider">Caption</p>
                  <div className="bg-secondary/30 border-2 border-black rounded-xl p-4 whitespace-pre-wrap text-sm font-bold leading-relaxed max-h-48 overflow-y-auto shadow-inner">
                    {selectedPost.content || <span className="italic text-muted-foreground">No caption</span>}
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
