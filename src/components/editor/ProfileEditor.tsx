'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Cropper from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { getPublicUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

type Props = {
  profile: Profile
  onSave: (updates: Partial<Profile>) => Promise<void>
}

type CropArea = { x: number; y: number; width: number; height: number }
type CropTarget = 'avatar' | 'cover' | null

// Convert crop area to a blob using canvas
async function getCroppedBlob(imageSrc: string, cropArea: CropArea): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = cropArea.width
  canvas.height = cropArea.height
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    cropArea.x, cropArea.y,
    cropArea.width, cropArea.height,
    0, 0,
    cropArea.width, cropArea.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/jpeg', 0.92)
  })
}

export default function ProfileEditor({ profile, onSave }: Props) {
  const supabase = createClient()

  // Text fields
  const [name, setName]         = useState(profile.display_name)
  const [bio, setBio]           = useState(profile.bio ?? '')
  const [username, setUsername] = useState(profile.username)

  // Cropper state
  const [cropTarget, setCropTarget]     = useState<CropTarget>(null)
  const [rawImageSrc, setRawImageSrc]   = useState<string | null>(null)
  const [crop, setCrop]                 = useState({ x: 0, y: 0 })
  const [zoom, setZoom]                 = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [uploading, setUploading]       = useState(false)

  const coverRef  = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  // When user picks a file, open the cropper instead of uploading immediately
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, target: CropTarget) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setRawImageSrc(reader.result as string)
      setCropTarget(target)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const onCropComplete = useCallback((_: any, pixels: CropArea) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleCropConfirm() {
    if (!rawImageSrc || !croppedAreaPixels || !cropTarget) return
    setUploading(true)

    try {
      const blob = await getCroppedBlob(rawImageSrc, croppedAreaPixels)
      const ext  = 'jpg'
      const path = `${profile.id}/${Date.now()}.${ext}`
      const bucket = cropTarget === 'avatar' ? 'avatars' : 'covers'

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

      if (error) {
        toast.error('Upload failed: ' + error.message)
        return
      }

      await onSave(cropTarget === 'avatar' ? { avatar_url: path } : { cover_url: path })
      toast.success(cropTarget === 'avatar' ? 'Profile photo updated!' : 'Cover photo updated!')
      setCropTarget(null)
      setRawImageSrc(null)
    } catch (err: any) {
      toast.error('Something went wrong: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    setCropTarget(null)
    setRawImageSrc(null)
  }

  async function handleSave() {
    await onSave({ display_name: name, bio, username })
  }

  const coverUrl  = getPublicUrl(profile.cover_url, 'covers')
  const avatarUrl = getPublicUrl(profile.avatar_url, 'avatars')

  // ── Cropper modal ──────────────────────────────────────────
  if (cropTarget && rawImageSrc) {
    const isAvatar = cropTarget === 'avatar'
    return (
      <div className="flex flex-col gap-4 py-4">
        <h2 className="font-medium">
          {isAvatar ? 'Adjust profile photo' : 'Adjust cover photo'}
        </h2>
        <p className="text-xs text-zuno-muted">
          Drag to reposition · Pinch or scroll to zoom
        </p>

        {/* Crop canvas */}
        <div
          className="relative w-full rounded-2xl overflow-hidden bg-black"
          style={{ height: isAvatar ? 300 : 450 }}
        >
          <Cropper
            image={rawImageSrc}
            crop={crop}
            zoom={zoom}
            aspect={isAvatar ? 1 : 4 / 3}
            cropShape={isAvatar ? 'round' : 'rect'}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zuno-muted w-6">–</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-zuno-text"
          />
          <span className="text-xs text-zuno-muted w-6">+</span>
        </div>

        <div className="flex gap-2">
          <button
            className="btn-primary flex-1"
            onClick={handleCropConfirm}
            disabled={uploading}
          >
            {uploading ? 'Saving…' : 'Save photo'}
          </button>
          <button
            className="btn-secondary flex-1"
            onClick={handleCropCancel}
            disabled={uploading}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Normal editor ──────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 py-4">
      <h2 className="font-medium">Profile</h2>

      {/* Cover photo */}
      <div>
        <label className="text-sm text-zuno-muted mb-2 block">Cover photo</label>
        <div
          onClick={() => coverRef.current?.click()}
          className="relative w-full h-36 rounded-2xl overflow-hidden bg-zuno-card border border-zuno-border cursor-pointer hover:opacity-90 transition-opacity"
        >
          {coverUrl ? (
            <Image src={coverUrl} alt="Cover" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-zuno-muted">
              + Add cover photo
            </div>
          )}
          {coverUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
              <span className="text-white text-sm font-medium">Change photo</span>
            </div>
          )}
        </div>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFileSelect(e, 'cover')}
        />
      </div>

      {/* Avatar */}
      <div>
        <label className="text-sm text-zuno-muted mb-2 block">Profile photo</label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => avatarRef.current?.click()}
            className="relative w-16 h-16 rounded-full overflow-hidden bg-zuno-card border border-zuno-border cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-zuno-muted">+</div>
            )}
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            className="btn-secondary text-sm py-2"
          >
            Upload photo
          </button>
        </div>
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFileSelect(e, 'avatar')}
        />
      </div>

      {/* Display name */}
      <div>
        <label className="text-sm text-zuno-muted mb-2 block">Display name</label>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name or brand"
        />
      </div>

      {/* Username */}
      <div>
        <label className="text-sm text-zuno-muted mb-2 block">Username</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zuno-muted">
            zuno.app/
          </span>
          <input
            className="input pl-[4.5rem]"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            placeholder="username"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="text-sm text-zuno-muted mb-2 block">Bio</label>
        <textarea
          className="input resize-none h-24"
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="A short description about you…"
          maxLength={160}
        />
        <p className="text-xs text-zuno-muted mt-1 text-right">{bio.length}/160</p>
      </div>

      <button className="btn-primary" onClick={handleSave}>
        Save changes
      </button>
    </div>
  )
}
