# 🍽️ Restoran Sipariş Sistemi

Tam özellikli, production-ready restoran sipariş yönetim sistemi. Node.js + Express + React + Vite + TypeScript ile geliştirilmiştir.

## ✨ Özellikler

- **Roller**: Admin, Garson (Waiter), Mutfak (Kitchen), Bar, Kasa (Cashier)
- **PIN Tabanlı Kimlik Doğrulama**: Güvenli PIN sistemi
- **Menü Yönetimi**: Tam CRUD operasyonları, kampanya menüleri
- **Sipariş Yönetimi**: PENDING → IN_PROGRESS → READY → SERVED lifecycle
- **Masa Yönetimi**: 20 masa, durum takibi, masa transferi
- **Ödeme Sistemi**: Nakit/Kart ödeme, indirim uygulama
- **Gerçek Zamanlı Güncelleme**: WebSocket ile anlık bildirimler
- **Raporlama**: Canlı ciro, günlük/haftalık/aylık raporlar, garson satış analizi
- **Personel Yönetimi**: Garson ve kasiyer ekleme/silme

## 🚀 Hızlı Başlangıç

### Geliştirme Modu

1. **Bağımlılıkları yükleyin:**
```bash
npm run install:all
```

2. **Geliştirme modunda çalıştırın:**
```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000

### Production Build

```bash
# Build
npm run build

# Production modda çalıştır
npm start
```

Detaylı deployment rehberi için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın.

## 👥 Kullanıcılar

- **Admin**: PIN: `5678`
- **Mutfak**: PIN: `mutfak`
- **Bar**: PIN: `bar`
- **Kasa**: PIN: `kasa`
- **Garson (Ahmet)**: PIN: `1234`
- **Garson (Mehmet)**: PIN: `4321`

## 📁 Proje Yapısı

```
restaurant-order-system/
├── server/
│   ├── src/
│   │   ├── index.ts          # Express server ve WebSocket
│   │   ├── auth.ts           # Authentication
│   │   ├── dataManager.ts    # JSON dosya yönetimi
│   │   └── types.ts          # TypeScript tipleri
│   ├── data/
│   │   ├── users.json        # Kullanıcılar
│   │   ├── menu.json         # Menü
│   │   ├── orders.json       # Aktif siparişler
│   │   └── completed-orders.json  # Geçmiş siparişler
│   └── dist/                 # Production build
├── client/
│   ├── src/
│   │   ├── pages/            # Sayfa bileşenleri
│   │   ├── components/       # UI bileşenleri
│   │   ├── hooks/           # Custom hooks
│   │   └── config.ts        # API configuration
│   └── dist/                 # Production build
├── Dockerfile                # Docker image
├── docker-compose.yml        # Docker Compose config
├── ecosystem.config.js       # PM2 config
└── DEPLOYMENT.md             # Deployment rehberi
```

## 🛠️ Teknolojiler

- **Backend**: Express, WebSocket (ws), express-session
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, React Router
- **Veri Depolama**: JSON dosyaları (server/data/)
- **Build**: Vite, TypeScript Compiler
- **Deployment**: Docker, PM2, Nginx

## 📊 Sipariş Durumları

- `PENDING`: Beklemede
- `IN_PROGRESS`: Hazırlanıyor
- `READY`: Hazır
- `SERVED`: Servis edildi
- `CANCELLED`: İptal edildi

## 🚀 Production Deployment

### Hızlı Deploy (Docker)

```bash
# Docker Compose ile
docker-compose up -d

# Veya Docker ile
docker build -t restaurant-order-system .
docker run -p 3000:3000 -e SESSION_SECRET=your-secret restaurant-order-system
```

### Manuel Deploy

1. Environment variables ayarlayın
2. `npm run build` çalıştırın
3. `npm start` ile başlatın

Detaylı bilgi için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın.

## 📝 Notlar

- Tüm veriler `server/data/` klasöründeki JSON dosyalarında tutulur
- WebSocket ile gerçek zamanlı güncellemeler sağlanır
- Her rol kendi yetkilerine göre işlem yapabilir
- Production modda client build dosyaları server tarafından serve edilir
- Environment variables ile production ayarları yapılır

