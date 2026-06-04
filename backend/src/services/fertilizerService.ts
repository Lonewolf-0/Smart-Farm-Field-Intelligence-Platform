import { SoilNPK, FertilizerPlan } from "../types";
import { cropNutrientRequirements } from "../data/crop-nutrient-requirements";

export const calculateFertilizer = (
  soilNPK: SoilNPK,
  cropName: string,
  fieldArea: number,
): FertilizerPlan => {
  //Get crop requirement
  const crop = cropNutrientRequirements.find(
    (c) => c.cropName.toLowerCase() === cropName.toLocaleLowerCase(),
  );

  if (!crop) {
    throw new Error("Crop not supported");
  }

  //Available nutrients
  const availableN = soilNPK.nitrogen * 0.5;
  const availableP = soilNPK.phosphorus * 0.4;
  const availableK = soilNPK.potassium * 0.6;

  //deficit calculations
  let nDeficit = Math.max(0, crop.nitrogenRequired - availableN);
  let pDeficit = Math.max(0, crop.phosphorusRequired - availableP);
  let kDeficit = Math.max(0, crop.potassiumRequired - availableK);

  //convert to fertilizers
  let urea = nDeficit / 0.46;
  let dap = pDeficit / 0.46;
  let mop = kDeficit / 0.6;

  //adjust nitrogen from DAP
  const dapNitrogen = dap * 0.18;
  urea = Math.max(0, (nDeficit - dapNitrogen) / 0.46);

  //scale by field area
  urea *= fieldArea;
  dap *= fieldArea;
  mop *= fieldArea;

  //Prepare recommendations

  const recommendations = [];

  if (urea > 0) {
    recommendations.push({
      name: "Urea",
      quantity: Number(urea.toFixed(2)),
      unit: "kg",
    });
  }

  if (dap > 0) {
    recommendations.push({
      name: "DAP",
      quantity: Number(dap.toFixed(2)),
      unit: "kg",
    });
  }

  if (mop > 0) {
    recommendations.push({
      name: "MOP",
      quantity: Number(mop.toFixed(2)),
      unit: "kg",
    });
  }

  const totalQuantity = recommendations.reduce((sum, r) => sum + r.quantity, 0);

  //Schedule

  const applicationSchedule =
    recommendations.length === 0
      ? ["No fertilizer needed"]
      : ["Apply 50% at sowing", "Apply remaining 50% after 30 days"];

  return {
    nitrogenDeficit: Number(nDeficit.toFixed(2)),
    phosphorusDeficit: Number(pDeficit.toFixed(2)),
    potassiumDeficit: Number(kDeficit.toFixed(2)),
    recommendations,
    totalQuantity: Number(totalQuantity.toFixed(2)),
    applicationSchedule,
  };
};
