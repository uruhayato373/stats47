import { SignJWT, jwtVerify, decodeJwt } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "your-secret-key-change-this-in-production-min-32-chars"
);

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: "admin" | "user";
  sessionId: string;
  iat?: number;
  exp?: number;
}

export async function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const payload = decodeJwt(token);
    return payload as JWTPayload;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}
