/**
 * collections.config.js
 * Master schema for all content collections.
 * Add or remove fields here — the admin UI and templates reflect changes automatically.
 */

const STATUS = {
  green:  { label: 'Active',       variants: ['active', 'published', 'current', 'read'] },
  yellow: { label: 'In Progress',  variants: ['in-progress', 'under-review', 'ongoing', 'reading'] },
  red:    { label: 'Archived',     variants: ['archived', 'discontinued', 'retracted', 'interested'] },
}

const GLOBAL_FIELDS = [
  { key: 'title',       type: 'text',     required: true  },
  { key: 'description', type: 'textarea', required: false },
  { key: 'tags',        type: 'tags',     required: false },
  { key: 'links',       type: 'links',    required: false },
  { key: 'picture',     type: 'image',    required: false },
  { key: 'status',      type: 'status',   required: true, options: Object.keys(STATUS) },
  { key: 'date',        type: 'date',     required: false },
]

const COLLECTIONS = {
  projects: {
    label: 'Projects',
    icon: 'Code',
    fields: [
      ...GLOBAL_FIELDS,
      { key: 'type',        type: 'select',   required: true,  options: ['github', 'university', 'generic'] },
      { key: 'repo',        type: 'text',     required: false, placeholder: 'https://github.com/…' },
      { key: 'stars',       type: 'number',   required: false },
      { key: 'forks',       type: 'number',   required: false },
      { key: 'university',  type: 'text',     required: false },
      { key: 'coauthors',   type: 'text',     required: false },
      { key: 'demo',        type: 'text',     required: false, placeholder: 'https://…' },
    ],
  },

  work: {
    label: 'Work Experience',
    icon: 'Briefcase',
    fields: [
      ...GLOBAL_FIELDS,
      { key: 'role',        type: 'text',     required: true  },
      { key: 'org',         type: 'text',     required: true  },
      { key: 'location',    type: 'text',     required: false },
      { key: 'start',       type: 'text',     required: true,  placeholder: 'Jan 2023' },
      { key: 'end',         type: 'text',     required: false, placeholder: 'Present' },
      { key: 'stack',       type: 'tags',     required: false },
      { key: 'highlights',  type: 'textarea', required: false },
    ],
  },

  publications: {
    label: 'Publications',
    icon: 'FileText',
    fields: [
      ...GLOBAL_FIELDS,
      { key: 'type',        type: 'select',   required: true, options: ['paper', 'article', 'book-chapter', 'preprint'] },
      { key: 'venue',       type: 'text',     required: false },
      { key: 'year',        type: 'text',     required: false },
      { key: 'doi',         type: 'text',     required: false },
      { key: 'arxiv',       type: 'text',     required: false },
      { key: 'citations',   type: 'number',   required: false },
      { key: 'coauthors',   type: 'text',     required: false },
      { key: 'abstract',    type: 'textarea', required: false },
    ],
  },

  books: {
    label: 'Books',
    icon: 'Book',
    fields: [
      ...GLOBAL_FIELDS,
      { key: 'author',      type: 'text',     required: true  },
      { key: 'genre',       type: 'text',     required: false },
      { key: 'year',        type: 'text',     required: false },
      { key: 'rating',      type: 'select',   required: false, options: ['1','2','3','4','5'] },
      { key: 'notes',       type: 'textarea', required: false },
      { key: 'cover',       type: 'image',    required: false },
    ],
  },
}

module.exports = { COLLECTIONS, GLOBAL_FIELDS, STATUS }
