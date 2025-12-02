import React, { useState, useEffect } from 'react';
import { TariffConfig } from '../types';
import { Settings, RefreshCw, Plus, Trash2 } from 'lucide-react';
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

  // Handler genérico atualizado para lidar com objetos aninhados
  const handleChange = (section: keyof TariffConfig, key: string, value: any) => {
    setConfig((prev) => {
        // Caso Iluminação Pública (objeto)
        if (section === 'iluminacaoPublica') {
            return {
                ...prev,
                iluminacaoPublica: {
                    ...prev.iluminacaoPublica,
                    [key]: key === 'tipo' ? value : parseFloat(value)
                }
            };
        }
        
        // Caso Bandeira
        if (section === 'bandeira') {
            // Bandeira Principal
            if (key === 'tipo' || key === 'valorPorKwh') {
                return {
                    ...prev,
                    bandeira: {
                        ...prev.bandeira,
                        [key]: key === 'tipo' ? value : parseFloat(value)
                    }
                };
            }
            // Bandeira 2 (Nested)
            if (key.startsWith('b2_')) {
                const subKey = key.replace('b2_', '');
                return {
                    ...prev,
                    bandeira: {
                        ...prev.bandeira,
                        bandeira2: {
                            ...(prev.bandeira.bandeira2 || DEFAULT_TARIFFS.bandeira.bandeira2!),
                            [subKey]: subKey === 'tipo' ? value : (subKey === 'ativa' ? value : parseFloat(value))
                        }
                    }
                };
            }
        }

        // Caso TUSD/TE
        if (typeof prev[section] === 'object' && section !== 'bandeira') {
             return {
                ...prev,
                [section]: { ...prev[section] as any, [key]: parseFloat(value.toString()) }
             };
        }
        
        return prev;
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
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md border border-slate-100 pb-20 md:pb-6">
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
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">TUSD (Distribuição)</h3>
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Valor com Tributos (R$/kWh)</label>
                    <input 
                        type="number" step="0.00001" 
                        value={config.tusd.unitarioComTributos}
                        onChange={(e) => handleChange('tusd', 'unitarioComTributos', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                        placeholder="Ex: 0.45"
                    />
                </div>
            </div>
        </div>

        {/* TE Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">TE (Energia)</h3>
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Valor com Tributos (R$/kWh)</label>
                    <input 
                        type="number" step="0.00001" 
                        value={config.te.unitarioComTributos}
                        onChange={(e) => handleChange('te', 'unitarioComTributos', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                        placeholder="Ex: 0.35"
                    />
                </div>
            </div>
        </div>

        {/* Bandeira Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">Bandeiras Tarifárias</h3>
            
            {/* Bandeira 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Tipo da Bandeira Principal</label>
                    <select 
                        value={config.bandeira.tipo}
                        onChange={(e) => handleChange('bandeira', 'tipo', e.target.value)}
                        className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
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
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                    />
                </div>
            </div>

            {/* Bandeira 2 (Opcional) */}
            {config.bandeira.bandeira2?.ativa ? (
                <div className="mt-4 p-3 bg-white rounded border border-indigo-100 relative">
                    <button 
                        type="button"
                        onClick={() => handleChange('bandeira', 'b2_ativa', false)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                        title="Remover 2ª Bandeira"
                    >
                        <Trash2 size={16} />
                    </button>
                    <h4 className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wider">Bandeira Secundária (Vigente no mesmo mês)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                            <select 
                                value={config.bandeira.bandeira2.tipo}
                                onChange={(e) => handleChange('bandeira', 'b2_tipo', e.target.value)}
                                className="w-full p-2 border rounded text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-200 outline-none"
                            >
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
                                value={config.bandeira.bandeira2.valor}
                                onChange={(e) => handleChange('bandeira', 'b2_valor', e.target.value)}
                                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <button 
                    type="button"
                    onClick={() => handleChange('bandeira', 'b2_ativa', true)}
                    className="mt-2 text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    <Plus size={14} /> Adicionar Bandeira Secundária (Período misto)
                </button>
            )}
        </div>

        {/* IP Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">Iluminação Pública</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs text-slate-500 mb-1">Tipo de Cobrança</label>
                    <select 
                        value={config.iluminacaoPublica.tipo}
                        onChange={(e) => handleChange('iluminacaoPublica', 'tipo', e.target.value)}
                        className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                    >
                        <option value="fixo">Valor Fixo (R$)</option>
                        <option value="percentual">Variável (Valor x kWh)</option>
                    </select>
                 </div>
                 <div>
                     <label className="block text-xs text-slate-500 mb-1">
                        {config.iluminacaoPublica.tipo === 'fixo' ? 'Valor Mensal (R$)' : 'Valor Unitário (R$/kWh)'}
                     </label>
                     <input 
                            type="number" step={config.iluminacaoPublica.tipo === 'fixo' ? "0.01" : "0.00001"}
                            value={config.iluminacaoPublica.valor}
                            onChange={(e) => handleChange('iluminacaoPublica', 'valor', e.target.value)}
                            className="w-full p-2 border rounded text-sm text-right focus:ring-2 focus:ring-indigo-200 outline-none"
                     />
                 </div>
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