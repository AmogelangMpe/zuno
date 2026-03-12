import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zuno-bg">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zuno-border bg-zuno-surface">
        <span className="font-serif italic text-xl">Zuno</span>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-zuno-text hover:text-zuno-accent transition-colors">
            Log in
          </Link>
          <Link href="/auth/signup" className="btn-primary">
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Create your <span className="text-zuno-accent">link in bio</span> page
        </h1>
        <p className="text-xl text-zuno-muted mb-8 max-w-2xl mx-auto">
          Share all your important links in one beautiful, customizable page.
          Connect with your audience and grow your online presence.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
            Get started for free
          </Link>
          <Link href="/auth/login" className="btn-secondary text-lg px-8 py-3">
            Log in
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-zuno-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Fully Customizable</h3>
            <p className="text-zuno-muted">
              Choose from beautiful themes and customize every aspect of your page.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-zuno-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Mobile Optimized</h3>
            <p className="text-zuno-muted">
              Your page looks perfect on all devices, from phones to desktops.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-zuno-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics</h3>
            <p className="text-zuno-muted">
              Track your page views and link clicks to understand your audience.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zuno-border bg-zuno-surface">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-zuno-muted">
            © 2024 Zuno. Built with Next.js and Supabase.
          </p>
        </div>
      </footer>
    </main>
  )
}
