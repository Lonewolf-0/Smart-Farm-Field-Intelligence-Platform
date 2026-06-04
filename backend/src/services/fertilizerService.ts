import { SoilNPK, FertilizerPlan } from "../types";
import { cropNutrientRequirements } from "../data/crop-nutrient-requirements";
import { findFieldById } from "../repositories/field.repository";
import { findLatestSoilByFieldId } from "../repositories/soil.repository";
import { calculateCropSuitability } from "./crop-suitability.service";
import { getWeatherData } from "./weather.service";

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

export const getFertilizerService = async (
  userId: string,
  fieldId: string,
  body: any,
) => {
  const { crop, soilN, soilP, soilK } = body || {};

  //1.Field
  const field = await findFieldById(fieldId);
  if (!field) {
    throw { status: 404, message: "Field not found" };
  }

  if (field.user_id !== userId) {
    throw {
      status: 403,
      message: "Forbidden",
      code: "FIELD_ACCESS_DENIED",
    };
  }

  //2.Soil
  let soilData;
  if (soilN !== undefined && soilP !== undefined && soilK !== undefined) {
    soilData = {
      nitrogen: Number(soilN),
      phosphorus: Number(soilP),
      potassium: Number(soilK),
    };
  } else {
    const soil = await findLatestSoilByFieldId(fieldId);

    if (!soil) {
      throw { status: 400, message: "run soil analysis first" };
    }

    const layer = soil.data.layers[0];

    soilData = {
      nitrogen: layer.nitrogen || 0,
      phosphorus: 40,
      potassium: 50,
    };
  }

  //3.Crop selection
  let selectedCrop = crop;

  if (!selectedCrop) {
    const weather = await getWeatherData(
      field.centroid_lat,
      field.centroid_lng,
    );

    const soil = await findLatestSoilByFieldId(fieldId);
    const layer = soil?.data.layers[0];

    if (!layer) {
      throw { status: 400, message: "Run soil analysis first" };
    }

    const soilInput = {
      ph: layer.ph,
      organicCarbon: layer.organicCarbon,
      soilTexture: layer.texture.toLowerCase(),
    };

    const suitability = calculateCropSuitability(soilInput, weather);

    selectedCrop = suitability[0]?.name;
  }

  if (!selectedCrop) {
    throw { status: 400, message: "Unable to determine crop" };
  }

  //4.Calculate fertilizer
  const plan = calculateFertilizer(soilData, selectedCrop, 1);

  return {
    crop: selectedCrop,
    ...plan,
  };
};
