import React, { useMemo, useState, useEffect } from 'react';
import { Reading, TariffConfig } from '../types';
import { 
  calcularCustoReal, 
  formatCurrency, 
  formatNumber,
  calcularConsumoEntreLeituras
} from '../utils/calculations';
import { 
  Zap, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  PieChart as PieIcon,
  Filter
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

interface DashboardProps {
  readings: Reading[];
  tariffs: TariffConfig;
}

// Helper para processar dados brutos em eventos de consumo
interface ConsumptionEvent {
  date: Date;
  kwh: number;
  reading: number;
  monthKey: string; // YYYY-MM
  daysSinceLast: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ readings, tariffs }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('current');

  // 1. Processar todas as leituras para gerar histórico de consumo completo
  // Isso é feito ANTES de filtrar, pois o consumo de um mês pode depender da última leitura do mês anterior.
  const fullHistory = useMemo(() => {
    const sorted = [...readings].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    const history: ConsumptionEvent[] = [];
    
    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const prev = sorted[i-1];
        
        const kwh = calcularConsumoEntreLeituras(prev.leitura, current.leitura);
        const currentDate = new Date(current.data);
        const prevDate = new Date(prev.data);
        const days = (currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
        
        // Ajuste de fuso horário simples para garantir que o mês fique correto (YYYY-MM)
        const monthKey = current.data.substring(0, 7); 

        history.push({
            date: currentDate,
            kwh,
            reading: current.leitura,
            monthKey,
            daysSinceLast: days
        });
    }
    return history;
  }, [readings]);

  // 2. Extrair meses disponíveis para o filtro
  const availableMonths = useMemo(() => {
    const months = new Set(fullHistory.map(h => h.monthKey));
    return Array.from(months).sort().reverse();
  }, [fullHistory]);

  // 3. Definir seleção inicial (Mês atual ou último disponível)
  useEffect(() => {
    if (selectedMonth === 'current' && availableMonths.length > 0) {
        const now = new Date().toISOString().substring(0, 7);
        if (availableMonths.includes(now)) {
            setSelectedMonth(now);
        } else {
            setSelectedMonth(availableMonths[0]);
        }
    }
  }, [availableMonths, selectedMonth]);

  // 4. Filtrar dados baseados na seleção
  const filteredData = useMemo(() => {
    if (selectedMonth === 'all' || selectedMonth === 'current') return fullHistory;
    return fullHistory.filter(h => h.monthKey === selectedMonth);
  }, [fullHistory, selectedMonth]);

  // 5. Calcular KPIs
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;

    const totalKwh = filteredData.reduce((acc, curr) => acc + curr.kwh, 0);
    const costs = calcularCustoReal(totalKwh, tariffs);
    const lastEvent = filteredData[filteredData.length - 1];

    // Lógica de Projeção / Média / Fechamento
    let projectionInfo = {
        type: 'Fechado', // 'Projeção', 'Média', 'Fechado'
        kwh: totalKwh,
        cost: costs.total,
        label: 'Total do Período'
    };

    const currentMonthKey = new Date().toISOString().substring(0, 7);

    if (selectedMonth === 'all') {
        // Modo "Todos": Mostrar médias
        const uniqueMonths = new Set(filteredData.map(d => d.monthKey)).size;
        if (uniqueMonths > 0) {
            projectionInfo = {
                type: 'Média Mensal',
                kwh: totalKwh / uniqueMonths,
                cost: costs.total / uniqueMonths,
                label: 'Média por Mês'
            };
        }
    } else if (selectedMonth === currentMonthKey) {
        // Modo "Mês Atual": Calcular Projeção
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        // Soma dos dias cobertos pelas leituras deste mês
        const daysCovered = filteredData.reduce((acc, curr) => acc + curr.daysSinceLast, 0);
        
        if (daysCovered > 0) {
            const dailyAvg = totalKwh / daysCovered;
            const projectedKwh = dailyAvg * daysInMonth;
            const projectedCost = calcularCustoReal(projectedKwh, tariffs).total;
            
            projectionInfo = {
                type: 'Projeção',
                kwh: projectedKwh,
                cost: projectedCost,
                label: 'Estimativa Final'
            };
        }
    }
    // Se for mês passado, mantém "Fechado" (total real)

    return {
        totalKwh,
        costs,
        lastReading: lastEvent.reading,
        lastDate: lastEvent.date,
        projection: projectionInfo
    };
  }, [filteredData, tariffs, selectedMonth]);

  // Dados para Gráficos
  const chartData = useMemo(() => {
      return filteredData.map(d => ({
          name: d.date.toLocaleDateString('pt-BR', { day: '2-digit', month: selectedMonth === 'all' ? 'short' : undefined }),
          kwh: d.kwh,
          fullDate: d.date.toLocaleDateString('pt-BR')
      }));
  }, [filteredData, selectedMonth]);

  const compositionData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'TUSD', value: stats.costs.custoTUSD, color: '#6366f1' },
      { name: 'TE', value: stats.costs.custoTE, color: '#10b981' },
      { name: 'Bandeira', value: stats.costs.custoBandeira, color: '#f59e0b' },
      { name: 'Ilum. Púb.', value: stats.costs.iluminacao, color: '#8b5cf6' },
    ];
  }, [stats]);

  // Formatar label do mês para o dropdown
  const formatMonthLabel = (key: string) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // -- Renderização --

  if (readings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Bem-vindo ao EnergiReal</h3>
        <p className="text-sm text-slate-400 text-center max-w-xs mt-2">
          Comece registrando a leitura do seu medidor de energia para visualizar as análises.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
            <p className="text-slate-500 text-sm mt-1">
                Acompanhamento de consumo e custos.
            </p>
        </div>
        
        {/* Filtro de Mês */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <div className="pl-2 text-slate-400">
                <Filter size={16} />
            </div>
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none p-1.5 cursor-pointer min-w-[160px]"
            >
                <option value="all">Todos os períodos</option>
                {availableMonths.map(month => (
                    <option key={month} value={month}>
                        {formatMonthLabel(month).charAt(0).toUpperCase() + formatMonthLabel(month).slice(1)}
                    </option>
                ))}
            </select>
        </div>
      </div>

      {stats ? (
        <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card: Última Leitura (ou Leitura Final do Período) */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 text-slate-500 rounded-full">
                        {selectedMonth === 'all' ? 'Mais Recente' : 'Final'}
                    </span>
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Leitura do Medidor</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatNumber(stats.lastReading)}</h3>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {stats.lastDate.toLocaleDateString('pt-BR')}
                    </p>
                </div>
                </div>

                {/* Card: Consumo Total/Filtrado */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Consumo Filtrado</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        {formatNumber(stats.totalKwh)} <span className="text-sm font-medium text-slate-400">kWh</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-2">
                        {selectedMonth === 'all' ? 'Acumulado Total' : 'Neste Mês'}
                    </p>
                </div>
                </div>

                {/* Card: Custo Real do Período */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                        <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                        {tariffs.bandeira.tipo}
                    </span>
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Custo Real</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        {formatCurrency(stats.costs.total)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2">
                        Valor calculado
                    </p>
                </div>
                </div>

                {/* Card: Projeção / Média / Fechamento */}
                <div className={`p-5 rounded-2xl shadow-lg relative overflow-hidden group text-white ${
                    stats.projection.type === 'Projeção' 
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-700 shadow-indigo-200' 
                        : 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-200'
                }`}>
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/10">
                            <PieIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/10">
                            {stats.projection.type}
                        </span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm text-indigo-100 font-medium">{stats.projection.label}</p>
                        <h3 className="text-2xl font-bold mt-1 text-white">
                            {formatCurrency(stats.projection.cost)}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white border border-white/10">
                                ~{formatNumber(stats.projection.kwh)} kWh
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Evolução do Consumo</h3>
                        {selectedMonth !== 'all' && (
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                {formatMonthLabel(selectedMonth)}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 min-h-[300px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#94a3b8" 
                                        tick={{fontSize: 12}} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        dy={10}
                                        interval={selectedMonth === 'all' ? 'preserveStartEnd' : 0}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8" 
                                        tick={{fontSize: 12}} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: number) => [`${formatNumber(value)} kWh`, 'Consumo']}
                                        labelFormatter={(label) => label}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="kwh" 
                                        stroke="#6366f1" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorTrend)" 
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <p className="text-sm">Sem dados para este período</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Cost Breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Composição da Fatura</h3>
                    <p className="text-xs text-slate-500 mb-6">Detalhamento proporcional.</p>

                    <div className="h-[220px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={compositionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    cornerRadius={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {compositionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Central Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-400 font-medium">Total</span>
                            <span className="text-lg font-bold text-slate-700">{formatCurrency(stats.costs.total)}</span>
                        </div>
                    </div>

                    {/* Custom Legend */}
                    <div className="mt-4 space-y-3">
                        {compositionData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm group">
                                <div className="flex items-center gap-2.5">
                                    <div 
                                        className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" 
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-slate-600 font-medium">{item.name}</span>
                                </div>
                                <div className="text-slate-800 font-semibold bg-slate-50 px-2 py-0.5 rounded group-hover:bg-slate-100 transition-colors">
                                    {formatCurrency(item.value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      ) : (
          <div className="text-center py-20 text-slate-400">
              <p>Nenhuma leitura encontrada para o período selecionado.</p>
          </div>
      )}
    </div>
  );
};
