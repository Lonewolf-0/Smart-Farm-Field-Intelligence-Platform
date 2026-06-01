import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterRequest) => {
  const response = await api.post("/auth/register", data);
  return response.data?.data;
};

export const loginUser = async (data: LoginRequest) => {
  const response = await api.post("/auth/login", data);
  return response.data?.data;
};
