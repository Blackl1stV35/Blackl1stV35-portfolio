import { NextRequest, NextResponse } from 'next/server'
import { buildPortfolioDOCX } from '@/lib/export'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') ?? 'docx'

  // Get author name for filename
  let authorName = 'Portfolio'
  try {
    const a = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'author.json'), 'utf-8'))
    authorName = String(a.name ?? 'Portfolio').replace(/\s+/g, '_')
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

    // PDF: write DOCX to tmp, convert via LibreOffice, return PDF
    if (format === 'pdf') {
      const tmp   = path.join('/tmp', `portfolio_${Date.now()}`)
      const docxPath = `${tmp}.docx`
      const pdfPath  = `${tmp}.pdf`
      fs.writeFileSync(docxPath, docxBuffer)

      try {
        // Try LibreOffice (available on most Linux servers including Vercel)
        execSync(`libreoffice --headless --convert-to pdf --outdir /tmp "${docxPath}"`, { timeout: 30000 })
        const pdfBuf = fs.readFileSync(pdfPath)
        fs.unlinkSync(docxPath)
        fs.unlinkSync(pdfPath)
        return new NextResponse(pdfBuf as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${authorName}_Portfolio.pdf"`,
            'Cache-Control': 'no-store',
          },
        })
      } catch {
        // LibreOffice not available — return DOCX with a note
        fs.unlinkSync(docxPath)
        return new NextResponse(docxBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${authorName}_Portfolio.docx"`,
            'Content-Note': 'PDF conversion unavailable on this server; returning DOCX instead',
            'Cache-Control': 'no-store',
          },
        })
      }
    }

    return NextResponse.json({ error: 'format must be docx or pdf' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[export]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
