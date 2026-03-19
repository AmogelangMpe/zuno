'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/extended'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

type Props = {
  profileId: string
  products:  Product[]
  canSell:   boolean
}

export default function ProductManager({ profileId, products: initial, canSell }: Props) {
  const supabase = createClient()
  const [products, setProducts] = useState(initial)
  const [adding, setAdding]     = useState(false)

  async function addProduct(data: Partial<Product>, file?: File, cover?: File) {
    const id = uuidv4()
    let filePath:  string | null = null
    let coverUrl:  string | null = null

    if (file) {
      const ext  = file.name.split('.').pop()
      filePath   = `${profileId}/${id}.${ext}`
      await supabase.storage.from('products-private').upload(filePath, file)
    }

    if (cover) {
      const ext  = cover.name.split('.').pop()
      const path = `${profileId}/${id}-cover.${ext}`
      await supabase.storage.from('product-covers').upload(path, cover)
      const { data: pub } = supabase.storage.from('product-covers').getPublicUrl(path)
      coverUrl = pub.publicUrl
    }

    const newProduct: any = {
      id,
      profile_id:  profileId,
      title:       data.title,
      description: data.description || '',
      price:       Math.round((data.price as number) * 100),
      currency:    'ZAR',
      file_path:   filePath,
      cover_url:   coverUrl,
      is_published: false,
    }

    const { error } = await supabase.from('products').insert(newProduct)
    if (error) { toast.error(error.message); return }

    setProducts(prev => [{ ...newProduct, sales_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev])
    setAdding(false)
    toast.success('Product created!')
  }

  async function togglePublish(id: string, current: boolean) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_published: !current } : p))
    await supabase.from('products').update({ is_published: !current }).eq('id', id)
    toast.success(!current ? 'Product published!' : 'Product unpublished')
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setProducts(prev => prev.filter(p => p.id !== id))
    await supabase.from('products').delete().eq('id', id)
    toast.success('Deleted')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">Your products</h2>
        <button className="btn-primary text-sm py-2" onClick={() => setAdding(true)}>
          + Add product
        </button>
      </div>

      {adding && <AddProductForm onSave={addProduct} onCancel={() => setAdding(false)} />}

      {products.length === 0 && !adding && (
        <div className="card p-8 text-center">
          <p className="font-medium mb-1">No products yet</p>
          <p className="text-sm text-zuno-muted">Add your first digital product to start selling</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {products.map(product => (
          <div key={product.id} className="card p-5">
            <div className="flex gap-4">
              {product.cover_url ? (
                <img src={product.cover_url} alt={product.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zuno-card flex-shrink-0 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{product.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${product.is_published ? 'bg-green-50 text-green-700' : 'bg-zuno-card text-zuno-muted'}`}>
                    {product.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm font-medium mb-2">R{(product.price / 100).toLocaleString()}</p>
                <p className="text-xs text-zuno-muted">{product.sales_count} sales</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => togglePublish(product.id, product.is_published)}
                disabled={!canSell && !product.is_published}
                className="btn-secondary text-xs py-1.5 flex-1"
              >
                {product.is_published ? 'Unpublish' : canSell ? 'Publish' : 'Set up Stripe to publish'}
              </button>
              <button onClick={() => deleteProduct(product.id)} className="btn-ghost text-xs py-1.5 text-red-500">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddProductForm({ onSave, onCancel }: { onSave: (d: any, f?: File, c?: File) => void; onCancel: () => void }) {
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [price, setPrice]       = useState('')
  const [file, setFile]         = useState<File>()
  const [cover, setCover]       = useState<File>()
  const fileRef  = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  return (
    <div className="card p-5 mb-4 flex flex-col gap-4">
      <h3 className="font-medium">New product</h3>
      <input className="input" placeholder="Product title *" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="input resize-none h-20" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zuno-muted">R</span>
        <input className="input pl-8" type="number" placeholder="Price *" value={price} onChange={e => setPrice(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => fileRef.current?.click()} className="btn-secondary text-sm py-2.5">
          {file ? `✓ ${file.name.slice(0,20)}…` : '+ Upload file'}
        </button>
        <button onClick={() => coverRef.current?.click()} className="btn-secondary text-sm py-2.5">
          {cover ? `✓ Cover set` : '+ Cover image'}
        </button>
      </div>
      <input ref={fileRef}  type="file" className="hidden" onChange={e => setFile(e.target.files?.[0])} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => setCover(e.target.files?.[0])} />

      <div className="flex gap-3">
        <button className="btn-primary flex-1" onClick={() => onSave({ title, description: desc, price: parseFloat(price) }, file, cover)} disabled={!title || !price}>
          Save product
        </button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
