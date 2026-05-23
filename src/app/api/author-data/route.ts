import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const file = path.join(process.cwd(), 'content', 'author.json')
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({}, { status: 404 })
  }
}
