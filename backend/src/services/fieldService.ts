import {
  createField,
  getFieldsByUserId,
  deleteField,
  updateFieldName,
  findFieldById,
  findFieldByIdAndUserId,
  findFieldByNameAndUserId
} from "../repositories/fieldRepository";

export const createFieldService = async (
  userId: string,
  name: string,
  polygon: any,
  area: number,
  centroidLat: number,
  centroidLng: number
) => {
  return await createField(userId, name, polygon, area, centroidLat, centroidLng);
};

export const getFieldsByUserIdService = async (userId: string) => {
  return await getFieldsByUserId(userId);
};

export const deleteFieldService = async (fieldId: string, userId: string) => {
  return await deleteField(fieldId, userId);
};

export const updateFieldNameService = async (fieldId: string, userId: string, newName: string) => {
  return await updateFieldName(fieldId, userId, newName);
};

export const findFieldByIdService = async (fieldId: string) => {
  return await findFieldById(fieldId);
};

export const findFieldByIdAndUserIdService = async (fieldId: string, userId: string) => {
  return await findFieldByIdAndUserId(fieldId, userId);
};

export const findFieldByNameAndUserIdService = async (userId: string, name: string) => {
  return await findFieldByNameAndUserId(userId, name);
};

