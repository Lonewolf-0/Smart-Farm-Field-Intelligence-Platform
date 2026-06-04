export interface Treatment {
  productName: string;
  activeIngredient: string;
  dosage: string;
  applicationMethod: "foliar spray" | "soil drench" | "granular";
  frequency: string;
  safetyInterval: number;
  precautions: string[];
}

export interface PestEntry {
  name: string;
  type: "pest" | "disease" | "fungus";
  affectedCrops: string[];
  symptoms: string[];
  favorableConditions: {
    minTemp?: number;
    maxTemp?: number;
    minHumidity?: number;
    season: string;
  };
  treatments: Treatment[];
  preventionMeasures: string[];
  riskLevel: "low" | "medium" | "high";
}

export const pestDatabase: PestEntry[] = [
  // WHEAT
  {
    name: "Wheat Rust (Puccinia)",
    type: "fungus",
    affectedCrops: ["Wheat"],
    symptoms: ["Orange or brown pustules on leaves and stems", "Stunted growth", "Reduced grain quality"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 25,
      minHumidity: 80,
      season: "Late Winter / Early Spring"
    },
    preventionMeasures: ["Plant rust-resistant varieties", "Ensure good field drainage", "Crop rotation"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Generic Propiconazole",
        activeIngredient: "Propiconazole 25% EC",
        dosage: "1-1.5 ml/L",
        applicationMethod: "foliar spray",
        frequency: "Every 14-21 days",
        safetyInterval: 30,
        precautions: ["Wear protective gear", "Do not spray during strong winds"]
      }
    ]
  },
  {
    name: "Wheat Aphids",
    type: "pest",
    affectedCrops: ["Wheat"],
    symptoms: ["Yellowing of leaves", "Honeydew secretion", "Curled or stunted leaves"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 30,
      minHumidity: 40,
      season: "Spring / Warm Dry Weather"
    },
    preventionMeasures: ["Encourage natural predators like ladybugs", "Avoid excessive nitrogen fertilizers"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Confidor",
        activeIngredient: "Imidacloprid 17.8% SL",
        dosage: "0.5 ml/L",
        applicationMethod: "foliar spray",
        frequency: "Once or twice at 10-day intervals",
        safetyInterval: 21,
        precautions: ["Toxic to bees, spray during late evening"]
      }
    ]
  },
  {
    name: "Powdery Mildew",
    type: "fungus",
    affectedCrops: ["Wheat"],
    symptoms: ["White, powdery patches on leaves and stems", "Premature drying of leaves", "Poor grain filling"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 22,
      minHumidity: 85,
      season: "Cool Humid Weather"
    },
    preventionMeasures: ["Use balanced fertilizers", "Ensure proper spacing for air circulation"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Sulfex",
        activeIngredient: "Wettable Sulfur 80% WP",
        dosage: "2-3 g/L",
        applicationMethod: "foliar spray",
        frequency: "Every 10-15 days",
        safetyInterval: 14,
        precautions: ["Do not apply in temperatures above 30°C to avoid leaf burn"]
      }
    ]
  },

  // RICE
  {
    name: "Stem Borer",
    type: "pest",
    affectedCrops: ["Rice"],
    symptoms: ["Dead heart in vegetative stage", "Whiteheads at reproductive stage", "Hollowed stems"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 32,
      minHumidity: 70,
      season: "Hot Humid Season"
    },
    preventionMeasures: ["Plough fields immediately after harvest", "Clip seedling tips before transplanting"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Coragen",
        activeIngredient: "Chlorantraniliprole 18.5% SC",
        dosage: "0.3-0.4 ml/L",
        applicationMethod: "foliar spray",
        frequency: "As needed, max 2 sprays per season",
        safetyInterval: 20,
        precautions: ["Keep out of aquatic ecosystems when possible"]
      }
    ]
  },
  {
    name: "Rice Blast",
    type: "fungus",
    affectedCrops: ["Rice"],
    symptoms: ["Diamond-shaped spots with gray centers", "Lesions on nodes and panicles", "Panicle drop"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 28,
      minHumidity: 90,
      season: "Humid Cool Nights"
    },
    preventionMeasures: ["Use resistant varieties", "Avoid excessive nitrogen application", "Proper water management"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Baan",
        activeIngredient: "Tricyclazole 75% WP",
        dosage: "0.6 g/L",
        applicationMethod: "foliar spray",
        frequency: "At tillering and panicle emergence",
        safetyInterval: 30,
        precautions: ["Spray early morning or late afternoon"]
      }
    ]
  },
  {
    name: "Brown Plant Hopper",
    type: "pest",
    affectedCrops: ["Rice"],
    symptoms: ["Hopperburn (yellowing and rapid drying of plants)", "Sooty mold growth on honeydew"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 32,
      minHumidity: 80,
      season: "Monsoon Season"
    },
    preventionMeasures: ["Alternate wetting and drying of fields", "Provide alleyways in planting"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Applaud",
        activeIngredient: "Buprofezin 25% SC",
        dosage: "1-1.5 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At early nymphal stage",
        safetyInterval: 20,
        precautions: ["Direct spray to the base of the plant"]
      }
    ]
  },

  // MAIZE
  {
    name: "Fall Armyworm",
    type: "pest",
    affectedCrops: ["Maize"],
    symptoms: ["Window-pane feeding marks on leaves", "Sawdust-like frass in the whorl", "Severely shredded leaves"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 32,
      minHumidity: 60,
      season: "Warm Season"
    },
    preventionMeasures: ["Early planting", "Intercropping with legumes", "Apply sand/ash to the whorl"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Proclaim",
        activeIngredient: "Emamectin Benzoate 5% SG",
        dosage: "0.4 g/L",
        applicationMethod: "foliar spray",
        frequency: "When 5% of plants are infested",
        safetyInterval: 14,
        precautions: ["Direct the spray into the plant whorls"]
      }
    ]
  },
  {
    name: "Maize Stem Borer",
    type: "pest",
    affectedCrops: ["Maize"],
    symptoms: ["Shot holes on emerging leaves", "Dead heart", "Boring holes at the base of the stem"],
    favorableConditions: {
      minTemp: 24,
      maxTemp: 30,
      minHumidity: 70,
      season: "Monsoon"
    },
    preventionMeasures: ["Deep summer ploughing", "Remove and destroy dead hearts"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Furadan",
        activeIngredient: "Carbofuran 3% CG",
        dosage: "3-4 g/plant",
        applicationMethod: "granular",
        frequency: "At 20 and 40 days after sowing",
        safetyInterval: 45,
        precautions: ["Highly toxic, use protective gloves when applying"]
      }
    ]
  },
  {
    name: "Leaf Blight",
    type: "fungus",
    affectedCrops: ["Maize"],
    symptoms: ["Large, elliptical, grayish-green or brown lesions", "Premature drying of leaves"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 32,
      minHumidity: 90,
      season: "Humid Season"
    },
    preventionMeasures: ["Use resistant hybrids", "Destroy infected crop debris"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Dithane M-45",
        activeIngredient: "Mancozeb 75% WP",
        dosage: "2.5 g/L",
        applicationMethod: "foliar spray",
        frequency: "Every 10-15 days upon disease onset",
        safetyInterval: 21,
        precautions: ["Do not mix with alkaline substances"]
      }
    ]
  },

  // COTTON
  {
    name: "Bollworm",
    type: "pest",
    affectedCrops: ["Cotton"],
    symptoms: ["Flared squares", "Holes in bolls with frass", "Shedding of bolls"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 35,
      minHumidity: 60,
      season: "Flowering Stage"
    },
    preventionMeasures: ["Install pheromone traps", "Use Bt cotton hybrids", "Handpick early caterpillars"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Tracer",
        activeIngredient: "Spinosad 45% SC",
        dosage: "0.3-0.4 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At economic threshold level",
        safetyInterval: 14,
        precautions: ["Rotate with other insecticides to prevent resistance"]
      }
    ]
  },
  {
    name: "Whitefly",
    type: "pest",
    affectedCrops: ["Cotton"],
    symptoms: ["Upward curling of leaves", "Yellowing", "Sooty mold on honeydew"],
    favorableConditions: {
      minTemp: 28,
      maxTemp: 38,
      minHumidity: 30,
      season: "Dry Hot Weather"
    },
    preventionMeasures: ["Use yellow sticky traps", "Avoid excessive nitrogen"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Oberon",
        activeIngredient: "Spiromesifen 22.9% SC",
        dosage: "1 ml/L",
        applicationMethod: "foliar spray",
        frequency: "When nymphs cross economic threshold",
        safetyInterval: 20,
        precautions: ["Ensure good coverage on the underside of leaves"]
      }
    ]
  },
  {
    name: "Jassids",
    type: "pest",
    affectedCrops: ["Cotton"],
    symptoms: ["Downward cupping of leaves", "Reddening of leaf margins", "Stunted growth"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 35,
      minHumidity: 70,
      season: "Vegetative Stage"
    },
    preventionMeasures: ["Use resistant/tolerant varieties", "Keep field weed-free"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Pride",
        activeIngredient: "Acetamiprid 20% SP",
        dosage: "0.2-0.3 g/L",
        applicationMethod: "foliar spray",
        frequency: "If curling is observed on upper leaves",
        safetyInterval: 15,
        precautions: ["Avoid spraying during active bee foraging hours"]
      }
    ]
  },

  // SOYBEAN
  {
    name: "Girdle Beetle",
    type: "pest",
    affectedCrops: ["Soybean"],
    symptoms: ["Two parallel rings (girdles) on stem or petiole", "Drooping of leaves above the girdle", "Stem breakage"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 30,
      minHumidity: 80,
      season: "Pod Stage"
    },
    preventionMeasures: ["Maintain optimum plant population", "Destroy infested plant parts"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Ekalux",
        activeIngredient: "Quinalphos 25% EC",
        dosage: "2 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At initial damage symptoms",
        safetyInterval: 21,
        precautions: ["Use protective clothing, strong odor"]
      }
    ]
  },
  {
    name: "Soybean Aphids",
    type: "pest",
    affectedCrops: ["Soybean"],
    symptoms: ["Stunted plants", "Yellowing of leaves", "Sooty mold on honeydew"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 28,
      minHumidity: 60,
      season: "Vegetative Stage"
    },
    preventionMeasures: ["Conserve natural enemies", "Avoid late planting"],
    riskLevel: "low",
    treatments: [
      {
        productName: "Rogor",
        activeIngredient: "Dimethoate 30% EC",
        dosage: "2 ml/L",
        applicationMethod: "foliar spray",
        frequency: "When threshold exceeds 250 aphids/plant",
        safetyInterval: 14,
        precautions: ["Highly toxic to aquatic life"]
      }
    ]
  },
  {
    name: "Yellow Mosaic Virus",
    type: "disease",
    affectedCrops: ["Soybean"],
    symptoms: ["Scattered yellow patches on leaves", "Complete yellowing of foliage", "Reduced pod size"],
    favorableConditions: {
      minTemp: 28,
      maxTemp: 35,
      minHumidity: 50,
      season: "Whitefly Vector Season"
    },
    preventionMeasures: ["Use resistant varieties", "Control the whitefly vector", "Uproot and destroy infected plants"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Vector Control (Confidor)",
        activeIngredient: "Imidacloprid 17.8% SL",
        dosage: "0.5 ml/L",
        applicationMethod: "foliar spray",
        frequency: "Early in the season to control whiteflies",
        safetyInterval: 21,
        precautions: ["Viruses cannot be cured; focus on killing the vector"]
      }
    ]
  },

  // SUGARCANE
  {
    name: "Red Rot",
    type: "fungus",
    affectedCrops: ["Sugarcane"],
    symptoms: ["Drying of top leaves", "Red lesions on midrib", "Alcoholic smell from split stalks"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 32,
      minHumidity: 90,
      season: "Monsoon"
    },
    preventionMeasures: ["Use healthy setts", "Crop rotation", "Uproot infected clumps"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Bavistin",
        activeIngredient: "Carbendazim 50% WP",
        dosage: "1 g/L",
        applicationMethod: "soil drench",
        frequency: "Sett treatment before planting",
        safetyInterval: 60,
        precautions: ["Preventive measure is key; very hard to cure once established"]
      }
    ]
  },
  {
    name: "Early Shoot Borer",
    type: "pest",
    affectedCrops: ["Sugarcane"],
    symptoms: ["Dead heart in young shoots", "Bore holes at the base of shoots"],
    favorableConditions: {
      minTemp: 30,
      maxTemp: 40,
      minHumidity: 30,
      season: "Hot Dry Weather"
    },
    preventionMeasures: ["Trash mulching", "Light earthing up", "Frequent irrigation in dry months"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Regent",
        activeIngredient: "Fipronil 0.3% GR",
        dosage: "20-25 kg/ha",
        applicationMethod: "granular",
        frequency: "At planting or 30 days after planting",
        safetyInterval: 45,
        precautions: ["Apply to soil and irrigate immediately"]
      }
    ]
  },
  {
    name: "Woolly Aphid",
    type: "pest",
    affectedCrops: ["Sugarcane"],
    symptoms: ["White woolly patches on leaves", "Sooty mold", "Stunted growth"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 30,
      minHumidity: 80,
      season: "Humid Season"
    },
    preventionMeasures: ["Avoid excessive nitrogen", "Promote natural predators like Chrysoperla"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Metasystox",
        activeIngredient: "Oxydemeton-methyl 25% EC",
        dosage: "2 ml/L",
        applicationMethod: "foliar spray",
        frequency: "When infestation reaches 20% leaves",
        safetyInterval: 30,
        precautions: ["Spray from bottom upwards to cover under-surface of leaves"]
      }
    ]
  },

  // MUSTARD
  {
    name: "Mustard Aphids",
    type: "pest",
    affectedCrops: ["Mustard"],
    symptoms: ["Yellowing of leaves", "Curled and stunted plants", "Honeydew with sooty mold"],
    favorableConditions: {
      minTemp: 10,
      maxTemp: 20,
      minHumidity: 60,
      season: "Winter"
    },
    preventionMeasures: ["Early sowing", "Balanced fertilizer application"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Confidor",
        activeIngredient: "Imidacloprid 17.8% SL",
        dosage: "0.5 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At economic threshold of 50-60 aphids/10cm shoot",
        safetyInterval: 21,
        precautions: ["Do not spray during full bloom to protect honeybees"]
      }
    ]
  },
  {
    name: "Alternaria Blight",
    type: "fungus",
    affectedCrops: ["Mustard"],
    symptoms: ["Brown/black spots with concentric rings on leaves", "Lesions on stems and pods"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 25,
      minHumidity: 70,
      season: "Late Winter / High Humidity"
    },
    preventionMeasures: ["Use certified seeds", "Destroy crop debris", "Crop rotation"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Indofil M-45",
        activeIngredient: "Mancozeb 75% WP",
        dosage: "2 g/L",
        applicationMethod: "foliar spray",
        frequency: "At 45 and 60 days after sowing",
        safetyInterval: 14,
        precautions: ["Ensure complete coverage of lower leaves"]
      }
    ]
  },
  {
    name: "White Rust",
    type: "fungus",
    affectedCrops: ["Mustard"],
    symptoms: ["White pustules on under-surface of leaves", "Staghead (swelling and distortion of inflorescence)"],
    favorableConditions: {
      minTemp: 10,
      maxTemp: 20,
      minHumidity: 80,
      season: "Cool Humid Weather"
    },
    preventionMeasures: ["Late sowing avoidance", "Weed control"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Ridomil Gold",
        activeIngredient: "Metalaxyl 8% + Mancozeb 64% WP",
        dosage: "2 g/L",
        applicationMethod: "foliar spray",
        frequency: "If pustules are widespread",
        safetyInterval: 21,
        precautions: ["Apply strictly before the staghead phase begins"]
      }
    ]
  },

  // CHICKPEA
  {
    name: "Gram Pod Borer",
    type: "pest",
    affectedCrops: ["Chickpea"],
    symptoms: ["Circular holes on pods", "Larvae feeding with half body outside the pod"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 30,
      minHumidity: 50,
      season: "Spring / Pod Formation"
    },
    preventionMeasures: ["Intercropping with coriander/mustard", "Use pheromone traps", "Erect bird perches"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Coragen",
        activeIngredient: "Chlorantraniliprole 18.5% SC",
        dosage: "0.3 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At 50% flowering and 15 days later",
        safetyInterval: 14,
        precautions: ["Alternate chemicals to prevent resistance"]
      }
    ]
  },
  {
    name: "Fusarium Wilt",
    type: "fungus",
    affectedCrops: ["Chickpea"],
    symptoms: ["Drooping of upper leaves", "Discoloration of internal stem tissue", "Complete plant drying"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 30,
      minHumidity: 40,
      season: "Dry Warm Weather"
    },
    preventionMeasures: ["Deep summer ploughing", "Seed treatment with Trichoderma", "Crop rotation"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Bavistin",
        activeIngredient: "Carbendazim 50% WP",
        dosage: "2 g/kg seed",
        applicationMethod: "soil drench",
        frequency: "Seed treatment before sowing",
        safetyInterval: 30,
        precautions: ["Difficult to control once established; prevention is vital"]
      }
    ]
  },
  {
    name: "Ascochyta Blight",
    type: "fungus",
    affectedCrops: ["Chickpea"],
    symptoms: ["Dark brown spots with pale centers on leaves and pods", "Stem girdling and breakage"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 25,
      minHumidity: 85,
      season: "Cool Rainy Weather"
    },
    preventionMeasures: ["Use disease-free seed", "Delayed sowing"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Kavach",
        activeIngredient: "Chlorothalonil 75% WP",
        dosage: "2 g/L",
        applicationMethod: "foliar spray",
        frequency: "Upon disease appearance, repeat after 10 days",
        safetyInterval: 14,
        precautions: ["Ensure good canopy coverage"]
      }
    ]
  },

  // GROUNDNUT
  {
    name: "Tikka Disease (Leaf Spot)",
    type: "fungus",
    affectedCrops: ["Groundnut"],
    symptoms: ["Dark brown to black circular spots on leaves", "Yellow halo around spots", "Defoliation"],
    favorableConditions: {
      minTemp: 26,
      maxTemp: 31,
      minHumidity: 80,
      season: "Warm Humid Weather"
    },
    preventionMeasures: ["Crop rotation", "Remove infected plant debris", "Early sowing"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Bavistin",
        activeIngredient: "Carbendazim 50% WP",
        dosage: "1 g/L",
        applicationMethod: "foliar spray",
        frequency: "At 30 and 45 days after sowing",
        safetyInterval: 21,
        precautions: ["Mix with mancozeb for better control"]
      }
    ]
  },
  {
    name: "White Grub",
    type: "pest",
    affectedCrops: ["Groundnut"],
    symptoms: ["Yellowing of plants", "Drying of entire plant", "Roots completely eaten away"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 35,
      minHumidity: 60,
      season: "Early Kharif (Onset of Monsoon)"
    },
    preventionMeasures: ["Deep ploughing to expose grubs to birds", "Use light traps for adult beetles"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Phorate",
        activeIngredient: "Phorate 10% CG",
        dosage: "10-15 kg/ha",
        applicationMethod: "granular",
        frequency: "Soil application before sowing",
        safetyInterval: 60,
        precautions: ["Extremely toxic; wear gloves and mask during application"]
      }
    ]
  },
  {
    name: "Groundnut Aphids",
    type: "pest",
    affectedCrops: ["Groundnut"],
    symptoms: ["Stunted plants", "Curled leaves", "Vector for Rosette Virus"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 30,
      minHumidity: 60,
      season: "Dry Spells during Monsoon"
    },
    preventionMeasures: ["Intercropping with pearl millet", "Conserve ladybird beetles"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Rogor",
        activeIngredient: "Dimethoate 30% EC",
        dosage: "2 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At initial infestation",
        safetyInterval: 14,
        precautions: ["Do not spray near flowering to avoid bee mortality"]
      }
    ]
  },

  // POTATO
  {
    name: "Late Blight",
    type: "fungus",
    affectedCrops: ["Potato", "Tomato"],
    symptoms: ["Water-soaked dark lesions on leaves", "White cottony growth on undersides", "Rotting tubers/fruits"],
    favorableConditions: {
      minTemp: 10,
      maxTemp: 24,
      minHumidity: 90,
      season: "Cool, Humid, Cloudy Weather"
    },
    preventionMeasures: ["Use disease-free tubers", "Ensure good drainage", "Preventive spraying"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Acrobat",
        activeIngredient: "Dimethomorph 50% WP",
        dosage: "1.5 g/L",
        applicationMethod: "foliar spray",
        frequency: "Every 7-10 days under favorable conditions",
        safetyInterval: 14,
        precautions: ["Coverage is critical; spray before rain if possible"]
      }
    ]
  },
  {
    name: "Early Blight",
    type: "fungus",
    affectedCrops: ["Potato", "Tomato"],
    symptoms: ["Brown spots with concentric rings (target board effect)", "Lower leaves affected first"],
    favorableConditions: {
      minTemp: 24,
      maxTemp: 29,
      minHumidity: 80,
      season: "Alternating Dry and Wet Weather"
    },
    preventionMeasures: ["Avoid overhead irrigation", "Proper plant spacing", "Crop rotation"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Kavach",
        activeIngredient: "Chlorothalonil 75% WP",
        dosage: "2 g/L",
        applicationMethod: "foliar spray",
        frequency: "Every 10-14 days",
        safetyInterval: 14,
        precautions: ["Preventive application is best"]
      }
    ]
  },
  {
    name: "Aphids (Green Peach Aphid)",
    type: "pest",
    affectedCrops: ["Potato", "Tomato"],
    symptoms: ["Curling of young leaves", "Yellowing", "Vector for Potato Leafroll Virus"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 25,
      minHumidity: 60,
      season: "Spring / Moderate Weather"
    },
    preventionMeasures: ["Use yellow sticky traps", "Remove weeds"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Confidor",
        activeIngredient: "Imidacloprid 17.8% SL",
        dosage: "0.5 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At economic threshold",
        safetyInterval: 21,
        precautions: ["Control is vital to prevent viral transmission"]
      }
    ]
  },

  // TOMATO
  {
    name: "Tomato Fruit Borer",
    type: "pest",
    affectedCrops: ["Tomato"],
    symptoms: ["Larvae boring into developing fruits", "Holes on fruits covered with frass", "Fruit dropping"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 32,
      minHumidity: 60,
      season: "Fruiting Stage"
    },
    preventionMeasures: ["Plant marigold as a trap crop", "Install pheromone traps", "Handpick damaged fruits"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Coragen",
        activeIngredient: "Chlorantraniliprole 18.5% SC",
        dosage: "0.3 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At flowering and fruit setting",
        safetyInterval: 5,
        precautions: ["Use low-toxicity chemicals near harvest"]
      }
    ]
  },
  {
    name: "Tomato Leaf Curl Virus",
    type: "disease",
    affectedCrops: ["Tomato"],
    symptoms: ["Upward curling of leaves", "Stunted plant growth", "Drastic yield reduction"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 35,
      minHumidity: 50,
      season: "Warm Dry Weather"
    },
    preventionMeasures: ["Use resistant varieties", "Use nylon nets in nurseries to prevent whitefly vector"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Vector Control (Oberon)",
        activeIngredient: "Spiromesifen 22.9% SC",
        dosage: "1 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At early stage to control whiteflies",
        safetyInterval: 10,
        precautions: ["Uproot and destroy infected plants immediately to prevent spread"]
      }
    ]
  },
  {
    name: "Early Blight",
    type: "fungus",
    affectedCrops: ["Tomato"],
    symptoms: ["Dark spots with concentric rings on older leaves", "Stem lesions", "Fruit spotting"],
    favorableConditions: {
      minTemp: 24,
      maxTemp: 29,
      minHumidity: 85,
      season: "Humid Weather"
    },
    preventionMeasures: ["Prune lower leaves", "Stake plants to keep foliage off ground"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Amistar",
        activeIngredient: "Azoxystrobin 23% SC",
        dosage: "1 ml/L",
        applicationMethod: "foliar spray",
        frequency: "Every 10-14 days",
        safetyInterval: 7,
        precautions: ["Ensure good coverage of the entire plant canopy"]
      }
    ]
  },

  // ONION
  {
    name: "Onion Thrips",
    type: "pest",
    affectedCrops: ["Onion"],
    symptoms: ["Silvery or whitish patches on leaves", "Leaves curling and twisting", "Stunted bulb growth"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 30,
      minHumidity: 40,
      season: "Dry Warm Weather"
    },
    preventionMeasures: ["Provide frequent irrigation", "Use blue sticky traps"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Fipronil",
        activeIngredient: "Fipronil 5% SC",
        dosage: "1.5 ml/L",
        applicationMethod: "foliar spray",
        frequency: "Every 10-15 days when 30 thrips/plant observed",
        safetyInterval: 14,
        precautions: ["Add a spreader/sticker due to waxy onion leaves"]
      }
    ]
  },
  {
    name: "Purple Blotch",
    type: "fungus",
    affectedCrops: ["Onion"],
    symptoms: ["Small, water-soaked lesions turning purple with yellow halos", "Breaking of leaves at the lesion"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 30,
      minHumidity: 90,
      season: "Monsoon / High Humidity"
    },
    preventionMeasures: ["Use disease-free bulbs", "Crop rotation", "Wider spacing"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Mancozeb",
        activeIngredient: "Mancozeb 75% WP",
        dosage: "2.5 g/L",
        applicationMethod: "foliar spray",
        frequency: "Every 10-14 days from early bulb formation",
        safetyInterval: 14,
        precautions: ["Always use a sticking agent"]
      }
    ]
  },
  {
    name: "Onion Maggot",
    type: "pest",
    affectedCrops: ["Onion"],
    symptoms: ["Wilting and yellowing of seedlings", "Rotting bulbs with maggots inside", "Stinking smell"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 25,
      minHumidity: 80,
      season: "Cool Wet Weather"
    },
    preventionMeasures: ["Avoid undecomposed organic manure", "Crop rotation with non-allium crops"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Chlorpyrifos",
        activeIngredient: "Chlorpyrifos 20% EC",
        dosage: "2.5 ml/L",
        applicationMethod: "soil drench",
        frequency: "At planting or early vegetative stage",
        safetyInterval: 30,
        precautions: ["Do not apply close to harvest"]
      }
    ]
  },

  // SUNFLOWER
  {
    name: "Head Borer",
    type: "pest",
    affectedCrops: ["Sunflower"],
    symptoms: ["Larvae feeding on floral parts and developing seeds", "Holes on the flower head with frass"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 32,
      minHumidity: 60,
      season: "Flowering / Seed filling stage"
    },
    preventionMeasures: ["Synchronized planting", "Install pheromone traps", "Handpick early caterpillars"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Proclaim",
        activeIngredient: "Emamectin Benzoate 5% SG",
        dosage: "0.4 g/L",
        applicationMethod: "foliar spray",
        frequency: "At early flowering stage",
        safetyInterval: 14,
        precautions: ["Highly toxic to bees; spray late evening after bee activity stops"]
      }
    ]
  },
  {
    name: "Sunflower Rust",
    type: "fungus",
    affectedCrops: ["Sunflower"],
    symptoms: ["Cinnamon-brown pustules on leaves", "Premature defoliation", "Reduced seed size"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 25,
      minHumidity: 85,
      season: "Cool Humid Weather"
    },
    preventionMeasures: ["Plant resistant hybrids", "Destroy volunteer sunflowers and weeds"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Tilt",
        activeIngredient: "Propiconazole 25% EC",
        dosage: "1 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At first sign of disease, repeat in 15 days",
        safetyInterval: 21,
        precautions: ["Ensure good coverage of lower leaves"]
      }
    ]
  },
  {
    name: "Alternaria Blight",
    type: "fungus",
    affectedCrops: ["Sunflower"],
    symptoms: ["Dark brown spots with yellow halos on leaves", "Stem lesions", "Rotting of flower heads"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 30,
      minHumidity: 90,
      season: "Warm Rainy Season"
    },
    preventionMeasures: ["Use disease-free seed", "Seed treatment", "Wider spacing for air flow"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Mancozeb",
        activeIngredient: "Mancozeb 75% WP",
        dosage: "2.5 g/L",
        applicationMethod: "foliar spray",
        frequency: "Spray at 30, 45, and 60 days after sowing",
        safetyInterval: 21,
        precautions: ["Do not spray during rains"]
      }
    ]
  },

  // BARLEY
  {
    name: "Covered Smut",
    type: "fungus",
    affectedCrops: ["Barley"],
    symptoms: ["Grain heads replaced by hard black spore masses", "Spore masses covered by a grayish membrane"],
    favorableConditions: {
      minTemp: 10,
      maxTemp: 20,
      minHumidity: 70,
      season: "Seedling Stage"
    },
    preventionMeasures: ["Use certified disease-free seeds", "Seed treatment is mandatory"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Vitavax",
        activeIngredient: "Carboxin 75% WP",
        dosage: "2 g/kg seed",
        applicationMethod: "soil drench",
        frequency: "Seed treatment before sowing",
        safetyInterval: 0,
        precautions: ["Cannot be controlled by foliar spray; treat seeds only"]
      }
    ]
  },
  {
    name: "Barley Aphids",
    type: "pest",
    affectedCrops: ["Barley"],
    symptoms: ["Yellowing of leaves", "Honeydew and sooty mold", "Vector for Barley Yellow Dwarf Virus"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 25,
      minHumidity: 50,
      season: "Late Winter / Spring"
    },
    preventionMeasures: ["Avoid early planting", "Encourage ladybird beetles"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Confidor",
        activeIngredient: "Imidacloprid 17.8% SL",
        dosage: "0.5 ml/L",
        applicationMethod: "foliar spray",
        frequency: "At economic threshold",
        safetyInterval: 21,
        precautions: ["Spray during late evening"]
      }
    ]
  },
  {
    name: "Powdery Mildew",
    type: "fungus",
    affectedCrops: ["Barley"],
    symptoms: ["Fluffy white patches on leaves", "Premature aging of leaves", "Reduced tillering"],
    favorableConditions: {
      minTemp: 15,
      maxTemp: 22,
      minHumidity: 85,
      season: "Cool Humid Weather"
    },
    preventionMeasures: ["Use resistant varieties", "Avoid excessive nitrogen"],
    riskLevel: "medium",
    treatments: [
      {
        productName: "Sulfex",
        activeIngredient: "Wettable Sulfur 80% WP",
        dosage: "3 g/L",
        applicationMethod: "foliar spray",
        frequency: "Every 14 days",
        safetyInterval: 14,
        precautions: ["Avoid spraying in extreme heat"]
      }
    ]
  },

  // MILLET
  {
    name: "Shoot Fly",
    type: "pest",
    affectedCrops: ["Millet"],
    symptoms: ["Dead heart in young seedlings", "Side tillers produced after central shoot dies"],
    favorableConditions: {
      minTemp: 25,
      maxTemp: 32,
      minHumidity: 80,
      season: "Early Kharif / Cloudy Days"
    },
    preventionMeasures: ["Early sowing to escape peak pest incidence", "Use higher seed rate to compensate"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Thimet",
        activeIngredient: "Phorate 10% CG",
        dosage: "10 kg/ha",
        applicationMethod: "granular",
        frequency: "Soil application in furrows at planting",
        safetyInterval: 60,
        precautions: ["Wear protective equipment; highly toxic"]
      }
    ]
  },
  {
    name: "Downy Mildew",
    type: "fungus",
    affectedCrops: ["Millet"],
    symptoms: ["Green ear (floral parts turning into leafy structures)", "White downy growth on lower leaves", "Stunted growth"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 25,
      minHumidity: 90,
      season: "Cool Wet Weather"
    },
    preventionMeasures: ["Use resistant hybrids", "Rogue out infected plants early", "Seed treatment"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Ridomil Gold",
        activeIngredient: "Metalaxyl 8% + Mancozeb 64% WP",
        dosage: "2 g/L",
        applicationMethod: "foliar spray",
        frequency: "At 20 days after sowing if symptoms appear",
        safetyInterval: 21,
        precautions: ["Seed treatment with Apron 35 SD is highly recommended alongside spray"]
      }
    ]
  },
  {
    name: "Ergot",
    type: "disease",
    affectedCrops: ["Millet"],
    symptoms: ["Honeydew oozing from florets", "Dark hard sclerotia replacing grains", "Toxic to livestock and humans"],
    favorableConditions: {
      minTemp: 20,
      maxTemp: 30,
      minHumidity: 85,
      season: "Flowering Stage / Cloudy Rainy Weather"
    },
    preventionMeasures: ["Use sclerotia-free seeds (steep in 10% salt water)", "Adjust planting dates to avoid rain during flowering", "Deep ploughing"],
    riskLevel: "high",
    treatments: [
      {
        productName: "Bavistin",
        activeIngredient: "Carbendazim 50% WP",
        dosage: "1 g/L",
        applicationMethod: "foliar spray",
        frequency: "Preventive spray at 50% flowering, repeat after 5 days",
        safetyInterval: 21,
        precautions: ["Crucial to prevent toxicity in human/animal consumption"]
      }
    ]
  }
];
