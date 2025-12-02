import React, { useState, useEffect } from 'react';
import { Reading, TariffConfig } from './types';
import { getReadings, saveReading, getTariffs, saveTariffs, deleteReading, updateReading } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { ReadingForm } from './components/ReadingForm';
import { TariffSettings } from './components/TariffSettings';
import { History } from './components/History';
import { LayoutDashboard, PlusCircle, Settings, History as HistoryIcon, Zap } from 'lucide-react';

enum Tab {
  DASHBOARD = 'dashboard',
  ADD = 'add',
  HISTORY = 'history',
  SETTINGS = 'settings'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [tariffs, setTariffs] = useState<TariffConfig | null>(null);

  useEffect(() => {
    // Initial Load
    setReadings(getReadings());
    setTariffs(getTariffs());
  }, []);

  const handleSaveReading = (reading: Reading) => {
    const updated = saveReading(reading);
    setReadings(updated);
    setActiveTab(Tab.DASHBOARD);
  };

  const handleUpdateReading = (reading: Reading) => {
    const updated = updateReading(reading);
    setReadings(updated);
  };

  const handleSaveTariffs = (config: TariffConfig) => {
    const updated = saveTariffs(config);
    setTariffs(updated);
  };

  const handleDeleteReading = (id: string) => {
      if(window.confirm('Tem certeza que deseja excluir esta leitura?')) {
        const updated = deleteReading(id);
        setReadings(updated);
      }
  };

  const getLastReading = () => {
    if (readings.length === 0) return undefined;
    return [...readings].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).pop();
  };

  if (!tariffs) return <div className="flex h-screen items-center justify-center text-slate-500">Carregando...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return <Dashboard readings={readings} tariffs={tariffs} />;
      case Tab.ADD:
        return <ReadingForm onSave={handleSaveReading} lastReading={getLastReading()} tariffs={tariffs} />;
      case Tab.HISTORY:
        return <History readings={readings} tariffs={tariffs} onDelete={handleDeleteReading} onUpdate={handleUpdateReading} />;
      case Tab.SETTINGS:
        return <TariffSettings tariffs={tariffs} onSave={handleSaveTariffs} />;
      default:
        return <Dashboard readings={readings} tariffs={tariffs} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
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

            {/* Mobile Menu Button - Simplified for this demo as a simple toggle, but usually would involve a drawer */}
            <div className="md:hidden flex items-center">
                <button 
                  onClick={() => setActiveTab(Tab.ADD)}
                  className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"
                >
                  <PlusCircle size={20} />
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-40 pb-safe">
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
        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
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
    className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
      active ? 'text-indigo-600' : 'text-slate-400'
    }`}
  >
    {icon}
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

export default App;