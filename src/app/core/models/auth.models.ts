export interface LoginRequest {
  email: string;
  password: string;
}
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  documentType: "CC" | "TI" | "CE"; // según tu enum en backend
  documentNumber: string;
  password: string;
  phoneNumber: string;
  birthDate: string; // 'YYYY-MM-DD'
  emergencyContactPhone: string;
  medicalConditions?: string;
  mainLocationId?: number;
  role: "USER" | "ADMIN"; // según tu enum UserRole
}
