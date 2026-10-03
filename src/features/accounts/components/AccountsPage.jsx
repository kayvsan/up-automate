import React, { useEffect, useState } from 'react';
import { useApp } from '../../../shared/hooks/useApp';
import { fetchAccounts, disconnectAccount, getConnectOAuthUrl } from '../api';
import toast from 'react-hot-toast';
import { Plus, Trash2, AlertTriangle, X, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const YouTubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Publish Reels, feed posts & Stories',
    icon: InstagramIcon,
    iconBg: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    accentColor: '#ee2a7b',
    badgeColor: 'bg-[#f472b6] text-black',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    description: 'Upload videos & schedule posts',
    icon: TikTokIcon,
    iconBg: 'bg-black',
    accentColor: '#010101',
    badgeColor: 'bg-[#a78bfa] text-black',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Publish videos & Shorts',
    icon: YouTubeIcon,
    iconBg: 'bg-[#FF0000]',
    accentColor: '#FF0000',
    badgeColor: 'bg-[#FF0000] text-white',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'Post to Pages, Reels & Stories',
    icon: FacebookIcon,
    iconBg: 'bg-[#1877F2]',
    accentColor: '#1877F2',
    badgeColor: 'bg-[#1877F2] text-white',
  },
];

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
      setConnecting(platform);

      // Facebook uses headless mode so we handle page selection ourselves
      const isFacebook = platform === 'facebook';
      const redirectUrl = isFacebook
        ? window.location.origin + '/connect/facebook/callback'
        : window.location.href;
      const options = isFacebook ? { headless: true } : {};

      const res = await getConnectOAuthUrl(apiKey, profileId, platform, redirectUrl, options);
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
    } finally {
      setConnecting(null);
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

  const getPlatformMeta = (platform) =>
    PLATFORMS.find(p => p.id === platform) || {
      iconBg: 'bg-black',
      badgeColor: 'bg-black text-white',
      icon: null,
    };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', visualDuration: 0.6, bounce: 0.4 }}
        className="max-w-5xl mx-auto pb-20"
      >
        {/* HEADER */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
            <div>
              <h1 className="text-4xl font-extrabold text-foreground flex flex-wrap items-baseline gap-2 mb-2">
                Connected Accounts
                <span className="text-muted-foreground/60 text-2xl whitespace-nowrap tracking-tight">
                  ({accounts.length} / {MAX_ACCOUNTS})
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">Manage your social media integrations.</p>
            </div>

            <button
              onClick={() => setDrawerOpen(true)}
              disabled={isLimitReached}
              className={`
                flex items-center gap-2 px-6 py-3 font-black text-sm uppercase rounded-xl border-2 border-black transition-all shrink-0
                ${isLimitReached
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-70'
                  : 'bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-none'}
              `}
            >
              <Plus size={18} strokeWidth={3} />
              Add Connection
            </button>
          </div>

          {isLimitReached && (
            <div className="flex items-center gap-3 bg-[#fef08a] border-2 border-black text-black px-4 py-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-fit">
              <AlertTriangle size={20} className="shrink-0" />
              <p className="font-bold text-sm leading-tight">
                Batas maksimum {MAX_ACCOUNTS} akun tercapai. Hapus salah satu akun untuk menambah yang baru.
              </p>
            </div>
          )}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <p className="font-bold text-xl animate-pulse">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel text-center p-20 flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary border-2 border-border flex items-center justify-center mb-2">
              <Zap size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-extrabold text-2xl">No accounts connected</h3>
            <p className="text-muted-foreground max-w-sm">
              Connect your first social media account to start automating posts.
            </p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="mt-2 flex items-center gap-2 px-6 py-3 font-black text-sm uppercase rounded-xl border-2 border-black bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
            >
              <Plus size={18} strokeWidth={3} /> Add Connection
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map(acc => {
              const meta = getPlatformMeta(acc.platform);
              const PlatformIcon = meta.icon;
              const avatar = acc.profilePicture || acc.avatarUrl || acc.metadata?.profileData?.profilePicture;
              const name = acc.displayName || acc.metadata?.profileData?.displayName || acc.name || acc.username;
              const handle = acc.username ? `@${acc.username}` : '';

              return (
                <motion.div
                  key={acc._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-14 h-14 rounded-full border-2 border-black object-cover shadow-sm bg-white"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=' + acc.platform.charAt(0).toUpperCase(); }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full border-2 border-black bg-secondary flex items-center justify-center font-black text-xl uppercase">
                          {acc.platform.charAt(0)}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 border-black rounded-full flex items-center justify-center text-white shadow-sm ${meta.iconBg}`}>
                        {PlatformIcon && <PlatformIcon size={12} />}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-black text-lg text-foreground truncate">{name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${meta.badgeColor}`}>
                          {acc.platform}
                        </span>
                        {handle && <span className="text-sm font-bold text-muted-foreground truncate">{handle}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDisconnect(acc._id)}
                    title="Disconnect Account"
                    className="shrink-0 p-3 bg-background border-2 border-black rounded-xl text-foreground hover:bg-[#f87171] hover:text-white hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* DRAWER OVERLAY + PANEL */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-background border-l-2 border-black z-50 flex flex-col shadow-[-8px_0px_32px_rgba(0,0,0,0.15)]"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-border shrink-0">
                <div>
                  <h2 className="text-xl font-black">Add Connection</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Choose a platform to connect</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl border-2 border-border hover:bg-secondary hover:border-black transition-all"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Platform list */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                {isLimitReached && (
                  <div className="flex items-start gap-3 bg-[#fef08a] border-2 border-black text-black px-4 py-3 rounded-xl mb-2">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-bold leading-tight">
                      Account limit reached ({MAX_ACCOUNTS}). Disconnect an account first.
                    </p>
                  </div>
                )}

                {PLATFORMS.map((platform, i) => {
                  const Icon = platform.icon;
                  const isConnecting = connecting === platform.id;
                  const isDisabled = isLimitReached || isConnecting;

                  return (
                    <motion.button
                      key={platform.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleConnect(platform.id)}
                      disabled={isDisabled}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all
                        ${isDisabled
                          ? 'border-border bg-secondary/50 opacity-60 cursor-not-allowed'
                          : 'border-black bg-background hover:bg-secondary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'}
                      `}
                    >
                      {/* Platform icon */}
                      <div className={`w-12 h-12 rounded-xl ${platform.iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                        <Icon size={22} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base">{platform.label}</p>
                        <p className="text-sm text-muted-foreground leading-tight">{platform.description}</p>
                      </div>

                      {/* Arrow / Spinner */}
                      {isConnecting ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0 opacity-60" />
                      ) : (
                        <ChevronRight size={20} className="text-muted-foreground shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t-2 border-border shrink-0">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  You will be redirected to the platform to authorize access. No passwords are stored.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
