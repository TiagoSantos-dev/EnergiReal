import React, { useMemo } from 'react';
import { Reading, TariffConfig } from '../types';
import { 
  calcularProjecao, 
  calcularConsumoEntreLeituras, 
  calcularCustoReal, 
  formatCurrency, 
  formatNumber 
} from '../utils/calculations';
import { 
  Zap, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  PieChart as PieIcon 
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

export const Dashboard: React.FC<DashboardProps> = ({ readings, tariffs }) => {
  const sortedReadings = useMemo(() => 
    [...readings].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
  [readings]);

  // Cálculo das estatísticas gerais
  const stats = useMemo(() => {
    if (sortedReadings.length === 0) return null;

    const lastReading = sortedReadings[sortedReadings.length - 1];
    let totalKwh = 0;
    
    // Calcula consumo total
    for (let i = 1; i < sortedReadings.length; i++) {
        totalKwh += calcularConsumoEntreLeituras(sortedReadings[i-1].leitura, sortedReadings[i].leitura);
    }

    const currentCosts = calcularCustoReal(totalKwh, tariffs);
    const projection = calcularProjecao(sortedReadings, tariffs);

    return {
      lastReading,
      totalKwh,
      currentCosts,
      projection
    };
  }, [sortedReadings, tariffs]);

  // Dados para o Gráfico de Área (Histórico recente)
  const trendData = useMemo(() => {
    if (sortedReadings.length < 2) return [];
    return sortedReadings.map((reading, index) => {
      const consumption = index === 0 ? 0 : calcularConsumoEntreLeituras(sortedReadings[index-1].leitura, reading.leitura);
      return {
        name: new Date(reading.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        kwh: consumption,
        fullDate: new Date(reading.data).toLocaleDateString('pt-BR')
      };
    }).slice(1); // Remove o primeiro pois não tem consumo anterior
  }, [sortedReadings]);

  // Dados para o Gráfico de Rosca (Composição)
  const compositionData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'TUSD', value: stats.currentCosts.custoTUSD, color: '#6366f1' }, // Indigo
      { name: 'TE', value: stats.currentCosts.custoTE, color: '#10b981' }, // Emerald
      { name: 'Bandeira', value: stats.currentCosts.custoBandeira, color: '#f59e0b' }, // Amber
      { name: 'Ilum. Púb.', value: stats.currentCosts.iluminacao, color: '#8b5cf6' }, // Violet
    ];
  }, [stats]);

  // Custom Tooltip para o Gráfico de Área
  const CustomTooltipArea = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className="text-sm font-bold text-indigo-600">
            {formatNumber(payload[0].value)} kWh
          </p>
        </div>
      );
    }
    return null;
  };

  // Estado vazio
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

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
            <p className="text-slate-500 text-sm mt-1">
                Acompanhamento e projeção do seu consumo.
            </p>
        </div>
        <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Hoje</p>
            <p className="text-sm font-semibold text-slate-700 capitalize">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Última Leitura */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 text-slate-500 rounded-full">
                Medidor
            </span>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Última Leitura</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatNumber(stats.lastReading.leitura)}</h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(stats.lastReading.data).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Card: Consumo Acumulado */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            {readings.length > 2 && (
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Ativo
                </span>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Consumo no Período</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {formatNumber(stats.totalKwh)} <span className="text-sm font-medium text-slate-400">kWh</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2">
                Acumulado entre leituras
            </p>
          </div>
        </div>

        {/* Card: Custo Estimado */}
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
            <p className="text-sm text-slate-500 font-medium">Custo Parcial</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(stats.currentCosts.total)}
            </h3>
            <p className="text-xs text-slate-400 mt-2">
                Baseado nas tarifas atuais
            </p>
          </div>
        </div>

        {/* Card: Projeção (Destaque) */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 rounded-2xl shadow-lg shadow-indigo-200 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/10">
                    <PieIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/10">
                    Estimativa
                </span>
            </div>
            <div className="relative z-10">
                <p className="text-sm text-indigo-100 font-medium">Projeção Mensal</p>
                {stats.projection ? (
                    <>
                    <h3 className="text-2xl font-bold mt-1 text-white">
                        {formatCurrency(stats.projection.custoEstimado)}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-indigo-500/50 px-2 py-0.5 rounded text-indigo-50 border border-indigo-400/30">
                            ~{formatNumber(stats.projection.kwhProjetado)} kWh
                        </span>
                        <span className="text-[10px] text-indigo-200">
                            (Final do Mês)
                        </span>
                    </div>
                    </>
                ) : (
                    <div className="mt-2">
                        <p className="text-sm font-semibold">Dados insuficientes</p>
                        <p className="text-xs text-indigo-200">Adicione +1 leitura</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Evolução do Consumo</h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Últimos Registros</span>
            </div>
            
            <div className="flex-1 min-h-[300px]">
                {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                tick={{fontSize: 12}} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <Tooltip content={<CustomTooltipArea />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                            <Area 
                                type="monotone" 
                                dataKey="kwh" 
                                stroke="#6366f1" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorTrend)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p className="text-sm">Gráfico disponível após 2ª leitura</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right: Cost Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Composição da Fatura</h3>
            <p className="text-xs text-slate-500 mb-6">Detalhamento dos custos aplicados.</p>

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
                     <span className="text-lg font-bold text-slate-700">{formatCurrency(stats.currentCosts.total)}</span>
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
    </div>
  );
};