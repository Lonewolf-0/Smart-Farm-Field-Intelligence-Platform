export const FERTILIZER_PRICES: Record<string, { pricePerLb: number; bagSizeLbs: number }> = {
  "Urea": { pricePerLb: 0.27, bagSizeLbs: 50 },
  "DAP": { pricePerLb: 0.36, bagSizeLbs: 50 },
  "MOP": { pricePerLb: 0.32, bagSizeLbs: 50 }
};

export const KG_PER_HA_TO_LBS_PER_ACRE = 0.892179;

/**
 * Calculates pricing and bag requirements for a fertilizer product.
 * @param productName Name of the fertilizer (e.g. "Urea")
 * @param quantityKgPerHa Raw quantity required in kg/ha from the backend
 * @param areaAcres Total field area in acres
 * @returns Calculated metrics for display and reporting
 */
export function calculateFertilizerMetrics(productName: string, quantityKgPerHa: number, areaAcres: number) {
  const pricing = FERTILIZER_PRICES[productName] || { pricePerLb: 0.27, bagSizeLbs: 50 };
  
  const quantityPerAcre = quantityKgPerHa * KG_PER_HA_TO_LBS_PER_ACRE;
  const totalQuantityLbs = quantityPerAcre * areaAcres;
  
  const totalBags = Math.ceil(totalQuantityLbs / pricing.bagSizeLbs);
  
  const costPerAcre = quantityPerAcre * pricing.pricePerLb;
  const totalCost = costPerAcre * areaAcres;

  return {
    quantityPerAcre,
    totalQuantityLbs,
    totalBags,
    costPerAcre,
    totalCost,
    pricePerLb: pricing.pricePerLb,
    bagSizeLbs: pricing.bagSizeLbs
  };
}
