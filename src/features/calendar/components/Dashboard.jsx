import React, { useEffect, useState } from 'react';
import { useApp } from '../../../shared/hooks/useApp';
import { fetchPosts } from '../../history/api';
import { fetchUsage, fetchAnalytics, fetchAds, fetchInbox } from '../api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Upload, Calendar, ArrowRight, TrendingUp, 
  MessageCircle, BarChart3, Clock, Target, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard = () => {
  const { profile, accounts, activeWorkspace, apiKey } = useApp();
  const navigate = useNavigate();

  // Real Data States
  const [upcomingPosts, setUpcomingPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const [analytics, setAnalytics] = useState({
    impressions: '0',
    impressionsGrowth: '+0%',
    followers: '0',
    engagementRate: '0%'
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const [inbox, setInbox] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);

  const [quota, setQuota] = useState({
    used: 0,
    total: 0,
    resetIn: '-'
  });
  const [loadingQuota, setLoadingQuota] = useState(true);

  const [ads, setAds] = useState({
    activeCampaigns: 0,
    totalSpend: '$0',
    roi: '0%'
  });
  const [loadingAds, setLoadingAds] = useState(true);

  useEffect(() => {
    const loadUpcoming = async () => {
      try {
        setLoadingPosts(true);
        // We fetch posts and filter for scheduled
        const res = await fetchPosts(apiKey, { limit: 10 });
        const allPosts = res.data?.posts || res.data?.data || [];
        const scheduled = allPosts
          .filter(p => p.status === 'scheduled')
          .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
          .slice(0, 3);
        setUpcomingPosts(scheduled);
      } catch (err) {
        console.error('Failed to load upcoming posts', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    const loadUsage = async () => {
      try {
        setLoadingQuota(true);
        const res = await fetchUsage(apiKey);
        const usageData = res.data?.usage || res.data?.data?.usage || {};
        const limitsData = res.data?.limits || res.data?.data?.limits || {};
        
        // Zernio's /v1/usage uses `uploads` as the primary metric for content posting
        const usedUploads = usageData.uploads || 0;
        // If limits.uploads is 0, we can assume unlimited (or just fallback to 100 to avoid div/0)
        const totalUploads = limitsData.uploads || 100;
        
        setQuota({
          used: usedUploads,
          total: totalUploads,
          resetIn: '24 hours' 
        });
      } catch (err) {
        console.error('Failed to load usage', err);
      } finally {
        setLoadingQuota(false);
      }
    };

    const loadAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const res = await fetchAnalytics(apiKey);
        const data = res.data || {};
        
        // Split followers by platform
        const accountsList = data.accounts || [];
        const tiktokFollowers = accountsList
          .filter(a => a.platform === 'tiktok')
          .reduce((acc, curr) => acc + (curr.followersCount || 0), 0);
          
        const igFollowers = accountsList
          .filter(a => a.platform === 'instagram')
          .reduce((acc, curr) => acc + (curr.followersCount || 0), 0);
        
        const overview = data.overview || {};
        
        setAnalytics({
          impressions: overview.totalPosts?.toString() || '0',
          impressionsLabel: 'Total Posts', 
          impressionsGrowth: '',
          followersTiktok: tiktokFollowers.toString(),
          followersIg: igFollowers.toString(),
          engagementRate: overview.publishedPosts?.toString() || '0',
          engagementLabel: 'Published'
        });
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    const loadAds = async () => {
      try {
        setLoadingAds(true);
        const res = await fetchAds(apiKey);
        
        // /v1/ads/campaigns usually returns { campaigns: [...] }
        // We also check res.data.data just in case the wrapper is different
        const campaigns = res.data?.campaigns || res.data?.data || [];
        
        // Count active campaigns
        const activeCampaignsCount = Array.isArray(campaigns) 
          ? campaigns.filter(c => c.status === 'active' || c.platformCampaignStatus === 'ACTIVE').length 
          : 0;
        
        // Sum total spend from all campaigns (in their native currency)
        const totalSpendValue = Array.isArray(campaigns) 
          ? campaigns.reduce((acc, curr) => acc + (curr.metrics?.spend || curr.spend || 0), 0)
          : 0;
        
        setAds({
          activeCampaigns: activeCampaignsCount,
          totalSpend: `$${totalSpendValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          roi: '+0%' // ROI requires revenue data which might not be directly available, fallback to 0%
        });
      } catch (err) {
        console.error('Failed to load ads', err);
      } finally {
        setLoadingAds(false);
      }
    };

    const loadInbox = async () => {
      try {
        setLoadingInbox(true);
        const res = await fetchInbox(apiKey);
        const items = res.data?.data || [];
        
        // Map to our UI format based on response
        setInbox(items.slice(0, 5).map((item) => ({
          id: item.id,
          platform: item.platform,
          user: item.participantUsername || item.participantName || 'Unknown User',
          text: item.lastMessage || 'No preview available',
          unread: item.unreadCount > 0
        })));
      } catch (err) {
        console.error('Failed to load inbox', err);
      } finally {
        setLoadingInbox(false);
      }
    };

    if (apiKey) {
      loadUpcoming();
      loadUsage();
      loadAnalytics();
      loadAds();
      loadInbox();
    }
  }, [apiKey]);

  const quotaPercent = Math.round((quota.used / quota.total) * 100);
  const isQuotaWarning = quotaPercent > 80;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", visualDuration: 0.6, bounce: 0.4 }}
      className="max-w-6xl mx-auto pb-20"
    >
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-foreground">Welcome, {profile?.name}</h1>
          <p className="text-lg text-muted-foreground">Your social media command center for <span className="font-bold text-foreground">{activeWorkspace?.label}</span>.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => navigate('/upload')} className="btn flex items-center gap-2 px-5 py-2">
            <Upload size={18} /> New Post
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Analytics Card */}
        <div className="bg-[#fef08a] p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-black text-white p-2.5 rounded-lg border-2 border-transparent">
              <TrendingUp size={24} />
            </div>
            <span className="bg-white border-2 border-black text-black px-2 py-1 font-black text-[10px] uppercase rounded shadow-sm">This Month</span>
          </div>
          
          {loadingAnalytics ? (
            <div className="py-8 animate-pulse text-center font-bold text-black/50">Loading stats...</div>
          ) : (
            <>
              <h3 className="text-4xl font-black mb-1">{analytics.impressions}</h3>
              <p className="text-sm font-bold text-black mb-4">{analytics.impressionsLabel || 'Total Impressions'}</p>
              
              <div className="flex gap-4 border-t-2 border-black/20 pt-4">
                <div>
                  <p className="text-xs font-bold text-black/60 uppercase flex items-center gap-1">IG <span className="hidden sm:inline">Followers</span></p>
                  <p className="font-black text-[#f472b6]">{analytics.followersIg}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-black/60 uppercase flex items-center gap-1">TT <span className="hidden sm:inline">Followers</span></p>
                  <p className="font-black text-[#16a34a]">{analytics.followersTiktok}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-black/60 uppercase">{analytics.engagementLabel || 'Engagement'}</p>
                  <p className="font-black text-black">{analytics.engagementRate}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ads Summary Card */}
        <div className="bg-[#a78bfa] p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-black text-white p-2.5 rounded-lg border-2 border-transparent">
              <Target size={24} />
            </div>
            <span className="bg-white border-2 border-black text-black px-2 py-1 font-black text-[10px] uppercase rounded shadow-sm">Ads Manager</span>
          </div>
          
          {loadingAds ? (
            <div className="py-8 animate-pulse text-center font-bold text-black/50">Loading campaigns...</div>
          ) : (
            <>
              <h3 className="text-4xl font-black mb-1">{ads.activeCampaigns}</h3>
              <p className="text-sm font-bold text-black mb-4">Active Campaigns</p>
              
              <div className="flex gap-4 border-t-2 border-black/20 pt-4">
                <div>
                  <p className="text-xs font-bold text-black/60 uppercase">Spend</p>
                  <p className="font-black text-black">{ads.totalSpend}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-black/60 uppercase">ROI</p>
                  <p className="font-black text-[#16a34a]">{ads.roi}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* API Quota Card */}
        <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="bg-black text-white p-2.5 rounded-lg border-2 border-transparent">
                <BarChart3 size={24} />
              </div>
              <span className="bg-secondary border-2 border-black text-black px-2 py-1 font-black text-[10px] uppercase rounded shadow-sm">Monthly Quota</span>
            </div>
            <h3 className="text-2xl font-black mt-4">Upload Limits</h3>
            {loadingQuota ? (
              <p className="text-sm font-bold text-muted-foreground mb-4 animate-pulse">Loading usage...</p>
            ) : (
              <p className="text-sm font-bold text-muted-foreground mb-4">{quota.used} / {quota.total} uploads used</p>
            )}
          </div>
          
          <div>
            <div className="w-full h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full border-r-2 border-black transition-all duration-1000 ${isQuotaWarning ? 'bg-danger' : 'bg-[#34d399]'}`} 
                style={{ width: `${quota.total > 0 ? quotaPercent : 0}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-muted-foreground text-right">Resets in {quota.resetIn}</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Inbox and Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Unified Inbox */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 flex-wrap">
              <MessageCircle size={24} className="text-primary" /> 
              Unified Inbox
              <span className="bg-[#f472b6] text-black px-2 py-1 rounded text-[10px] uppercase font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ml-2">
                IG ONLY
              </span>
            </h2>
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-black border-2 border-black">
              {inbox.length} Unread
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {loadingInbox ? (
              <div className="py-10 text-center font-bold text-muted-foreground animate-pulse">Loading messages...</div>
            ) : inbox.length === 0 ? (
              <div className="py-10 text-center font-bold text-muted-foreground">No new messages! 🎉</div>
            ) : (
              inbox.map(msg => (
                <div key={msg.id} className="p-4 bg-secondary/30 border-2 border-black rounded-xl hover:bg-[#fef08a] transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${msg.unread ? 'bg-primary' : 'bg-gray-300'}`}></span>
                      <span className="font-bold text-sm">{msg.user}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${msg.platform === 'instagram' ? 'bg-[#f472b6]' : 'bg-[#a78bfa]'}`}>
                      {msg.platform}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2 leading-snug">{msg.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Calendar size={24} className="text-primary" /> Upcoming Schedule
            </h2>
            <button onClick={() => navigate('/history')} className="text-sm font-bold hover:underline">View All</button>
          </div>

          <div className="flex flex-col gap-4">
            {loadingPosts ? (
              <div className="py-10 text-center font-bold text-muted-foreground animate-pulse">Loading upcoming...</div>
            ) : upcomingPosts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-bold text-muted-foreground mb-4">No upcoming posts scheduled.</p>
                <button onClick={() => navigate('/upload')} className="btn btn-secondary text-sm py-2">Schedule Now</button>
              </div>
            ) : (
              upcomingPosts.map(post => (
                <div key={post._id} className="p-4 bg-background border-2 border-black shadow-sm rounded-xl flex items-start gap-4 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                  <div className="bg-[#34d399] w-12 h-12 rounded-lg border-2 border-black flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black uppercase leading-none mb-0.5">{format(new Date(post.scheduledFor), 'MMM')}</span>
                    <span className="text-lg font-black leading-none">{format(new Date(post.scheduledFor), 'dd')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm mb-1 truncate">{post.content || 'Media only post'}</p>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-muted-foreground" />
                      <span className="text-xs font-bold text-muted-foreground">{format(new Date(post.scheduledFor), 'HH:mm')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {post.platforms?.map(p => (
                      <span key={p.platform} className={`w-5 h-5 rounded flex items-center justify-center border border-black text-[10px] font-black text-black ${p.platform === 'instagram' ? 'bg-[#f472b6]' : 'bg-[#a78bfa]'}`}>
                        {p.platform.charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
