import { login, logout, register } from "./auth";

export const server = {
  auth: {
    login,
    register,
    logout,
  },
};
