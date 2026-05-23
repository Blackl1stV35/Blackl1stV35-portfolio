import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import fs from 'fs'
import path from 'path'
import { getCollection } from '@/lib/collections'
import { PortfolioPDF } from '@/lib/pdf'
import type { WorkEntry, ProjectEntry, PublicationEntry } from '@/types'

export async function GET() {
  const authorFile = path.join(process.cwd(), 'content', 'author.json')
  const author = JSON.parse(fs.readFileSync(authorFile, 'utf-8'))

  const work         = getCollection<WorkEntry>('work')
  const projects     = getCollection<ProjectEntry>('projects')
  const publications = getCollection<PublicationEntry>('publications')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = React.createElement(PortfolioPDF as any, { author, work, projects, publications })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await (renderToBuffer as any)(el)

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(author.name as string).replace(/\s+/g,'_')}_Portfolio.pdf"`,
    },
  })
}
