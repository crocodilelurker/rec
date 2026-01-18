'use client'

import { useParams } from "next/navigation"
import { useState } from "react";

export default function Room() {

    const [copyStatus,setcopyStatus] = useState<string>("COPY")
    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setcopyStatus("COPIED")
        setTimeout(() => {
            setcopyStatus("COPY")
        },2000)
    }
    const params = useParams()
    const roomId = params.roomId as string
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
                </div>
            </header>
        </main>
    )
}