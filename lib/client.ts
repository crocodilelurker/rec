import { treaty } from '@elysiajs/eden'
import type { app } from '../app/api/[[...slugs]]/route'

export const client = treaty<typeof app>('https://rec-gules.vercel.app/').api