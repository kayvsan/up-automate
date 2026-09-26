import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { LayoutDashboard, Users, Clock, LogOut, Upload, ChevronDown, Check, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/accounts', icon: Users, label: 'Accounts' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/history', icon: Clock, label: 'History' },
];

export const Layout = () => {
  const { workspaces, activeWorkspace, setActiveWorkspaceId, clearAuth } = useApp();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/auth');
  };

  if (workspaces.length === 0) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="app-container relative">

      {/* ── DESKTOP & TABLET SIDEBAR (hidden on mobile) ── */}
      <aside className={`sidebar hidden md:flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-[72px] p-3' : 'w-[260px] p-5'}`}>
        
        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-4 top-10 bg-white border-2 border-black rounded-full p-1 z-50 hover:bg-[#fef08a] transition-transform hover:scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="mb-8 shrink-0">
          <h2 className={`text-2xl font-black text-primary mb-5 tracking-tight drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] pb-1 overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'text-center' : 'pr-2'}`}>
            {isSidebarCollapsed ? 'S' : 'SociFlow'}
          </h2>
          
          {/* Workspace Switcher */}
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`bg-[#fef08a] border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center cursor-pointer transition-transform active:translate-y-1 active:shadow-none ${isSidebarCollapsed ? 'p-2 justify-center' : 'p-3 justify-between'}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="bg-white border-2 border-black rounded-full w-7 h-7 flex items-center justify-center text-base shadow-sm shrink-0">🟣</span>
                {!isSidebarCollapsed && (
                  <span className="text-sm font-bold text-black overflow-hidden text-ellipsis whitespace-nowrap">
                    {activeWorkspace?.label || 'Workspace'}
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <ChevronDown size={16} className={`shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </div>
            
            <AnimatePresence>
              {isDropdownOpen && !isSidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.92, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 z-50 mt-2"
                >
                  <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                    {workspaces.map(w => (
                      <button
                        key={w.id}
                        onClick={() => { setActiveWorkspaceId(w.id); setIsDropdownOpen(false); }}
                        className={`flex items-center justify-between p-3 text-sm font-bold text-left transition-colors border-b border-black/10 last:border-0 ${activeWorkspace?.id === w.id ? 'bg-[#fef08a]' : 'hover:bg-gray-50'}`}
                      >
                        <span className="truncate pr-2">{w.label}</span>
                        {activeWorkspace?.id === w.id && <Check size={14} className="shrink-0" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pb-4">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center !px-0' : ''}`
              }
            >
              <Icon size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          className={`btn btn-secondary shrink-0 mt-4 ${isSidebarCollapsed ? '!p-3 flex justify-center' : 'w-full'}`}
          onClick={handleLogout}
        >
          <LogOut size={18} className={isSidebarCollapsed ? '' : 'mr-2'} />
          {!isSidebarCollapsed && <span>Disconnect</span>}
        </button>
      </aside>

      {/* ── MOBILE TOP BAR (visible only on mobile) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b-2 border-sidebar-border flex items-center justify-between px-4 h-14 shadow-[0_2px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-black text-primary tracking-tight drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">SociFlow</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-sidebar-foreground/70 max-w-[120px] truncate">{activeWorkspace?.label}</span>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg border-2 border-sidebar-border bg-sidebar-accent/20 hover:bg-sidebar-accent/40 transition-colors"
          >
            <Menu size={20} className="text-sidebar-foreground" />
          </button>
        </div>
      </div>

      {/* ── MOBILE SLIDE-IN MENU ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-sidebar border-r-2 border-sidebar-border flex flex-col p-5 shadow-[4px_0_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">SociFlow</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg border-2 border-sidebar-border hover:bg-sidebar-accent/30 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Workspace */}
              <div className="mb-6 bg-[#fef08a] border-2 border-black rounded-lg p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1">Active Workspace</p>
                <p className="font-bold text-sm text-black truncate">{activeWorkspace?.label || 'None'}</p>
                {workspaces.length > 1 && (
                  <div className="mt-3 flex flex-col gap-1">
                    {workspaces.map(w => (
                      <button
                        key={w.id}
                        onClick={() => { setActiveWorkspaceId(w.id); setIsMobileMenuOpen(false); }}
                        className={`text-left text-sm font-bold px-2 py-1.5 rounded-md border border-black/20 transition-colors ${activeWorkspace?.id === w.id ? 'bg-white text-black' : 'text-black/70 hover:bg-white/50'}`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <nav className="flex flex-col gap-1.5 flex-1">
                {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>

              <button className="btn btn-secondary w-full mt-4" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" /> Disconnect All
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content md:pt-0 pt-14">
        <Outlet />
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t-2 border-sidebar-border flex items-center justify-around px-2 h-16 shadow-[0_-2px_0px_0px_rgba(0,0,0,1)]">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground scale-105 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-black uppercase tracking-wide leading-none">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
