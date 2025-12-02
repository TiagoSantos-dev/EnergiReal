import { Reading, TariffConfig } from '../types';
import { DEFAULT_TARIFFS } from '../constants';

const KEYS = {
  READINGS: 'energi_real_readings',
  TARIFFS: 'energi_real_tariffs',
};

export const getReadings = (): Reading[] => {
  const data = localStorage.getItem(KEYS.READINGS);
  return data ? JSON.parse(data) : [];
};

export const saveReading = (reading: Reading): Reading[] => {
  const readings = getReadings();
  const newReadings = [...readings, reading];
  localStorage.setItem(KEYS.READINGS, JSON.stringify(newReadings));
  return newReadings;
};

export const updateReading = (updatedReading: Reading): Reading[] => {
  const readings = getReadings().map(r => r.id === updatedReading.id ? updatedReading : r);
  localStorage.setItem(KEYS.READINGS, JSON.stringify(readings));
  return readings;
};

export const deleteReading = (id: string): Reading[] => {
  const readings = getReadings().filter(r => r.id !== id);
  localStorage.setItem(KEYS.READINGS, JSON.stringify(readings));
  return readings;
};

export const getTariffs = (): TariffConfig => {
  const data = localStorage.getItem(KEYS.TARIFFS);
  return data ? JSON.parse(data) : DEFAULT_TARIFFS;
};

export const saveTariffs = (tariffs: TariffConfig): TariffConfig => {
  localStorage.setItem(KEYS.TARIFFS, JSON.stringify(tariffs));
  return tariffs;
}