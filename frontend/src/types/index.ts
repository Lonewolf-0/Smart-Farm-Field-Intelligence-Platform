import type { Polygon } from "geojson";
// ==========================
// API RESPONSE WRAPPER
// ==========================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================
//  CORE ENTITIES
// ==========================
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Field {
  id: string;
  name: string;
  polygon: Polygon;
  area: number;
  centroid: {
    lat: number;
    lng: number;
  };
  userId: string;
}

export interface SoilData {
  id: string;
  fieldId: string;
  ph: number;
  organicCarbon: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  clay: number;
  sand: number;
  texture: string;
  year: number;
  season: string;
}

// ==========================
//  WEATHER
// ==========================
export interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  condition: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  forecast: ForecastDay[];
}

// ==========================
//  ANALYTICS
// ==========================
export interface CropSuitability {
  crop: string;
  score: number;
  soilMatch: number;
  climateMatch: number;
  rainfallMatch: number;
}

export interface IrrigationPlan {
  nextIrrigationDays: number;
  waterRequired: number;
  soilMoisture: number;
  evapotranspiration: number;
}

export interface NDVIData {
  averageNDVI: number;
  healthScore: number;
  stressZones: number[];
  timestamp: string;
}

export interface FertilizerProduct {
  name: string;
  quantity: number;
  unit: string;
}

export interface FertilizerPlan {
  nitrogenRequired: number;
  phosphorusRequired: number;
  potassiumRequired: number;
  recommendations: FertilizerProduct[];
}

export interface PesticideRecommendation {
  product: string;
  dosage: string;
  timing: string;
  safety: string;
  pestRisk: string;
}

export interface ProfitAnalysis {
  revenue: number;
  costs: number;
  profit: number;
  perAcre: number;
  crop: string;
  yield: number;
}

export interface RiskAlert {
  type: string;
  severity: string;
  message: string;
  expectedDate: string;
}

// ==========================
// BRANCH / MARKET
// ==========================
export interface BranchProduct {
  name: string;
  price: number;
  unit: string;
}

export interface NutrienBranch {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  services: string[];
  products: BranchProduct[];
}

// ==========================
//  FINAL AGGREGATED OUTPUT
// ==========================
export interface FieldAnalysis {
  soilData: SoilData;
  weather: WeatherData;
  cropSuitability: CropSuitability[];
  irrigation: IrrigationPlan;
  ndvi: NDVIData;
  fertilizer: FertilizerPlan;
  pesticide: PesticideRecommendation[];
  profit: ProfitAnalysis;
  risks: RiskAlert[];
}

// ==========================
// REQUEST TYPES
// ==========================

// AUTH
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// FIELD
export interface CreateFieldRequest {
  name: string;
  polygon: Polygon;
}

export interface UpdateFieldRequest {
  name?: string;
  polygon?: Polygon;
}

// SOIL
export interface AddSoilDataRequest {
  fieldId: string;
  ph: number;
  organicCarbon: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  clay: number;
  sand: number;
  texture: string;
  year: number;
  season: string;
}

// ANALYSIS
export interface AnalysisRequest {
  fieldId: string;
}
