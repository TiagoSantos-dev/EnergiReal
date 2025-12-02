import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Reading, TariffConfig } from './types';
import { getReadings, saveReading, getTariffs, saveTariffs, deleteReading, updateReading } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { ReadingForm } from './components/ReadingForm';
import { TariffSettings } from './components/TariffSettings';
import { History } from './components/History';
import { Login } from './components/Login';
import { LayoutDashboard, PlusCircle, Settings, History as HistoryIcon, Zap, LogOut, Loader2 } from 'lucide-react';
import { DEFAULT_TARIFFS } from './constants';

enum Tab {
  DASHBOARD = 'dashboard',
  ADD = 'add',
  HISTORY = 'history',
  SETTINGS = 'settings'
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  
  const [readings, setReadings] = useState<Reading[]>([]);
  const [tariffs, setTariffs] = useState<TariffConfig | null>(null);
  
  const [loadingData, setLoadingData] = useState(false);

  // 1. Gerenciamento de Sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Busca de Dados quando a sessão existe
  useEffect(() => {
    if (session) {
      loadData();
    } else {
      setReadings([]);
      setTariffs(null);
    }
  }, [session]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [fetchedReadings, fetchedTariffs] = await Promise.all([
        getReadings(),
        getTariffs()
      ]);
      setReadings(fetchedReadings);
      setTariffs(fetchedTariffs || DEFAULT_TARIFFS);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab(Tab.DASHBOARD);
  };

  const handleSaveReading = async (reading: Reading) => {
    try {
      // Remove ID for creation, Supabase generates it
      const { id, ...readingData } = reading;
      const saved = await saveReading(readingData);
      if (saved) {
        setReadings(prev => [...prev, saved]);
        setActiveTab(Tab.DASHBOARD);
      }
    } catch (e) {
      alert('Erro ao salvar leitura');
    }
  };

  const handleUpdateReading = async (reading: Reading) => {
    try {
      const updated = await updateReading(reading);
      if (updated) {
        setReadings(prev => prev.map(r => r.id === updated.id ? updated : r));
      }
    } catch (e) {
      alert('Erro ao atualizar leitura');
    }
  };

  const handleSaveTariffs = async (config: TariffConfig) => {
    try {
      const saved = await saveTariffs(config);
      setTariffs(saved);
    } catch (e) {
      alert('Erro ao salvar tarifas');
    }
  };

  const handleDeleteReading = async (id: string) => {
      if(window.confirm('Tem certeza que deseja excluir esta leitura?')) {
        try {
          await deleteReading(id);
          setReadings(prev => prev.filter(r => r.id !== id));
        } catch (e) {
          alert('Erro ao excluir leitura');
        }
      }
  };

  const getLastReading = () => {
    if (readings.length === 0) return undefined;
    return [...readings].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).pop();
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  const renderContent = () => {
    if (loadingData && !tariffs) {
      return <div className="flex h-[50vh] items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2"/> Carregando dados...</div>;
    }

    // Fallback if tariffs failed to load but we aren't loading anymore
    const safeTariffs = tariffs || DEFAULT_TARIFFS;

    switch (activeTab) {
      case Tab.DASHBOARD:
        return <Dashboard readings={readings} tariffs={safeTariffs} />;
      case Tab.ADD:
        return <ReadingForm onSave={handleSaveReading} lastReading={getLastReading()} tariffs={safeTariffs} />;
      case Tab.HISTORY:
        return <History readings={readings} tariffs={safeTariffs} onDelete={handleDeleteReading} onUpdate={handleUpdateReading} />;
      case Tab.SETTINGS:
        return <TariffSettings tariffs={safeTariffs} onSave={handleSaveTariffs} />;
      default:
        return <Dashboard readings={readings} tariffs={safeTariffs} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-sm shadow-indigo-200">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                EnergiReal
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              <NavButton 
                active={activeTab === Tab.DASHBOARD} 
                onClick={() => setActiveTab(Tab.DASHBOARD)} 
                icon={<LayoutDashboard size={18} />}
                label="Visão Geral"
              />
              <NavButton 
                active={activeTab === Tab.HISTORY} 
                onClick={() => setActiveTab(Tab.HISTORY)} 
                icon={<HistoryIcon size={18} />}
                label="Histórico"
              />
              <NavButton 
                active={activeTab === Tab.ADD} 
                onClick={() => setActiveTab(Tab.ADD)} 
                icon={<PlusCircle size={18} />}
                label="Nova Leitura"
              />
              <NavButton 
                active={activeTab === Tab.SETTINGS} 
                onClick={() => setActiveTab(Tab.SETTINGS)} 
                icon={<Settings size={18} />}
                label="Tarifas"
              />
            </div>

            {/* Logout Button (Desktop & Mobile header) */}
            <div className="flex items-center gap-4">
                <span className="hidden sm:block text-xs text-slate-400 max-w-[100px] truncate">{session.user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <MobileNavButton 
            active={activeTab === Tab.DASHBOARD} 
            onClick={() => setActiveTab(Tab.DASHBOARD)} 
            icon={<LayoutDashboard size={20} />}
            label="Início"
          />
          <MobileNavButton 
            active={activeTab === Tab.HISTORY} 
            onClick={() => setActiveTab(Tab.HISTORY)} 
            icon={<HistoryIcon size={20} />}
            label="Histórico"
          />
           <MobileNavButton 
            active={activeTab === Tab.ADD} 
            onClick={() => setActiveTab(Tab.ADD)} 
            icon={<PlusCircle size={20} />}
            label="Adicionar"
          />
          <MobileNavButton 
            active={activeTab === Tab.SETTINGS} 
            onClick={() => setActiveTab(Tab.SETTINGS)} 
            icon={<Settings size={20} />}
            label="Tarifas"
          />
      </div>
    </div>
  );
};

// Helper Components for Nav
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-[60px] ${
      active ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400'
    }`}
  >
    {icon}
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

export default App;
