/**
 * Utilidades para formateo de moneda en pesos dominicanos
 */

/**
 * Formatea un precio directamente a pesos dominicanos (RD$)
 * @param price - Precio directo (no en centavos)
 * @returns Precio formateado con símbolo RD$
 * @example formatPrice(25) => "RD$25"
 * @example formatPrice(150) => "RD$150"
 */
export const formatPrice = (price: number): string => {
  return `RD$${price.toFixed(0)}`;
};

/**
 * Formatea un precio solo con símbolo $ (para la página principal)
 * @param price - Precio directo (no en centavos)
 * @returns Precio formateado solo con símbolo $
 * @example formatPriceHome(25) => "$25"
 * @example formatPriceHome(150) => "$150"
 */
export const formatPriceHome = (price: number): string => {
  return `$${price.toFixed(0)}`;
};