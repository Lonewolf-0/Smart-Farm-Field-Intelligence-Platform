import { pool } from "../config/db";
import { NutrienBranch } from "../types";

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
  // Fetch all branches from the database
  const result = await pool.query(`SELECT * FROM branches`);
  const branches: NutrienBranch[] = result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    phone: row.phone,
    services: row.services,
    products: row.products,
  }));

  // Calculate distance for each branch
  const branchesWithDistances: BranchWithDistance[] = branches.map(
    (branch) => {
      const distance = calculateDistance(
        lat,
        lng,
        branch.latitude,
        branch.longitude
      );
      return { ...branch, distance };
    }
  );

  // Sort by distance ascending
  branchesWithDistances.sort((a, b) => a.distance - b.distance);

  // Return the top N nearest branches
  return branchesWithDistances.slice(0, limit);
}
