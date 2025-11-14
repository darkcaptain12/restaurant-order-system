# ⚡ Hızlı Başlangıç - Production Deployment

## 🐳 Docker ile (En Kolay Yöntem)

### 1. Environment Variables Ayarlayın

`.env` dosyası oluşturun (proje kök dizininde):

```env
PORT=3000
SESSION_SECRET=your-super-secret-random-string-here
CORS_ORIGIN=https://yourdomain.com
```

**SESSION_SECRET oluşturma:**
```bash
openssl rand -base64 32
```

### 2. Docker Compose ile Başlatın

```bash
docker-compose up -d
```

### 3. Kontrol Edin

```bash
# Logları görüntüle
docker-compose logs -f

# Durumu kontrol et
docker-compose ps
```

Tarayıcıda `http://localhost:3000` adresine gidin.

---

## 📦 Manuel Deployment

### 1. Build

```bash
npm run build
```

### 2. Environment Variables

**Server için** (`server/.env`):
```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key
CORS_ORIGIN=https://yourdomain.com
CLIENT_BUILD_PATH=../client/dist
```

**Client için** (`client/.env.production`):
```env
VITE_API_URL=/api
VITE_WS_URL=
```

### 3. Başlat

```bash
npm start
```

---

## 🌐 Nginx Reverse Proxy (Production)

### Nginx Config

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 🔄 PM2 ile Process Management

```bash
# PM2 yükle
npm install -g pm2

# Başlat
pm2 start ecosystem.config.js

# Otomatik başlat
pm2 startup
pm2 save
```

---

Detaylı bilgi için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın.

