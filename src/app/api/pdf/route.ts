import { NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import React from 'react'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { getCollection } from '@/lib/collections'
import { PortfolioPDF } from '@/lib/pdf'
import type { WorkEntry, ProjectEntry, PublicationEntry } from '@/types'

// Collect a Node.js ReadableStream into a Buffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function GET() {
  try {
    const authorFile = path.join(process.cwd(), 'content', 'author.json')
    const author = JSON.parse(fs.readFileSync(authorFile, 'utf-8'))

    const work         = getCollection<WorkEntry>('work')
    const projects     = getCollection<ProjectEntry>('projects')
    const publications = getCollection<PublicationEntry>('publications')

    // v4 API: pdf(element).toBuffer() → ReadableStream
    const element = React.createElement(PortfolioPDF, { author, work, projects, publications })
    const instance = pdf(element as React.ReactElement)
    const readableStream = await instance.toBuffer()
    const buffer = await streamToBuffer(readableStream as unknown as NodeJS.ReadableStream)

    const filename = `${(author.name as string).replace(/\s+/g, '_')}_Portfolio.pdf`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PDF route]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
