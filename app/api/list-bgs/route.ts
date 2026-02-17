import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET() {
    try {
        const backgroundsDir = join(process.cwd(), 'public', 'backgrounds')
        let backgrounds: string[] = ['/default-bg.png']

        if (existsSync(backgroundsDir)) {
            const files = await readdir(backgroundsDir)
            const images = files.filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
            backgrounds = [...backgrounds, ...images.map(img => `/backgrounds/${img}`)]
        }

        return NextResponse.json({ backgrounds })

    } catch (error) {
        console.error('List Backgrounds Error:', error)
        return NextResponse.json({ error: 'Failed to list backgrounds' }, { status: 500 })
    }
}
