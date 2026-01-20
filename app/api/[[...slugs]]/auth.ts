import { redis } from "@/lib/redis";
import Elysia from "elysia";

class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

export const authMiddleware = new Elysia({ name: "auth" })
    .error({ AuthError })
    .onError({ as: "scoped" }, ({ code, set, error }) => {
        if (code == "AuthError") {
            set.status = 401;
            return {
                error: "Unauthorized",
                message: error.message
            }
        }
    }).derive({ as: "scoped" }, async ({ query, cookie }) => {
        const roomId = query.roomId;
        const token = cookie["x-auth-token"].value as string | undefined;
        if (!roomId || !token) {
            throw new AuthError("Missing roomid or token !");
        }
        const meta = await redis.hget<string[]>(`meta:${roomId}`, "connected")
        if (!meta?.includes(token)) {
            throw new AuthError("Invalid token !")
        }
        return {
            auth: { token, roomId, meta }
        }
    })