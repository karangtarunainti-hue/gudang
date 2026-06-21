# Sedesa PWA — Panduan Deploy

## Struktur File

```
sedesa-pwa/
├── index.html        ← Halaman utama (sudah include PWA)
├── manifest.json     ← Web App Manifest
├── sw.js             ← Service Worker
└── icons/
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png
```

## Cara Deploy

### 1. Upload ke Web Server / Hosting

Unggah **seluruh folder** ke hosting (Netlify, Vercel, GitHub Pages, VPS, dsb).  
Pastikan semua file berada di **satu direktori yang sama**.

> ⚠️ PWA **tidak bisa** dijalankan dari `file://` lokal. Harus melalui HTTPS atau `http://localhost`.

### 2. Wajib: HTTPS

Service Worker hanya aktif di **HTTPS** (atau localhost).  
Gunakan hosting yang menyediakan SSL gratis seperti Netlify, Vercel, atau Cloudflare Pages.

### 3. Isi Konfigurasi Supabase

Buka `index.html`, cari bagian ini di awal `<script>`:

```js
const SUPABASE_URL      = 'https://XXXX.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...';
```

Ganti dengan URL dan anon key dari **app.supabase.com → Settings → API**.

---

## Fitur PWA yang Aktif

| Fitur | Keterangan |
|---|---|
| **Installable** | Muncul tombol "Pasang Aplikasi" di header saat browser mendukung |
| **Offline support** | Data cache localStorage tetap bisa diakses saat offline |
| **Cache-first** | App shell di-cache sehingga loading instan |
| **Network-first** | Supabase API selalu dicoba dari jaringan, fallback ke cache |
| **Theme color** | Status bar biru navy di Android/iOS |
| **Apple PWA** | `apple-mobile-web-app-capable` aktif untuk iOS Safari |
| **Shortcuts** | Shortcut "Form Pinjam" & "Histori" muncul saat app di-install |

---

## Update Cache

Jika ada perubahan pada `index.html`, ganti versi cache di `sw.js`:

```js
const CACHE_NAME = 'sedesa-v2'; // ← naikkan versinya
```

Service Worker akan otomatis menghapus cache lama dan mengunduh yang baru.

---

## Menguji PWA

1. Buka di Chrome → DevTools → **Application** → **Manifest** & **Service Workers**
2. Jalankan **Lighthouse** (DevTools) untuk audit PWA score
3. Di Android: buka di Chrome → akan muncul banner "Tambah ke layar beranda"
4. Di iOS Safari: ketuk ikon Share → "Tambahkan ke Layar Utama"
