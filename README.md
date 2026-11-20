# EID Technical Test - Smart Manufacturing Dashboard

Aplikasi dashboard smart manufacturing dengan backend Laravel dan frontend React/Vite. Backend menyediakan REST API untuk login, dashboard, mesin, operator, produksi, dan laporan.

## Struktur project

```text
eid_techinicaltest_syauqi/
├── backend/   # Laravel REST API dan database
├── frontend/  # React + Vite
└── README.md
```

## Persyaratan

Pasang tools berikut sebelum memulai:

- Git
- PHP 8.3 atau lebih baru, dengan ekstensi PDO SQLite (`pdo_sqlite`), OpenSSL, Mbstring, dan ekstensi standar Laravel lainnya
- Composer
- Node.js yang didukung Vite 8 (Node.js 20.19+ atau 22.12+)
- npm (biasanya terpasang bersama Node.js)

Pastikan perintah `php`, `composer`, `node`, `npm`, dan `git` tersedia di terminal:

```powershell
php -v
composer --version
node -v
npm -v
```

## 1. Clone repository

```powershell
git clone https://github.com/MuhammadSyauqiMurtadlo/eid_techinicaltest_nama.git
cd eid_techinicaltest_syauqi
```

Jika nama folder hasil clone berbeda, masuklah ke folder tersebut sebelum melanjutkan.

## 2. Konfigurasi backend dan database

Semua perintah backend berikut dijalankan dari folder `backend`:

```powershell
cd backend
composer install
```

Buat file konfigurasi lokal `.env` dari template. Jangan menimpa `.env` yang sudah ada:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

### Database MySQL

Buat database kosong, misalnya `eid_smart_manufacturing`, di MySQL. Lalu ubah konfigurasi database di `backend/.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eid_smart_manufacturing
DB_USERNAME=root
DB_PASSWORD=
```

Sesuaikan username dan password dengan konfigurasi lokal MySQL, pastikan service MySQL aktif, lalu jalankan dari folder `backend`:

```powershell
php artisan key:generate
php artisan migrate --seed
```

Jalankan `php artisan key:generate` hanya ketika `APP_KEY` di `.env` masih kosong. Jika sudah pernah dibuat, jangan menggantinya karena dapat membuat data terenkripsi lama tidak bisa dibaca.

> **Perhatian:** `php artisan migrate:fresh --seed` menghapus semua tabel dan data pada database yang sedang dikonfigurasi, lalu membuatnya kembali. Gunakan hanya jika memang ingin mereset database lokal.

## 3. Konfigurasi dan install frontend

Buka terminal baru dari root project, lalu jalankan:

```powershell
cd frontend
npm install
```

Frontend membaca URL API dari `VITE_API_URL`. Buat `frontend/.env` jika belum ada dan pastikan nilainya mengarah ke backend lokal:

```dotenv
VITE_API_URL=http://localhost:8000/api
```

Jika mengubah file `.env` frontend saat Vite sedang berjalan, hentikan dan jalankan ulang server frontend agar konfigurasi terbaca.

## 4. Jalankan aplikasi

Jalankan backend dan frontend di **4 terminal terpisah**.

**Terminal 1 — backend**, dari folder `backend`:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

**Terminal 2 — backend**, dari folder `backend`:

```powershell
php artisan reverb:start
```

**Terminal 3 — backend**, dari folder `backend`:

```powershell
php artisan machines:simulate
```

**Terminal 4 — frontend**, dari folder `frontend`:

```powershell
npm run dev
```

Buka alamat frontend yang ditampilkan Vite (default: [http://localhost:5173](http://localhost:5173)). API backend tersedia di [http://localhost:8000/api](http://localhost:8000/api).

## 5. Login demo

Setelah menjalankan `php artisan migrate --seed`, gunakan salah satu akun berikut:

| Peran         | Email                  | Password   |
| ------------- | ---------------------- | ---------- |
| Administrator | `admin@example.com`    | `password` |
| Operator      | `operator@example.com` | `password` |
| Operator      | `siti@example.com`     | `password` |
| Operator      | `agus@example.com`     | `password` |
| Operator      | `dewi@example.com`     | `password` |

Akun admin dapat mengelola operator dan mesin. Akun operator memiliki akses terbatas sesuai perannya. Password demo hanya untuk pengembangan/testing lokal; jangan gunakan konfigurasi ini untuk deployment produksi.

## Perintah tambahan

Jalankan perintah dari folder terkait:

```powershell
# Backend: jalankan test Laravel
cd backend
php artisan test

# Frontend: validasi lint
cd ..\frontend
npm run lint

# Frontend: buat build produksi
npm run build
```

## Troubleshooting singkat

- **API tidak dapat dihubungi:** pastikan backend berjalan di port `8000` dan `VITE_API_URL` di `frontend/.env` benar.
- **Gagal login atau error database:** pastikan database sudah dikonfigurasi, file SQLite tersedia bila memakai SQLite, lalu jalankan migrasi dan seeder.
- **Error driver SQLite:** aktifkan ekstensi `pdo_sqlite` pada konfigurasi PHP yang digunakan oleh terminal.
- **Perubahan `.env` tidak terbaca:** hentikan lalu jalankan ulang server yang bersangkutan.
- **Port sudah digunakan:** hentikan aplikasi lain pada port tersebut atau ubah port server dan sesuaikan URL API frontend.
