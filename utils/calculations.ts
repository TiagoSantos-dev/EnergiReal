import { Reading, TariffConfig, CostBreakdown, ProjectionResult } from '../types';

export function calcularConsumoEntreLeituras(leituraAnterior: number | null, leituraAtual: number): number {
    if (leituraAnterior === null) return 0;
    return Math.max(leituraAtual - leituraAnterior, 0);
}

export function calcularCustoReal(kwh: number, tarifas: TariffConfig): CostBreakdown {
    const custoTUSD = kwh * tarifas.tusd.unitarioComTributos;
    const custoTE   = kwh * tarifas.te.unitarioComTributos;
    const custoBandeira = kwh * tarifas.bandeira.valorPorKwh;
    const iluminacao = tarifas.iluminacaoPublica;

    const total = custoTUSD + custoTE + custoBandeira + iluminacao;

    return {
        custoTUSD,
        custoTE,
        custoBandeira,
        iluminacao,
        total
    };
}

export function calcularProjecao(leituras: Reading[], tarifas: TariffConfig): ProjectionResult | null {
    if (leituras.length < 2) return null;

    // Clone and sort by date
    const sortedReadings = [...leituras].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    let totalConsumido = 0;

    // Only consider readings from the current month/cycle if we want strict monthly projection, 
    // but the prompt implies a general projection based on recent history.
    // For better accuracy, let's grab the range of the provided readings.
    
    for (let i = 1; i < sortedReadings.length; i++) {
        const kwh = calcularConsumoEntreLeituras(
            sortedReadings[i - 1].leitura,
            sortedReadings[i].leitura
        );
        totalConsumido += kwh;
    }

    const firstDate = new Date(sortedReadings[0].data);
    const lastDate = new Date(sortedReadings[sortedReadings.length - 1].data);
    
    const timeDiff = lastDate.getTime() - firstDate.getTime();
    const daysPassed = timeDiff / (1000 * 3600 * 24);

    if (daysPassed <= 0) return null;

    const mediaDiaria = totalConsumido / daysPassed;

    const diasNoMes = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
    ).getDate();

    const kwhProjetado = mediaDiaria * diasNoMes;
    const custos = calcularCustoReal(kwhProjetado, tarifas);

    return {
        mediaDiaria,
        kwhProjetado,
        custoEstimado: custos.total
    };
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
};