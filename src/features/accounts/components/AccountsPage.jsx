import React, { useEffect, useState } from 'react';
import { useApp } from '../../../shared/hooks/useApp';
import { fetchAccounts, disconnectAccount, getConnectOAuthUrl } from '../api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Video, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-3.9V2.97h-3.4v13.54a2.82 2.82 0 1 1-2.77-2.82c.16 0 .32 0 .48.02v-3.4a6.27 6.27 0 1 0 6.27 6.27V9.75c1.4.95 3.09 1.48 4.83 1.48V6.69z"/>
  </svg>
);

const MAX_ACCOUNTS = 2;

const extractProfileId = (account) => {
  if (!account) return null;
  const p = account.profileId || account.profile;
  if (!p) return null;
  if (typeof p === 'string') return p;
  return p._id || p.id || null;
};

export const AccountsPage = () => {
  const { apiKey, profileId, accounts, setAccounts } = useApp();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetchAccounts(apiKey);
      const allAccounts = res.data?.accounts || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const filtered = profileId ? allAccounts.filter(a => {
        const accPid = extractProfileId(a);
        return !accPid || accPid === profileId;
      }) : allAccounts;
      setAccounts(filtered);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform) => {
    if (!profileId) {
      toast.error('Please select or create a profile first');
      return;
    }
    if (accounts.length >= MAX_ACCOUNTS) {
      toast.error(`Batas maksimum tercapai! Hanya diperbolehkan maksimal ${MAX_ACCOUNTS} akun terpaut.`);
      return;
    }
    try {
      const redirectUrl = window.location.href;
      const res = await getConnectOAuthUrl(apiKey, profileId, platform, redirectUrl);
      const authUrl = res.data?.authUrl || res.data?.url || res.data?.data?.authUrl || res.data?.data?.url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        console.error('Invalid response format:', res.data);
        toast.error('No auth URL returned from Zernio');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || `Failed to initiate ${platform} connection`;
      toast.error(msg);
    }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm('Are you sure you want to disconnect this account?')) return;
    try {
      await disconnectAccount(apiKey, id);
      toast.success('Account disconnected');
      loadAccounts();
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const isLimitReached = accounts.length >= MAX_ACCOUNTS;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", visualDuration: 0.6, bounce: 0.4 }}
      className="max-w-5xl mx-auto pb-20"
    >
      
      {/* HEADER SECTION */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground flex flex-wrap items-baseline gap-2 mb-2">
              Connected Accounts 
              <span className="text-muted-foreground/60 text-2xl whitespace-nowrap tracking-tight">({accounts.length} / {MAX_ACCOUNTS})</span>
            </h1>
            <p className="text-lg text-muted-foreground">Manage your TikTok and Instagram integrations.</p>
          </div>
          
          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 shrink-0 p-2 -m-2">
            <button 
              onClick={() => handleConnect('tiktok')} 
              disabled={isLimitReached}
              className={`
                flex items-center justify-center gap-2 px-6 py-3 font-black text-sm uppercase rounded-xl border-2 border-black transition-transform
                ${isLimitReached 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-80' 
                  : 'bg-black text-white shadow-[4px_4px_0px_0px_#06b6d4] hover:-translate-y-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_#06b6d4]'}
              `}
            >
              <TikTokIcon size={18} /> Connect TikTok
            </button>
            <button 
              onClick={() => handleConnect('instagram')} 
              disabled={isLimitReached}
              className={`
                flex items-center justify-center gap-2 px-6 py-3 font-black text-sm uppercase rounded-xl border-2 border-black transition-transform
                ${isLimitReached 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-80' 
                  : 'bg-[#f472b6] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:bg-[#f14d9f] active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]'}
              `}
            >
              <InstagramIcon size={18} /> Connect Instagram
            </button>
          </div>
        </div>

        {isLimitReached && (
          <div className="flex items-center gap-3 bg-[#fef08a] border-2 border-black text-black px-4 py-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-fit">
            <AlertTriangle size={20} className="shrink-0" />
            <p className="font-bold text-sm leading-tight">Batas maksimum {MAX_ACCOUNTS} akun tercapai. Hapus salah satu akun untuk menambah yang baru.</p>
          </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <p className="font-bold text-xl animate-pulse">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass-panel text-center p-20">
          <h3 className="font-extrabold text-2xl mb-2">No accounts connected</h3>
          <p className="text-muted-foreground">Connect your first social media account to start automating.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map(acc => {
            const avatar = acc.profilePicture || acc.avatarUrl || acc.metadata?.profileData?.profilePicture || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop';
            const name = acc.displayName || acc.metadata?.profileData?.displayName || acc.name || acc.username;
            const handle = acc.username ? `@${acc.username}` : '';
            const isIg = acc.platform === 'instagram';
            
            return (
              <div key={acc._id} className="glass-panel flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors">
                
                {/* Left Side: Avatar & Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <img 
                      src={avatar} 
                      alt={name} 
                      className="w-14 h-14 rounded-full border-2 border-black object-cover shadow-sm bg-white"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=' + acc.platform.charAt(0).toUpperCase(); }} 
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 border-black rounded-full flex items-center justify-center text-white shadow-sm ${isIg ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' : 'bg-black'}`}>
                      {isIg ? <InstagramIcon size={12}/> : 'T'}
                    </div>
                  </div>
                  
                  <div className="min-w-0">
                    <h3 className="font-black text-lg text-foreground truncate">{name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isIg ? 'bg-[#f472b6] text-black' : 'bg-[#a78bfa] text-black'}`}>
                        {acc.platform}
                      </span>
                      {handle && <span className="text-sm font-bold text-muted-foreground truncate">{handle}</span>}
                    </div>
                  </div>
                </div>

                {/* Right Side: Delete Button */}
                <button 
                  onClick={() => handleDisconnect(acc._id)} 
                  title="Disconnect Account"
                  className="shrink-0 p-3 bg-background border-2 border-black rounded-xl text-foreground hover:bg-[#f87171] hover:text-white hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Trash2 size={20} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
