'use client'
import { format } from "date-fns"
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bomb, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react";
import { useRealtime } from "@/lib/realtime-client";

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${formattedSeconds}`;
};

export default function Room() {
    const router = useRouter();
    const params = useParams()
    const roomId = params.roomId as string
    const [input, setInput] = useState<string>("")
    const { username } = useUsername();
    const [copyStatus, setcopyStatus] = useState<string>("COPY")

    const [time, setTime] = useState<number | null>(null);

    const { mutate: destroyRoom } = useMutation({
        mutationFn: async () => {
            await client.room.delete(null, { query: { roomId } })
            router.push("/?destroyed=true")
        }
    })
    const { data: ttlData } = useQuery({
        queryKey: ["ttl", roomId],
        queryFn: async () => {
            const res = await client.room.ttl.get({ query: { roomId } })
            return res.data;
        }
    })
    useEffect(() => {
        if (ttlData?.ttl !== undefined) {
            setTime(ttlData.ttl)
        }
    }, [ttlData])

    useEffect(() => {
        if (time == null || time < 0) {
            return;
        }
        if (time == 0) {
            router.push("/?destroyed=true")
        }
        const interval = setInterval(() => {
            setTime((prev) => {
                if (prev == null || prev < 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [time, router])



    const { data: messages, refetch } = useQuery({
        queryKey: ["messages", roomId],
        queryFn: async () => {
            const res = await client.messages.get({ query: { roomId } })
            return res.data;
        }
    })

    useRealtime({
        channels: [roomId],
        events: ["chat.message", "chat.destroy"],
        onData: async ({ event, data }) => {
            if (event === "chat.message") {
                refetch();
            }
            if (event === "chat.destroy") {
                router.push("/?destroyed=true")
            }
        }
    })
    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setcopyStatus("COPIED")
        setTimeout(() => {
            setcopyStatus("COPY")
        }, 2000)
    }



    const { mutate: sendMessage, isPending } = useMutation({
        mutationFn: async ({ text }: { text: string }) => {
            await client.messages.post({
                sender: username, text
            }, { query: { roomId } })
        }
    })
    const inputRef = useRef<HTMLInputElement | undefined>(null)



    return (
        <main className="flex flex-col h-screen max-h-screen overflow-hidden">
            <header className="border-b border-zinc-800/50 p-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm text-zinc-100 uppercase">Room ID</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-green-400">{roomId}</span>
                            <button onClick={copyLink} className="text-xs text-zinc-400 border border-zinc-100 px-2 py-1 rounded cursor-pointer hover:bg-zinc-800 hover:text-zinc-100 transition-colors">{copyStatus}</button>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-zinc-800" />
                    <div className="flex flex-col ">
                        <span className="text-xs text-zinc-500 uppercase">
                            SELF-DESTRUCT
                        </span>
                        <span className={`text-sm font-bold flex items-center gap-2 ${time != null && time < 60 ? "text-red-500" : "text-yellow-500"}`}>
                            {time != null ? formatTime(time) : "--:--"}
                        </span>
                    </div>
                </div>
                <button onClick={() => destroyRoom()} className="flex items-center gap-2 text-sm text-zinc-400 border border-zinc-100 px-2 py-1 rounded cursor-pointer hover:bg-red-800 hover:text-zinc-100 transition-colors">
                    <Bomb className="w-4 h-4" />
                    DESTROY ROOM
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages?.messages.length === 0 && (<div className="flex items-center justify-center h-full">
                    <p className="text-zinc-600">No messages yet</p>
                </div>)}

                {messages?.messages.map((m) => (
                    <div key={m.id} className="flex flex-col items-start">
                        <div className="max-w-[80%] group">
                            <div className="flex items-baseline gap-3 mb-1">
                                <span className={`text-sm font-bold ${m.sender === username ? "text-green-500" : "text-blue-500"}`}>{m.sender}
                                </span>
                                <span className="text-[15px] text-zinc-600">
                                    {format(m.timestamp, "HH:mm")}
                                </span>

                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed break-all">
                                {m.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t border-zinc-800/50 p-4 bg-zinc-900/50 backdrop-blur-md">
                <div className="flex gap-4">
                    <div className="flex-1 relative-group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse pl-1">{'>'}</span>
                        <input autoFocus
                            value={input}
                            onKeyDown={(e) => {
                                if (e.key == "Enter") {
                                    sendMessage({ text: input })
                                    inputRef.current?.focus();
                                    setInput("")
                                }
                            }}
                            placeholder="Type message ..."
                            onChange={(e) => setInput(e.target.value)}
                            type="text"
                            className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus-outline-none transition-colors text-zinc-100 
                    placeholder:text-zinc-700 pl-4 py-8 pr-4 text-sm rounded"></input>
                    </div>
                    <button onClick={() => {
                        sendMessage({ text: input })
                        inputRef.current?.focus()
                        setInput("")
                    }}
                        disabled={!input.trim() || isPending}
                        className="bg-zinc-800 text-zinc-400 px-6 text-md font-bold hover: text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-lg flex items-center gap-2">
                        SEND<Send className="h-4 w-4" /></button>
                </div>
            </div>
        </main>
    )
}