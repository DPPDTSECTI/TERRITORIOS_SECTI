import { clsx } from 'clsx';

/**
 * Utilitário para combinar e condicionalizar classes CSS usando clsx.
 * @param  {...any} inputs - Nomes de classes ou objetos condicionais
 * @returns {string} Classes combinadas
 */
export function cn(...inputs) {
  return clsx(inputs);
}
