export interface Reading {
  id: string;
  data: string; // ISO date string YYYY-MM-DD
  leitura: number;
}

export interface TariffConfig {
  tusd: {
    unitarioComTributos: number;
    unitarioSemTributos: number;
  };
  te: {
    unitarioComTributos: number;
    unitarioSemTributos: number;
  };
  bandeira: {
    tipo: string;
    valorPorKwh: number;
  };
  iluminacaoPublica: number;
}

export interface CostBreakdown {
  custoTUSD: number;
  custoTE: number;
  custoBandeira: number;
  iluminacao: number;
  total: number;
}

export interface ProjectionResult {
  mediaDiaria: number;
  kwhProjetado: number;
  custoEstimado: number;
}

export interface MonthlyStats {
  consumption: number;
  cost: CostBreakdown;
  readingsCount: number;
}