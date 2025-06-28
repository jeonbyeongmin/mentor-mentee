export interface User {
  id: number;
  email: string;
  password: string;
  name?: string;
  role: "mentor" | "mentee";
  bio?: string;
  profile_image?: string;
  tech_stacks?: string;
  created_at: string;
  updated_at: string;
}

export interface MatchRequest {
  id: number;
  mentor_id: number;
  mentee_id: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface ProfileImage {
  id: number;
  user_id: number;
  filename: string;
  mime_type: string;
  size: number;
  data: Buffer;
  created_at: string;
}

export interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  name?: string;
  email: string;
  role: "mentor" | "mentee";
  id: number;
}
