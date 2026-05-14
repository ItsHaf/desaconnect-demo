import { useState, useMemo } from 'react'
import { useData } from './DataProvider'

interface Props {
  villageId: number
  villageName: string
  className?: string
  style?: React.CSSProperties
}

const COLORS = [
  '#5b8c3e', '#7a6b3a', '#4a6e2e', '#3d5e28', '#6a8e4e',
  '#8a7b4a', '#5a7a3a', '#7a5c3e', '#6b5a3e', '#8b6914',
  '#9e8c5a', '#5e4a2e', '#b07aa1', '#7a9e4a', '#c9a84c',
  '#6e9e8e', '#4a5e6e', '#8b7355', '#6e4a3a', '#a86e5a',
  '#8e6b4a', '#4a8e8e', '#5a4a3e', '#7a6a5a', '#3a7a3a',
  '#7a8a3a', '#9e5a6e', '#6a5a8e', '#5a8a6a', '#5e3a2a',
]

function makeFallbackSvg(id: number, name: string): string {
  const color = COLORS[(id - 1) % COLORS.length]
  const short = name.replace('Desa Wisata ', '')
  const text = short.length > 16 ? short.substring(0, 14) + '...' : short
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300">
      <defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${color}cc"/>
      </linearGradient></defs>
      <rect width="600" height="300" fill="url(#g${id})"/>
      <rect x="20" y="20" width="560" height="260" rx="12" fill="rgba(255,255,255,0.12)"/>
      <text x="300" y="135" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="22" font-weight="700" fill="white">${text}</text>
      <text x="300" y="168" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="13" fill="rgba(255,255,255,0.7)">Kabupaten Sleman, Yogyakarta</text>
    </svg>`
  )}`
}

export default function ResponsiveImage({ villageId, villageName, className, style }: Props) {
  const { villages } = useData()
  const village = villages.find((v) => v.id === villageId)
  const fallback = useMemo(() => makeFallbackSvg(villageId, villageName), [villageId, villageName])
  const realSrc = village?.image || fallback
  const [failedId, setFailedId] = useState<number | null>(null)
  const src = failedId === villageId ? fallback : realSrc

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      <img
        src={src}
        alt={villageName}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setFailedId(villageId)}
      />
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function makeThumbSvg(seed: string): string {
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const color = COLORS[hash % COLORS.length]
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150">
      <rect width="200" height="150" fill="${color}"/>
      <text x="100" y="80" text-anchor="middle" font-family="sans-serif" font-size="12" fill="rgba(255,255,255,0.6)">+ Foto Baru</text>
    </svg>`
  )}`
}
