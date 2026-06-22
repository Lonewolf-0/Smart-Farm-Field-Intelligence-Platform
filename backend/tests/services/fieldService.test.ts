import {
  createFieldService,
  getFieldsByUserIdService,
  deleteFieldService,
  updateFieldNameService,
  findFieldByIdService,
  findFieldByIdAndUserIdService
} from "../../src/services/fieldService";
import * as fieldRepo from "../../src/repositories/fieldRepository";

describe("Field Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createFieldService", () => {
    it("should call createField repository with correct parameters and return the result", async () => {
      const mockField = { id: "field1", name: "Test Field" };
      jest.spyOn(fieldRepo, "createField").mockResolvedValue(mockField as any);

      const userId = "user1";
      const name = "Test Field";
      const polygon = [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]];
      const area = 100;
      const centroidLat = 0.5;
      const centroidLng = 0.5;

      const result = await createFieldService(userId, name, polygon, area, centroidLat, centroidLng);

      expect(fieldRepo.createField).toHaveBeenCalledWith(userId, name, polygon, area, centroidLat, centroidLng);
      expect(result).toEqual(mockField);
    });
  });

  describe("getFieldsByUserIdService", () => {
    it("should call getFieldsByUserId repository with correct parameters and return the result", async () => {
      const mockFields = [{ id: "field1", name: "Test Field" }];
      jest.spyOn(fieldRepo, "getFieldsByUserId").mockResolvedValue(mockFields as any);

      const userId = "user1";

      const result = await getFieldsByUserIdService(userId);

      expect(fieldRepo.getFieldsByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockFields);
    });
  });

  describe("deleteFieldService", () => {
    it("should call deleteField repository with correct parameters and return the result", async () => {
      jest.spyOn(fieldRepo, "deleteField").mockResolvedValue(true);

      const fieldId = "field1";
      const userId = "user1";

      const result = await deleteFieldService(fieldId, userId);

      expect(fieldRepo.deleteField).toHaveBeenCalledWith(fieldId, userId);
      expect(result).toBe(true);
    });
  });

  describe("updateFieldNameService", () => {
    it("should call updateFieldName repository with correct parameters and return the result", async () => {
      const mockUpdatedField = { id: "field1", name: "New Name" };
      jest.spyOn(fieldRepo, "updateFieldName").mockResolvedValue(mockUpdatedField as any);

      const fieldId = "field1";
      const userId = "user1";
      const newName = "New Name";

      const result = await updateFieldNameService(fieldId, userId, newName);

      expect(fieldRepo.updateFieldName).toHaveBeenCalledWith(fieldId, userId, newName);
      expect(result).toEqual(mockUpdatedField);
    });
  });

  describe("findFieldByIdService", () => {
    it("should call findFieldById repository with correct parameters and return the result", async () => {
      const mockField = { id: "field1", name: "Test Field" };
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);

      const fieldId = "field1";

      const result = await findFieldByIdService(fieldId);

      expect(fieldRepo.findFieldById).toHaveBeenCalledWith(fieldId);
      expect(result).toEqual(mockField);
    });
  });

  describe("findFieldByIdAndUserIdService", () => {
    it("should call findFieldByIdAndUserId repository with correct parameters and return the result", async () => {
      const mockField = { id: "field1", name: "Test Field", user_id: "user1" };
      jest.spyOn(fieldRepo, "findFieldByIdAndUserId").mockResolvedValue(mockField as any);

      const fieldId = "field1";
      const userId = "user1";

      const result = await findFieldByIdAndUserIdService(fieldId, userId);

      expect(fieldRepo.findFieldByIdAndUserId).toHaveBeenCalledWith(fieldId, userId);
      expect(result).toEqual(mockField);
    });
  });
});
