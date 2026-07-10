import type React from 'react';

/** "$ 24.600" — formato del prototipo (es-AR, sin decimales salvo centavos reales). */
export function money(amount: number): string {
  const hasCents = Math.abs(amount % 1) > 0.001;
  return `$ ${amount.toLocaleString('es-AR', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })}`;
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "Hoy", "Ayer", "3 jul" */
export function shortDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return `${day} ${MONTHS_SHORT[month - 1]}`;
}

/** "dic 2026" */
export function monthYear(isoDate: string): string {
  const [year, month] = isoDate.slice(0, 10).split('-').map(Number);
  return `${MONTHS_SHORT[month - 1]} ${year}`;
}

/** "julio" — nombre del mes actual o de un YYYY-MM. */
export function monthName(yyyyMm?: string): string {
  const month = yyyyMm ? Number(yyyyMm.split('-')[1]) : new Date().getMonth() + 1;
  return MONTHS_LONG[month - 1];
}

/** "09 · 07 · 2026" — fecha de la estampilla. */
export function stampDate(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd} · ${mm} · ${date.getFullYear()}`;
}

/** Fondo pastel por nombre de token ('lilac' → var(--lilac)). */
export function pastel(color: string | null | undefined): React.CSSProperties {
  return { background: `var(--${color ?? 'butter'})` };
}
