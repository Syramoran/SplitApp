import { ValueTransformer } from 'typeorm';

/**
 * Postgres devuelve NUMERIC como string para no perder precisión.
 * Para los montos de la app (2 decimales) un number de JS alcanza,
 * así que convertimos en el borde de la DB y operamos con números.
 */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null): number | null | undefined => value,
  from: (value?: string | null): number | null =>
    value === null || value === undefined ? null : parseFloat(value),
};

export const round2 = (n: number): number => Math.round(n * 100) / 100;
