export type Lang = 'id' | 'en'

const t = {
  appTitle: { id: 'DesaConnect', en: 'DesaConnect' },
  appSubtitle: { id: 'Platform Desa Wisata Kabupaten Sleman', en: 'Tourism Village GIS — Sleman Regency, Yogyakarta' },

  filterInSeason: { id: 'Musim Panen', en: 'In Season' },
  filterActivities: { id: 'Ada Aktivitas', en: 'Has Activities' },
  filterWheelchair: { id: 'Akses Kursi Roda', en: 'Wheelchair Access' },
  inSeason: { id: 'Musim Panen', en: 'In Season' },
  offSeason: { id: 'Luar Musim', en: 'Off Season' },
  contactWhatsApp: { id: 'Hubungi via WhatsApp', en: 'Contact via WhatsApp' },
  waMessage: { id: 'Halo%20DesaConnect%2C%20saya%20ingin%20bertanya%20tentang%20paket%20wisata', en: 'Hello%20DesaConnect%2C%20I%20would%20like%20to%20ask%20about%20tour%20packages' },
  noResults: { id: 'Tidak ada desa yang cocok dengan filter', en: 'No villages match the selected filters' },

  reviews: { id: 'Ulasan', en: 'Reviews (Ulasan)' },
  writeReview: { id: 'Tulis Ulasan', en: 'Write a Review' },
  reviewAuthor: { id: 'Nama Anda', en: 'Your Name' },
  reviewText: { id: 'Ulasan Anda', en: 'Your Review' },
  reviewSubmit: { id: 'Kirim Ulasan', en: 'Submit Review' },
  reviewRating: { id: 'Rating', en: 'Rating' },
  reviewNone: { id: 'Belum ada ulasan untuk desa ini.', en: 'No reviews yet for this village.' },
  avgRating: { id: 'Rata-rata Rating', en: 'Average Rating' },
  reviewSaved: { id: 'Ulasan berhasil dikirim.', en: 'Review submitted successfully.' },

  exportVillagesCsv: { id: 'Ekspor Data Desa (CSV)', en: 'Export Village Data (CSV)' },
  exportAuditCsv: { id: 'Ekspor Log Audit (CSV)', en: 'Export Audit Log (CSV)' },
  exportReviewsCsv: { id: 'Ekspor Ulasan (CSV)', en: 'Export Reviews (CSV)' },
  exportMyData: { id: 'Ekspor Data Saya', en: 'Export My Data' },
  deleteMyData: { id: 'Hapus Data Saya', en: 'Delete My Data' },
  dataRightsTitle: { id: 'Hak Data Saya', en: 'My Data Rights' },
  dataRightsDesc: { id: 'Ekspor atau hapus data yang Anda kirim melalui platform ini.', en: 'Export or delete the data you submitted through this platform.' },
  exportDone: { id: 'Ekspor data selesai.', en: 'Data export completed.' },
  deleteDone: { id: 'Permintaan hapus data diproses.', en: 'Data deletion request processed.' },

  showPlots: { id: 'Tampilkan Lahan Petani', en: 'Show Farm Plots (Lahan Petani)' },
  plotHarvestWindow: { id: 'Masa Panen', en: 'Harvest Window' },
  plotCrop: { id: 'Tanaman', en: 'Crop (Tanaman)' },
  plotFarmer: { id: 'Petani', en: 'Farmer' },
  plotSeasonYes: { id: 'Musim Panen', en: 'In Season' },
  plotSeasonNo: { id: 'Luar Musim', en: 'Off Season' },
  delegatedPlotTitle: { id: 'Daftarkan Lahan untuk Petani Lansia', en: 'Register Plot for Older Farmer' },
  delegatedPlotDesc: { id: 'Pokdarwis dapat membantu mendaftarkan lahan atas nama petani yang kesulitan menggunakan ponsel.', en: 'Pokdarwis can help register a plot on behalf of an older farmer who struggles to use a smartphone.' },
  delegatedFarmerId: { id: 'ID / Nama Petani', en: 'Farmer ID / Name' },
  delegatedConsentLabel: { id: 'Petani telah memberikan persetujuan untuk pendaftaran lahan oleh Pokdarwis.', en: 'The farmer has given consent for Pokdarwis to register this plot on their behalf.' },
  delegatedRegister: { id: 'Daftarkan Lahan Petani', en: 'Register Farmer Plot' },
  delegatedSaved: { id: 'Lahan petani berhasil didaftarkan.', en: 'Farmer plot registered successfully.' },
  syncComplete: { id: 'Perubahan offline berhasil disinkronkan.', en: 'Offline changes synced successfully.' },

  visitorDesc: {
    id: 'Jelajahi desa wisata di Kabupaten Sleman. Klik marker untuk melihat detail aktivitas, harga, dan hubungi via WhatsApp.',
    en: 'Explore tourism villages (desa wisata) across Sleman Regency. Click a marker to see activities, prices, and a WhatsApp link to the village manager.',
  },

  pokdarwisTitle: { id: 'Kelola Desa Wisata', en: 'Manage Tourism Village' },
  pokdarwisDesc: {
    id: 'Pokdarwis (Kelompok Sadar Wisata) adalah kelompok masyarakat yang mengelola operasional desa wisata. Gunakan editor ini untuk memperbarui informasi desa Anda.',
    en: 'Pokdarwis (Tourism Awareness Group — Kelompok Sadar Wisata) are community members who run daily tourism village operations. Use this editor to update your village information.',
  },
  editVillage: { id: 'Edit Desa', en: 'Edit Village' },
  addVillage: { id: 'Tambah Desa Baru', en: 'Add New Village' },
  addVillageDesc: {
    id: 'Daftarkan desa wisata baru ke platform DesaConnect.',
    en: 'Register a new tourism village on the DesaConnect platform.',
  },
  registerNewVillage: { id: 'Daftarkan Desa Baru', en: 'Register New Village (Desa Baru)' },
  registerNewVillageDesc: {
    id: 'Daftarkan desa wisata baru ke platform DesaConnect.',
    en: 'Register a new tourism village on the DesaConnect platform.',
  },
  villageDescId: { id: 'Deskripsi (Bahasa)', en: 'Description (Bahasa Indonesia)' },
  villageDescEn: { id: 'Deskripsi (Inggris)', en: 'Description (English)' },
  descId: { id: 'Deskripsi (Bahasa)', en: 'Description (Bahasa Indonesia)' },
  descEn: { id: 'Deskripsi (Inggris)', en: 'Description (English)' },
  whatsappNumber: { id: 'Nomor WhatsApp', en: 'WhatsApp Number' },
  imageUrl: { id: 'URL Foto', en: 'Photo URL' },
  villageAdded: { id: 'Desa berhasil ditambahkan!', en: 'Village added successfully!' },
  villageRegistered: { id: 'Desa baru berhasil didaftarkan!', en: 'New village registered successfully!' },
  consentLabel: {
    id: 'Musyawarah desa telah menyetujui pendaftaran desa ini ke platform',
    en: 'Village deliberation (musyawarah desa) has approved joining this platform',
  },
  fillRequired: { id: 'Lengkapi semua kolom yang wajib diisi.', en: 'Please fill in all required fields.' },
  villageName: { id: 'Nama Desa', en: 'Village Name (Nama Desa)' },
  latitude: { id: 'Lintang', en: 'Latitude' },
  longitude: { id: 'Bujur', en: 'Longitude' },
  harvestSeason: { id: 'Status Musim', en: 'Season Status (Musim Panen)' },
  villagePhoto: { id: 'Foto Desa', en: 'Village Photo' },
  uploadPhoto: { id: 'Upload Foto', en: 'Upload Photo' },
  tourActivities: { id: 'Aktivitas Wisata', en: 'Tour Activities (Aktivitas Wisata)' },
  activityName: { id: 'Nama Aktivitas', en: 'Activity Name' },
  price: { id: 'Harga', en: 'Price (Harga)' },
  duration: { id: 'Durasi', en: 'Duration' },
  save: { id: 'Simpan', en: 'Save' },
  savedLocal: {
    id: 'Tersimpan lokal — akan dikirim saat ada sinyal',
    en: 'Saved locally — will send when signal returns',
  },
  offlineSim: {
    id: 'Simulasi Offline',
    en: 'Simulate Offline (upper slopes of Merapi may have no signal)',
  },
  queuedNotice: {
    id: '1 perubahan menunggu sinkronisasi',
    en: '1 change queued in IndexedDB — will sync when signal returns',
  },

  farmerTitle: { id: 'Registrasi Lahan Petani', en: 'Register Farmland Plot' },
  farmerDesc: {
    id: 'Daftarkan batas lahan pertanian Anda pada peta. Komoditas dan musim panen akan terlihat oleh pengunjung jika diatur publik.',
    en: 'Walk the perimeter of your field to register it on the map. Commodity and harvest window are shown to visitors if set to public. Precise boundaries stay private to you (NFR11).',
  },
  commodity: { id: 'Komoditas', en: 'Crop / Commodity' },
  harvestStart: { id: 'Awal Musim Panen', en: 'Harvest Start Month' },
  harvestEnd: { id: 'Akhir Musim Panen', en: 'Harvest End Month' },
  visibility: { id: 'Visibilitas', en: 'Visibility' },
  publicReduced: {
    id: 'Publik (resolusi dikurangi)',
    en: 'Public — reduced resolution (boundary simplified for visitors)',
  },
  private: { id: 'Privat', en: 'Private (only you and authorised officers see it)' },
  polygonLabel: {
    id: 'Polygon lahan (contoh statis — Lahan Petani)',
    en: 'Farm plot boundary (static example). In production, the farmer walks the perimeter with GPS.',
  },

  farmerDrawHint: {
    id: 'Klik pada peta untuk menambah titik batas lahan. Seret titik untuk menyesuaikan.',
    en: 'Click the map to add boundary points. Drag points to adjust them.',
  },
  farmerUndoPoint: { id: 'Hapus Titik Terakhir', en: 'Undo Last Point' },
  farmerClearPoints: { id: 'Hapus Semua', en: 'Clear All' },

  dashTitle: { id: 'Dashboard Tata Kelola', en: 'Governance Dashboard (Dinas Pariwisata)' },
  dashDesc: {
    id: 'Ringkasan data kunjungan dan log audit untuk petugas Dinas Pariwisata, Dinas Pertanian, dan BAPPEDA.',
    en: 'Aggregated visitor analytics and audit log visible to the Regional Tourism Office (Dinas Pariwisata), Regional Agriculture Office (Dinas Pertanian), and Regional Planning Agency (BAPPEDA).',
  },
  totalActiveVillages: { id: 'Total Desa Wisata Aktif', en: 'Active Tourism Villages (of 53 registered)' },
  totalVisitorClicks: { id: 'Total Klik Pengunjung', en: 'Total Visitor Click-throughs' },
  registeredVillages: { id: 'Desa Terdaftar di Platform', en: 'Villages on Platform' },
  totalFarmers: { id: 'Total Petani Terdaftar', en: 'Registered Farmers (Petani)' },
  totalClicksToday: { id: 'Klik Hari Ini', en: 'Clicks Today' },
  pendingSync: { id: 'Menunggu Sinkronisasi', en: 'Pending Offline Sync' },
  clicksPerVillage: { id: 'Klik per Desa Wisata (Top 5)', en: 'Visitor Clicks per Village (Top 5)' },
  recentAuditLog: { id: 'Log Audit Terbaru', en: 'Recent Audit Log (every read/write is recorded — NFR9)' },
  actor: { id: 'Aktor', en: 'Actor' },
  action: { id: 'Aksi', en: 'Action' },
  timestamp: { id: 'Waktu', en: 'Timestamp' },
  target: { id: 'Target', en: 'Target' },

  roleVisitor: { id: 'Visitor', en: 'Visitor' },
  rolePokdarwis: { id: 'Pokdarwis', en: 'Pokdarwis' },
  roleFarmer: { id: 'Petani', en: 'Farmer' },
  roleOfficer: { id: 'Officer', en: 'Officer' },

  roleDescVisitor: {
    id: '',
    en: 'Browse the map — no login needed',
  },
  roleDescPokdarwis: {
    id: '',
    en: 'Tourism Awareness Group member',
  },
  roleDescFarmer: {
    id: '',
    en: 'Smallholder farmer (petani)',
  },
  roleDescOfficer: {
    id: '',
    en: 'Dinas / BAPPEDA officer',
  },

  commoditySalak: { id: 'Salak (Snakefruit)', en: 'Salak / Snakefruit' },
  commodityCabai: { id: 'Cabai (Chili Pepper)', en: 'Cabai / Chili Pepper' },
  commodityPadi: { id: 'Padi (Rice)', en: 'Padi / Rice' },
  commodityJagung: { id: 'Jagung (Corn)', en: 'Jagung / Corn / Maize' },
} as const

export type TranslationKey = keyof typeof t

export function tr(key: TranslationKey, lang: Lang): string {
  const val = t[key][lang]
  if (val === '' && lang === 'id') return t[key]['en']
  return val
}

export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function getMonths(lang: Lang): string[] {
  return lang === 'id' ? MONTHS_ID : MONTHS_EN
}
