export interface NutrientSplit {
  n: number; // percentage
  p: number; // percentage
  k: number; // percentage
}

export interface ScheduleStep {
  stage: string;
  days: number;
  description: string;
  nutrients: NutrientSplit;
}

export interface CropSchedule {
  cropName: string;
  steps: ScheduleStep[];
}

export const cropSchedules: CropSchedule[] = [
  {
    cropName: "Wheat",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply at sowing time to encourage initial root growth.",
        nutrients: { n: 50, p: 100, k: 100 }
      },
      {
        stage: "Crown Root Initiation (CRI)",
        days: 21,
        description: "First top-dress at the most critical vegetative stage.",
        nutrients: { n: 25, p: 0, k: 0 }
      },
      {
        stage: "Tillering Stage",
        days: 45,
        description: "Second top-dress supporting jointing and spikelet development.",
        nutrients: { n: 25, p: 0, k: 0 }
      }
    ]
  },
  {
    cropName: "Rice",
    steps: [
      {
        stage: "Basal (Transplanting)",
        days: 0,
        description: "Apply at transplanting to establish seedlings.",
        nutrients: { n: 33, p: 100, k: 50 }
      },
      {
        stage: "Active Tillering",
        days: 21,
        description: "First top-dress coupled with potassium to boost tillering.",
        nutrients: { n: 33, p: 0, k: 50 }
      },
      {
        stage: "Panicle Initiation",
        days: 45,
        description: "Second top-dress to maximize grains per panicle.",
        nutrients: { n: 34, p: 0, k: 0 }
      }
    ]
  },
  {
    cropName: "Maize",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply at sowing time to build robust seedling vigor.",
        nutrients: { n: 33, p: 100, k: 100 }
      },
      {
        stage: "Knee-High Stage",
        days: 30,
        description: "First top-dress supporting rapid stalk elongation.",
        nutrients: { n: 33, p: 0, k: 0 }
      },
      {
        stage: "Tasseling Stage",
        days: 60,
        description: "Second top-dress to optimize grain development and filling.",
        nutrients: { n: 34, p: 0, k: 0 }
      }
    ]
  },
  {
    cropName: "Soybean",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply starter dose at sowing. Legumes fix nitrogen and need minimal N split.",
        nutrients: { n: 100, p: 100, k: 100 }
      }
    ]
  },
  {
    cropName: "Cotton",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply at sowing to support early seedling establishment.",
        nutrients: { n: 33, p: 100, k: 50 }
      },
      {
        stage: "Square Formation",
        days: 40,
        description: "First top-dress of nitrogen and remaining potassium to encourage square development.",
        nutrients: { n: 33, p: 0, k: 50 }
      },
      {
        stage: "Boll Development",
        days: 70,
        description: "Second top-dress supporting boll formation and seed weight.",
        nutrients: { n: 34, p: 0, k: 0 }
      }
    ]
  },
  {
    cropName: "Sugarcane",
    steps: [
      {
        stage: "Basal (Planting)",
        days: 0,
        description: "Apply planting dose to encourage early germination and tillering.",
        nutrients: { n: 25, p: 100, k: 50 }
      },
      {
        stage: "Tillering Stage",
        days: 60,
        description: "First top-dress of nitrogen and potassium during active tillering phase.",
        nutrients: { n: 35, p: 0, k: 25 }
      },
      {
        stage: "Grand Growth Stage",
        days: 120,
        description: "Second top-dress to support rapid stalk elongation and cane yield.",
        nutrients: { n: 40, p: 0, k: 25 }
      }
    ]
  },
  {
    cropName: "Mustard",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply at sowing to support early seedling growth and branching.",
        nutrients: { n: 50, p: 100, k: 100 }
      },
      {
        stage: "Rosette (Pre-flowering)",
        days: 30,
        description: "Top-dress remaining nitrogen to maximize branching and seed pod development.",
        nutrients: { n: 50, p: 0, k: 0 }
      }
    ]
  },
  {
    cropName: "Chickpea",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply starter dose at sowing. Pulse crop needs minimal starter nitrogen.",
        nutrients: { n: 100, p: 100, k: 100 }
      }
    ]
  },
  {
    cropName: "Groundnut",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply at sowing. Legume starter dose satisfies initial root nodulation needs.",
        nutrients: { n: 100, p: 100, k: 100 }
      }
    ]
  },
  {
    cropName: "Potato",
    steps: [
      {
        stage: "Basal (Planting)",
        days: 0,
        description: "Apply starter dose at planting to support early sprout and root growth.",
        nutrients: { n: 50, p: 100, k: 50 }
      },
      {
        stage: "Stolon Initiation",
        days: 30,
        description: "Top-dress remaining nitrogen and potassium to fuel rapid tuber bulking.",
        nutrients: { n: 50, p: 0, k: 50 }
      }
    ]
  },
  {
    cropName: "Tomato",
    steps: [
      {
        stage: "Basal (Transplanting)",
        days: 0,
        description: "Apply transplanting starter dose to establish robust root systems.",
        nutrients: { n: 50, p: 100, k: 50 }
      },
      {
        stage: "Flowering & Fruit Set",
        days: 30,
        description: "First top-dress to support blossom development and early fruit set.",
        nutrients: { n: 25, p: 0, k: 25 }
      },
      {
        stage: "Fruit Development",
        days: 60,
        description: "Second top-dress to maximize tomato fruit size, quality, and weight.",
        nutrients: { n: 25, p: 0, k: 25 }
      }
    ]
  },
  {
    cropName: "Onion",
    steps: [
      {
        stage: "Basal (Transplanting)",
        days: 0,
        description: "Apply planting dose to encourage early leaf and root expansion.",
        nutrients: { n: 50, p: 100, k: 50 }
      },
      {
        stage: "Bulb Initiation",
        days: 30,
        description: "First top-dress supporting early bulb development.",
        nutrients: { n: 25, p: 0, k: 25 }
      },
      {
        stage: "Bulb Development",
        days: 60,
        description: "Second top-dress to support optimal bulb size expansion.",
        nutrients: { n: 25, p: 0, k: 25 }
      }
    ]
  },
  {
    cropName: "Sunflower",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply at sowing to support robust stem and head formation.",
        nutrients: { n: 50, p: 100, k: 100 }
      },
      {
        stage: "Bud Initiation",
        days: 35,
        description: "Top-dress remaining nitrogen to maximize bud size and seed fill.",
        nutrients: { n: 50, p: 0, k: 0 }
      }
    ]
  },
  {
    cropName: "Barley",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply at sowing time to build robust seedling vigor.",
        nutrients: { n: 50, p: 100, k: 100 }
      },
      {
        stage: "Active Tillering",
        days: 30,
        description: "Top-dress remaining nitrogen to promote tillering and grain size.",
        nutrients: { n: 50, p: 0, k: 0 }
      }
    ]
  },
  {
    cropName: "Millet",
    steps: [
      {
        stage: "Basal (Sowing)",
        days: 0,
        description: "Apply at sowing to satisfy primary vegetative requirements.",
        nutrients: { n: 50, p: 100, k: 100 }
      },
      {
        stage: "Tillering / Stem Elongation",
        days: 30,
        description: "Top-dress remaining nitrogen during stem elongation phase.",
        nutrients: { n: 50, p: 0, k: 0 }
      }
    ]
  }
];

export const defaultSchedule: CropSchedule = {
  cropName: "Default",
  steps: [
    {
      stage: "Basal (Sowing)",
      days: 0,
      description: "Apply at sowing time to satisfy primary requirements.",
      nutrients: { n: 50, p: 100, k: 100 }
    },
    {
      stage: "Active Growth",
      days: 30,
      description: "Top-dress remaining nitrogen during active vegetative growth.",
      nutrients: { n: 50, p: 0, k: 0 }
    }
  ]
};
