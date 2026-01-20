import { redis } from '@/lib/redis';
import { Elysia } from 'elysia'
import { nanoid } from 'nanoid'
import { authMiddleware } from './auth';
import { z } from 'zod'
import { Message, realtime } from '@/lib/realtime';

const ROOM_TTL = 60 * 10;
const rooms = new Elysia({ prefix: '/room' })
    .post("/create", async () => {
        const roomId = nanoid();
        await redis.hset(`meta:${roomId}`, {
            connected: [],
            createdAt: Date.now(),
        })
        await redis.expire(`meta:${roomId}`, ROOM_TTL)
        return { roomId }
    })

const messageQuerySchema = z.object({
    roomId: z.string()
})

const messageBodySchema = z.object({
    sender: z.string().max(100).min(1),
    text: z.string().max(1000).min(1)
})

const messages = new Elysia({ prefix: "/messages" }).use(authMiddleware)
    .post("/", async ({ auth, body, query }) => {
        const parsedQuery = messageQuerySchema.parse(query);
        const parsedBody = messageBodySchema.parse(body);

        const { roomId, token } = auth;
        const { sender, text } = parsedBody;
        const roomExists = await redis.exists(`meta:${roomId}`)
        if (!roomExists) {
            throw new Error("room not found")
        }
        const message: Message = {
            id: nanoid(),
            sender,
            text,
            timestamp: Date.now(),
            roomId
        }
        await redis.rpush(`messages:${roomId}`, {
            ...message,
            token
        })
        await realtime.channel(roomId).emit("chat.message", message)
        const remaining = await redis.ttl(`meta:${roomId}`)
        await redis.expire(`messages:${roomId}`, remaining)
        await redis.expire(`history:${roomId}`, remaining)
        await redis.expire(`meta:${roomId}`, remaining)
    })

export const app = new Elysia({ prefix: '/api' }).use(rooms).use(messages)
export const GET = app.fetch
export const POST = app.fetch
