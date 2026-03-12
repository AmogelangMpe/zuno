'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const PLATFORMS = ['Instagram','TikTok','YouTube','Facebook','Twitter/X']
const NICHES    = ['Fashion','Beauty','Lifestyle','Tech','Food','Fitness','Travel','Finance','Entertainment']

export default function PostDealForm({ brandId }: { brandId: string }) {
  const supabase = createClient()
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [budgetMin, setBudgetMin]       = useState('')
  const [budgetMax, setBudgetMax]       = useState('')
  const [minFollowers, setMinFollowers] = useState('')
  const [deadline, setDeadline]         = useState('')
  const [platforms, setPlatforms]       = useState<string[]>([])
  const [niches, setNiches]             = useState<string[]>([])
  const [loading, setLoading]           = useState(false)
  const [open, setOpen]                 = useState(false)

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  async function handleSubmit() {
    if (!title || !description || !deliverables) {
      toast.error('Please fill in title, description and deliverables')
      return
    }
    setLoading(true)

    const { error } = await supabase.from('deals').insert({
      brand_id:       brandId,
      title,
      description,
      deliverables,
      budget_min:     budgetMin  ? Math.round(parseFloat(budgetMin)  * 100) : null,
      budget_max:     budgetMax  ? Math.round(parseFloat(budgetMax)  * 100) : null,
      min_followers:  minFollowers ? parseInt(minFollowers) : null,
      deadline:       deadline || null,
      platforms:      platforms.map(p => p.toLowerCase().replace('/','_')),
      niche:          niches.map(n => n.toLowerCase()),
      currency:       'ZAR',
    })

    if (error) { toast.error(error.message) }
    else {
      toast.success('Deal posted!')
      setTitle(''); setDescription(''); setDeliverables('')
      setBudgetMin(''); setBudgetMax(''); setMinFollowers('')
      setDeadline(''); setPlatforms([]); setNiches([])
      setOpen(false)
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button className="btn-secondary w-full" onClick={() => setOpen(true)}>
        + Post a new deal
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <input className="input" placeholder="Deal title *" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="input resize-none h-24" placeholder="Description — what is this campaign about? *" value={description} onChange={e => setDescription(e.target.value)} />
      <textarea className="input resize-none h-24" placeholder="Deliverables — what must the creator produce? *" value={deliverables} onChange={e => setDeliverables(e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zuno-muted">R</span>
          <input className="input pl-8" type="number" placeholder="Budget min" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zuno-muted">R</span>
          <input className="input pl-8" type="number" placeholder="Budget max" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
        </div>
      </div>

      <input className="input" type="number" placeholder="Min followers required (optional)" value={minFollowers} onChange={e => setMinFollowers(e.target.value)} />
      <input className="input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />

      <div>
        <p className="text-sm text-zuno-muted mb-2">Platforms</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatforms(toggle(platforms, p))}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${platforms.includes(p) ? 'bg-zuno-text text-zuno-bg border-zuno-text' : 'border-zuno-border hover:border-zuno-accent'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-zuno-muted mb-2">Niche</p>
        <div className="flex flex-wrap gap-2">
          {NICHES.map(n => (
            <button key={n} onClick={() => setNiches(toggle(niches, n))}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${niches.includes(n) ? 'bg-zuno-text text-zuno-bg border-zuno-text' : 'border-zuno-border hover:border-zuno-accent'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Posting…' : 'Post deal'}
        </button>
        <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  )
}
