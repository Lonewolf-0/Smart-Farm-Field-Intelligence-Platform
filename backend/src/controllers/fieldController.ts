import { Response } from "express";
import { AuthRequest } from "../types";
import * as turf from "@turf/turf";
import { createFieldService, getFieldsByUserIdService, deleteFieldService, updateFieldNameService } from "../services/fieldService";
import { sendResponse } from "../utils/response";

export const updateField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const { id } = req.params;
    const { name } = req.body;
    
    if (!id) {
      sendResponse(res, 400, "Field ID required", null, "Field ID required");
      return;
    }
    
    if (!name || name.trim() === "") {
      sendResponse(res, 400, "Field name required", null, "Field name required");
      return;
    }

    const updatedField = await updateFieldNameService(id, user.id, name.trim());
    if (!updatedField) {
      sendResponse(res, 404, "Field not found or unauthorized", null, "Field not found or unauthorized");
      return;
    }

    sendResponse(res, 200, "Success", updatedField);
  } catch (error: any) {
    console.error("Update Field Error:", error);
    sendResponse(res, 500, "Internal server error", null, error.message);
  }
};

export const deleteUserField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const { id } = req.params;
    if (!id) {
      sendResponse(res, 400, "Field ID required", null, "Field ID required");
      return;
    }

    const deleted = await deleteFieldService(id, user.id);
    if (!deleted) {
      sendResponse(res, 404, "Field not found or unauthorized to delete", null, "Field not found or unauthorized to delete");
      return;
    }

    sendResponse(res, 200, "Field deleted successfully");
  } catch (error: any) {
    console.error("Delete Field Error:", error);
    sendResponse(res, 500, "Internal server error", null, error.message);
  }
};

export const getUserFields = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const fields = await getFieldsByUserIdService(user.id);
    const formattedFields = fields.map((f: any) => ({
      id: f.id,
      name: f.name,
      area: f.area,
      polygon: f.polygon,
      centroid: {
        lat: f.centroid_lat,
        lng: f.centroid_lng,
      },
      createdAt: f.created_at,
    }));
    sendResponse(res, 200, "Success", formattedFields);
  } catch (error: any) {
    console.error("Get User Fields Error:", error);
    sendResponse(res, 500, "Internal server error", null, error.message);
  }
};

export const saveField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const { name, polygon } = req.body;
    if (!name || !polygon || polygon.type !== "Polygon") {
      sendResponse(res, 400, "Invalid field data. Name and valid Polygon required.", null, "Invalid field data. Name and valid Polygon required.");
      return;
    }

    // Calculate Area (in hectares)
    const areaSqMeters = turf.area(turf.polygon(polygon.coordinates));
    const areaHectares = areaSqMeters / 10000;

    // Calculate Centroid
    const centroid = turf.centroid(turf.polygon(polygon.coordinates));
    const [centroidLng, centroidLat] = centroid.geometry.coordinates;

    const newField = await createFieldService(
      user.id,
      name,
      polygon,
      areaHectares,
      centroidLat,
      centroidLng
    );

    sendResponse(res, 201, "Success", {
      id: newField.id,
      name: newField.name,
      area: newField.area,
      polygon: newField.polygon,
      centroid: {
        lat: newField.centroid_lat,
        lng: newField.centroid_lng,
      },
      createdAt: newField.created_at,
    });
  } catch (error: any) {
    console.error("Save Field Error:", error);
    sendResponse(res, 500, "Internal server error", null, error.message);
  }
};
