'use client'

import { useState } from 'react'
import type { Profile } from '@/types'

const PRESETS = [
  { name: 'Soft White',  bg: '#f8f7f5', surface: '#ffffff', text: '#1a1917', accent: '#c4b8a8' },
  { name: 'Warm Cream',  bg: '#fdf6ec', surface: '#fffdf7', text: '#2a1f0e', accent: '#d4a96a' },
  { name: 'Cool Slate',  bg: '#f0f4f8', surface: '#ffffff', text: '#1e293b', accent: '#94a3b8' },
  { name: 'Midnight',    bg: '#0f0f0f', surface: '#1a1a1a', text: '#f5f5f5', accent: '#888888' },
  { name: 'Dusty Rose',  bg: '#fdf4f4', surface: '#fff8f8', text: '#2d1a1a', accent: '#d4a0a0' },
  { name: 'Forest',      bg: '#f2f5f0', surface: '#ffffff', text: '#1a2a1a', accent: '#7a9a6a' },
]

type Props = {
  profile: Profile
  onSave:  (updates: Partial<Profile>) => Promise<void>
}

export default function ThemeEditor({ profile, onSave }: Props) {
  const [bg,      setBg]      = useState(profile.theme_bg)
  const [surface, setSurface] = useState(profile.theme_surface)
  const [text,    setText]    = useState(profile.theme_text)
  const [accent,  setAccent]  = useState(profile.theme_accent)

  async function applyPreset(preset: typeof PRESETS[0]) {
    setBg(preset.bg); setSurface(preset.surface)
    setText(preset.text); setAccent(preset.accent)
    await onSave({ theme_bg: preset.bg, theme_surface: preset.surface, theme_text: preset.text, theme_accent: preset.accent })
  }

  async function handleSave() {
    await onSave({ theme_bg: bg, theme_surface: surface, theme_text: text, theme_accent: accent })
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <h2 className="font-medium">Theme</h2>

      {/* Presets */}
      <div>
        <p className="text-sm text-zuno-muted mb-3">Presets</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-zuno-border hover:border-zuno-accent transition-colors"
            >
              {/* Mini preview swatch */}
              <div className="w-full h-10 rounded-lg flex items-center justify-center" style={{ background: p.bg }}>
                <div className="w-6 h-6 rounded-md" style={{ background: p.surface, border: `2px solid ${p.accent}` }} />
              </div>
              <span className="text-xs" style={{ color: p.text }}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colours */}
      <div>
        <p className="text-sm text-zuno-muted mb-3">Custom colours</p>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Background', value: bg,      set: setBg      },
            { label: 'Surface',    value: surface,  set: setSurface },
            { label: 'Text',       value: text,     set: setText    },
            { label: 'Accent',     value: accent,   set: setAccent  },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3">
              <input
                type="color"
                value={c.value}
                onChange={e => c.set(e.target.value)}
                className="w-10 h-10 rounded-xl border border-zuno-border cursor-pointer bg-transparent"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-zuno-muted">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave}>Apply theme</button>
    </div>
  )
}
