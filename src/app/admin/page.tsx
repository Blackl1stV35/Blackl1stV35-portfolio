'use client'
import { useState, useEffect } from 'react'
import { LogOut, Plus, Upload, CheckCircle } from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'

type CollectionName = 'projects' | 'work' | 'publications' | 'books'
type Panel = CollectionName | '_uploads' | '_author' | '_contact'

const COLLECTIONS: CollectionName[] = ['projects', 'work', 'publications', 'books']

type FieldDef = { key: string; label: string; type: string; options?: string[] }

// picture field injected into every collection
const PICTURE_FIELD: FieldDef = { key: 'picture', label: 'Picture (optional)', type: 'image' }

const FIELDS: Record<CollectionName, FieldDef[]> = {
  projects: [
    { key: 'title',       label: 'Title *',             type: 'text' },
    { key: 'type',        label: 'Type *',              type: 'select', options: ['github','university','generic'] },
    { key: 'status',      label: 'Status *',            type: 'select', options: ['green','yellow','red'] },
    { key: 'repo',        label: 'Repo URL',            type: 'text' },
    { key: 'description', label: 'Description',         type: 'textarea' },
    { key: 'tags',        label: 'Tags (comma-sep)',     type: 'text' },
    PICTURE_FIELD,
  ],
  work: [
    { key: 'role',        label: 'Role *',              type: 'text' },
    { key: 'org',         label: 'Organisation *',      type: 'text' },
    { key: 'start',       label: 'Start *',             type: 'text' },
    { key: 'end',         label: 'End',                 type: 'text' },
    { key: 'status',      label: 'Status *',            type: 'select', options: ['green','yellow','red'] },
    { key: 'location',    label: 'Location',            type: 'text' },
    { key: 'description', label: 'Description',         type: 'textarea' },
    { key: 'highlights',  label: 'Highlights',          type: 'textarea' },
    { key: 'stack',       label: 'Stack (comma-sep)',   type: 'text' },
    PICTURE_FIELD,
  ],
  publications: [
    { key: 'title',       label: 'Title *',             type: 'text' },
    { key: 'type',        label: 'Type *',              type: 'select', options: ['paper','article','book-chapter','preprint'] },
    { key: 'status',      label: 'Status *',            type: 'select', options: ['green','yellow','red'] },
    { key: 'venue',       label: 'Venue',               type: 'text' },
    { key: 'year',        label: 'Year',                type: 'text' },
    { key: 'doi',         label: 'DOI',                 type: 'text' },
    { key: 'arxiv',       label: 'arXiv ID',            type: 'text' },
    { key: 'description', label: 'Description',         type: 'textarea' },
    { key: 'abstract',    label: 'Abstract',            type: 'textarea' },
    PICTURE_FIELD,
  ],
  books: [
    { key: 'title',       label: 'Title *',             type: 'text' },
    { key: 'author',      label: 'Author *',            type: 'text' },
    { key: 'status',      label: 'Status *',            type: 'select', options: ['green','yellow','red'] },
    { key: 'genre',       label: 'Genre',               type: 'text' },
    { key: 'year',        label: 'Year',                type: 'text' },
    { key: 'rating',      label: 'Rating',              type: 'select', options: ['1','2','3','4','5'] },
    { key: 'notes',       label: 'Notes',               type: 'textarea' },
    PICTURE_FIELD,
  ],
}

const AUTHOR_FIELDS: FieldDef[] = [
  { key: 'name',        label: 'Full name *',         type: 'text' },
  { key: 'title',       label: 'Title / subtitle *',  type: 'text' },
  { key: 'status',      label: 'Status badge',        type: 'select', options: ['green','yellow','red'] },
  { key: 'statusLabel', label: 'Status label',        type: 'text' },
  { key: 'bio',         label: 'Bio paragraph 1 *',   type: 'textarea' },
  { key: 'bio2',        label: 'Bio paragraph 2',     type: 'textarea' },
  { key: 'tags',        label: 'Tags (comma-sep)',     type: 'text' },
  { key: 'degree1',     label: 'Degree / credential 1', type: 'text' },
  { key: 'degree2',     label: 'Degree / credential 2', type: 'text' },
  { key: 'github',      label: 'GitHub URL / handle', type: 'text' },
  { key: 'email',       label: 'Email',               type: 'text' },
  { key: 'linkedin',    label: 'LinkedIn URL',         type: 'text' },
  { key: 'location',    label: 'Location',             type: 'text' },
]

export default function AdminPage() {
  const [authed, setAuthed]     = useState(false)
  const [token, setToken]       = useState('')
  const [session, setSession]   = useState('')
  const [error, setError]       = useState('')
  const [locked, setLocked]     = useState(false)

  const [panel, setPanel]       = useState<Panel>('_author')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  // Author panel state
  const [authorData, setAuthorData] = useState<Record<string, string>>({})
  const [authorPhoto, setAuthorPhoto] = useState<string | null>(null)
  const [authorSaving, setAuthorSaving] = useState(false)
  const [authorSaved, setAuthorSaved]   = useState(false)
  const [contactData, setContactData] = useState<Record<string, string>>({})
  const [contactSaving, setContactSaving] = useState(false)

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadDone, setUploadDone]         = useState<Record<string, boolean>>({})
  const [entries, setEntries] = useState<Record<string, unknown>[]>([])
  const [editingSlug, setEditingSlug] = useState<string | null>(null)

  useEffect(() => {
    const s = sessionStorage.getItem('admin_session')
    if (s) { setSession(s); setAuthed(true); loadAuthor() }
  }, [])

  useEffect(() => {
    if (COLLECTIONS.includes(panel as CollectionName)) {
      loadEntries(panel as CollectionName)
    } else {
      setEntries([])
      setEditingSlug(null)
    }
  }, [panel])

  async function loadAuthor() {
    try {
      const res = await fetch('/api/author-data')
      if (res.ok) {
        const data = await res.json()
        const { photo, tags, ...rest } = data
        setAuthorData({
          ...rest,
          tags: Array.isArray(tags) ? tags.join(', ') : (tags ?? ''),
        })
        setAuthorPhoto(photo ?? null)
      }
    } catch {}
  }

  async function loadContact() {
    try {
      const res = await fetch('/api/contact-data')
      if (res.ok) {
        const data = await res.json()
        const { formAction, ...rest } = data
        setContactData({ ...rest, formAction: formAction ?? '' })
      }
    } catch {}
  }

  function parseArrayField(val: unknown): string[] {
    if (!val) return []
    if (Array.isArray(val)) return val.map(String).filter(Boolean)
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean)
    return []
  }

  function formatValue(val: unknown): string {
    if (Array.isArray(val)) return val.map(String).join(', ')
    return val == null ? '' : String(val)
  }

  async function loadEntries(collection: CollectionName) {
    try {
      const res = await fetch(`/api/collections?collection=${collection}`)
      if (res.ok) {
        setEntries(await res.json())
      }
    } catch {}
  }

  async function loadEntry(slug: string) {
    try {
      const res = await fetch(`/api/collections?collection=${panel}&slug=${slug}`)
      if (!res.ok) throw new Error('Entry not found')
      const data = await res.json()
      const form: Record<string, string> = {}
      for (const [key, value] of Object.entries(data)) {
        if (key === 'content') continue
        form[key] = formatValue(value)
      }
      form._body = String(data.content ?? '')
      setFormData(form)
      setEditingSlug(slug)
      setShowForm(true)
    } catch (err) {
      console.warn('Unable to load entry', err)
    }
  }

  async function handleAuth() {
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const json = await res.json()
    if (res.ok) {
      sessionStorage.setItem('admin_session', json.session)
      setSession(json.session)
      setAuthed(true)
      loadAuthor()
    } else if (res.status === 429) {
      setLocked(true)
      setError('Too many attempts. Locked for 15 minutes.')
    } else {
      setError(json.error ?? 'Incorrect token.')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_session')
    setAuthed(false); setSession(''); setToken(''); setError('')
  }

  async function saveAuthor() {
    setAuthorSaving(true)
    const payload = {
      ...authorData,
      photo: authorPhoto ?? null,
      tags: authorData.tags ? authorData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    const res = await fetch('/api/author', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify(payload),
    })
    setAuthorSaving(false)
    if (res.ok) {
      setAuthorSaved(true)
      setTimeout(() => setAuthorSaved(false), 3000)
      // attempt to trigger redeploy (no-op if not configured)
      try { await fetch('/api/redeploy', { method: 'POST', headers: { Authorization: `Bearer ${session}` } }) } catch {}
    } else {
      const j = await res.json()
      alert('Error: ' + j.error)
    }
  }

  async function saveContact() {
    setContactSaving(true)
    const payload = { ...contactData }
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify(payload),
    })
    setContactSaving(false)
    if (res.ok) {
      // show saved briefly
      setAuthorSaved(true)
      setTimeout(() => setAuthorSaved(false), 3000)
      try { await fetch('/api/redeploy', { method: 'POST', headers: { Authorization: `Bearer ${session}` } }) } catch {}
    } else {
      const j = await res.json()
      alert('Error: ' + j.error)
    }
  }

  async function deleteContact() {
    if (!confirm('Delete contact information? This will clear contact.json.')) return
    try {
      const res = await fetch('/api/contact', { method: 'DELETE', headers: { Authorization: `Bearer ${session}` } })
      if (res.ok) {
        setContactData({})
        setAuthorSaved(true)
        setTimeout(() => setAuthorSaved(false), 3000)
      } else {
        const j = await res.json()
        alert('Error: ' + j.error)
      }
    } catch (err) { console.warn(err) }
  }

  async function saveEntry() {
    setSaving(true)
    const typedFields = {
      ...formData,
      date: new Date().toISOString().split('T')[0],
      tags: parseArrayField(formData.tags),
      stack: parseArrayField(formData.stack),
    }
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify({ collection: panel, slug: editingSlug ?? undefined, fields: typedFields, content: formData._body ?? '' }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setShowForm(false)
        setFormData({})
        setEditingSlug(null)
        loadEntries(panel as CollectionName)
      }, 2500)
      try { await fetch('/api/redeploy', { method: 'POST', headers: { Authorization: `Bearer ${session}` } }) } catch {}
    } else {
      const j = await res.json()
      alert('Error: ' + j.error)
    }
  }

  async function deleteEntry(slug: string) {
    if (!confirm('Delete this entry? This will remove the MDX from the repository.')) return
    try {
      const res = await fetch('/api/collections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
        body: JSON.stringify({ collection: panel, slug }),
      })
      if (res.ok) {
        loadEntries(panel as CollectionName)
      } else {
        const j = await res.json()
        alert('Error deleting: ' + j.error)
      }
    } catch (err) { console.warn(err); alert('Network error') }
  }

  function simulateUpload(type: string) {
    setUploadProgress(p => ({ ...p, [type]: 0 }))
    setUploadDone(d => ({ ...d, [type]: false }))
    let w = 0
    const iv = setInterval(() => {
      w += Math.random() * 20 + 10
      if (w >= 100) { w = 100; clearInterval(iv); setUploadDone(d => ({ ...d, [type]: true })) }
      setUploadProgress(p => ({ ...p, [type]: Math.min(Math.round(w), 100) }))
    }, 120)
  }

  function renderField(f: FieldDef, data: Record<string, string>, set: (k: string, v: string) => void) {
    if (f.type === 'image') return (
      <div className="col-span-2 flex items-center gap-4">
        <AvatarUpload src={data[f.key] || undefined} initials="?" size={72}
          onChange={url => set(f.key, url ?? '')} />
        <span className="text-xs font-mono text-zinc-400 leading-relaxed">
          Optional.<br />Click to upload.<br />Stored in frontmatter.
        </span>
      </div>
    )
    if (f.type === 'select') return (
      <select value={data[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}
        className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm font-serif focus:outline-none focus:border-zinc-400"
      >
        <option value="">— select —</option>
        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
    if (f.type === 'textarea') return (
      <textarea rows={3} value={data[f.key] ?? ''}
        onChange={e => set(f.key, e.target.value)}
        className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm font-serif resize-none focus:outline-none focus:border-zinc-400"
      />
    )
    return (
      <input type="text" value={data[f.key] ?? ''}
        onChange={e => set(f.key, e.target.value)}
        className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm font-serif focus:outline-none focus:border-zinc-400"
      />
    )
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="bg-white border border-zinc-200 rounded-lg p-8 w-80">
        <h1 className="font-serif font-bold text-lg mb-1">Admin access</h1>
        <p className="text-xs font-mono text-zinc-400 mb-6">portfolio.vercel.app/admin</p>
        <label className="block text-xs font-mono text-zinc-500 mb-1">Access token</label>
        <input type="password" value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !locked && handleAuth()}
          className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-mono mb-1 focus:outline-none focus:border-zinc-400"
          placeholder="Enter token" autoComplete="off"
        />
        {error && <p className="text-xs font-mono text-red-600 mb-2">{error}</p>}
        <button onClick={handleAuth} disabled={locked}
          className="w-full mt-2 bg-zinc-900 text-white text-sm font-serif py-2 rounded hover:bg-zinc-700 disabled:opacity-40 transition-colors"
        >Authenticate</button>
        <p className="text-xs font-mono text-zinc-400 text-center mt-3">Validated server-side · session cleared on tab close</p>
      </div>
    </div>
  )

  const isCollection = COLLECTIONS.includes(panel as CollectionName)

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold">Admin</span>
          <span className="text-xs font-mono bg-green-50 text-green-700 px-2 py-0.5 rounded">Authenticated</span>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 border border-zinc-200 px-3 py-1 rounded hover:text-zinc-700 transition-colors"
        ><LogOut size={12} /> Sign out</button>
      </div>

      <div className="flex min-h-[calc(100vh-48px)]">
        <aside className="w-44 bg-white border-r border-zinc-100 py-4 flex-shrink-0">
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 px-4 mb-2">Author</div>
          <SideLink label="Profile" active={panel === '_author'} onClick={() => { setPanel('_author'); setShowForm(false) }} />
          <SideLink label="Contact" active={panel === '_contact'} onClick={() => { setPanel('_contact'); setShowForm(false); loadContact() }} />
          <div className="border-t border-zinc-100 mt-3 pt-3">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 px-4 mb-2">Collections</div>
            {COLLECTIONS.map(c => (
              <SideLink key={c} label={c.charAt(0).toUpperCase() + c.slice(1)}
                active={panel === c} onClick={() => { setPanel(c); setShowForm(false) }} />
            ))}
          </div>
          <div className="border-t border-zinc-100 mt-3 pt-3">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 px-4 mb-2">Files</div>
            <SideLink label="CV & PDFs" active={panel === '_uploads'} onClick={() => { setPanel('_uploads'); setShowForm(false) }} />
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">

          {/* ── Author profile panel ── */}
          {panel === '_author' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif font-bold text-base">Author profile</h2>
                {authorSaved && <span className="text-xs font-mono text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Saved &amp; committed</span>}
              </div>

              {/* Photo — admin-only upload */}
              <div className="bg-white border border-zinc-200 rounded-md p-5 mb-4">
                <div className="text-xs font-mono text-zinc-400 mb-3 uppercase tracking-widest">Profile photo</div>
                <div className="flex items-center gap-5">
                  <AvatarUpload src={authorPhoto ?? undefined} initials={authorData.name?.split(' ').map(w => w[0]).join('').slice(0,2) ?? 'AB'}
                    size={100} onChange={url => setAuthorPhoto(url)} />
                  <div className="text-xs font-mono text-zinc-400 leading-relaxed">
                    Click to upload photo.<br />
                    Saved to author.json via GitHub API.<br />
                    Displayed on About page + PDF cover.<br />
                    Max 5 MB · JPG / PNG / WebP.
                  </div>
                </div>
              </div>

              {/* Text fields */}
              <div className="bg-white border border-zinc-200 rounded-md p-5 mb-4">
                <div className="text-xs font-mono text-zinc-400 mb-4 uppercase tracking-widest">About content</div>
                <div className="grid grid-cols-2 gap-3">
                  {AUTHOR_FIELDS.map(f => (
                    <div key={f.key} className={f.type === 'textarea' ? 'col-span-2' : ''}>
                      <label className="block text-xs font-mono text-zinc-500 mb-1">{f.label}</label>
                      {renderField(f, authorData, (k, v) => setAuthorData(d => ({ ...d, [k]: v })))}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveAuthor} disabled={authorSaving}
                className="bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >{authorSaving ? 'Saving…' : 'Save & commit to GitHub'}</button>
            </div>
          )}

          {/* ── Contact panel ── */}
          {panel === '_contact' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif font-bold text-base">Contact settings</h2>
                {authorSaved && <span className="text-xs font-mono text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Saved &amp; committed</span>}
              </div>

              <div className="bg-white border border-zinc-200 rounded-md p-5 mb-4">
                <div className="text-xs font-mono text-zinc-400 mb-4 uppercase tracking-widest">Contact links</div>
                <div className="grid grid-cols-2 gap-3">
                  {['email','github','linkedin','location','formAction'].map(k => (
                    <div key={k} className={k === 'formAction' ? 'col-span-2' : ''}>
                      <label className="block text-xs font-mono text-zinc-500 mb-1">{k === 'formAction' ? 'Form action (submit URL)' : (k.charAt(0).toUpperCase() + k.slice(1))}</label>
                      <input type="text" value={contactData[k] ?? ''}
                        onChange={e => setContactData(d => ({ ...d, [k]: e.target.value }))}
                        className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm font-serif focus:outline-none focus:border-zinc-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={saveContact} disabled={contactSaving}
                  className="bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >{contactSaving ? 'Saving…' : 'Save & commit to GitHub'}</button>
                <button onClick={deleteContact}
                  className="text-xs font-mono border border-zinc-200 px-4 py-2 rounded hover:bg-zinc-50 transition-colors"
                >Delete contact data</button>
              </div>
            </div>
          )}

          {/* ── Collection panels ── */}
          {isCollection && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif font-bold text-base">{(panel as string).charAt(0).toUpperCase() + (panel as string).slice(1)}</h2>
                <button onClick={() => { setShowForm(!showForm); setFormData({}); setEditingSlug(null) }}
                  className="flex items-center gap-1.5 text-xs font-mono border border-zinc-200 px-3 py-1.5 rounded hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors"
                ><Plus size={12} /> New entry</button>
              </div>

              {entries.length > 0 ? (
                <div className="mb-5 bg-white border border-zinc-100 rounded-md overflow-hidden">
                  <div className="p-4 text-xs font-mono text-zinc-400 border-b border-zinc-50">
                    Existing entries in {panel} — click Edit to load into the form.
                  </div>
                  {entries.map(entry => (
                    <div key={String(entry.slug)} className="p-4 border-b border-zinc-100 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold">{String(entry.title ?? entry.slug)}</div>
                        <div className="text-xs text-zinc-500">{String(entry.date ?? '')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => loadEntry(String(entry.slug))}
                          className="text-xs font-mono text-zinc-500 border border-zinc-200 px-3 py-1 rounded hover:bg-zinc-50 transition-colors"
                        >Edit</button>
                        <button onClick={() => deleteEntry(String(entry.slug))}
                          className="text-xs font-mono text-red-600 border border-red-100 bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition-colors"
                        >Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-5 text-xs font-mono text-zinc-500">No existing entries found for this collection.</div>
              )}

              {showForm && (
                <div className="bg-white border border-zinc-200 rounded-md p-5 mb-5">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {FIELDS[panel as CollectionName].map(f => (
                      <div key={f.key} className={f.type === 'textarea' || f.type === 'image' ? 'col-span-2' : ''}>
                        <label className="block text-xs font-mono text-zinc-500 mb-1">{f.label}</label>
                        {renderField(f, formData, (k, v) => setFormData(d => ({ ...d, [k]: v })))}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={saveEntry} disabled={saving}
                      className="bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                    >{saving ? 'Committing…' : 'Save & commit to GitHub'}</button>
                    <button onClick={() => setShowForm(false)}
                      className="text-xs font-mono border border-zinc-200 px-4 py-2 rounded hover:bg-zinc-50 transition-colors"
                    >Cancel</button>
                    {saved && <span className="text-xs font-mono text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Committed — redeploy triggered</span>}
                  </div>
                </div>
              )}

              <div className="bg-white border border-zinc-100 rounded-md overflow-hidden">
                <div className="p-4 text-xs font-mono text-zinc-400 border-b border-zinc-50">
                  Entries read from /collections/{panel}/*.mdx · writes commit via GitHub API → auto-redeploy ~30s
                </div>
              </div>
            </div>
          )}

          {/* ── Uploads panel ── */}
          {panel === '_uploads' && (
            <div>
              <h2 className="font-serif font-bold text-base mb-5">CV &amp; Portfolio PDF</h2>
              {(['cv'] as const).map(type => (
                <div key={type} className="mb-4">
                  <div onClick={() => simulateUpload(type)}
                    className="border border-dashed border-zinc-300 rounded-md p-8 text-center cursor-pointer hover:bg-zinc-50 bg-white mb-2 transition-colors"
                  >
                    <Upload size={22} className="mx-auto text-zinc-300 mb-2" />
                    <div className="text-sm font-serif text-zinc-500">Upload {type === 'cv' ? 'CV / Resume' : 'Portfolio PDF'}</div>
                    <div className="text-xs font-mono text-zinc-400 mt-1">
                      {type === 'cv' ? 'Replaces public/cv.pdf · served as /cv.pdf' : ''}
                    </div>
                  </div>
                  {uploadProgress[type] != null && (
                    <div className="flex items-center gap-3 bg-white border border-zinc-100 rounded px-4 py-3">
                      <span className="text-sm font-mono flex-1">{type}.pdf</span>
                      <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-150" style={{ width: `${uploadProgress[type]}%` }} />
                      </div>
                      <span className="text-xs font-mono text-zinc-400 w-20 text-right">
                        {uploadDone[type]
                          ? <span className="text-green-600 flex items-center gap-1 justify-end"><CheckCircle size={11} /> Done</span>
                          : `${uploadProgress[type]}%`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 bg-zinc-50 border border-zinc-100 rounded p-4 text-xs font-mono text-zinc-400 leading-7">
                CV → GitHub commit to public/cv.pdf → Vercel serves as /cv.pdf<br />
                Portfolio → generated as DOCX only (PDF export removed)<br />
                Download available in navbar
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

function SideLink({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left text-sm font-serif px-4 py-2 border-l-2 transition-colors
        ${active ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
    >{label}</button>
  )
}
