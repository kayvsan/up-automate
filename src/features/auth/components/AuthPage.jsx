import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../shared/hooks/useApp';
import { fetchProfiles, createProfile } from '../api';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2, ArrowRight } from 'lucide-react';

export const AuthPage = () => {
  const { workspaces, setWorkspaces, setActiveWorkspaceId } = useApp();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (workspaces.length > 0) {
      navigate('/', { replace: true });
    }
  }, [workspaces, navigate]);

  const [inputs, setInputs] = useState(
    workspaces.length > 0 
      ? workspaces.map(w => ({ id: w.id, label: w.label, apiKey: w.apiKey }))
      : [{ id: 'ws_' + Date.now(), label: 'Bisnis Utama', apiKey: '' }]
  );
  
  const [loading, setLoading] = useState(false);

  const handleAddRow = () => {
    setInputs([...inputs, { id: 'ws_' + Date.now(), label: `Workspace ${inputs.length + 1}`, apiKey: '' }]);
  };

  const handleRemoveRow = (id) => {
    setInputs(inputs.filter(i => i.id !== id));
  };

  const handleChange = (id, field, value) => {
    setInputs(inputs.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validInputs = inputs.filter(i => i.apiKey.trim() && i.label.trim());
    
    if (validInputs.length === 0) {
      return toast.error('Minimal masukkan 1 API Key yang valid');
    }

    setLoading(true);
    let newWorkspaces = [];

    try {
      for (const input of validInputs) {
        const res = await fetchProfiles(input.apiKey.trim());
        const list = res.data?.profiles || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        
        let profile = null;
        if (list.length > 0) {
          const defaultProfile = list.find(p => p.isDefault) || list[0];
          profile = defaultProfile?.data ? defaultProfile.data : defaultProfile;
        } else {
          const newRes = await createProfile(input.apiKey.trim(), input.label);
          profile = newRes.data?.profile || newRes.data?.data || newRes.data;
        }

        newWorkspaces.push({
          id: input.id,
          label: input.label.trim(),
          apiKey: input.apiKey.trim(),
          profile
        });
      }

      setWorkspaces(newWorkspaces);
      if (newWorkspaces.length > 0) {
        setActiveWorkspaceId(newWorkspaces[0].id);
      }
      
      toast.success(`${newWorkspaces.length} workspace(s) connected!`);
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memvalidasi API Key. Periksa kembali key Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="bg-white p-8 md:p-12 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-fade-in w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="bg-primary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
            <Key size={40} color="black" />
          </div>
          <h2 className="text-4xl font-black mb-3 text-black">Setup Workspaces</h2>
          <p className="text-lg font-bold text-gray-600">Hubungkan berbagai akun Anda untuk posting paralel.</p>
        </div>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-6 mb-8">
            {inputs.map((input, index) => (
              <div key={input.id} className="flex flex-col sm:flex-row gap-4 items-end p-5 bg-[#fef08a] rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-full sm:w-1/3">
                  <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Label Workspace</label>
                  <input 
                    type="text" 
                    className="input-field mb-0 h-[52px] bg-white border-2 border-black focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg" 
                    placeholder="Contoh: Klien A" 
                    value={input.label}
                    onChange={e => handleChange(input.id, 'label', e.target.value)}
                    required
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">API Key</label>
                  <input 
                    type="password" 
                    className="input-field mb-0 h-[52px] bg-white border-2 border-black focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg" 
                    placeholder="sk_..." 
                    value={input.apiKey}
                    onChange={e => handleChange(input.id, 'apiKey', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black mb-2 uppercase opacity-0 select-none pointer-events-none">X</label>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveRow(input.id)}
                    disabled={inputs.length === 1}
                    className="w-[52px] h-[52px] bg-red-400 border-2 border-black rounded-lg text-black font-black hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center p-0"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button"
            onClick={handleAddRow}
            className="w-full py-4 mb-8 bg-[#34d399] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl font-black text-black flex items-center justify-center gap-2 hover:bg-[#10b981] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-lg"
          >
            <Plus size={24} strokeWidth={3} /> Tambah Workspace Lain
          </button>

          <button className="btn w-full py-5 text-xl flex justify-center gap-3 items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" type="submit" disabled={loading}>
            {loading ? 'Memvalidasi...' : (
              <>Mulai Menggunakan SociFlow <ArrowRight size={24} strokeWidth={3}/></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
