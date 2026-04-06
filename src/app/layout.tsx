import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'ZunoBio — Your Personal Link Page',
  description: 'Create your beautiful personal link page in minutes.',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#f8f7f5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans bg-zuno-bg text-zuno-text antialiased">
        {children}
        <Analytics />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a1917',
              color: '#f8f7f5',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'var(--font-dm-sans)',
            },
          }}
        />
      </body>
    </html>
  )
}
