# 🚀 Production Deployment Rehberi

Bu rehber, Restoran Sipariş Sistemi'ni production ortamına nasıl deploy edeceğinizi adım adım açıklar.

---

## 📋 İçindekiler

1. [Ön Gereksinimler](#ön-gereksinimler)
2. [Yerel Build ve Test](#yerel-build-ve-test)
3. [Production Build](#production-build)
4. [Environment Variables](#environment-variables)
5. [Deployment Seçenekleri](#deployment-seçenekleri)
6. [Post-Deployment Kontroller](#post-deployment-kontroller)

---

## 1️⃣ Ön Gereksinimler

### Gerekli Yazılımlar:
- **Node.js** (v18 veya üzeri)
- **npm** veya **yarn**
- **Git**

### Sunucu Gereksinimleri:
- **RAM**: Minimum 512MB (önerilen: 1GB+)
- **Disk**: Minimum 500MB boş alan
- **Port**: 3000 (veya belirlediğiniz port) açık olmalı
- **SSL Sertifikası**: HTTPS için (Let's Encrypt ücretsiz)

---

## 2️⃣ Yerel Build ve Test

### Adım 1: Bağımlılıkları Yükleyin

```bash
# Proje kök dizininde
npm run install:all
```

### Adım 2: Client Build

```bash
# Client'ı production modda build edin
npm run build:client
```

Build dosyaları `client/dist/` klasörüne oluşturulacak.

### Adım 3: Server Build

```bash
# Server'ı TypeScript'ten JavaScript'e compile edin
npm run build:server
```

Compile edilmiş dosyalar `server/dist/` klasörüne oluşturulacak.

### Adım 4: Yerel Production Test

```bash
# Production modda test edin
NODE_ENV=production PORT=3000 npm start
```

Tarayıcıda `http://localhost:3000` adresine giderek test edin.

---

## 3️⃣ Production Build

### Tek Komutla Build:

```bash
npm run build
```

Bu komut hem client hem de server'ı build eder.

---

## 4️⃣ Environment Variables

### Server Environment Variables

`server/.env` dosyası oluşturun:

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-super-secret-random-string-min-32-chars
CORS_ORIGIN=https://yourdomain.com
CLIENT_BUILD_PATH=../client/dist
```

**ÖNEMLİ:** `SESSION_SECRET` için güçlü bir random string kullanın:
```bash
# Linux/Mac
openssl rand -base64 32

# veya Node.js ile
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Client Environment Variables

`client/.env.production` dosyası oluşturun:

```env
VITE_API_URL=/api
VITE_WS_URL=wss://yourdomain.com
```

**Not:** Eğer API ve client aynı domain'de ise:
- `VITE_API_URL=/api` (relative path)
- `VITE_WS_URL` boş bırakılabilir (otomatik olarak aynı domain kullanılır)

**Eğer API farklı bir domain'de ise:**
```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

---

## 5️⃣ Deployment Seçenekleri

### Seçenek A: VPS/Cloud Server (DigitalOcean, AWS, Linode, vb.)

#### Adım 1: Sunucuya Bağlanın

```bash
ssh user@your-server-ip
```

#### Adım 2: Projeyi Klonlayın

```bash
git clone https://github.com/yourusername/restaurant-order-system.git
cd restaurant-order-system
```

#### Adım 3: Bağımlılıkları Yükleyin

```bash
npm run install:all
```

#### Adım 4: Environment Variables Ayarlayın

```bash
# Server .env
cd server
nano .env
# Yukarıdaki .env içeriğini yapıştırın ve kaydedin

# Client .env.production
cd ../client
nano .env.production
# Yukarıdaki .env.production içeriğini yapıştırın ve kaydedin
```

#### Adım 5: Build Edin

```bash
cd ..
npm run build
```

#### Adım 6: PM2 ile Çalıştırın (Önerilen)

```bash
# PM2'yi global olarak yükleyin
npm install -g pm2

# Production modda başlatın
cd server
pm2 start dist/index.js --name restaurant-api --env production

# PM2'yi sistem başlangıcında otomatik başlatmak için
pm2 startup
pm2 save
```

#### Adım 7: Nginx Reverse Proxy Kurulumu

```bash
# Nginx yükleyin
sudo apt update
sudo apt install nginx

# Nginx config dosyası oluşturun
sudo nano /etc/nginx/sites-available/restaurant
```

Nginx config içeriği:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # HTTP'den HTTPS'e yönlendirme (SSL kurulumundan sonra)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Config'i aktif edin
sudo ln -s /etc/nginx/sites-available/restaurant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Adım 8: SSL Sertifikası (Let's Encrypt)

```bash
# Certbot yükleyin
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası alın
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Otomatik yenileme test edin
sudo certbot renew --dry-run
```

---

### Seçenek B: Railway.app

1. [Railway.app](https://railway.app) hesabı oluşturun
2. "New Project" → "Deploy from GitHub repo"
3. Repository'yi seçin
4. Environment variables ekleyin:
   - `NODE_ENV=production`
   - `PORT` (Railway otomatik atar)
   - `SESSION_SECRET` (güçlü bir random string)
   - `CORS_ORIGIN` (Railway domain'iniz)
5. Build command: `npm run build`
6. Start command: `cd server && npm run start:prod`

---

### Seçenek C: Render.com

1. [Render.com](https://render.com) hesabı oluşturun
2. "New Web Service" → GitHub repo seçin
3. Ayarlar:
   - **Build Command**: `npm run build`
   - **Start Command**: `cd server && npm run start:prod`
   - **Environment**: `Node`
4. Environment variables ekleyin
5. Deploy edin

---

### Seçenek D: Heroku

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) yükleyin
2. Heroku'da yeni app oluşturun:
   ```bash
   heroku create your-app-name
   ```
3. Environment variables ekleyin:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-secret-key
   heroku config:set CORS_ORIGIN=https://your-app-name.herokuapp.com
   ```
4. Deploy edin:
   ```bash
   git push heroku main
   ```

---

### Seçenek E: Docker (Önerilen Production)

#### Dockerfile Oluşturma

`Dockerfile` dosyası oluşturun:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN cd server && npm ci --only=production

# Copy built files
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/data ./server/data

WORKDIR /app/server

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/index.js"]
```

#### Docker Compose (Önerilen)

`docker-compose.yml` dosyası oluşturun:

```yaml
version: '3.8'

services:
  restaurant-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - SESSION_SECRET=${SESSION_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:3000}
      - CLIENT_BUILD_PATH=../client/dist
    volumes:
      - ./server/data:/app/server/data
    restart: unless-stopped
```

#### Docker ile Deploy

```bash
# Build
docker-compose build

# Çalıştır
docker-compose up -d

# Logları görüntüle
docker-compose logs -f
```

---

## 6️⃣ Post-Deployment Kontroller

### ✅ Kontrol Listesi:

1. **Server Çalışıyor mu?**
   ```bash
   curl http://localhost:3000/api/menu
   ```

2. **Client Build Edilmiş mi?**
   ```bash
   ls -la client/dist/
   ```

3. **Environment Variables Doğru mu?**
   ```bash
   # Server'da
   cd server
   cat .env
   ```

4. **Port Açık mı?**
   ```bash
   netstat -tulpn | grep 3000
   ```

5. **SSL Sertifikası Geçerli mi?**
   - Tarayıcıda `https://yourdomain.com` açın
   - SSL ikonunu kontrol edin

6. **WebSocket Çalışıyor mu?**
   - Tarayıcı console'unda WebSocket bağlantısını kontrol edin
   - Network tab'ında WebSocket upgrade'i kontrol edin

---

## 🔧 Troubleshooting

### Problem: "Cannot find module"
**Çözüm:** `npm run install:all` komutunu çalıştırın

### Problem: "Port already in use"
**Çözüm:** 
```bash
# Port'u kullanan process'i bulun
lsof -ti:3000

# Process'i sonlandırın
kill -9 $(lsof -ti:3000)
```

### Problem: "WebSocket connection failed"
**Çözüm:** 
- Nginx config'de WebSocket upgrade header'larını kontrol edin
- SSL sertifikasının geçerli olduğundan emin olun (WSS için)

### Problem: "Session not persisting"
**Çözüm:**
- `SESSION_SECRET` environment variable'ının ayarlandığından emin olun
- Cookie `secure` flag'inin production'da `true` olduğunu kontrol edin
- `sameSite` cookie ayarını kontrol edin

---

## 📊 Monitoring ve Maintenance

### PM2 Monitoring

```bash
# Process durumunu görüntüle
pm2 status

# Logları görüntüle
pm2 logs restaurant-api

# Restart
pm2 restart restaurant-api

# Memory kullanımı
pm2 monit
```

### Log Rotation

PM2 log rotation için:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Backup

JSON dosyalarını düzenli yedekleyin:
```bash
# Cron job ekleyin (günlük backup)
0 2 * * * tar -czf /backup/restaurant-$(date +\%Y\%m\%d).tar.gz /path/to/server/data
```

---

## 🔐 Security Checklist

- [ ] `SESSION_SECRET` güçlü ve random
- [ ] HTTPS aktif (SSL sertifikası)
- [ ] CORS origin doğru ayarlanmış
- [ ] Cookie secure flag production'da true
- [ ] Environment variables `.gitignore`'da
- [ ] Firewall kuralları ayarlanmış
- [ ] Düzenli güncellemeler yapılıyor

---

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. Environment variables'ı doğrulayın
3. Port ve firewall ayarlarını kontrol edin
4. Browser console'da hataları kontrol edin

---

**Başarılar! 🎉**

