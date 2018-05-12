export interface LoginRequestWrapper {
  "request-json": LoginRequest
}

export interface LoginRequest {
  apikey: string
}

export interface LoginResponse {
  status: string,
  message: string,
  session: string
}