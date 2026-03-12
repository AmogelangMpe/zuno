'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Props = { dealId: string; profileId: string; currency: string }

export default function DealApplyForm({ dealId, profileId, currency }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [pitch, setPitch]   = useState('')
  const [rate, setRate]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!pitch.trim()) { toast.error('Please write a pitch'); return }
    setLoading(true)

    const { error } = await supabase.from('deal_applications').insert({
      deal_id:    dealId,
      profile_id: profileId,
      pitch,
      rate:       rate ? Math.round(parseFloat(rate) * 100) : null,
    })

    if (error) {
      toast.error(error.message)
    } else {
      // Increment application count
      await supabase.rpc('increment_applications', { deal_id: dealId })
      toast.success('Application sent!')
      router.push('/deals')
    }
    setLoading(false)
  }

  return (
    <div className="card p-6 flex flex-col gap-5">
      <h2 className="font-medium">Your application</h2>

      <div>
        <label className="text-sm text-zuno-muted mb-2 block">
          Your pitch <span className="text-red-400">*</span>
        </label>
        <textarea
          className="input resize-none h-36"
          placeholder="Tell the brand why you're a great fit. Mention your audience, engagement rate, and any relevant past work…"
          value={pitch}
          onChange={e => setPitch(e.target.value)}
          maxLength={1000}
        />
        <p className="text-xs text-zuno-muted mt-1 text-right">{pitch.length}/1000</p>
      </div>

      <div>
        <label className="text-sm text-zuno-muted mb-2 block">
          Your rate ({currency}) <span className="text-zuno-muted text-xs">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zuno-muted">R</span>
          <input
            className="input pl-8"
            type="number"
            placeholder="5000"
            value={rate}
            onChange={e => setRate(e.target.value)}
            min="0"
          />
        </div>
        <p className="text-xs text-zuno-muted mt-1">Leave blank to negotiate directly with the brand</p>
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={loading || !pitch.trim()}>
        {loading ? 'Submitting…' : 'Submit application'}
      </button>
    </div>
  )
}
