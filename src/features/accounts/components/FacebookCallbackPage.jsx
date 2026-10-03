import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../../shared/hooks/useApp';
import { listFacebookPages, selectFacebookPage } from '../api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, ChevronRight, Loader } from 'lucide-react';

const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

export const FacebookCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiKey } = useApp();

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Extract params from OAuth callback URL
  const profileId = searchParams.get('profileId');
  const tempToken = searchParams.get('tempToken');
  const userProfile = (() => {
    try {
      const raw = searchParams.get('userProfile');
      return raw ? JSON.parse(decodeURIComponent(raw)) : null;
    } catch {
      return null;
    }
  })();
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      setError(`Connection failed: ${errorParam}`);
      setLoading(false);
      return;
    }
    if (!profileId || !tempToken) {
      setError('Missing required connection parameters. Please try again.');
      setLoading(false);
      return;
    }
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await listFacebookPages(apiKey, profileId, tempToken);
      const pageList = res.data?.pages || [];
      if (pageList.length === 0) {
        setError('No Facebook Pages found. Make sure your account manages at least one Page.');
      } else {
        setPages(pageList);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load Facebook Pages';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = async (page) => {
    try {
      setSelecting(page.id);
      await selectFacebookPage(apiKey, {
        profileId,
        pageId: page.id,
        tempToken,
        userProfile: userProfile || { id: '', name: page.name },
        redirect_url: window.location.origin + '/accounts',
      });
      setSuccess(true);
      toast.success(`"${page.name}" connected successfully!`);
      setTimeout(() => navigate('/accounts'), 1800);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to connect page';
      toast.error(msg);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', visualDuration: 0.5, bounce: 0.3 }}
        className="w-full max-w-lg"
      >
        {/* Header Card */}
        <div className="glass-panel p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-[#1877F2] text-white p-2 rounded-xl">
              <FacebookIcon size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black">Connect Facebook Page</h1>
              <p className="text-sm text-muted-foreground">Select the Page you want to connect</p>
            </div>
          </div>
        </div>

        {/* States */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-10 flex flex-col items-center gap-4"
            >
              <div className="w-10 h-10 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-muted-foreground">Loading your Facebook Pages...</p>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-8 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <div>
                <h2 className="font-black text-lg mb-1">Connection Error</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <button
                onClick={() => navigate('/accounts')}
                className="btn mt-2"
              >
                Back to Accounts
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-10 flex flex-col items-center gap-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-300 flex items-center justify-center"
              >
                <CheckCircle size={32} className="text-green-500" />
              </motion.div>
              <div>
                <h2 className="font-black text-xl">Page Connected!</h2>
                <p className="text-sm text-muted-foreground mt-1">Redirecting you back...</p>
              </div>
            </motion.div>
          )}

          {!loading && !error && !success && pages.length > 0 && (
            <motion.div
              key="pages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3"
            >
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 mb-1">
                {pages.length} page{pages.length > 1 ? 's' : ''} available
              </p>
              {pages.map((page, i) => (
                <motion.button
                  key={page.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleSelectPage(page)}
                  disabled={!!selecting}
                  className={`glass-panel p-4 flex items-center gap-4 text-left w-full transition-all
                    ${selecting === page.id ? 'border-[#1877F2] bg-blue-50/30' : 'hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'}
                    ${selecting && selecting !== page.id ? 'opacity-50 pointer-events-none' : ''}
                  `}
                >
                  {/* Page avatar / initials */}
                  <div className="w-12 h-12 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                    {page.name?.charAt(0)?.toUpperCase() ?? 'F'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-black text-base truncate">{page.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {page.username && (
                        <span className="text-xs font-bold text-muted-foreground">@{page.username}</span>
                      )}
                      {page.category && (
                        <span className="text-[0.6rem] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary border border-border">
                          {page.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {selecting === page.id ? (
                    <Loader size={20} className="animate-spin text-[#1877F2] shrink-0" />
                  ) : (
                    <ChevronRight size={20} className="text-muted-foreground shrink-0" />
                  )}
                </motion.button>
              ))}

              <button
                onClick={() => navigate('/accounts')}
                className="mt-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors text-center py-2"
              >
                Cancel — go back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
