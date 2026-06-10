import { 
  getAllBranchesFromDb, 
  getBranchByIdFromDb, 
  getBranchPricesFromDb, 
  getNearestBranchesFromDb 
} from "../repositories/branchRepository";
import { NutrienBranch } from "../types";

/**
 * Represents a Nutrien branch along with its calculated distance from a specific point.
 */
export interface BranchWithDistance extends NutrienBranch {
  distance: number;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of the first point
 * @param lng1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lng2 Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function getAllBranchesService() {
  return await getAllBranchesFromDb();
}

export async function getBranchByIdService(id: string) {
  return await getBranchByIdFromDb(id);
}

export async function getBranchPricesService(id: string) {
  return await getBranchPricesFromDb(id);
}

/**
 * Finds the nearest branches to a given set of coordinates.
 *
 * @param lat Latitude of the user
 * @param lng Longitude of the user
 * @param limit Number of branches to return
 * @returns Array of nearest branches with distances
 */
export async function findNearestBranches(
  lat: number,
  lng: number,
  limit: number = 5
): Promise<BranchWithDistance[]> {
  const rows = await getNearestBranchesFromDb(lat, lng, limit);
  
  const branchesWithDistances: BranchWithDistance[] = rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    phone: row.phone,
    services: row.services,
    products: row.products,
    distance: row.distance,
  }));

  return branchesWithDistances;
}
