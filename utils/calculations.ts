import { Reading, TariffConfig, CostBreakdown, ProjectionResult } from '../types';

export function calcularConsumoEntreLeituras(leituraAnterior: number | null, leituraAtual: number): number {
    if (leituraAnterior === null) return 0;
    return Math.max(leituraAtual - leituraAnterior, 0);
}

export function calcularCustoReal(kwh: number, tarifas: TariffConfig): CostBreakdown {
    const custoTUSD = kwh * tarifas.tusd.unitarioComTributos;
    const custoTE   = kwh * tarifas.te.unitarioComTributos;
    
    // Bandeira 1
    const custoBandeira1 = kwh * tarifas.bandeira.valorPorKwh;
    
    // Bandeira 2 (se ativa)
    let custoBandeira2 = 0;
    if (tarifas.bandeira.bandeira2?.ativa) {
        custoBandeira2 = kwh * tarifas.bandeira.bandeira2.valor;
    }
    
    const custoBandeiraTotal = custoBandeira1 + custoBandeira2;

    // Iluminação Pública (Fixo ou Variável/Percentual)
    let iluminacao = 0;
    
    // Verificação de segurança para formato legado (se por acaso vier number direto)
    if (typeof tarifas.iluminacaoPublica === 'number') {
        iluminacao = tarifas.iluminacaoPublica;
    } else {
        if (tarifas.iluminacaoPublica.tipo === 'percentual') {
            // Percentual sobre o valor total do kWh consumido (TUSD + TE + Bandeiras)
            // Ex: Se o consumo deu R$ 100,00 e a taxa é 10%, a iluminação será R$ 10,00
            const custoBase = custoTUSD + custoTE + custoBandeiraTotal;
            iluminacao = custoBase * (tarifas.iluminacaoPublica.valor / 100);
        } else {
            iluminacao = tarifas.iluminacaoPublica.valor;
        }
    }

    const total = custoTUSD + custoTE + custoBandeiraTotal + iluminacao;

    return {
        custoTUSD,
        custoTE,
        custoBandeira: custoBandeiraTotal,
        iluminacao,
        total
    };
}

export function calcularProjecao(leituras: Reading[], tarifas: TariffConfig): ProjectionResult | null {
    if (leituras.length < 2) return null;

    // Clone and sort by date
    const sortedReadings = [...leituras].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    let totalConsumido = 0;

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