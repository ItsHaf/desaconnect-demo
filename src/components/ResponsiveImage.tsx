import { useEffect, useMemo, useState } from 'react'
import { useLang } from './LangProvider'
import { useVillages } from './VillagesProvider'

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

const IMAGE_ALT_COPY: Record<number, { id: string; en: string }> = {
  1: {
    id: 'Air terjun dengan pengunjung berdiri di tepinya, dikelilingi pepohonan hijau dan jembatan logam.',
    en: 'A waterfall with visitors at its edge, surrounded by green trees and a metal bridge.',
  },
  2: {
    id: 'Wanita tersenyum di samping sepeda fat-tire merah di jalan setapak, dengan sawah hijau di belakangnya.',
    en: 'A smiling woman beside a red fat-tire bicycle on a dirt path, with green rice paddies behind.',
  },
  3: {
    id: 'Wanita berjongkok di antara dua pohon salak berbuah lebat dengan tandan salak merah besar.',
    en: 'A woman kneels between two snakefruit palms bearing large clusters of bright red fruit.',
  },
  4: {
    id: 'Pemandangan udara pulau kecil berpasir putih di tengah laut biru toska jernih dengan perahu di dekatnya.',
    en: 'Aerial view of a small white-sand island surrounded by clear turquoise water with boats nearby.',
  },
  5: {
    id: 'Kelompok berbaju putih menyeimbangkan di atas balok kayu di atas air, dikelilingi rumput hijau.',
    en: 'A group in white shirts balances on wooden logs over calm water, surrounded by green grass.',
  },
  6: {
    id: 'Taman tropis dengan jalan setapak batu, kolam bermancuran, dan bangunan beratap ijuk di antara pohon palem.',
    en: 'A tropical garden with a stone path, fountain pond, and thatched-roof buildings among palm trees.',
  },
  7: {
    id: 'Papan nama hijau "DESWITADAYA GAMOL" dengan ilustrasi ternak, di lingkungan desa tropis rimbun.',
    en: 'A green "DESWITADAYA GAMOL" signboard with livestock illustrations in a lush tropical village.',
  },
  8: {
    id: 'Danau kawah tenang memantulkan langit senja jingga dan merah muda, dikelilingi perbukitan.',
    en: 'A crater lake reflects a sunset sky of orange and pink, surrounded by rolling green hills.',
  },
  9: {
    id: 'Workshop topeng kayu dengan topeng putih ukiran di atas terpal biru, pengrajin bekerja di bangunan tradisional.',
    en: 'A mask workshop with white carved masks on a blue tarp, artisans working in a traditional wooden building.',
  },
  10: {
    id: 'Desa tradisional dengan gubuk beratap ijuk kerucut di lereng bukit hijau, orang berkumpul di lapangan rumput.',
    en: 'A traditional village with conical thatched-roof huts on a green hillside, people gathered in the grassy area.',
  },
  11: {
    id: 'Lima orang menanam padi di sawah tergenang, dengan rumah tradisional dan pohon kelapa di latar belakang.',
    en: 'Five people planting rice in a flooded paddy, with traditional houses and palm trees in the background.',
  },
  12: {
    id: 'Mata air alami dikelilingi jalur batu dan paviliun beratap ijuk, di tengah hutan hijau lebat.',
    en: 'A natural spring surrounded by stone paths and thatched-roof pavilions in dense green forest.',
  },
  13: {
    id: 'Taman bunga rapi dengan barisan tanaman kuning dan saluran air, dua orang sedang merawat bunga.',
    en: 'A neat flower garden with rows of yellow plants and water channels, two people tending the flowers.',
  },
  14: {
    id: 'Sawah terasering hijau menanjak menuju rumah panggung beratap merah, dengan pegunungan hijau di latar belakang.',
    en: 'Green terraced paddies slope up to stilt houses with red roofs, backed by lush green mountains.',
  },
  15: {
    id: 'Jalan berlikit membelah sawah terasering hijau dengan gunung berselimut awan di latar belakang.',
    en: 'A winding road cuts through green terraced fields with a cloud-capped mountain in the background.',
  },
  16: {
    id: 'Orang berendam di kolam air panas alami dikelilingi batu kemerahan, uap mengepul di antara pepohonan.',
    en: 'A person in a natural hot spring pool surrounded by reddish rocks, steam rising among tropical trees.',
  },
  17: {
    id: 'Dua pria berjabat tangan di bawah gapura kayu bertuliskan "kampung mina padi samberembe" dengan latar sawah.',
    en: 'Two men shake hands under a wooden archway reading "kampung mina padi samberembe" with rice paddies behind.',
  },
  18: {
    id: 'Gazebo kayu putih beratap ijuk di tepi sungai kecil dengan pipa bambu menuangkan air, dikelilingi pepohonan.',
    en: 'A white thatched-roof gazebo by a stream with a bamboo water spout, surrounded by tropical greenery.',
  },
  19: {
    id: 'Kelompok berpose di sekitar empat jeep berwarna-warni di lapangan rumput dengan pegunungan hijau di latar.',
    en: 'A group poses around four colorful jeeps on a grassy field with green mountains in the background.',
  },
  20: {
    id: 'Delapan penari berpakaian tradisional pink dan kuning emas dengan mahkota hiasan emas menari di atas panggung.',
    en: 'Eight dancers in traditional pink tops and golden skirts with ornate gold headdresses perform on stage.',
  },
  21: {
    id: 'Hidangan desa dalam mangkuk berisi nasi, ikan, dan telur ikan jingga, di meja berlatar kipas dekoratif.',
    en: 'Village cuisine in bowls with rice, fish, and orange roe garnish on a table with decorative fans.',
  },
  22: {
    id: 'Enam orang berhelm dan rompi pelampung di rakit karet oranye di atas air, memegang dayung kuning.',
    en: 'Six people in helmets and life jackets in an orange inflatable raft on the water, holding yellow paddles.',
  },
  23: {
    id: 'Orang berpakaian biru menyeberangi jembatan kayu dengan Gunung Merapi menjulang di latar belakang.',
    en: 'A person in blue crosses a wooden bridge with Mount Merapi volcano rising in the background.',
  },
  24: {
    id: 'Nenek membentuk tanah liat di roda tembikar di bengkel tradisional, dikelilingi pot tanah liat berbagai ukuran.',
    en: 'An elderly woman shapes clay on a pottery wheel in a rustic workshop, surrounded by clay pots.',
  },
  25: {
    id: 'Hutan pinus dengan kolam kecil, fasilitas permainan, dan jalur setapak di lanskap hijau yang rimbun.',
    en: 'A pine forest with a small pond, playground facilities, and a winding path through lush greenery.',
  },
  26: {
    id: 'Pemandangan udara sawah terasering hijau dan permukiman atap merah di lereng Merapi yang diselimuti hutan.',
    en: 'Aerial view of green terraced fields and red-roofed houses on Merapi slopes, nestled in dense forest.',
  },
  27: {
    id: 'Penari wanita berpakaian merah menari diiringi enam musisi berbaju biru memainkan gamelan di halaman desa.',
    en: 'A woman in red traditional dress dances while six musicians in blue play gamelan in a village courtyard.',
  },
  28: {
    id: 'Struktur kerucut dari potongan keramik kecil dengan model kuaca hitam berstupa, dipajang di luar ruangan.',
    en: 'A conical structure of small ceramic pieces with a black stupa model in front, displayed outdoors.',
  },
  29: {
    id: 'Bangunan tradisional beratap merah multi-puncak di atas kolam, orang terlihat di dalamnya saat senja.',
    en: 'A traditional multi-peaked red-roofed building on a platform over a pond, people inside at dusk.',
  },
  30: {
    id: 'Hutan tropis dengan kolam berlili air, gazebo beratap ijuk, dan jembatan tradisional di tepi kolam.',
    en: 'Tropical forest with a lily-pad pond, thatched-roof gazebo, and traditional walkway along the edge.',
  },
}

const loadedImages = new Set<string>()

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
  const { lang } = useLang()
  const { villages } = useVillages()
  const village = villages.find((v) => v.id === villageId)
  const fallback = useMemo(() => makeFallbackSvg(villageId, villageName), [villageId, villageName])
  const realSrc = village?.image || fallback
  const altText = IMAGE_ALT_COPY[villageId]?.[lang] || villageName
  const canDisplayImmediately = !realSrc || realSrc.startsWith('data:image') || loadedImages.has(realSrc)
  const [resolvedSrc, setResolvedSrc] = useState(realSrc)

  useEffect(() => {
    let cancelled = false

    if (canDisplayImmediately) {
      return () => {
        cancelled = true
      }
    }

    const img = new Image()
    img.src = realSrc
    img.onload = () => {
      loadedImages.add(realSrc)
      if (!cancelled) setResolvedSrc(realSrc)
    }
    img.onerror = () => {
      if (!cancelled) setResolvedSrc(fallback)
    }

    return () => {
      cancelled = true
    }
  }, [canDisplayImmediately, fallback, realSrc])

  const src = canDisplayImmediately ? realSrc || fallback : resolvedSrc

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      <img
        src={src}
        alt={altText}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="eager"
        decoding="async"
        onError={() => setResolvedSrc(fallback)}
      />
      <div className="image-alt-wrap">
        <button type="button" className="image-alt-badge" aria-label={`Show image alt text: ${altText}`} title={altText}>
          ALT
        </button>
        <span className="image-alt-tooltip" role="note">
          {altText}
        </span>
      </div>
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
