import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useApp } from '../../../shared/hooks/useApp';
import { getPresignedUrl, createPost } from '../api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { UploadCloud, CheckCircle, Clock, Send, Calendar as CalendarIcon, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export const UploadPage = () => {
  const { apiKey, allAccounts, workspaces, profile } = useApp();
  const [file, setFile] = useState(null);
  const [mediaRef, setMediaRef] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [caption, setCaption] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  
  const [publishMode, setPublishMode] = useState('Now'); // 'Now', 'Schedule'
  const [scheduleDate, setScheduleDate] = useState('');
  
  // Platform specific settings
  const [igSettings, setIgSettings] = useState({
    postType: 'Reel', // Feed, Story, Reel
    aiGenerated: false,
    collaborators: '',
    firstComment: '',
    customCaption: ''
  });

  const [ttSettings, setTtSettings] = useState({
    draft: false,
    location: '',
    onlyAds: false,
    customCaption: ''
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/*': [], 'image/*': [] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const selected = acceptedFiles[0];
      setFile(selected);
      handleUpload(selected);
    }
  });

  const handleUpload = async (fileToUpload) => {
    try {
      setUploading(true);
      const presignRes = await getPresignedUrl(apiKey, {
        filename: fileToUpload.name,
        contentType: fileToUpload.type,
        size: fileToUpload.size
      });
      
      const { uploadUrl, publicUrl } = presignRes.data;

      await axios.put(uploadUrl, fileToUpload, {
        headers: { 'Content-Type': fileToUpload.type }
      });

      setMediaRef(publicUrl);
      toast.success('Media uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Media upload failed');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const toggleAccount = (accId) => {
    setSelectedAccounts(prev => 
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    );
  };

  const handleSubmit = async () => {
    if (!mediaRef && !file) return toast.error('Please upload media first');
    if (selectedAccounts.length === 0) return toast.error('Select at least one account');

    setUploading(true);

    // Group selected accounts by workspace
    const selectedFullAccounts = selectedAccounts.map(id => allAccounts.find(a => a._id === id)).filter(Boolean);
    const groupedAccounts = selectedFullAccounts.reduce((acc, account) => {
      if (!acc[account.workspaceId]) acc[account.workspaceId] = [];
      acc[account.workspaceId].push(account);
      return acc;
    }, {});

    try {
      const promises = Object.entries(groupedAccounts).map(async ([wsId, accountsInWs]) => {
        const ws = workspaces.find(w => w.id === wsId);
        if (!ws) throw new Error(`Workspace not found for id ${wsId}`);

        const platforms = accountsInWs.map(acc => {
          const p = { platform: acc.platform, accountId: acc._id };
          if (acc.platform === 'instagram') p.customText = igSettings.customCaption || undefined;
          if (acc.platform === 'tiktok') p.customText = ttSettings.customCaption || undefined;
          return p;
        });

        const payload = {
          content: caption,
          mediaItems: [{ url: mediaRef }],
          platforms,
        };

        if (platforms.some(p => p.platform === 'tiktok')) {
          payload.tiktokSettings = {
            videoCoverTimestampMs: 0
          };
        }

        if (publishMode === 'Schedule' && scheduleDate) {
          payload.scheduledFor = new Date(scheduleDate).toISOString();
        } else {
          payload.publishNow = true;
        }

        await createPost(ws.apiKey, payload);
        return { wsLabel: ws.label, success: true };
      });

      const results = await Promise.allSettled(promises);
      
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failures = results.filter(r => r.status === 'rejected');

      if (successes.length > 0) {
        toast.success(`Success for ${successes.length} workspace(s)!`);
      }
      if (failures.length > 0) {
        toast.error(`Failed on ${failures.length} workspace(s)`);
      }

      if (failures.length === 0) {
        // Reset only if all succeeded
        setCaption(''); setFile(null); setMediaRef(null);
        setScheduleDate(''); setSelectedAccounts([]);
      }
    } catch (err) {
      toast.error('Unexpected error during publish');
    } finally {
      setUploading(false);
    }
  };

  const hasInstagram = selectedAccounts.some(id => allAccounts.find(a => a._id === id)?.platform === 'instagram');
  const hasTiktok = selectedAccounts.some(id => allAccounts.find(a => a._id === id)?.platform === 'tiktok');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", visualDuration: 0.6, bounce: 0.4 }}
      className="max-w-6xl mx-auto pb-20"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 text-foreground">Create Post</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* LEFT COLUMN: Content & Platform Settings */}
        <div className="flex flex-col gap-6">
          
          {/* Main Content Area */}
          <div className="glass-panel p-6">
            <h3 className="font-extrabold text-lg mb-4 text-muted-foreground lowercase">content</h3>
            <textarea 
              className="input-field mb-4 min-h-[150px] resize-y text-lg" 
              placeholder="What's on your mind..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
            
            <div {...getRootProps()} className={`dropzone p-8 border-2 border-dashed rounded-xl transition-all ${isDragActive ? 'border-primary bg-secondary' : 'border-border bg-background hover:bg-secondary/50'}`}>
              <input {...getInputProps()} />
              {uploading && !mediaRef ? (
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud className="animate-bounce text-primary" size={32} />
                  <p className="font-bold">Uploading to cloud...</p>
                </div>
              ) : mediaRef ? (
                <div className="flex flex-col items-center gap-2 text-primary">
                  <CheckCircle size={32} />
                  <p className="font-bold">Media Ready</p>
                  <small className="text-muted-foreground font-medium">{file?.name}</small>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer">
                  <UploadCloud size={32} />
                  <p className="font-bold">+ Add media</p>
                </div>
              )}
            </div>
          </div>

          {/* Instagram Settings Tab */}
          {hasInstagram && (
            <div className="glass-panel p-6 border-l-8 border-l-[#E1306C]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white p-1.5 rounded-lg shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <h3 className="font-black text-xl">Instagram</h3>
                </div>
                
                {/* Segmented Control */}
                <div className="flex bg-secondary p-1.5 rounded-lg border-2 border-black">
                  {['Feed', 'Reel'].map(t => (
                    <button 
                      key={t}
                      onClick={(e) => { e.preventDefault(); setIgSettings({...igSettings, postType: t}); }}
                      className={`px-3 py-1 text-sm font-black uppercase rounded-md transition-colors ${igSettings.postType === t ? 'bg-white border-2 border-black text-black' : 'text-muted-foreground hover:text-black border-2 border-transparent'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <label className="flex items-start gap-4 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-5 h-5 accent-primary border-2 border-border rounded" checked={igSettings.aiGenerated} onChange={e => setIgSettings({...igSettings, aiGenerated: e.target.checked})} />
                  <div>
                    <p className="font-bold">Label as AI-generated</p>
                    <p className="text-sm text-muted-foreground leading-tight mt-1">Adds Instagram's AI-content label. Use when media is created or edited with AI.</p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground lowercase mb-2">first comment</label>
                  <textarea className="input-field min-h-[80px]" placeholder="Drop any extra context or a CTA here." value={igSettings.firstComment} onChange={e => setIgSettings({...igSettings, firstComment: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground lowercase mb-2">custom caption</label>
                  <textarea className="input-field min-h-[100px]" placeholder="Leave blank to use main content..." value={igSettings.customCaption} onChange={e => setIgSettings({...igSettings, customCaption: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {/* TikTok Settings Tab */}
          {hasTiktok && (
            <div className="glass-panel p-6 border-l-8 border-l-black">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-black text-white p-1.5 rounded-lg shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.03z"/></svg>
                </div>
                <h3 className="font-black text-xl">TikTok</h3>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground lowercase mb-2">location tag (optional)</label>
                  <input type="text" className="input-field" placeholder="Search a city, venue or address..." value={ttSettings.location} onChange={e => setTtSettings({...ttSettings, location: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground lowercase mb-2">custom caption</label>
                  <textarea className="input-field min-h-[100px]" placeholder="Leave blank to use main content..." value={ttSettings.customCaption} onChange={e => setTtSettings({...ttSettings, customCaption: e.target.value})} />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Accounts & Publishing */}
        <div className="flex flex-col gap-6">
          
          <div className="glass-panel p-6">
            <h3 className="font-extrabold text-lg mb-2 text-muted-foreground lowercase">profiles</h3>
            <p className="text-sm text-muted-foreground mb-4">Select one or more platforms to post</p>
            
            <div className="flex flex-col gap-3">
              {Object.entries(
                allAccounts.reduce((acc, a) => {
                  if (!acc[a.workspaceLabel]) acc[a.workspaceLabel] = [];
                  acc[a.workspaceLabel].push(a);
                  return acc;
                }, {})
              ).map(([wsLabel, accs]) => (
                <div key={wsLabel} className="mb-4 last:mb-0">
                  <p className="text-xs font-black uppercase text-muted-foreground mb-2 tracking-widest">{wsLabel}</p>
                  <div className="flex flex-col gap-3">
                    {accs.map(acc => {
                      const isSelected = selectedAccounts.includes(acc._id);
                      const isIg = acc.platform === 'instagram';
                      const isTt = acc.platform === 'tiktok';
                      
                      return (
                        <button 
                          key={acc._id}
                          onClick={() => toggleAccount(acc._id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-primary bg-primary/10 shadow-[4px_4px_0px_0px_var(--primary)] -translate-y-1' : 'border-border bg-background hover:bg-secondary shadow-sm'}`}
                        >
                          {acc.profilePicture ? (
                            <img src={acc.profilePicture} className="w-10 h-10 rounded-lg border-2 border-border object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border-2 border-border bg-black text-white flex items-center justify-center font-bold uppercase">
                              {isIg ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                              ) : isTt ? 'T' : acc.platform.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-sm capitalize leading-tight">{acc.platform}</p>
                            <p className="text-xs text-muted-foreground font-medium leading-tight">{acc.displayName || acc.username}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {allAccounts.length === 0 && (
                <p className="text-sm text-danger font-bold">No accounts linked across any workspace.</p>
              )}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-extrabold text-lg mb-4 text-muted-foreground lowercase">publishing</h3>
            
            <div className="flex bg-secondary p-1.5 rounded-xl border-2 border-black mb-6">
              {['Schedule', 'Now'].map(mode => (
                <button 
                  key={mode}
                  onClick={() => setPublishMode(mode)}
                  className={`flex-1 py-2 text-sm font-black uppercase rounded-lg transition-all ${publishMode === mode ? 'bg-white border-2 border-black text-black' : 'text-muted-foreground border-2 border-transparent hover:text-black'}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {publishMode === 'Schedule' && (
              <div className="mb-6 animate-fade-in">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-sm font-bold text-muted-foreground lowercase">date & time</label>
                  <label className="text-sm font-bold text-muted-foreground lowercase">timezone</label>
                </div>
                <input 
                  type="datetime-local" 
                  className="input-field bg-background font-medium" 
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                />
              </div>
            )}

            <button 
              onClick={handleSubmit}
              disabled={uploading || (!mediaRef && !file) || selectedAccounts.length === 0} 
              className="btn w-full py-4 text-lg"
            >
              {uploading ? 'Processing...' : publishMode === 'Schedule' ? 'Schedule Post' : 'Publish Now'}
            </button>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
};
