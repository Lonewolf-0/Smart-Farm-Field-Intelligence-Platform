export interface CropNutrient {
  cropName: string;

  nitrogenRequired: number; // kg/ha
  phosphorusRequired: number; // kg/ha
  potassiumRequired: number; // kg/ha

  yieldTarget: number; // tons/ha

  season: "kharif" | "rabi" | "zaid";
}

export const cropNutrientRequirements: CropNutrient[] = [
  {
    cropName: "Wheat",
    nitrogenRequired: 120,
    phosphorusRequired: 60,
    potassiumRequired: 40,
    yieldTarget: 4.5,
    season: "rabi",
  },
  {
    cropName: "Rice",
    nitrogenRequired: 150,
    phosphorusRequired: 60,
    potassiumRequired: 60,
    yieldTarget: 5.0,
    season: "kharif",
  },
  {
    cropName: "Maize",
    nitrogenRequired: 180,
    phosphorusRequired: 80,
    potassiumRequired: 60,
    yieldTarget: 7.0,
    season: "kharif",
  },
  {
    cropName: "Soybean",
    nitrogenRequired: 30,
    phosphorusRequired: 60,
    potassiumRequired: 40,
    yieldTarget: 2.5,
    season: "kharif",
  },
  {
    cropName: "Cotton",
    nitrogenRequired: 150,
    phosphorusRequired: 60,
    potassiumRequired: 60,
    yieldTarget: 2.0,
    season: "kharif",
  },
  {
    cropName: "Sugarcane",
    nitrogenRequired: 250,
    phosphorusRequired: 100,
    potassiumRequired: 120,
    yieldTarget: 80,
    season: "kharif",
  },
  {
    cropName: "Mustard",
    nitrogenRequired: 80,
    phosphorusRequired: 40,
    potassiumRequired: 20,
    yieldTarget: 1.8,
    season: "rabi",
  },
  {
    cropName: "Chickpea",
    nitrogenRequired: 20,
    phosphorusRequired: 50,
    potassiumRequired: 20,
    yieldTarget: 2.0,
    season: "rabi",
  },
  {
    cropName: "Groundnut",
    nitrogenRequired: 25,
    phosphorusRequired: 50,
    potassiumRequired: 40,
    yieldTarget: 2.5,
    season: "kharif",
  },
  {
    cropName: "Potato",
    nitrogenRequired: 180,
    phosphorusRequired: 80,
    potassiumRequired: 100,
    yieldTarget: 25,
    season: "rabi",
  },
  {
    cropName: "Tomato",
    nitrogenRequired: 150,
    phosphorusRequired: 60,
    potassiumRequired: 80,
    yieldTarget: 30,
    season: "zaid",
  },
  {
    cropName: "Onion",
    nitrogenRequired: 100,
    phosphorusRequired: 50,
    potassiumRequired: 60,
    yieldTarget: 20,
    season: "rabi",
  },
  {
    cropName: "Sunflower",
    nitrogenRequired: 80,
    phosphorusRequired: 60,
    potassiumRequired: 40,
    yieldTarget: 2.0,
    season: "kharif",
  },
  {
    cropName: "Barley",
    nitrogenRequired: 80,
    phosphorusRequired: 40,
    potassiumRequired: 30,
    yieldTarget: 3.5,
    season: "rabi",
  },
  {
    cropName: "Millet",
    nitrogenRequired: 60,
    phosphorusRequired: 30,
    potassiumRequired: 20,
    yieldTarget: 2.5,
    season: "kharif",
  },
];
