export type StatusColor = 'green' | 'yellow' | 'red'

export interface BaseEntry {
  slug: string
  title: string
  description?: string
  tags?: string[]
  links?: { label: string; url: string }[]
  picture?: string
  status: StatusColor
  date?: string
  content: string
}

export interface ProjectEntry extends BaseEntry {
  type: 'github' | 'university' | 'generic'
  repo?: string
  stars?: number
  forks?: number
  university?: string
  coauthors?: string
  demo?: string
}

export interface WorkEntry extends BaseEntry {
  role: string
  org: string
  location?: string
  start: string
  end?: string
  stack?: string[]
  highlights?: string
}

export interface PublicationEntry extends BaseEntry {
  type: 'paper' | 'article' | 'book-chapter' | 'preprint'
  venue?: string
  year?: string
  doi?: string
  arxiv?: string
  citations?: number
  coauthors?: string
  abstract?: string
}

export interface BookEntry extends BaseEntry {
  author: string
  genre?: string
  year?: string
  rating?: string
  notes?: string
  cover?: string
}

export type CollectionEntry = ProjectEntry | WorkEntry | PublicationEntry | BookEntry
export type CollectionName = 'projects' | 'work' | 'publications' | 'books'
