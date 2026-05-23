'use client'
import { useState, useEffect } from 'react'
import { LogOut, Plus, Trash2, Edit, Upload, CheckCircle } from 'lucide-react'

type CollectionName = 'projects' | 'work' | 'publications' | 'books'

const COLLECTIONS: CollectionName[] = ['projects', 'work', 'publications', 'books']

const FIELDS: Record<CollectionName, { key: string; label: string; type: string; options?: string[] }[]> = {
  projects: [
    { key: 'title',       label: 'Title *',   type: 'text' },
    { key: 'type',        label: 'Type *',    type: 'select', options: ['github','university','generic'] },
    { key: 'status',      label: 'Status *',  type: 'select', options: ['green','yellow','red'] },
    { key: 'repo',        label: 'Repo URL',  type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'tags',        label: 'Tags (comma-sep)', type: 'text' },
  ],
  work: [
    { key: 'role',        label: 'Role *',        type: 'text' },
    { key: 'org',         label: 'Organisation *', type: 'text' },
    { key: 'start',       label: 'Start *',       type: 'text' },
    { key: 'end',         label: 'End',           type: 'text' },
    { key: 'status',      label: 'Status *',      type: 'select', options: ['green','yellow','red'] },
    { key: 'location',    label: 'Location',      type: 'text' },
    { key: 'description', label: 'Description',   type: 'textarea' },
    { key: 'highlights',  label: 'Highlights',    type: 'textarea' },
    { key: 'stack',       label: 'Stack (comma-sep)', type: 'text' },
  ],
  publications: [
    { key: 'title',       label: 'Title *',   type: 'text' },
    { key: 'type',        label: 'Type *',    type: 'select', options: ['paper','article','book-chapter','preprint'] },
    { key: 'status',      label: 'Status *',  type: 'select', options: ['green','yellow','red'] },
    { key: 'venue',       label: 'Venue',     type: 'text' },
    { key: 'year',        label: 'Year',      type: 'text' },
    { key: 'doi',         label: 'DOI',       type: 'text' },
    { key: 'arxiv',       label: 'arXiv ID',  type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'abstract',    label: 'Abstract',  type: 'textarea' },
  ],
  books: [
    { key: 'title',       label: 'Title *',   type: 'text' },
    { key: 'author',      label: 'Author *',  type: 'text' },
    { key: 'status',      label: 'Status *',  type: 'select', options: ['green','yellow','red'] },
    { key: 'genre',       label: 'Genre',     type: 'text' },
    { key: 'year',        label: 'Year',      type: 'text' },
    { key: 'rating',      label: 'Rating',    type: 'select', options: ['1','2','3','4','5'] },
    { key: 'notes',       label: 'Notes',     type: 'textarea' },
  ],
}

export default function AdminPage() {
  const [authed, setAuthed]       = useState(false)
  const [token, setToken]         = useState('')
  const [session, setSession]     = useState('')
  const [error, setError]         = useState('')
  const [remaining, setRemaining] = useState(5)
  const [locked, setLocked]       = useState(false)

  const [activeCol, setActiveCol] = useState<CollectionName>('projects')
  const [showForm, setShowForm]   = useState(false)
  const [formData, setFormData]   = useState<Record<string, string>>({})
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadDone, setUploadDone]         = useState<Record<string, boolean>>({})

  useEffect(() => {
    const s = sessionStorage.getItem('admin_session')
    if (s) { setSession(s); setAuthed(true) }
  }, [])

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
    } else if (res.status === 429) {
      setLocked(true)
      setError('Too many attempts. Locked for 15 minutes.')
    } else {
      setRemaining(json.remaining ?? remaining - 1)
      setError(`Incorrect token. ${json.remaining ?? ''} attempt${json.remaining === 1 ? '' : 's'} remaining.`)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_session')
    setAuthed(false); setSession(''); setToken('')
  }

  async function handleSave() {
    setSaving(true)
    const fields = { ...formData, date: new Date().toISOString().split('T')[0] }
    const title = formData.title ?? formData.role ?? 'untitled'
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify({ collection: activeCol, fields, content: formData._body ?? '' }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => { setSaved(false); setShowForm(false); setFormData({}) }, 2500)
    } else {
      const j = await res.json()
      alert('Error: ' + j.error)
    }
  }

  async function simulateUpload(type: 'cv' | 'portfolio') {
    setUploadProgress(p => ({ ...p, [type]: 0 }))
    setUploadDone(d => ({ ...d, [type]: false }))
    let w = 0
    const iv = setInterval(() => {
      w += Math.random() * 20 + 10
      if (w >= 100) { w = 100; clearInterval(iv); setUploadDone(d => ({ ...d, [type]: true })) }
      setUploadProgress(p => ({ ...p, [type]: Math.min(Math.round(w), 100) }))
    }, 120)
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="bg-white border border-zinc-200 rounded-lg p-8 w-80">
        <h1 className="font-serif font-bold text-lg mb-1">Admin access</h1>
        <p className="text-xs font-mono text-zinc-400 mb-6">portfolio.vercel.app/admin</p>
        <label className="block text-xs font-mono text-zinc-500 mb-1">Access token</label>
        <input
          type="password" value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !locked && handleAuth()}
          className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-mono mb-1 focus:outline-none focus:border-zinc-400"
          placeholder="Enter token" autoComplete="off"
        />
        {error && <p className="text-xs font-mono text-red-600 mb-2">{error}</p>}
        <button
          onClick={handleAuth} disabled={locked}
          className="w-full mt-2 bg-zinc-900 text-white text-sm font-serif py-2 rounded hover:bg-zinc-700 transition-colors disabled:opacity-40"
        >
          Authenticate
        </button>
        <p className="text-xs font-mono text-zinc-400 text-center mt-3">Token validated server-side · session cleared on tab close</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Admin nav */}
      <div className="bg-white border-b border-zinc-200 px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold">Admin</span>
          <span className="text-xs font-mono bg-green-50 text-green-700 px-2 py-0.5 rounded">Authenticated</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 border border-zinc-200 px-3 py-1 rounded hover:text-zinc-700 transition-colors">
          <LogOut size={12} /> Sign out
        </button>
      </div>

      <div className="flex min-h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <aside className="w-44 bg-white border-r border-zinc-100 py-4 flex-shrink-0">
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 px-4 mb-2">Collections</div>
          {COLLECTIONS.map(c => (
            <button
              key={c} onClick={() => { setActiveCol(c); setShowForm(false) }}
              className={`w-full text-left text-sm font-serif px-4 py-2 border-l-2 transition-colors
                ${activeCol === c ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
          <div className="border-t border-zinc-100 mt-3 pt-3">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 px-4 mb-2">Files</div>
            <button
              onClick={() => { setActiveCol('_uploads' as CollectionName); setShowForm(false) }}
              className={`w-full text-left text-sm font-serif px-4 py-2 border-l-2 transition-colors
                ${(activeCol as string) === '_uploads' ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
            >
              CV &amp; PDFs
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          {(activeCol as string) === '_uploads' ? (
            <div>
              <h2 className="font-serif font-bold text-base mb-5">CV &amp; Portfolio PDF</h2>
              {(['cv', 'portfolio'] as const).map(type => (
                <div key={type} className="mb-4">
                  <div
                    onClick={() => simulateUpload(type)}
                    className="border border-dashed border-zinc-300 rounded-md p-8 text-center cursor-pointer hover:bg-zinc-50 transition-colors bg-white mb-2"
                  >
                    <Upload size={24} className="mx-auto text-zinc-300 mb-2" />
                    <div className="text-sm font-serif text-zinc-500">Upload {type === 'cv' ? 'CV / Resume' : 'Portfolio PDF'}</div>
                    <div className="text-xs font-mono text-zinc-400 mt-1">
                      {type === 'cv' ? 'Replaces /public/cv.pdf · served as static download' : 'Vercel Blob · instant CDN URL'}
                    </div>
                  </div>
                  {uploadProgress[type] != null && (
                    <div className="flex items-center gap-3 bg-white border border-zinc-100 rounded-md px-4 py-3">
                      <span className="text-sm font-mono flex-1">{type}.pdf</span>
                      <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${uploadProgress[type]}%` }} />
                      </div>
                      <span className="text-xs font-mono text-zinc-400 w-16 text-right">
                        {uploadDone[type] ? <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Done</span> : `${uploadProgress[type]}%`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 bg-zinc-50 border border-zinc-100 rounded-md p-4 text-xs font-mono text-zinc-400 leading-6">
                CV → GitHub commit to /public/cv.pdf → Vercel serves as /cv.pdf<br />
                Portfolio → Vercel Blob upload → instant CDN URL → linked from download button
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif font-bold text-base">{activeCol.charAt(0).toUpperCase() + activeCol.slice(1)}</h2>
                <button
                  onClick={() => { setShowForm(!showForm); setFormData({}) }}
                  className="flex items-center gap-1.5 text-xs font-mono border border-zinc-200 px-3 py-1.5 rounded hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors"
                >
                  <Plus size={12} /> New entry
                </button>
              </div>

              {showForm && (
                <div className="bg-white border border-zinc-200 rounded-md p-5 mb-5">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {FIELDS[activeCol].map(f => (
                      <div key={f.key} className={f.type === 'textarea' ? 'col-span-2' : ''}>
                        <label className="block text-xs font-mono text-zinc-500 mb-1">{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            value={formData[f.key] ?? ''}
                            onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                            className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm font-serif focus:outline-none focus:border-zinc-400"
                          >
                            <option value="">— select —</option>
                            {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : f.type === 'textarea' ? (
                          <textarea
                            rows={3} value={formData[f.key] ?? ''}
                            onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                            className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm font-serif resize-none focus:outline-none focus:border-zinc-400"
                          />
                        ) : (
                          <input
                            type="text" value={formData[f.key] ?? ''}
                            onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                            className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm font-serif focus:outline-none focus:border-zinc-400"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave} disabled={saving}
                      className="bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Committing…' : 'Save & commit to GitHub'}
                    </button>
                    <button onClick={() => setShowForm(false)} className="text-xs font-mono border border-zinc-200 px-4 py-2 rounded hover:bg-zinc-50">
                      Cancel
                    </button>
                    {saved && <span className="text-xs font-mono text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Committed — redeploy triggered</span>}
                  </div>
                </div>
              )}

              <div className="bg-white border border-zinc-100 rounded-md overflow-hidden">
                <div className="p-4 border-b border-zinc-50 text-xs font-mono text-zinc-400">
                  Entries are read from /collections/{activeCol}/*.mdx · edits commit via GitHub API
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
