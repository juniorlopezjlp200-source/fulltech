/**
 * Utilidades para formateo de moneda en pesos dominicanos
 */

/**
 * Formatea un precio en centavos a pesos dominicanos (RD$)
 * @param priceInCents - Precio en centavos
 * @returns Precio formateado con símbolo RD$
 * @example formatPrice(2500) => "RD$25"
 * @example formatPrice(15000) => "RD$150"
 */
export const formatPrice = (priceInCents: number): string => {
  return `RD$${(priceInCents / 100).toFixed(0)}`;
};

/**
 * Formatea un precio en centavos a pesos dominicanos con decimales
 * @param priceInCents - Precio en centavos
 * @returns Precio formateado con símbolo RD$ y dos decimales
 * @example formatPriceWithDecimals(2500) => "RD$25.00"
 * @example formatPriceWithDecimals(2550) => "RD$25.50"
 */
export const formatPriceWithDecimals = (priceInCents: number): string => {
  return `RD$${(priceInCents / 100).toFixed(2)}`;
};