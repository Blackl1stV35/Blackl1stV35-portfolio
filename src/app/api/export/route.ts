import { NextRequest, NextResponse } from 'next/server'
import { buildPortfolioDOCX } from '@/lib/export'
import path from 'path'
import { readJSON } from '@/lib/cache'
import { execSync } from 'child_process'

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') ?? 'docx'

  // Get author name for filename
  let authorName = 'Portfolio'
  try {
    const a = await readJSON(path.join(process.cwd(), 'content', 'author.json')).catch(() => null)
    if (a) authorName = String(a.name ?? 'Portfolio').replace(/\s+/g, '_')
  } catch {}

  try {

    const docxBuffer = await buildPortfolioDOCX()

    if (format === 'docx') {
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
