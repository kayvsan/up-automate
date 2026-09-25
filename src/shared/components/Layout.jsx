import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { LayoutDashboard, Users, Calendar, Clock, LogOut, Upload, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = () => {
  const { workspaces, activeWorkspace, setActiveWorkspaceId, clearAuth } = useApp();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
      <aside className={`sidebar flex flex-col h-screen sticky top-0 shrink-0 relative transition-all duration-300 ${isSidebarCollapsed ? 'w-[88px] p-4' : 'w-[280px] p-6'}`}>
        
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-4 top-10 bg-white border-2 border-black rounded-full p-1 z-50 hover:bg-[#fef08a] transition-transform hover:scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="mb-10 shrink-0">
          <h2 className={`text-3xl font-black text-primary mb-6 tracking-tight drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] pb-1 overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'text-center' : 'pr-2'}`}>
            {isSidebarCollapsed ? 'S' : 'SociFlow'}
          </h2>
          
          {/* Workspace Switcher */}
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`bg-[#fef08a] border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center cursor-pointer transition-transform active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] ${isSidebarCollapsed ? 'p-2 justify-center' : 'p-3 justify-between'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`bg-white border-2 border-black rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-sm shrink-0 ${isSidebarCollapsed ? '' : 'mr-1 mb-1'}`}>
                  🟣
                </span> 
                {!isSidebarCollapsed && (
                  <span className="text-sm font-bold text-black overflow-hidden text-ellipsis whitespace-nowrap">
                    {activeWorkspace?.label || 'Active Workspace'}
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
                  initial={{ opacity: 0, scale: 0.8, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.8, height: 0 }}
                  transition={{
                    duration: 0.4,
                    scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
                  }}
                  style={{ transformOrigin: "top" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 mb-2 mr-2 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                    {workspaces.map(w => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setActiveWorkspaceId(w.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between p-3 text-sm font-bold text-left transition-colors border-b-2 border-transparent last:border-0 ${activeWorkspace?.id === w.id ? 'bg-[#fef08a] text-black' : 'bg-white text-black hover:bg-gray-100'}`}
                      >
                        <span className="truncate pr-2">{w.label}</span>
                        {activeWorkspace?.id === w.id && <Check size={16} className="shrink-0" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto px-2 pb-4 pt-2 -mx-2">
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center !px-0' : ''}`}>
            <LayoutDashboard size={20} className="shrink-0" /> 
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/accounts" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center !px-0' : ''}`}>
            <Users size={20} className="shrink-0" /> 
            {!isSidebarCollapsed && <span>Accounts</span>}
          </NavLink>
          <NavLink to="/upload" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center !px-0' : ''}`}>
            <Upload size={20} className="shrink-0" /> 
            {!isSidebarCollapsed && <span>Upload & Post</span>}
          </NavLink>
          <NavLink to="/history" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center !px-0' : ''}`}>
            <Clock size={20} className="shrink-0" /> 
            {!isSidebarCollapsed && <span>Post History</span>}
          </NavLink>
        </nav>

        <button className={`btn btn-secondary shrink-0 mt-4 ${isSidebarCollapsed ? 'w-full !p-3 flex justify-center items-center' : 'w-full'}`} onClick={handleLogout}>
          <LogOut size={20} className={isSidebarCollapsed ? '' : 'mr-2'} /> 
          {!isSidebarCollapsed && <span>Disconnect All</span>}
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
