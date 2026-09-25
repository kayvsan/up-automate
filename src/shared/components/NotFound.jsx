import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="bg-white p-8 md:p-12 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center w-full max-w-md animate-fade-in">
        <div className="mb-8">
          <h1 className="text-8xl font-black inline-block bg-[#fef08a] text-black px-8 py-2 border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-3">404</h1>
        </div>
        <h2 className="text-2xl font-black mb-4 text-black uppercase">Ups! Kesasar ya?</h2>
        <p className="text-gray-600 mb-8 font-bold text-lg">Halaman yang Anda cari tidak dapat ditemukan atau sudah dihapus.</p>
        
        <Link 
          to="/"
          className="w-full py-4 bg-[#34d399] border-4 border-black rounded-xl font-black text-black text-lg flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#10b981] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Home size={24} strokeWidth={3} />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
};
