import { NextRequest, NextResponse } from "next/server"
import { redis } from "./lib/redis"
import { nanoid } from "nanoid"

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname

    const roomId = pathname.split("/")[2]
    if (!roomId) {
        return NextResponse.redirect(new URL("/", req.url))
    }
    const meta = await redis.hgetall<{ connected: [], createdAt: number }>(`meta:${roomId}`)
    if (!meta) {
        return NextResponse.redirect(new URL("/?error=room-not-found", req.url))
    }
    const existingToken = req.cookies.get("x-auth-token")?.value
    if(existingToken && meta.connected.includes(existingToken))
    {
        return NextResponse.next();
    }
    if(meta.connected.length >= 2)
    {
        return NextResponse.redirect(new URL("/?error=room-full", req.url))
    }
    const response = NextResponse.next();
    const token = nanoid();
    response.cookies.set("x-auth-token", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7
    });
    await redis.hset(`meta:${roomId}`,
        {
            connected: [...meta.connected, token],
        }
    )
    return response;
}

export const config = {
    matcher: "/room/:path*"
}
