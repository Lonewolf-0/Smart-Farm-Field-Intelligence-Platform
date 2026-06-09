import { Request } from "express";
import type { Polygon } from "geojson";

/**
 * Standardized API response format for all endpoints.
 * @template T - The type of the data payload.
 */
export interface ApiResponse<T> {
  /** Indicates whether the request was successful */
  success: boolean;
  /** The payload data returned on success */
  data?: T;
  /** Error message returned on failure */
  error?: string;
}

/**
 * Payload encoded within the JWT authentication token.
 */
export interface JwtPayload {
  /** The unique identifier of the user */
  userId: string;
  /** The email address of the user */
  email: string;
}

/**
 * Represents an authenticated user in the system.
 */
export interface AuthUser {
  /** Unique UUID of the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's full name */
  name: string;
  /** Timestamp when the user account was created */
  createdAt: Date;
}

/**
 * Express Request object extended to include the authenticated user.
 */
export interface AuthRequest extends Request {
  /** The authenticated user object appended by the auth middleware */
  user?: AuthUser;
}

/**
 * Standard user profile representation.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/**
 * Represents a geographical farm field owned by a user.
 */
export interface Field {
  /** Unique UUID of the field */
  id: string;
  /** Human-readable name of the field */
  name: string;
  /** GeoJSON representation of the field's boundaries */
  polygon: Polygon;
  /** Calculated area of the field in hectares */
  area: number;
  /** Calculated geometric center of the field */
  centroid: {
    lat: number;
    lng: number;
  };
  /** UUID of the user who owns the field */
  userId: string;
}

/**
 * Detailed soil composition and properties.
 */
export interface SoilData {
  id: string;
  fieldId: string;
  /** Soil pH level (typically 0-14) */
  ph: number;
  /** Organic carbon content percentage */
  organicCarbon: number;
  /** Nitrogen content in parts per million (ppm) */
  nitrogen: number;
  /** Phosphorus content in parts per million (ppm) */
  phosphorus: number;
  /** Potassium content in parts per million (ppm) */
  potassium: number;
  /** Clay percentage */
  clay: number;
  /** Sand percentage */
  sand: number;
  /** Soil texture classification (e.g., "loam", "clay") */
  texture: string;
  /** The year this data was recorded */
  year: number;
  /** The agricultural season (e.g., "Kharif", "Rabi") */
  season: string;
}

/**
 * Algorithm score matching a crop to a specific field environment.
 */
export interface CropSuitability {
  /** Name of the crop (e.g., "Wheat") */
  crop: string;
  /** Overall suitability score out of 100 */
  score: number;
  /** Sub-score evaluating soil nutrient and pH match */
  soilMatch: number;
  /** Sub-score evaluating temperature and climate match */
  climateMatch: number;
  /** Sub-score evaluating expected rainfall match */
  rainfallMatch: number;
}

/**
 * Forward-looking irrigation recommendation.
 */
export interface IrrigationPlan {
  /** Number of days until the next required irrigation cycle */
  nextIrrigationDays: number;
  /** Required water volume in millimeters */
  waterRequired: number;
  /** Estimated current soil moisture percentage */
  currentSoilMoisture: number;
  /** Daily crop evapotranspiration in mm/day */
  dailyET: number;
  /** Forecasted rainfall over the next 7 days in millimeters */
  rainfallNext7Days: number;
}

/**
 * Satellite imagery health analysis using the Normalized Difference Vegetation Index.
 */
export interface NDVIData {
  /** Mean NDVI value across the entire field polygon (range -1 to 1) */
  averageNDVI: number;
  /** Human-readable health score string or percentage */
  healthScore: number;
  /** Array identifying geometric zones with high stress */
  stressZones: number[];
  /** Timestamp of the satellite image capture */
  timestamp: string;
}

/**
 * A specific fertilizer product recommendation.
 */
export interface FertilizerProduct {
  /** Name of the fertilizer product */
  name: string;
  /** Recommended quantity to apply */
  quantity: number;
  /** Unit of measurement (e.g., "kg/ha") */
  unit: string;
}

/**
 * A timed application step for fertilizers.
 */
export interface FertilizerStep {
  /** Crop growth stage for application (e.g., "Tillering") */
  stage: string;
  /** Days after sowing */
  days: number;
  /** Detailed instructions for the application */
  description: string;
  /** Products to apply during this step */
  recommendations: FertilizerProduct[];
}

/**
 * Dynamic adjustments based on real-time weather or soil conditions.
 */
export interface LiveAdjustment {
  /** Urgency level of the adjustment */
  type: "warning" | "info" | "success";
  /** Explanation of what needs to be adjusted */
  message: string;
}

/**
 * Comprehensive fertilizer application plan.
 */
export interface FertilizerPlan {
  /** Total calculated nitrogen deficit in kg/ha */
  nitrogenDeficit: number;
  /** Total calculated phosphorus deficit in kg/ha */
  phosphorusDeficit: number;
  /** Total calculated potassium deficit in kg/ha */
  potassiumDeficit: number;
  /** Overall product recommendations */
  recommendations: FertilizerProduct[];
  /** Total cumulative quantity of all fertilizers */
  totalQuantity: number;
  /** High-level application timeline */
  applicationSchedule: string[];
  /** Detailed step-by-step instructions (optional) */
  scheduleSteps?: FertilizerStep[];
  /** Real-time weather/soil adjustments (optional) */
  liveDataAdjustments?: LiveAdjustment[];
  /** Starting nutrient baselines before application (optional) */
  soilBaselines?: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
}

/**
 * Recommendation for pest or disease treatment.
 */
export interface PesticideRecommendation {
  /** Recommended chemical or organic product */
  product: string;
  /** Recommended dosage rate */
  dosage: string;
  /** Optimal timing or conditions for spraying */
  timing: string;
  /** Required safety precautions for handlers */
  safety: string;
  /** The identified pest or disease risk being mitigated */
  pestRisk: string;
}

/**
 * A single day's weather forecast.
 */
export interface ForecastDay {
  /** Date of the forecast in ISO format */
  date: string;
  /** Maximum expected temperature (°C) */
  tempMax: number;
  /** Minimum expected temperature (°C) */
  tempMin: number;
  /** Expected precipitation volume (mm) */
  precipitation: number;
  /** General weather condition description */
  condition: string;
}

/**
 * Aggregated current and forecasted weather data.
 */
export interface WeatherData {
  /** Current temperature (°C) */
  temperature: number;
  /** Current relative humidity percentage */
  humidity: number;
  /** Current wind speed (m/s or km/h) */
  windSpeed: number;
  /** Current rainfall in the last hour/day (mm) */
  rainfall: number;
  /** Forward-looking daily forecast array */
  forecast: ForecastDay[];
}

/**
 * An agricultural supply product sold at a branch.
 */
export interface BranchProduct {
  /** Product name */
  name: string;
  /** Price of the product */
  price: number;
  /** Unit of the price (e.g., "per ton") */
  unit: string;
}

/**
 * Physical agricultural supply branch details.
 */
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

/**
 * Financial profitability projection for a specific crop.
 */
export interface ProfitAnalysis {
  /** Estimated gross revenue */
  revenue: number;
  /** Estimated total costs (seed, fertilizer, operations) */
  costs: number;
  /** Estimated net profit */
  profit: number;
  /** Net profit calculated per acre/hectare */
  perAcre: number;
  /** Name of the crop being analyzed */
  crop: string;
  /** Estimated yield in tonnes */
  yield: number;
}

/**
 * An actionable alert for upcoming field risks.
 */
export interface RiskAlert {
  /** Category of risk (e.g., "Weather", "Pest") */
  type: string;
  /** Risk severity ("Low", "Medium", "High", "Critical") */
  severity: string;
  /** Description of the risk and potential impact */
  message: string;
  /** Estimated date the risk will materialize */
  expectedDate: string;
}

/**
 * Aggregate summary combining all intelligence modules for a single field.
 */
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

// ---------------------------------------------------------
// AUTHENTICATION REQUEST TYPES
// ---------------------------------------------------------

/** Request payload for user registration */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/** Request payload for user login */
export interface LoginRequest {
  email: string;
  password: string;
}

// ---------------------------------------------------------
// FIELD MANAGEMENT REQUEST TYPES
// ---------------------------------------------------------

/** Request payload for creating a new field */
export interface CreateFieldRequest {
  name: string;
  polygon: Polygon;
}

/** Request payload for updating an existing field */
export interface UpdateFieldRequest {
  name?: string;
  polygon?: Polygon;
}

// ---------------------------------------------------------
// SOIL MANAGEMENT REQUEST TYPES
// ---------------------------------------------------------

/** Request payload for manually adding soil sample data */
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

// ---------------------------------------------------------
// ANALYSIS REQUEST TYPES
// ---------------------------------------------------------

/** Generic request wrapper requiring a field ID */
export interface AnalysisRequest {
  fieldId: string;
}

/** Input parameters required for basic soil suitability analysis */
export interface SoilAnalysisInput {
  ph: number;
  soilTexture: string;
  organicCarbon: number;
}

/** Enhanced crop suitability algorithm response type */
export interface CropSuitabilityV2 {
  /** Target crop name */
  name: string;
  /** Overall score out of 100 */
  score: number;
  /** Detailed breakdown of score factors */
  breakdown: {
    ph: number;
    temperature: number;
    rainfall: number;
    soilTexture: number;
  };
}

/** Represents available Macronutrients (NPK) in the soil */
export interface SoilNPK {
  /** Available Nitrogen (kg/ha) */
  nitrogen: number;
  /** Available Phosphorus (kg/ha) */
  phosphorus: number;
  /** Available Potassium (kg/ha) */
  potassium: number;
}
