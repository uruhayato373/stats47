import { handlers } from "@/features/auth/lib/auth";

export const runtime = "edge";

export const { GET, POST } = handlers;
