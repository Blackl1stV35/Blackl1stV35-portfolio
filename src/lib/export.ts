// src/lib/export.ts — server-side only
import fs from 'fs'
import path from 'path'
import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, AlignmentType, BorderStyle, WidthType,
  Header, Footer, PageNumber, NumberFormat,
} from 'docx'
import { getCollection } from './collections'
import { readJSON } from './cache'
import type { WorkEntry, ProjectEntry, PublicationEntry } from '@/types'

// ── Colours ───────────────────────────────────────────────────────────────
const BLACK  = '0A0A0A'
const MID    = '52525B'
const MUTED  = 'A1A1AA'
const LINE   = 'E4E4E7'
const GREEN  = '16A34A'
const YELLOW = 'CA8A04'
const RED    = 'DC2626'

// ── Helpers ───────────────────────────────────────────────────────────────
// MDX frontmatter tags/stack may arrive as a comma-string or real array
function toArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String).filter(Boolean)
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

const run = (text: string, opts: Partial<{ bold: boolean; italic: boolean; size: number; color: string; font: string }> = {}) =>
  new TextRun({ text, bold: opts.bold ?? false, italics: opts.italic ?? false, size: opts.size ?? 22, color: opts.color ?? BLACK, font: opts.font ?? 'Times New Roman' })

const mono = (text: string, size = 18, color = MUTED) =>
  new TextRun({ text, size, color, font: 'Courier New' })

function hr(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 1 } },
    spacing: { after: 120 },
    children: [],
  })
}

function sectionHeading(label: string): Paragraph {
  return new Paragraph({
    children: [mono(label.toUpperCase(), 16, MUTED)],
    spacing: { before: 320, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE, space: 1 } },
  })
}

function statusLabel(status: string, variant: 'project' | 'work' | 'pub' = 'project'): string {
  const map: Record<string, Record<string, string>> = {
    project: { green: 'Active', yellow: 'In Progress', red: 'Archived' },
    work:    { green: 'Current', yellow: 'Part-time',  red: 'Closed'   },
    pub:     { green: 'Published', yellow: 'Under Review', red: 'Retracted' },
  }
  return map[variant]?.[status] ?? status
}

function statusColor(status: string): string {
  return status === 'green' ? GREEN : status === 'yellow' ? YELLOW : RED
}

function makeFooter(name: string): Footer {
  return new Footer({
    children: [new Paragraph({
      children: [
        mono(`${name} — Portfolio    `, 16, MUTED),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED, font: 'Courier New' }),
        mono(' / ', 16, MUTED),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED, font: 'Courier New' }),
      ],
      alignment: AlignmentType.RIGHT,
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: LINE, space: 1 } },
      spacing: { before: 80 },
    })],
  })
}

// ── Sections ──────────────────────────────────────────────────────────────
function coverSection(a: Record<string, unknown>, footer: Footer) {
  const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  return {
    properties: { page: { pageNumbers: { formatType: NumberFormat.DECIMAL } } },
    footers: { default: footer },
    children: [
      new Paragraph({ spacing: { before: 3200, after: 0 }, children: [] }),
      new Paragraph({ children: [run(String(a.name ?? ''), { bold: true, size: 64 })], spacing: { after: 80 } }),
      new Paragraph({ children: [run(String(a.title ?? ''), { size: 26, color: MID })], spacing: { after: 200 } }),
      hr(),
      ...(['degree1','degree2','github','email'] as const)
        .filter(k => !!a[k])
        .map(k => new Paragraph({ children: [mono(String(a[k]), 18, MUTED)], spacing: { after: 40 } })),
      new Paragraph({ children: [mono(`Generated ${date}`, 18, MUTED)], spacing: { before: 160 } }),
    ],
  }
}

function overviewSection(a: Record<string, unknown>, footer: Footer) {
  const tags = toArray(a.tags)
  return {
    properties: {},
    footers: { default: footer },
    children: [
      sectionHeading('About'),
      new Paragraph({ children: [run(String(a.bio ?? ''), { size: 22, color: MID })], spacing: { after: 160 }, alignment: AlignmentType.JUSTIFIED }),
      ...(a.bio2 ? [new Paragraph({ children: [run(String(a.bio2), { size: 22, color: MID })], spacing: { after: 160 }, alignment: AlignmentType.JUSTIFIED })] : []),
      ...(tags.length ? [new Paragraph({ children: tags.map((tag, i) => mono(`${tag}${i < tags.length - 1 ? '  ·  ' : ''}`, 18, MUTED)), spacing: { before: 80 } })] : []),
    ],
  }
}

function workSection(entries: WorkEntry[], footer: Footer) {
  const children: Paragraph[] = [sectionHeading('Work Experience')]
  for (const e of entries) {
    const stack = toArray(e.stack)
    children.push(
      new Paragraph({ children: [mono(String(e.org ?? ''), 17, MUTED)], spacing: { before: 240, after: 0 } }),
      new Paragraph({ children: [run(String(e.role ?? ''), { bold: true, size: 26 })], spacing: { after: 40 } }),
      new Paragraph({
        children: [
          mono(`${e.start ?? ''} — ${e.end ?? 'Present'}`, 17, MUTED),
          ...(e.location ? [mono(`  ·  ${e.location}`, 17, MUTED)] : []),
          mono('   ', 17),
          new TextRun({ text: ` ${statusLabel(e.status, 'work')} `, size: 16, bold: true, color: statusColor(e.status), font: 'Courier New' }),
        ],
        spacing: { after: 80 },
      }),
      ...(e.description ? [new Paragraph({ children: [run(String(e.description), { size: 20, color: MID })], spacing: { after: 60 }, alignment: AlignmentType.JUSTIFIED })] : []),
      ...(e.highlights  ? [new Paragraph({ children: [run(String(e.highlights), { size: 20, color: MID })], spacing: { after: 60 }, alignment: AlignmentType.JUSTIFIED })] : []),
      ...(stack.length  ? [new Paragraph({ children: stack.map((s, i) => mono(`${s}${i < stack.length - 1 ? '  ' : ''}`, 17, MUTED)) })] : []),
    )
  }
  return { properties: {}, footers: { default: footer }, children }
}

function projectsSection(entries: ProjectEntry[], footer: Footer) {
  const children: Paragraph[] = [sectionHeading('Projects')]
  for (const e of entries) {
    const tags = toArray(e.tags)
    children.push(
      new Paragraph({
        children: [
          run(String(e.title ?? ''), { bold: true, size: 24 }),
          mono('   '),
          new TextRun({ text: ` ${statusLabel(e.status)} `, size: 16, bold: true, color: statusColor(e.status), font: 'Courier New' }),
        ],
        spacing: { before: 200, after: 40 },
      }),
      new Paragraph({
        children: [
          mono(String(e.type ?? ''), 17, MUTED),
          ...(e.repo   ? [mono(`  ·  ${e.repo}`, 17, MUTED)] : []),
          ...(e.stars != null ? [mono(`  ·  ★ ${e.stars}`, 17, MUTED)] : []),
        ],
        spacing: { after: 60 },
      }),
      ...(e.description ? [new Paragraph({ children: [run(String(e.description), { size: 20, color: MID })], spacing: { after: 60 }, alignment: AlignmentType.JUSTIFIED })] : []),
      ...(tags.length   ? [new Paragraph({ children: tags.map((tg, i) => mono(`${tg}${i < tags.length - 1 ? '  ' : ''}`, 17, MUTED)) })] : []),
    )
  }
  return { properties: {}, footers: { default: footer }, children }
}

function publicationsSection(entries: PublicationEntry[], footer: Footer) {
  const children: Paragraph[] = [sectionHeading('Publications')]
  for (const e of entries) {
    children.push(
      new Paragraph({
        children: [
          run(String(e.title ?? ''), { bold: true, size: 24 }),
          mono('   '),
          new TextRun({ text: ` ${statusLabel(e.status, 'pub')} `, size: 16, bold: true, color: statusColor(e.status), font: 'Courier New' }),
        ],
        spacing: { before: 200, after: 40 },
      }),
      new Paragraph({
        children: [
          mono(String(e.type ?? ''), 17, MUTED),
          ...(e.venue ? [mono(`  ·  ${e.venue}`, 17, MUTED)] : []),
          ...(e.year  ? [mono(`  ·  ${e.year}`,  17, MUTED)] : []),
          ...(e.doi   ? [mono(`  ·  doi:${e.doi}`, 17, MUTED)] : []),
          ...(e.arxiv ? [mono(`  ·  arXiv:${e.arxiv}`, 17, MUTED)] : []),
        ],
        spacing: { after: 60 },
      }),
      ...(e.description ? [new Paragraph({ children: [run(String(e.description), { size: 20, color: MID })], spacing: { after: 60 }, alignment: AlignmentType.JUSTIFIED })] : []),
    )
  }
  return { properties: {}, footers: { default: footer }, children }
}

function contactSection(a: Record<string, unknown>, footer: Footer) {
  const fields: [string, string][] = [
    a.email   ? ['Email',    String(a.email)]   : null,
    a.github  ? ['GitHub',   String(a.github)]  : null,
  ].filter(Boolean) as [string, string][]
  return {
    properties: {},
    footers: { default: footer },
    children: [
      sectionHeading('Contact'),
      ...fields.map(([label, val]) =>
        new Paragraph({ children: [mono(`${label.padEnd(12)}`, 18, MUTED), run(val, { size: 20 })], spacing: { after: 80 } })
      ),
    ],
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
export async function buildPortfolioDOCX(): Promise<Buffer> {
  const author: Record<string, unknown> = await (async () => {
    try {
      return await readJSON(path.join(process.cwd(), 'content', 'author.json'))
    } catch {
      return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'author.json'), 'utf-8'))
    }
  })()
  const name = String(author?.name ?? 'Portfolio')
  const footer = makeFooter(name)

  const work         = await getCollection<WorkEntry>('work')
  const projects     = await getCollection<ProjectEntry>('projects')
  const publications = await getCollection<PublicationEntry>('publications')

  const doc = new Document({
    creator: name,
    title:   `${name} — Portfolio`,
    styles:  { default: { document: { run: { font: 'Times New Roman', size: 22, color: BLACK } } } },
    sections: [
      coverSection(author, footer),
      overviewSection(author, footer),
      ...(work.length         ? [workSection(work, footer)]               : []),
      ...(projects.length     ? [projectsSection(projects, footer)]       : []),
      ...(publications.length ? [publicationsSection(publications, footer)]: []),
      contactSection(author, footer),
    ],
  })

  return Packer.toBuffer(doc) as Promise<Buffer>
}
