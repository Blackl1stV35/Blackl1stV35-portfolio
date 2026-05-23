import { NextResponse } from 'next/server'
import path from 'path'
import { readJSON } from '@/lib/cache'

export async function GET() {
  const file = path.join(process.cwd(), 'content', 'contact.json')
  try {
    const data = await readJSON(file).catch(() => null)
    if (!data) return NextResponse.json({}, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({}, { status: 404 })
  }
}
