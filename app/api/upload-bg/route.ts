import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const backgroundsDir = join(process.cwd(), 'public', 'backgrounds')

        if (!existsSync(backgroundsDir)) {
            await mkdir(backgroundsDir, { recursive: true })
        }

        const filename = `bg-${Date.now()}-${file.name.replace(/\s+/g, '-')}`
        const path = join(backgroundsDir, filename)

        await writeFile(path, buffer)

        return NextResponse.json({
            success: true,
            url: `/backgrounds/${filename}`
        })

    } catch (error) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }
}
