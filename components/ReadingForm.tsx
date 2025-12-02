import React, { useState } from 'react';
import { Reading, TariffConfig } from '../types';
import { calcularConsumoEntreLeituras, calcularCustoReal, formatCurrency } from '../utils/calculations';
import { Save, Calculator } from 'lucide-react';

interface ReadingFormProps {
  onSave: (reading: Reading) => void;
  lastReading?: Reading;
  tariffs: TariffConfig;
}

export const ReadingForm: React.FC<ReadingFormProps> = ({ onSave, lastReading, tariffs }) => {
  const [leitura, setLeitura] = useState<string>('');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previewCost, setPreviewCost] = useState<number | null>(null);
  const [previewConsumption, setPreviewConsumption] = useState<number | null>(null);

  const handleCalculatePreview = () => {
    const val = parseFloat(leitura);
    if (isNaN(val) || !lastReading) return;

    const consumption = calcularConsumoEntreLeituras(lastReading.leitura, val);
    const costs = calcularCustoReal(consumption, tariffs);
    
    setPreviewConsumption(consumption);
    setPreviewCost(costs.total);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leitura || !data) return;

    const newReading: Reading = {
      id: crypto.randomUUID(),
      data,
      leitura: parseFloat(leitura),
    };

    onSave(newReading);
    setLeitura('');
    setPreviewCost(null);
    setPreviewConsumption(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Save className="w-5 h-5 text-indigo-600" />
        Registrar Leitura
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Data da Leitura</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Leitura do Medidor (kWh)</label>
          <input
            type="number"
            step="0.01"
            value={leitura}
            onChange={(e) => {
                setLeitura(e.target.value);
                setPreviewCost(null); // Reset preview on change
            }}
            placeholder="Ex: 10500"
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            required
          />
        </div>

        {lastReading && leitura && (
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
                    <span>Leitura Anterior:</span>
                    <span className="font-mono">{lastReading.leitura}</span>
                </div>
                
                {previewCost !== null ? (
                     <div className="space-y-2 mt-2 pt-2 border-t border-slate-200">
                        <div className="flex justify-between text-slate-700">
                            <span>Consumo Estimado:</span>
                            <span className="font-bold">{previewConsumption} kWh</span>
                        </div>
                        <div className="flex justify-between text-indigo-600">
                            <span>Custo Parcial:</span>
                            <span className="font-bold">{formatCurrency(previewCost)}</span>
                        </div>
                     </div>
                ) : (
                    <button 
                        type="button" 
                        onClick={handleCalculatePreview}
                        className="w-full mt-2 py-2 px-4 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Calculator className="w-4 h-4" />
                        Simular Custo
                    </button>
                )}
             </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm mt-4"
        >
          Salvar Leitura
        </button>
      </form>
    </div>
  );
};