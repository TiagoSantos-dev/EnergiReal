import React, { useMemo, useState } from 'react';
import { Reading, TariffConfig } from '../types';
import { calcularConsumoEntreLeituras, calcularCustoReal, formatCurrency, formatNumber } from '../utils/calculations';
import { Trash2, TrendingUp, BarChart2, Edit2, Check, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface HistoryProps {
  readings: Reading[];
  tariffs: TariffConfig;
  onDelete: (id: string) => void;
  onUpdate: (reading: Reading) => void;
}

export const History: React.FC<HistoryProps> = ({ readings, tariffs, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{data: string, leitura: string}>({ data: '', leitura: '' });

  // 1. Ordenação Cronológica (Ascendente) para Cálculos Corretos
  const sortedReadings = useMemo(() => 
    [...readings].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
  [readings]);

  // 2. Pré-cálculo dos valores (Consumo e Custo) mantendo ordem cronológica
  const calculatedHistory = useMemo(() => {
    return sortedReadings.map((reading, index) => {
        const isInitial = index === 0;
        // Consumo depende da leitura anterior na lista ordenada cronologicamente
        const consumption = isInitial 
            ? 0 
            : calcularConsumoEntreLeituras(sortedReadings[index-1].leitura, reading.leitura);
        
        const cost = isInitial
            ? 0
            : calcularCustoReal(consumption, tariffs).total;

        return {
            ...reading,
            consumption,
            cost,
            isInitial,
            displayDate: new Date(reading.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            fullDate: new Date(reading.data).toLocaleDateString('pt-BR')
        };
    });
  }, [sortedReadings, tariffs]);

  // 3. Dados para Gráficos (Removemos o inicial pois não tem consumo, mantemos ordem cronológica)
  const chartData = useMemo(() => {
    return calculatedHistory.filter(r => !r.isInitial);
  }, [calculatedHistory]);

  // 4. Dados para Tabela (Invertemos para mostrar Mais Recente -> Mais Antigo)
  const tableData = useMemo(() => {
      return [...calculatedHistory].reverse();
  }, [calculatedHistory]);

  const handleEditClick = (reading: Reading) => {
    setEditingId(reading.id);
    setEditValues({
      data: reading.data,
      leitura: reading.leitura.toString()
    });
  };

  const handleCancelClick = () => {
    setEditingId(null);
  };

  const handleSaveClick = () => {
    if (editingId) {
      onUpdate({
        id: editingId,
        data: editValues.data,
        leitura: parseFloat(editValues.leitura)
      });
      setEditingId(null);
    }
  };

  if (readings.length < 2) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
            <BarChart2 className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">Dados insuficientes</h3>
            <p className="text-slate-500 mb-4">Adicione pelo menos duas leituras para visualizar o histórico de consumo e gráficos.</p>
            {/* Show a simplified list if only 1 item exists, just so user can edit/delete the first one */}
            {readings.length === 1 && (
                 <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                     <p className="text-sm text-slate-400 mb-2 text-left">Leitura Inicial:</p>
                     <div className="flex items-center justify-between">
                         <div className="text-left">
                            <p className="font-bold text-slate-700">{formatNumber(readings[0].leitura)} kWh</p>
                            <p className="text-xs text-slate-400">{new Date(readings[0].data).toLocaleDateString('pt-BR')}</p>
                         </div>
                         <button 
                            onClick={() => onDelete(readings[0].id)}
                            className="text-red-400 hover:text-red-600 p-2"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                     </div>
                 </div>
            )}
        </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumption Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Histórico de Consumo (kWh)
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`${formatNumber(value)} kWh`, 'Consumo']}
                        />
                        <Area type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorKwh)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Cost Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Evolução de Custos (R$)
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                        <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             formatter={(value: number) => [formatCurrency(value), 'Custo Total']}
                        />
                        <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Tabela de Leituras</h3>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{readings.length} registros</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Leitura (kWh)</th>
                        <th className="px-6 py-3">Consumo</th>
                        <th className="px-6 py-3">Custo Estimado</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {tableData.map((item) => {
                        const isEditing = editingId === item.id;

                        return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">
                                    {isEditing ? (
                                        <input 
                                            type="date" 
                                            value={editValues.data}
                                            onChange={(e) => setEditValues({...editValues, data: e.target.value})}
                                            className="border border-slate-300 rounded px-2 py-1 w-full max-w-[140px] focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    ) : (
                                        item.fullDate
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={editValues.leitura}
                                            onChange={(e) => setEditValues({...editValues, leitura: e.target.value})}
                                            className="border border-slate-300 rounded px-2 py-1 w-full max-w-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    ) : (
                                        formatNumber(item.leitura)
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {item.isInitial ? (
                                        <span className="text-slate-400 italic">Inicial</span>
                                    ) : (
                                        <span className="font-semibold text-blue-600">+{item.consumption} kWh</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                     {item.isInitial ? (
                                        <span className="text-slate-400 italic">-</span>
                                    ) : (
                                        <span className="font-semibold text-emerald-600">{formatCurrency(item.cost)}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {isEditing ? (
                                            <>
                                                <button 
                                                    onClick={handleSaveClick}
                                                    className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-full transition-colors"
                                                    title="Salvar"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={handleCancelClick}
                                                    className="bg-slate-100 text-slate-500 hover:bg-slate-200 p-2 rounded-full transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => handleEditClick(item)}
                                                    className="text-indigo-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50"
                                                    title="Editar leitura"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(item.id)}
                                                    className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                                    title="Excluir leitura"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};