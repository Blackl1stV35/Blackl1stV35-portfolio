import StatusBadge from '@/components/StatusBadge'

export default function AboutPage() {
  return (
    <div>
      <div className="section-label">Author</div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-8 items-start">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-1">Alexander Bowen</h1>
          <p className="text-sm text-zinc-500 mb-3">Software Engineer · Researcher · Writer</p>
          <StatusBadge status="green" className="mb-4" />
          <p className="text-sm leading-relaxed text-zinc-600 mb-3">
            I build systems at the intersection of distributed computing and human-centered design.
            Currently pursuing research in applied machine learning. Previously worked across fintech and healthtech.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600">
            I believe good software is indistinguishable from good writing — precise, purposeful, and kind to its reader.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Python','TypeScript','Distributed Systems','ML','Bangkok, TH'].map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="w-40 h-40 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-4xl text-zinc-400 font-serif">
            AB
          </div>
          <div className="mt-3 text-xs font-mono text-zinc-400 leading-7">
            <div>MSc Computer Science</div>
            <div>BSc Mathematics</div>
            <div className="mt-2">github.com/yourusername</div>
            <div>you@example.com</div>
          </div>
        </div>
      </div>
    </div>
  )
}
