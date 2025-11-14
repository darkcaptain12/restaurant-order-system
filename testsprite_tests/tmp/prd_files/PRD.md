# Restoran Sipariş Yönetim Sistemi - Product Requirements Document

## 1. Genel Bakış

Bu sistem, restoran ve kafeler için tam kapsamlı bir sipariş yönetim sistemidir. Node.js + Express backend ve React + Vite frontend kullanılarak geliştirilmiştir. Tüm veriler JSON dosyalarında saklanır, veritabanı kullanılmaz.

## 2. Kullanıcı Rolleri

### 2.1 Admin
- **Giriş:** PIN: `5678`
- **Özellikler:**
  - Tüm panellere şifresiz geçiş (Mutfak, Bar, Kasa, Admin)
  - Günlük, haftalık, aylık ciro raporları
  - Anlık ciro takibi (5 saniyede bir güncelleme)
  - Garson başına satış raporları
  - En çok satan ürünler raporu
  - Ödeme yöntemleri analizi (Nakit/Kart)
  - Personel yönetimi (Garson ve Kasiyer ekleme/silme)
  - Menü yönetimi (Ürün ekleme/düzenleme/silme)
  - Gün sonu sıfırlama (otomatik 00:00'da)

### 2.2 Garson (Waiter)
- **Giriş:** PIN ile (örn: `1234` - Ahmet, `4321` - Mehmet)
- **Özellikler:**
  - 20 masalık görsel masa düzeni
  - Masa seçimi ve sipariş girme
  - Kategorize edilmiş menü (Yemekler, İçecekler, Tatlılar, Kampanya)
  - Sepet yönetimi
  - Kendi siparişlerini görüntüleme
  - Sipariş durumu takibi (Beklemede, Hazırlanıyor, Hazır, Servis Edildi)
  - Masa taşıma özelliği
  - Tüm masaları görme (diğer garsonların siparişleri dahil)

### 2.3 Mutfak (Kitchen)
- **Giriş:** PIN: `mutfak`
- **Özellikler:**
  - Sadece mutfak kategorisindeki ürünleri görme
  - Aktif siparişler sekmesi
  - Geçmiş siparişler sekmesi
  - Sipariş durumu güncelleme (Beklemede → Hazırlanıyor → Hazır)
  - Ürün iptal etme (neden belirtme)
  - Hazır olan ürünler otomatik geçmişe taşınır

### 2.4 Bar
- **Giriş:** PIN: `bar`
- **Özellikler:**
  - Sadece bar kategorisindeki ürünleri görme
  - Aktif siparişler sekmesi
  - Geçmiş siparişler sekmesi
  - Sipariş durumu güncelleme
  - Ürün iptal etme
  - Hazır olan ürünler otomatik geçmişe taşınır

### 2.5 Kasa (Cashier)
- **Giriş:** PIN: `kasa`
- **Özellikler:**
  - 20 masalık görsel masa düzeni
  - Masa seçimi ve hesap görüntüleme
  - Ödeme yöntemi seçimi (Nakit/Kart)
  - İndirim uygulama
  - Ödeme tamamlama
  - Ödenmiş masalar otomatik boş görünür

## 3. Sipariş Akışı

1. **Garson:** Masa seçer → Menüden ürün seçer → Sepete ekler → Siparişi gönderir
2. **Mutfak/Bar:** Siparişi görür → "Başlat" → "Hazır" → Otomatik geçmişe taşınır
3. **Garson:** Hazır siparişleri görür → "Servis Et" → Durum "Servis Edildi" olur
4. **Kasa:** Masa seçer → Hesabı görür → Ödeme yöntemi seçer → İndirim uygular → Ödeme yapar
5. **Sistem:** Masa otomatik boş görünür

## 4. Sipariş Durumları

- **PENDING:** Beklemede
- **IN_PROGRESS:** Hazırlanıyor
- **READY:** Hazır
- **SERVED:** Servis Edildi
- **CANCELLED:** İptal Edildi (neden belirtilir)

## 5. Menü Yönetimi

### 5.1 Kategoriler
- **Yemekler (Food):** Mutfak kategorisi
- **İçecekler (Drink):** Bar kategorisi
- **Tatlılar (Dessert):** Hem mutfak hem bar
- **Kampanya Menüleri:** Birden fazla ürün içeren özel menüler

### 5.2 Ürün Özellikleri
- Ürün adı
- Fiyat
- Kategori (Mutfak/Bar/Tatlı/Kampanya)
- Menü kategorisi (Yemek/İçecek/Tatlı/Kampanya)
- Extras (Opsiyonel - özel özellikler, seçenekler)
- Kampanya menüleri için içerik listesi

## 6. Ödeme Sistemi

- Ödeme yöntemleri: Nakit, Kart
- İndirim uygulanabilir
- Ödeme detayları kaydedilir (yöntem, tutar, indirim, final tutar, kasiyer bilgisi)
- Ödenmiş siparişler raporlara dahil edilir

## 7. Raporlama

### 7.1 Anlık Ciro
- Canlı güncelleme (5 saniyede bir)
- Toplam ciro
- Garson başına satış
- Sipariş sayısı

### 7.2 Günlük Rapor
- Toplam ciro
- İptal tutarı
- Garson başına satış
- En çok satan ürünler (top 10)
- Ödeme yöntemleri (Nakit/Kart)

### 7.3 Haftalık/Aylık Rapor
- Toplam ciro
- Garson başına satış
- Ödeme yöntemleri
- Sipariş sayısı
- Tarih aralığı

## 8. Özellikler

### 8.1 Gerçek Zamanlı Güncelleme
- WebSocket ile tüm paneller anında güncellenir
- Yeni sipariş, durum değişikliği, ödeme tamamlama gibi olaylar broadcast edilir

### 8.2 Masa Yönetimi
- 20 masa görsel olarak gösterilir
- Masa durumları: Boş, Beklemede, Hazır, Servis Edildi
- Her masa için sipariş sayısı ve toplam tutar gösterilir
- Masa taşıma özelliği

### 8.3 Otomatik İşlemler
- Gün sonu otomatik sıfırlama (00:00'da)
- Hazır ürünler otomatik geçmişe taşınır
- Ödenmiş masalar otomatik boş görünür

## 9. Teknik Detaylar

### 9.1 Backend
- Port: 3000
- Express.js
- WebSocket (ws)
- Session yönetimi (express-session)
- CORS enabled

### 9.2 Frontend
- Port: 5173
- React + Vite
- TypeScript
- Tailwind CSS
- React Router

### 9.3 Veri Depolama
- `/server/data/users.json` - Kullanıcılar
- `/server/data/menu.json` - Menü
- `/server/data/orders.json` - Aktif siparişler
- `/server/data/completed-orders.json` - Geçmiş siparişler

## 10. Test Senaryoları

### 10.1 Giriş Testleri
- PIN ile giriş yapma
- Farklı roller için doğru panele yönlendirme
- Geçersiz PIN ile giriş denemesi

### 10.2 Sipariş Testleri
- Garson sipariş oluşturma
- Mutfak/Bar sipariş görme
- Sipariş durumu güncelleme
- Ürün iptal etme
- Masa taşıma

### 10.3 Ödeme Testleri
- Kasa masa seçimi
- Ödeme yöntemi seçimi
- İndirim uygulama
- Ödeme tamamlama
- Masa boş görünme

### 10.4 Rapor Testleri
- Anlık ciro görüntüleme
- Günlük rapor
- Haftalık rapor
- Aylık rapor
- Garson başına satış

### 10.5 Menü Yönetimi Testleri
- Ürün ekleme
- Ürün düzenleme
- Ürün silme
- Kampanya menü ekleme
- Extras ekleme

### 10.6 Personel Yönetimi Testleri
- Garson ekleme
- Kasiyer ekleme
- Personel silme

## 11. Kullanıcı Hikayeleri

1. **Garson olarak:** Masaya sipariş girebilmek, sipariş durumunu takip edebilmek
2. **Mutfak olarak:** Siparişleri görmek, hazırlamak, hazır olarak işaretlemek
3. **Bar olarak:** İçecek siparişlerini görmek, hazırlamak
4. **Kasa olarak:** Masaların hesaplarını görmek, ödeme almak
5. **Admin olarak:** Raporları görmek, personel ve menü yönetmek

## 12. Kullanılabilirlik

- Modern ve kullanıcı dostu arayüz
- Responsive tasarım
- Renk kodlaması ile görsel geri bildirim
- Animasyonlar ve geçişler
- Gerçek zamanlı güncellemeler
- Hata mesajları ve onaylar

