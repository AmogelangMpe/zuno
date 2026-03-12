import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ image: null })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Zuno/1.0; +https://zuno.app)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return NextResponse.json({ image: null })

    const html = await res.text()

    // Try og:image first, then twitter:image, then first <img> as fallback
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        // Resolve relative URLs
        const imageUrl = match[1].startsWith('http')
          ? match[1]
          : new URL(match[1], url).href
        return NextResponse.json({ image: imageUrl })
      }
    }

    return NextResponse.json({ image: null })
  } catch (e) {
    return NextResponse.json({ image: null })
  }
}