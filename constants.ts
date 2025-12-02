import { TariffConfig } from './types';

export const DEFAULT_TARIFFS: TariffConfig = {
  tusd: {
    unitarioComTributos: 0.45,
    unitarioSemTributos: 0.38
  },
  te: {
    unitarioComTributos: 0.35,
    unitarioSemTributos: 0.29
  },
  bandeira: {
    tipo: 'Verde',
    valorPorKwh: 0.00,
    bandeira2: {
      ativa: false,
      tipo: 'Amarela',
      valor: 0.01885
    }
  },
  iluminacaoPublica: {
    tipo: 'fixo',
    valor: 15.00
  }
};

export const MOCK_READINGS = [
  { id: '1', data: '2023-10-01', leitura: 10500 },
  { id: '2', data: '2023-10-15', leitura: 10620 }
];