// src/lib/pdf.tsx
// Server-side only — called from /api/pdf route
import React from 'react'
import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from '@react-pdf/renderer'
import type { WorkEntry, ProjectEntry, PublicationEntry } from '@/types'

// ── Styles ────────────────────────────────────────────────────────────────
const C = {
  black:  '#0a0a0a',
  mid:    '#52525b',
  muted:  '#a1a1aa',
  line:   '#e4e4e7',
  green:  '#16a34a',
  yellow: '#ca8a04',
  red:    '#dc2626',
  greenBg:'#dcfce7',
  yellowBg:'#fef9c3',
  redBg:  '#fee2e2',
}

const s = StyleSheet.create({
  page:       { fontFamily: 'Times-Roman', padding: 48, backgroundColor: '#fff', fontSize: 10, color: C.black },
  coverPage:  { fontFamily: 'Times-Roman', padding: 64, backgroundColor: '#fff', justifyContent: 'flex-end' },

  // Cover
  coverPhoto: { width: 88, height: 88, borderRadius: 4, marginBottom: 32 },
  coverName:  { fontSize: 32, fontFamily: 'Times-Bold', marginBottom: 6, color: C.black },
  coverTitle: { fontSize: 13, color: C.mid, marginBottom: 8 },
  coverMeta:  { fontSize: 9, fontFamily: 'Courier', color: C.muted, marginBottom: 4 },
  coverDate:  { fontSize: 9, fontFamily: 'Courier', color: C.muted, marginTop: 32 },

  // Section header
  sectionLabel: { fontSize: 8, fontFamily: 'Courier', color: C.muted, textTransform: 'uppercase',
    letterSpacing: 1.5, borderBottomWidth: 0.5, borderBottomColor: C.line, paddingBottom: 4, marginBottom: 14 },

  // Overview page
  overviewBio:  { fontSize: 11, lineHeight: 1.7, color: C.mid, marginBottom: 10 },
  tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  tag:          { fontSize: 8, fontFamily: 'Courier', color: C.mid, borderWidth: 0.5,
    borderColor: C.line, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },

  // Timeline (work)
  tlItem:       { marginBottom: 18, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: C.line },
  tlOrg:        { fontSize: 8, fontFamily: 'Courier', color: C.muted, marginBottom: 1 },
  tlRole:       { fontSize: 12, fontFamily: 'Times-Bold', marginBottom: 2 },
  tlDate:       { fontSize: 8, fontFamily: 'Courier', color: C.muted, marginBottom: 4 },
  tlDesc:       { fontSize: 10, lineHeight: 1.6, color: C.mid },

  // Cards (projects, publications)
  card:         { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: C.line },
  cardTitle:    { fontSize: 11, fontFamily: 'Times-Bold', marginBottom: 2 },
  cardMeta:     { fontSize: 8, fontFamily: 'Courier', color: C.muted, marginBottom: 4 },
  cardDesc:     { fontSize: 10, lineHeight: 1.6, color: C.mid },
  cardTagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 5 },

  // Status badge
  badge:        { flexDirection: 'row', alignItems: 'center', borderRadius: 3,
    paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeDot:     { width: 5, height: 5, borderRadius: 5, marginRight: 3 },
  badgeText:    { fontSize: 7, fontFamily: 'Courier', fontWeight: 'bold' },

  // Page number footer
  footer:       { position: 'absolute', bottom: 28, left: 48, right: 48,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:   { fontSize: 8, fontFamily: 'Courier', color: C.muted },
  footerLine:   { borderTopWidth: 0.5, borderTopColor: C.line, marginBottom: 6 },
})

// ── Helpers ───────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; dot: string; text: string; label: string }> = {
    green:  { bg: C.greenBg,  dot: C.green,  text: C.green,  label: 'Active'      },
    yellow: { bg: C.yellowBg, dot: C.yellow, text: C.yellow, label: 'In Progress' },
    red:    { bg: C.redBg,    dot: C.red,    text: C.red,    label: 'Archived'    },
  }
  const c = cfg[status] ?? cfg.green
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <View style={[s.badgeDot, { backgroundColor: c.dot }]} />
      <Text style={[s.badgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  )
}

function Footer({ name }: { name: string }) {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerLine} />
      <Text style={s.footerText}>{name} — Portfolio</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

// ── Document ──────────────────────────────────────────────────────────────
interface Props {
  author: {
    name: string; title: string; bio: string; bio2?: string
    tags?: string[]; degree1?: string; degree2?: string
    github?: string; email?: string; photo?: string | null
    statusLabel?: string
  }
  work:         WorkEntry[]
  projects:     ProjectEntry[]
  publications: PublicationEntry[]
}

export function PortfolioPDF({ author, work, projects, publications }: Props) {
  const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Document title={`${author.name} — Portfolio`} author={author.name}>

      {/* ── Cover ── */}
      <Page size="A4" style={s.coverPage}>
        {author.photo && (
          <Image src={author.photo} style={s.coverPhoto} />
        )}
        <Text style={s.coverName}>{author.name}</Text>
        <Text style={s.coverTitle}>{author.title}</Text>
        {author.degree1 && <Text style={s.coverMeta}>{author.degree1}</Text>}
        {author.degree2 && <Text style={s.coverMeta}>{author.degree2}</Text>}
        {author.email   && <Text style={s.coverMeta}>{author.email}</Text>}
        {author.github  && <Text style={s.coverMeta}>{author.github}</Text>}
        <Text style={s.coverDate}>Generated {date}</Text>
      </Page>

      {/* ── Overview — bio + tags ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>About</Text>
        <Text style={s.overviewBio}>{author.bio}</Text>
        {author.bio2 && <Text style={s.overviewBio}>{author.bio2}</Text>}
        {author.tags && author.tags.length > 0 && (
          <View style={s.tagRow}>
            {author.tags.map(t => <Text key={t} style={s.tag}>{t}</Text>)}
          </View>
        )}
        <Footer name={author.name} />
      </Page>

      {/* ── Work experience ── */}
      {work.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionLabel}>Work Experience</Text>
          {work.map(e => (
            <View key={e.slug} style={s.tlItem}>
              <Text style={s.tlOrg}>{e.org}</Text>
              <Text style={s.tlRole}>{e.role}</Text>
              <Text style={s.tlDate}>{e.start} — {e.end ?? 'Present'}{e.location ? `  ·  ${e.location}` : ''}</Text>
              {e.description && <Text style={s.tlDesc}>{e.description}</Text>}
              {e.highlights   && <Text style={[s.tlDesc, { marginTop: 3 }]}>{e.highlights}</Text>}
            </View>
          ))}
          <Footer name={author.name} />
        </Page>
      )}

      {/* ── Projects ── */}
      {projects.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionLabel}>Projects</Text>
          {projects.map(e => (
            <View key={e.slug} style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <Text style={s.cardTitle}>{e.title}</Text>
                <Badge status={e.status} />
              </View>
              <Text style={s.cardMeta}>{e.type}{e.repo ? `  ·  ${e.repo}` : ''}{e.stars != null ? `  ·  ★ ${e.stars}` : ''}</Text>
              {e.description && <Text style={s.cardDesc}>{e.description}</Text>}
              {e.tags && e.tags.length > 0 && (
                <View style={s.cardTagRow}>
                  {e.tags.map(t => <Text key={t} style={s.tag}>{t}</Text>)}
                </View>
              )}
            </View>
          ))}
          <Footer name={author.name} />
        </Page>
      )}

      {/* ── Publications ── */}
      {publications.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionLabel}>Publications</Text>
          {publications.map(e => (
            <View key={e.slug} style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <Text style={[s.cardTitle, { flex: 1, marginRight: 8 }]}>{e.title}</Text>
                <Badge status={e.status} />
              </View>
              <Text style={s.cardMeta}>
                {e.type}{e.venue ? `  ·  ${e.venue}` : ''}{e.year ? `  ·  ${e.year}` : ''}
                {e.doi ? `  ·  doi:${e.doi}` : ''}{e.arxiv ? `  ·  arXiv:${e.arxiv}` : ''}
              </Text>
              {e.description && <Text style={s.cardDesc}>{e.description}</Text>}
            </View>
          ))}
          <Footer name={author.name} />
        </Page>
      )}

    </Document>
  )
}
