import { Response } from "express";
import { AuthRequest } from "../types";
import * as turf from "@turf/turf";
import { createField } from "../repositories/field.repository";

export const saveField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { name, polygon } = req.body;
    if (!name || !polygon || polygon.type !== "Polygon") {
      res.status(400).json({ success: false, error: "Invalid field data. Name and valid Polygon required." });
      return;
    }

    // Calculate Area (in hectares)
    const areaSqMeters = turf.area(turf.polygon(polygon.coordinates));
    const areaHectares = areaSqMeters / 10000;

    // Calculate Centroid
    const centroid = turf.centroid(turf.polygon(polygon.coordinates));
    const [centroidLng, centroidLat] = centroid.geometry.coordinates;

    const newField = await createField(
      user.id,
      name,
      polygon,
      areaHectares,
      centroidLat,
      centroidLng
    );

    res.status(201).json({ success: true, data: newField });
  } catch (error: any) {
    console.error("Save Field Error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
