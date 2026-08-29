import { NextRequest, NextResponse } from 'next/server'
import { buildPortfolioDOCX } from '@/lib/export'
import path from 'path'
import { readJSON } from '@/lib/cache'

// This endpoint is public (no auth — it's a "download my portfolio" feature) and
// each build packs a fresh DOCX/zip. Cache the buffer briefly so repeated requests
// can't force sustained CPU work; 30s keeps it well within "fresh enough" for a
// personal site that's edited occasionally, not continuously.
let cachedDocx: { buffer: Buffer; expiresAt: number } | null = null
const DOCX_CACHE_TTL_MS = 30_000

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') ?? 'docx'

  // Get author name for filename
  let authorName = 'Portfolio'
  try {
    const a = await readJSON(path.join(process.cwd(), 'content', 'author.json')).catch(() => null)
    if (a) authorName = String(a.name ?? 'Portfolio').replace(/\s+/g, '_')
  } catch {}

  try {
    if (format === 'docx') {
      if (!cachedDocx || cachedDocx.expiresAt < Date.now()) {
        cachedDocx = { buffer: await buildPortfolioDOCX(), expiresAt: Date.now() + DOCX_CACHE_TTL_MS }
      }
      const docxBuffer = cachedDocx.buffer
      return new NextResponse(docxBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${authorName}_Portfolio.docx"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    // PDF export removed — return explanatory error
    if (format === 'pdf') {
      return NextResponse.json({ error: 'PDF export has been removed. Please download DOCX instead.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'format must be docx or pdf' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[export]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
