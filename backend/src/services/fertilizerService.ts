import { SoilNPK, FertilizerPlan, FertilizerStep } from "../types";
import { cropNutrientRequirements } from "../data/crop-nutrient-requirements";
import { findFieldById } from "../repositories/field.repository";
import { findLatestSoilByFieldId } from "../repositories/soil.repository";
import { calculateCropSuitability } from "./crop-suitability.service";
import { getWeatherData } from "./weather.service";
import { cropSchedules, defaultSchedule } from "../data/applicationSchedules";
import { getNDVIData } from "./ndviService";

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

  const schedule = cropSchedules.find(
    (s) => s.cropName.toLowerCase() === cropName.toLowerCase()
  ) || defaultSchedule;

  const scheduleSteps: FertilizerStep[] = [];

  if (recommendations.length > 0) {
    for (const step of schedule.steps) {
      const stepRecs = [];

      // Urea split (based on step.nutrients.n)
      const ureaRec = recommendations.find((r) => r.name === "Urea");
      if (ureaRec && step.nutrients.n > 0) {
        const stepQty = Number((ureaRec.quantity * (step.nutrients.n / 100)).toFixed(2));
        if (stepQty > 0) {
          stepRecs.push({
            name: "Urea",
            quantity: stepQty,
            unit: "kg",
          });
        }
      }

      // DAP split (based on step.nutrients.p)
      const dapRec = recommendations.find((r) => r.name === "DAP");
      if (dapRec && step.nutrients.p > 0) {
        const stepQty = Number((dapRec.quantity * (step.nutrients.p / 100)).toFixed(2));
        if (stepQty > 0) {
          stepRecs.push({
            name: "DAP",
            quantity: stepQty,
            unit: "kg",
          });
        }
      }

      // MOP split (based on step.nutrients.k)
      const mopRec = recommendations.find((r) => r.name === "MOP");
      if (mopRec && step.nutrients.k > 0) {
        const stepQty = Number((mopRec.quantity * (step.nutrients.k / 100)).toFixed(2));
        if (stepQty > 0) {
          stepRecs.push({
            name: "MOP",
            quantity: stepQty,
            unit: "kg",
          });
        }
      }

      scheduleSteps.push({
        stage: step.stage,
        days: step.days,
        description: step.description,
        recommendations: stepRecs,
      });
    }
  } else {
    scheduleSteps.push({
      stage: "None Required",
      days: 0,
      description: "No fertilizer needed",
      recommendations: [],
    });
  }

  return {
    nitrogenDeficit: Number(nDeficit.toFixed(2)),
    phosphorusDeficit: Number(pDeficit.toFixed(2)),
    potassiumDeficit: Number(kDeficit.toFixed(2)),
    recommendations,
    totalQuantity: Number(totalQuantity.toFixed(2)),
    applicationSchedule,
    scheduleSteps,
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
  const soil = await findLatestSoilByFieldId(fieldId);
  const layer = soil?.data.layers[0];

  if (soilN !== undefined && soilP !== undefined && soilK !== undefined) {
    soilData = {
      nitrogen: Number(soilN),
      phosphorus: Number(soilP),
      potassium: Number(soilK),
    };
  } else {
    if (!soil || !layer) {
      throw { status: 400, message: "run soil analysis first" };
    }

    // Dynamic P estimation based on pH & OC
    const ph = layer.ph || 6.5;
    let phFactor = 1.0;
    if (ph < 5.5 || ph > 8.0) {
      phFactor = 0.6;
    } else if (ph < 6.0 || ph > 7.2) {
      phFactor = 0.8;
    }

    const oc = layer.organicCarbon !== null ? layer.organicCarbon / 10 : 1.5;
    const ocFactor = Math.min(1.5, Math.max(0.5, oc / 1.5));
    const dynamicP = Number((40 * phFactor * ocFactor).toFixed(1));

    // Dynamic K estimation based on texture
    const clay = layer.clay || 20;
    const sand = layer.sand || 40;
    let textureFactor = 1.0;
    if (sand > 60) {
      textureFactor = 0.7;
    } else if (clay > 35) {
      textureFactor = 1.2;
    }
    const dynamicK = Number((50 * textureFactor).toFixed(1));

    soilData = {
      nitrogen: layer.nitrogen || 0,
      phosphorus: dynamicP,
      potassium: dynamicK,
    };
  }

  const soilBaselines = {
    nitrogen: soilData.nitrogen,
    phosphorus: soilData.phosphorus,
    potassium: soilData.potassium,
  };

  //3.Crop selection
  let selectedCrop = crop;

  const weather = await getWeatherData(
    field.centroid_lat,
    field.centroid_lng,
  );

  if (!selectedCrop) {
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

  // Live Calculations (Weather & NDVI)
  const liveDataAdjustments = [];

  let totalForecastRain = 0;
  if (weather && weather.forecast) {
    totalForecastRain = weather.forecast.reduce((sum, day) => sum + (day.precipitation || 0), 0);
  }

  if (totalForecastRain > 30) {
    liveDataAdjustments.push({
      type: "warning",
      message: `⚠️ Delay Application: Heavy rain (${totalForecastRain.toFixed(1)}mm) expected in the next 7 days. Applying nitrogen now risks severe runoff and leaching.`
    });
  } else if (totalForecastRain === 0) {
    liveDataAdjustments.push({
      type: "info",
      message: "💡 Irrigation Advised: No rainfall forecast in the next 7 days. Apply light watering after fertilizing to help dissolve granular nutrients."
    });
  } else {
    liveDataAdjustments.push({
      type: "success",
      message: `✅ Favorable Weather: Light rain (${totalForecastRain.toFixed(1)}mm) expected, which will help dissolve the fertilizer naturally.`
    });
  }

  try {
    const ndviData = await getNDVIData(field.polygon);
    if (ndviData) {
      const avgNdvi = ndviData.averageNDVI;
      if (avgNdvi < 0.45) {
        liveDataAdjustments.push({
          type: "warning",
          message: `🌱 Crop Stress Detected: Latest satellite NDVI is ${avgNdvi.toFixed(2)} (low vegetative cover). Consider early top-dressing or micro-nutrient supplements to boost growth.`
        });
      } else if (avgNdvi > 0.65) {
        liveDataAdjustments.push({
          type: "success",
          message: `✨ Vigorous Vegetation: Latest satellite NDVI is ${avgNdvi.toFixed(2)} indicating excellent crop canopy health and active nutrient uptake.`
        });
      }
    }
  } catch (err) {
    console.log("Gracefully skipped NDVI fetch: satellite service not active or credentials missing");
  }

  //4.Calculate fertilizer
  const plan = calculateFertilizer(soilData, selectedCrop, 1);

  return {
    crop: selectedCrop,
    ...plan,
    liveDataAdjustments,
    soilBaselines,
  };
};
