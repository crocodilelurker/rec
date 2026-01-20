import { nanoid } from "nanoid";
import { useState, useEffect } from "react";

const ANIMALS = [
  "tiger",
  "wolf",
  "eagle",
  "panda",
  "fox",
  "lion",
  "otter",
  "hawk",
  "bear",
  "dolphin"
];
const ADJECTIVES = [
  "brave",
  "clever",
  "swift",
  "fierce",
  "lazy",
  "happy",
  "wild",
  "sneaky",
  "mighty",
  "calm"
];

const STORAGE_KEY = "chat_username"
const generateUsername = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const word = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${adjective}-${word}-${nanoid(5)}`
}
export const useUsername = () => {
    const [username, setUsername] = useState("");

    useEffect(() => {
        const main = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setUsername(stored);
            }
            else {
                const getUser = generateUsername();
                localStorage.setItem(STORAGE_KEY, getUser);
                setUsername(getUser)
            }
        }
        main();
    }, [])
    return { username };
}