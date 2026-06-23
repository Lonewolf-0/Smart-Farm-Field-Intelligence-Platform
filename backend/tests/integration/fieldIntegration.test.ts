import request from "supertest";
import express from "express";
import fieldRoutes from "../../src/routes/fieldRoutes";
import * as fieldRepo from "../../src/repositories/fieldRepository";
import { pool } from "../../src/config/db";
import { updateField, deleteUserField } from "../../src/controllers/fieldController";

let mockUser: any = { id: "user1" };

jest.mock("../../src/middlewares/authMiddleware", () => ({
  authenticate: (req: any, res: any, next: any) => {
    if (!mockUser) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    req.user = mockUser;
    next();
  },
}));

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

const app = express();
app.use(express.json());
app.use("/api/fields", fieldRoutes);

describe("Field API Integration Tests", () => {
  const mockPolygon = {
    type: "Polygon",
    coordinates: [[[0.0, 0.0], [0.0, 1.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0]]],
  };

  const mockDbField = {
    id: "field1",
    user_id: "user1",
    name: "My Field",
    polygon: mockPolygon,
    area: 123.45,
    centroid_lat: 0.5,
    centroid_lng: 0.5,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "user1" };
  });

  describe("GET /api/fields", () => {
    it("should return 401 if user is unauthorized", async () => {
      mockUser = null;

      const res = await request(app).get("/api/fields");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should return user fields successfully", async () => {
      jest.spyOn(fieldRepo, "getFieldsByUserId").mockResolvedValueOnce([mockDbField] as any);

      const res = await request(app).get("/api/fields");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([
        {
          id: mockDbField.id,
          name: mockDbField.name,
          area: mockDbField.area,
          polygon: mockDbField.polygon,
          centroid: {
            lat: mockDbField.centroid_lat,
            lng: mockDbField.centroid_lng,
          },
          createdAt: mockDbField.created_at,
        },
      ]);
      expect(fieldRepo.getFieldsByUserId).toHaveBeenCalledWith("user1");
    });

    it("should return 500 if database query fails", async () => {
      jest.spyOn(fieldRepo, "getFieldsByUserId").mockRejectedValueOnce(new Error("DB error"));

      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await request(app).get("/api/fields");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("DB error");

      errSpy.mockRestore();
    });
  });

  describe("POST /api/fields", () => {
    it("should return 401 if user is unauthorized", async () => {
      mockUser = null;

      const res = await request(app).post("/api/fields").send({
        name: "Test Field",
        polygon: mockPolygon,
      });

      expect(res.status).toBe(401);
    });

    it("should return 400 if name or polygon is invalid/missing", async () => {
      const res = await request(app).post("/api/fields").send({
        name: "",
        polygon: mockPolygon,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Invalid field data");
    });

    it("should save field, calculate area and centroid successfully", async () => {
      jest.spyOn(fieldRepo, "createField").mockResolvedValueOnce(mockDbField as any);

      const res = await request(app).post("/api/fields").send({
        name: "My Field",
        polygon: mockPolygon,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        id: mockDbField.id,
        name: mockDbField.name,
        area: mockDbField.area,
        polygon: mockDbField.polygon,
        centroid: {
          lat: mockDbField.centroid_lat,
          lng: mockDbField.centroid_lng,
        },
        createdAt: mockDbField.created_at,
      });
      expect(fieldRepo.createField).toHaveBeenCalledWith(
        "user1",
        "My Field",
        mockPolygon,
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should return 500 if save field query fails", async () => {
      jest.spyOn(fieldRepo, "createField").mockRejectedValueOnce(new Error("Save failed"));

      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await request(app).post("/api/fields").send({
        name: "My Field",
        polygon: mockPolygon,
      });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);

      errSpy.mockRestore();
    });
  });

  describe("PUT /api/fields/:id", () => {
    it("should return 401 if user is unauthorized", async () => {
      mockUser = null;

      const res = await request(app).put("/api/fields/field1").send({ name: "Updated Name" });

      expect(res.status).toBe(401);
    });

    it("should return 400 if name is missing or empty", async () => {
      const res = await request(app).put("/api/fields/field1").send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Field name required");
    });

    it("should update field name successfully", async () => {
      const updatedField = { ...mockDbField, name: "New Name" };
      jest.spyOn(fieldRepo, "updateFieldName").mockResolvedValueOnce(updatedField as any);

      const res = await request(app).put("/api/fields/field1").send({ name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Name");
      expect(fieldRepo.updateFieldName).toHaveBeenCalledWith("field1", "user1", "New Name");
    });

    it("should return 404 if field not found or unauthorized to update", async () => {
      jest.spyOn(fieldRepo, "updateFieldName").mockResolvedValueOnce(null);

      const res = await request(app).put("/api/fields/field1").send({ name: "New Name" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Field not found or unauthorized");
    });

    it("should return 500 if update database query fails", async () => {
      jest.spyOn(fieldRepo, "updateFieldName").mockRejectedValueOnce(new Error("Update failed"));

      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await request(app).put("/api/fields/field1").send({ name: "New Name" });

      expect(res.status).toBe(500);

      errSpy.mockRestore();
    });

    it("should return 400 if fieldId is missing in params", async () => {
      const customApp = express();
      customApp.use(express.json());
      customApp.put("/api/fields/:id", (req: any, res, next) => {
        req.user = { id: "user1" };
        req.params.id = undefined;
        next();
      }, updateField);

      const res = await request(customApp).put("/api/fields/dummy").send({ name: "New Name" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Field ID required");
    });
  });

  describe("DELETE /api/fields/:id", () => {
    it("should return 401 if user is unauthorized", async () => {
      mockUser = null;

      const res = await request(app).delete("/api/fields/field1");

      expect(res.status).toBe(401);
    });

    it("should delete field successfully", async () => {
      jest.spyOn(fieldRepo, "deleteField").mockResolvedValueOnce(true);

      const res = await request(app).delete("/api/fields/field1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Field deleted successfully");
      expect(fieldRepo.deleteField).toHaveBeenCalledWith("field1", "user1");
    });

    it("should return 404 if field not found or unauthorized to delete", async () => {
      jest.spyOn(fieldRepo, "deleteField").mockResolvedValueOnce(false);

      const res = await request(app).delete("/api/fields/field1");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Field not found or unauthorized to delete");
    });

    it("should return 500 if delete database query fails", async () => {
      jest.spyOn(fieldRepo, "deleteField").mockRejectedValueOnce(new Error("Delete failed"));

      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await request(app).delete("/api/fields/field1");

      expect(res.status).toBe(500);

      errSpy.mockRestore();
    });

    it("should return 400 if fieldId is missing in delete request params", async () => {
      const customApp = express();
      customApp.use(express.json());
      customApp.delete("/api/fields/:id", (req: any, res, next) => {
        req.user = { id: "user1" };
        req.params.id = undefined;
        next();
      }, deleteUserField);

      const res = await request(customApp).delete("/api/fields/dummy");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Field ID required");
    });
  });
});
