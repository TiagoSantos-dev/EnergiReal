import React, { useState, useEffect } from 'react';
import { TariffConfig } from '../types';
import { Settings, RefreshCw } from 'lucide-react';
import { DEFAULT_TARIFFS } from '../constants';

interface TariffSettingsProps {
  tariffs: TariffConfig;
  onSave: (tariffs: TariffConfig) => void;
}

export const TariffSettings: React.FC<TariffSettingsProps> = ({ tariffs, onSave }) => {
  const [config, setConfig] = useState<TariffConfig>(tariffs);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
      setConfig(tariffs);
  }, [tariffs]);

  const handleChange = (section: keyof TariffConfig, key: string, value: string | number) => {
    setConfig((prev) => {
        if (section === 'bandeira' && key === 'tipo') {
             return {
                ...prev,
                [section]: { ...prev[section], [key]: value as string }
             }
        }
        if (typeof prev[section] === 'object') {
             return {
                ...prev,
                [section]: { ...prev[section] as any, [key]: parseFloat(value.toString()) }
             };
        }
        return {
            ...prev,
            [section]: parseFloat(value.toString())
        }
    });
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const resetDefaults = () => {
    setConfig(DEFAULT_TARIFFS);
    setIsSaved(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Configuração de Tarifas
        </h2>
        <button onClick={resetDefaults} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Padrão
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TUSD Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">TUSD (Tarifa de Uso do Sistema de Distribuição)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Com Tributos (R$/kWh)</label>
                    <input 
                        type="number" step="0.00001" 
                        value={config.tusd.unitarioComTributos}
                        onChange={(e) => handleChange('tusd', 'unitarioComTributos', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Sem Tributos (R$/kWh)</label>
                    <input 
                        type="number" step="0.00001" 
                        value={config.tusd.unitarioSemTributos}
                        onChange={(e) => handleChange('tusd', 'unitarioSemTributos', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                    />
                </div>
            </div>
        </div>

        {/* TE Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">TE (Tarifa de Energia)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Com Tributos (R$/kWh)</label>
                    <input 
                        type="number" step="0.00001" 
                        value={config.te.unitarioComTributos}
                        onChange={(e) => handleChange('te', 'unitarioComTributos', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Sem Tributos (R$/kWh)</label>
                    <input 
                        type="number" step="0.00001" 
                        value={config.te.unitarioSemTributos}
                        onChange={(e) => handleChange('te', 'unitarioSemTributos', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                    />
                </div>
            </div>
        </div>

        {/* Bandeira Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">Bandeira Tarifária</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                    <select 
                        value={config.bandeira.tipo}
                        onChange={(e) => handleChange('bandeira', 'tipo', e.target.value)}
                        className="w-full p-2 border rounded text-sm bg-white"
                    >
                        <option value="Verde">Verde</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Vermelha P1">Vermelha P1</option>
                        <option value="Vermelha P2">Vermelha P2</option>
                        <option value="Escassez Hídrica">Escassez Hídrica</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Valor Adicional (R$/kWh)</label>
                    <input 
                        type="number" step="0.00001" 
                        value={config.bandeira.valorPorKwh}
                        onChange={(e) => handleChange('bandeira', 'valorPorKwh', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                    />
                </div>
            </div>
        </div>

        {/* IP Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div className="flex justify-between items-center">
                 <label className="text-sm font-semibold text-slate-700">Iluminação Pública (Valor Fixo)</label>
                 <input 
                        type="number" step="0.01" 
                        value={config.iluminacaoPublica}
                        onChange={(e) => handleChange('iluminacaoPublica', '', e.target.value)}
                        className="w-32 p-2 border rounded text-sm text-right"
                 />
             </div>
        </div>

        <button
          type="submit"
          className={`w-full py-3 rounded-lg font-semibold transition-all shadow-md ${isSaved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          {isSaved ? 'Configurações Salvas!' : 'Salvar Tarifas'}
        </button>
      </form>
    </div>
  );
};