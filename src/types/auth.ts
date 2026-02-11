export interface LoginResponse {
  token: string;
  role: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
}
