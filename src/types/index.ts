export interface User {
  avatar_url: string;
  username: string;
  fullname: string;
  email: string;
  verified: boolean;
  updated_at?: string;
  etag?: string;
}

export interface UserQuota {
  id: number;
  user_id: string;
  used_bytes: number;
  total_bytes: number;
  gif_count: number;
  gif_limit: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: string;
}

export interface SignupPayload {
  username: string;
  fullname: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  confirm_password: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirm_password: string;
}

export interface UploadPresignedResponse {
  upload_url: string;
  key: string;
  expires_in: number;
}

export type UploadStatus = "pending" | "processing" | "ok" | "failed";

export interface UploadStatusResponse {
  status: UploadStatus;
}

export interface StreamResponse {
  url: string;
  expires_in: number;
}

export interface LastUploadMetadata {
  user_id: string;
  key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  duration_sec: number;
  uploaded_at: string;
  thumbnail_url?: string;
}

export interface ConvertPayload {
  upload_key: string;
  start_time: number;
  end_time: number;
  fps: number;
  width: number;
  loop: boolean;
}

export interface ConvertJobResponse {
  job_id: string;
  status: "queued" | string;
  location?: string;
}

export type ConversionStatus = "queued" | "converting" | "completed" | "failed";

export interface ConvertStatusResponse {
  job_id: string;
  status: ConversionStatus;
  gif_id?: string;
  progress?: number;
  updated_at?: string;
  etag?: string;
}

export interface GifItem {
  key: string;
  name?: string;
  status: "public" | "private" | string;
  persist?: boolean;
  url: string;
  thumbnail_url?: string;
  download?: number;
  created_at: string;
  updated_at?: string;
  etag?: string;
}

export interface GifThumbnailResponse {
  thumbnail: string;
}

export interface GifListResponse {
  data?: GifItem[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface DownloadResponse {
  url: string;
}

export interface SharedGifItem {
  id: string;
  name: string;
  url: string;
  thumbnail_url: string;
  gif_key: string;
  owner_id: string;
  shared_with: string;
  expires_at: string;
}

export interface SharePayload {
  shared_with: string;
  expire_at: string;
}

export interface CreateShareByTokenRequest {
  gif_key: string;
  email: string;
  expire_at: string; // ISO 8601 string
}

export interface CreateShareByTokenResponse {
  token: string;
}

export interface SharedGifTokenResponse {
  gif_key: string;
  name: string;
  url: string;
  thumbnail_url: string;
  expires_at: string | null;
  created_at: string;
}

export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "PRECONDITION_FAILED"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_USER_NOT_VERIFIED"
  | "AUTH_USER_EXISTS"
  | "AUTH_USER_NOT_FOUND"
  | "AUTH_RESET_TOKEN_INVALID"
  | "AUTH_VERIFY_TOKEN_INVALID"
  | "GIF_NOT_FOUND"
  | "GIF_FORBIDDEN"
  | "JOB_NOT_FOUND"
  | "SHARE_NOT_FOUND"
  | "SHARE_FORBIDDEN"
  | "RATE_LIMITED"
  | string;

export interface ApiError {
  error_code?: ApiErrorCode;
  message: string;
  status: number;
  code?: number;
  error?: string;
  detail?: unknown;
}

export interface RateLimitInfo {
  limit?: string | null;
  remaining?: string | null;
  reset?: string | null;
  retryAfter?: string | null;
}

