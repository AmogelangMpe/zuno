'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function BuyButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleBuy() {
    setLoading(true)
    try {
      const res = await fetch('/api/products/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Something went wrong')
        setLoading(false)
      }
    } catch {
      toast.error('Could not start checkout')
      setLoading(false)
    }
  }

  return (
    <button className="btn-primary w-full text-base py-4" onClick={handleBuy} disabled={loading}>
      {loading ? 'Redirecting to checkout…' : 'Buy now →'}
    </button>
  )
}
