import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { createZernioClient } from '../api/client';

const AppContext = createContext(null);

export const getProfileId = (p) => {
  if (!p) return null;
  if (typeof p === 'string') return p;
  if (p._id) return p._id;
  if (p.id) return p.id;
  if (p.profileId) return p.profileId;
  if (p.data) return getProfileId(p.data);
  return null;
};

export const AppProvider = ({ children }) => {
  const [workspaces, setWorkspacesState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sf_workspaces')) || [];
    } catch {
      return [];
    }
  });
  
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => {
    return localStorage.getItem('sf_active_workspace') || null;
  });

  const [allAccounts, setAllAccounts] = useState([]);

  const setWorkspaces = useCallback((ws) => {
    setWorkspacesState(ws);
    localStorage.setItem('sf_workspaces', JSON.stringify(ws));
  }, []);

  const setActiveWorkspaceId = useCallback((id) => {
    setActiveWorkspaceIdState(id);
    localStorage.setItem('sf_active_workspace', id || '');
  }, []);

  const activeWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || null;
  }, [workspaces, activeWorkspaceId]);

  const apiKey = activeWorkspace?.apiKey || '';
  const profile = activeWorkspace?.profile || null;
  const profileId = useMemo(() => getProfileId(profile), [profile]);

  const accounts = useMemo(() => {
    return allAccounts.filter(a => a.workspaceId === activeWorkspace?.id);
  }, [allAccounts, activeWorkspace]);

  const fetchAllAccounts = useCallback(async () => {
    if (workspaces.length === 0) return;
    
    let combinedAccounts = [];
    
    const promises = workspaces.map(async (ws) => {
      try {
        const res = await createZernioClient(ws.apiKey).get('/accounts');
        const accs = res.data?.accounts || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        const pId = getProfileId(ws.profile);
        
        const filtered = accs.filter(a => {
          const p = a.profileId || a.profile;
          if (!p) return true;
          const pid = typeof p === 'string' ? p : (p._id || p.id);
          return pid === pId;
        }).map(a => ({ ...a, workspaceId: ws.id, workspaceLabel: ws.label }));
        
        combinedAccounts = [...combinedAccounts, ...filtered];
      } catch (err) {
        console.error(`Failed to load accounts for workspace ${ws.label}:`, err);
      }
    });

    await Promise.allSettled(promises);
    setAllAccounts(combinedAccounts);
  }, [workspaces]);

  useEffect(() => {
    fetchAllAccounts();
  }, [fetchAllAccounts]);

  const clearAuth = useCallback(() => {
    setWorkspaces([]);
    setActiveWorkspaceId(null);
    setAllAccounts([]);
    localStorage.removeItem('sf_workspaces');
    localStorage.removeItem('sf_active_workspace');
  }, [setWorkspaces, setActiveWorkspaceId]);

  return (
    <AppContext.Provider value={{ 
      workspaces, 
      setWorkspaces, 
      activeWorkspaceId: activeWorkspace?.id, 
      setActiveWorkspaceId,
      activeWorkspace,
      apiKey, 
      profile, 
      profileId, 
      accounts,
      setAccounts: fetchAllAccounts,
      allAccounts,
      fetchAllAccounts,
      clearAuth 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
