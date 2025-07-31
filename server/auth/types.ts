// Authentication types and interfaces
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthConfig {
  googleClientId?: string;
  googleClientSecret?: string;
  sessionSecret: string;
  sessionTimeout: number;
}

export interface PassportUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImageUrl?: string | null;
}

export interface GoogleProfile {
  id: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  photos?: Array<{ value: string }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  username: string;
}