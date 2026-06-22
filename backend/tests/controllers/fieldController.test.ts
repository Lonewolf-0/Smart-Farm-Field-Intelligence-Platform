import { updateField, deleteUserField, getUserFields, saveField } from "../../src/controllers/fieldController";
import { sendResponse } from "../../src/utils/response";
import * as fieldService from "../../src/services/fieldService";
import * as turf from "@turf/turf";

jest.mock("../../src/utils/response");
jest.mock("../../src/services/fieldService");
jest.mock("@turf/turf");

describe("Field Controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: "user123" },
    };

    res = {};

    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("updateField", () => {
    it("should update a field name successfully", async () => {
      req.params.id = "field123";
      req.body.name = "New Field Name";

      const mockUpdatedField = { id: "field123", name: "New Field Name" };
      (fieldService.updateFieldNameService as jest.Mock).mockResolvedValue(mockUpdatedField);

      await updateField(req, res);

      expect(fieldService.updateFieldNameService).toHaveBeenCalledWith("field123", "user123", "New Field Name");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Success", mockUpdatedField);
    });

    it("should return 400 if ID is missing", async () => {
      req.body.name = "New Field Name";

      await updateField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 400, "Field ID required", null, "Field ID required");
      expect(fieldService.updateFieldNameService).not.toHaveBeenCalled();
    });

    it("should return 400 if name is missing", async () => {
      req.params.id = "field123";

      await updateField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 400, "Field name required", null, "Field name required");
      expect(fieldService.updateFieldNameService).not.toHaveBeenCalled();
    });

    it("should return 400 if name is empty", async () => {
      req.params.id = "field123";
      req.body.name = "   ";

      await updateField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 400, "Field name required", null, "Field name required");
      expect(fieldService.updateFieldNameService).not.toHaveBeenCalled();
    });

    it("should return 404 if field is not found or unauthorized", async () => {
      req.params.id = "field123";
      req.body.name = "New Field Name";

      (fieldService.updateFieldNameService as jest.Mock).mockResolvedValue(null);

      await updateField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 404, "Field not found or unauthorized", null, "Field not found or unauthorized");
    });

    it("should return 500 if an error occurs", async () => {
      req.params.id = "field123";
      req.body.name = "New Field Name";

      const error = new Error("Database error");
      (fieldService.updateFieldNameService as jest.Mock).mockRejectedValue(error);

      await updateField(req, res);

      expect(console.error).toHaveBeenCalledWith("Update Field Error:", error);
      expect(sendResponse).toHaveBeenCalledWith(res, 500, "Internal server error", null, error.message);
    });
  });

  describe("deleteUserField", () => {
    it("should delete a field successfully", async () => {
      req.params.id = "field123";

      (fieldService.deleteFieldService as jest.Mock).mockResolvedValue(true);

      await deleteUserField(req, res);

      expect(fieldService.deleteFieldService).toHaveBeenCalledWith("field123", "user123");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Field deleted successfully");
    });

    it("should return 400 if ID is missing", async () => {
      await deleteUserField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 400, "Field ID required", null, "Field ID required");
      expect(fieldService.deleteFieldService).not.toHaveBeenCalled();
    });

    it("should return 404 if field is not found or unauthorized to delete", async () => {
      req.params.id = "field123";

      (fieldService.deleteFieldService as jest.Mock).mockResolvedValue(false);

      await deleteUserField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 404, "Field not found or unauthorized to delete", null, "Field not found or unauthorized to delete");
    });

    it("should return 500 if an error occurs", async () => {
      req.params.id = "field123";

      const error = new Error("Database error");
      (fieldService.deleteFieldService as jest.Mock).mockRejectedValue(error);

      await deleteUserField(req, res);

      expect(console.error).toHaveBeenCalledWith("Delete Field Error:", error);
      expect(sendResponse).toHaveBeenCalledWith(res, 500, "Internal server error", null, error.message);
    });
  });

  describe("getUserFields", () => {
    it("should retrieve and map user fields successfully", async () => {
      const mockDbFields = [
        {
          id: "field1",
          name: "Field 1",
          area: 10.5,
          polygon: { type: "Polygon", coordinates: [] },
          centroid_lat: 40.7128,
          centroid_lng: -74.0060,
          created_at: "2023-01-01T00:00:00Z"
        },
        {
          id: "field2",
          name: "Field 2",
          area: 20.0,
          polygon: { type: "Polygon", coordinates: [] },
          centroid_lat: 34.0522,
          centroid_lng: -118.2437,
          created_at: "2023-01-02T00:00:00Z"
        }
      ];

      const expectedFormattedFields = [
        {
          id: "field1",
          name: "Field 1",
          area: 10.5,
          polygon: { type: "Polygon", coordinates: [] },
          centroid: {
            lat: 40.7128,
            lng: -74.0060
          },
          createdAt: "2023-01-01T00:00:00Z"
        },
        {
          id: "field2",
          name: "Field 2",
          area: 20.0,
          polygon: { type: "Polygon", coordinates: [] },
          centroid: {
            lat: 34.0522,
            lng: -118.2437
          },
          createdAt: "2023-01-02T00:00:00Z"
        }
      ];

      (fieldService.getFieldsByUserIdService as jest.Mock).mockResolvedValue(mockDbFields);

      await getUserFields(req, res);

      expect(fieldService.getFieldsByUserIdService).toHaveBeenCalledWith("user123");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Success", expectedFormattedFields);
    });

    it("should return 500 if an error occurs", async () => {
      const error = new Error("Database connection failed");
      (fieldService.getFieldsByUserIdService as jest.Mock).mockRejectedValue(error);

      await getUserFields(req, res);

      expect(console.error).toHaveBeenCalledWith("Get User Fields Error:", error);
      expect(sendResponse).toHaveBeenCalledWith(res, 500, "Internal server error", null, error.message);
    });
  });

  describe("saveField", () => {
    beforeEach(() => {
      // Mock turf functions
      (turf.polygon as jest.Mock).mockReturnValue("mockTurfPolygon");
      (turf.area as jest.Mock).mockReturnValue(150000); // 15 hectares = 150000 sq meters
      (turf.centroid as jest.Mock).mockReturnValue({
        geometry: {
          coordinates: [-120.5, 35.8] // [lng, lat]
        }
      });
    });

    it("should calculate area/centroid and save field successfully", async () => {
      req.body = {
        name: "My New Field",
        polygon: {
          type: "Polygon",
          coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
        }
      };

      const mockNewField = {
        id: "newFieldId",
        name: "My New Field",
        area: 15,
        polygon: req.body.polygon,
        centroid_lat: 35.8,
        centroid_lng: -120.5,
        created_at: "2023-01-01T00:00:00Z"
      };

      (fieldService.createFieldService as jest.Mock).mockResolvedValue(mockNewField);

      await saveField(req, res);

      // Verify turf functions were called
      expect(turf.polygon).toHaveBeenCalledWith(req.body.polygon.coordinates);
      expect(turf.area).toHaveBeenCalledWith("mockTurfPolygon");
      expect(turf.centroid).toHaveBeenCalledWith("mockTurfPolygon");

      // Verify service call with calculated area (hectares) and centroid
      expect(fieldService.createFieldService).toHaveBeenCalledWith(
        "user123",
        "My New Field",
        req.body.polygon,
        15, // 150000 / 10000
        35.8, // lat
        -120.5 // lng
      );

      // Verify response formatting
      expect(sendResponse).toHaveBeenCalledWith(res, 201, "Success", {
        id: "newFieldId",
        name: "My New Field",
        area: 15,
        polygon: req.body.polygon,
        centroid: {
          lat: 35.8,
          lng: -120.5
        },
        createdAt: "2023-01-01T00:00:00Z"
      });
    });

    it("should return 400 if name is missing", async () => {
      req.body = {
        polygon: {
          type: "Polygon",
          coordinates: []
        }
      };

      await saveField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 400, "Invalid field data. Name and valid Polygon required.", null, "Invalid field data. Name and valid Polygon required.");
      expect(fieldService.createFieldService).not.toHaveBeenCalled();
    });

    it("should return 400 if polygon is missing", async () => {
      req.body = {
        name: "My Field"
      };

      await saveField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 400, "Invalid field data. Name and valid Polygon required.", null, "Invalid field data. Name and valid Polygon required.");
      expect(fieldService.createFieldService).not.toHaveBeenCalled();
    });

    it("should return 400 if polygon type is not 'Polygon'", async () => {
      req.body = {
        name: "My Field",
        polygon: {
          type: "Point",
          coordinates: [0, 0]
        }
      };

      await saveField(req, res);

      expect(sendResponse).toHaveBeenCalledWith(res, 400, "Invalid field data. Name and valid Polygon required.", null, "Invalid field data. Name and valid Polygon required.");
      expect(fieldService.createFieldService).not.toHaveBeenCalled();
    });

    it("should return 500 if an error occurs", async () => {
      req.body = {
        name: "My Field",
        polygon: {
          type: "Polygon",
          coordinates: []
        }
      };

      const error = new Error("Failed to save field");
      (fieldService.createFieldService as jest.Mock).mockRejectedValue(error);

      await saveField(req, res);

      expect(console.error).toHaveBeenCalledWith("Save Field Error:", error);
      expect(sendResponse).toHaveBeenCalledWith(res, 500, "Internal server error", null, error.message);
    });
  });
});
