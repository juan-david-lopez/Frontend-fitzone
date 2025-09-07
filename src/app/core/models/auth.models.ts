import { DocumentType, UserRole } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  timestamp: number;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  message?: string;
  step?: number;
  status?: string;
  error?: string;
  details?: string;
  userId?: number;
  tokenType?: string;
  expiresIn?: number;
}

export interface UserResponse {
  idUser: number;
  firstName: string;
  lastName: string;
  email: string;
  documentType: DocumentType;
  documentNumber: string;
  phoneNumber: string;
  birthDate: string; // LocalDate format: 'YYYY-MM-DD'
  emergencyContactPhone: string;
  medicalConditions: string;
  userRole: UserRole;
  createdAt: string; // LocalDateTime format: 'YYYY-MM-DDTHH:mm:ss'
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  documentType: DocumentType;
  documentNumber: string;
  password: string;
  phoneNumber: string;
  birthDate: string; // 'YYYY-MM-DD'
  emergencyContactPhone: string;
  medicalConditions?: string;
  role?: UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OtpVerificationRequest {
  email: string;
  otp: string;
}

// Para actualización de usuario
export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phoneNumber?: string;
  birthDate?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
}
