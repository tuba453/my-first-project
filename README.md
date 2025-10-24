# 📌 Kişisel Görev ve Not Yönetimi Uygulaması

Bu proje, **Python**, **Flask** çerçevesi ve modern web teknolojileri kullanılarak geliştirilmiş kapsamlı bir **Kişisel Görev ve Not Yönetimi Uygulaması**dır.  
Her kullanıcı kendi notlarını ve görevlerini ekleyebilir, güncelleyebilir, silebilir, yıldızlayabilir ve etiketleyebilir.

Uygulama, kullanıcı deneyimini ön planda tutarak **responsive** bir arayüz sunar.  
Flask'ın modüler yapısı sayesinde kodlar **temiz**, **anlaşılır** ve **kolayca genişletilebilir** bir mimariye sahiptir.  
**SQLAlchemy** ile veritabanı etkileşimleri yönetilir.

---

## ✨ Özellikler

### 👤 Kullanıcı Yönetimi
- Güvenli kullanıcı kayıt, giriş ve çıkış sistemi (Flask-Login ile)

### 🗒️ Not Yönetimi
- Not ekleme, düzenleme ve silme  
- Notları önemli olarak işaretleme (⭐ yıldızlama)  
- Notlara etiket ekleme ve etiketlere göre filtreleme

### ✅ Görev Yönetimi
- Görev ekleme, düzenleme ve silme  
- Görevleri tamamlama ve tamamlanmış görevleri görüntüleme  
- Görevlere bitiş tarihi atama, yaklaşan veya gecikmiş görevleri takip etme  
- Görevleri önemli olarak işaretleme  
- Görevlere etiket ekleme ve filtreleme  
- **Sürükle-bırak** (drag & drop) ile görev sıralamasını değiştirme  
- **Celery** ile otomatik e-posta görev hatırlatmaları

### 🏷️ Etiket Sistemi
- Not ve görevler için ortak etiketler oluşturma ve yönetme

### 🏅 Rozet Sistemi
- Kullanıcıların belirli başarımları tamamladıkça rozetler kazanması (gamification)

### ⚙️ Kullanıcı Ayarları
- Kullanıcı adı ve e-posta güncelleme  
- Şifre değiştirme  
- Profil avatarı seçimi  
- Hesap silme

### 🎨 Temalar
- Açık, Koyu ve özel “Orman” teması seçenekleri

### 🤖 AI Asistanı
- Kullanıcıya motivasyonel mesajlar sunan basit bir yapay zeka asistanı

### 📱 Responsive Tasarım
- Mobil ve masaüstü cihazlarda sorunsuz kullanım (Bootstrap 5 ile)

### 🔍 Arama ve Filtreleme
- Not ve görevler arasında kolayca arama yapma

### 🔔 Bildirimler
- Toast mesajları ve rozet kazanma animasyonları ile anlık geri bildirimler

---

## 📸 Ekran Görüntüleri

- **İlk Ekran**  
<img width="1590" height="774" alt="ilk sayfa" src="https://github.com/user-attachments/assets/da2df0a0-bf84-463d-90d9-9afbb3673884" />

- **Giriş Ekranı**  
<img width="1595" height="777" alt="giriş sayfası" src="https://github.com/user-attachments/assets/3a9f1030-87db-48eb-87e4-9d6aed4fcfab" />

- **Kayıt Ekranı**  
<img width="1596" height="777" alt="kayıt sayfası" src="https://github.com/user-attachments/assets/9f1fb85d-d872-4b96-9c25-abadc8ba7812" />

- **Karşılama Ekranı**  
<img width="1591" height="770" alt="karşılama sayfası" src="https://github.com/user-attachments/assets/5d0f8155-9a18-4f75-80c4-f41c22855680" />

- **Genel Sayfa**  
<img width="1599" height="789" alt="genel sayfa" src="https://github.com/user-attachments/assets/6ce251f0-6f23-4f3c-b986-2f68d747c1db" />

- **Karanlık Tema**  
<img width="1588" height="776" alt="karanlık mod" src="https://github.com/user-attachments/assets/fa3e6194-2e41-45ba-9628-72b1060e5b76" />

- **Orman Teması**  
<img width="1595" height="770" alt="orman mod" src="https://github.com/user-attachments/assets/58f99988-43a9-48a8-bc26-94c466506a16" />

- **Hesap Ayarları Ekranı**  
<img width="1346" height="722" alt="hesap ayarları sayfası" src="https://github.com/user-attachments/assets/e9c5a735-3bdc-46e4-8e2a-cc95216be14a" />

- **Avatar Seçim Ekranı**  
<img width="1349" height="723" alt="avatar seçim sayfası" src="https://github.com/user-attachments/assets/8f66297b-d7fc-477f-b3af-55d6c59b7376" />

- **Rozetler Ekranı**  
<img width="1342" height="719" alt="rozetler sayfası" src="https://github.com/user-attachments/assets/0ca90d75-3c99-472d-a9e8-ee6392ff559f" />

- **Şifre Değiştirme Ekranı**  
<img width="1341" height="708" alt="şifre değiştirme sayfası" src="https://github.com/user-attachments/assets/94cab330-24bd-43a0-aaab-58aee0f3817c" />

- **Hesap Silme Ekranı**  
<img width="1337" height="717" alt="hesap silme sayfası" src="https://github.com/user-attachments/assets/5d70f3aa-7d9b-46d4-af90-36c590f1deee" />

- **hesap Silme Sonrası Ekranı**  
<img width="1588" height="752" alt="silme sonrası ekranı" src="https://github.com/user-attachments/assets/1cc2bd48-9bd2-40c1-921a-1f9aeec90a88" />

---

## 🗃️ Veritabanı Yapısı

Proje, **Flask-SQLAlchemy ORM** kullanılarak veritabanı etkileşimlerini yönetir.  
Temel modeller ve ilişkiler şu şekildedir:

- **User:** Kullanıcı bilgileri (kullanıcı adı, e-posta, şifre hash’i, avatar, silinen not sayısı)  
  → Notlar, görevler ve rozetlerle ilişkili.  
- **Note:** Kullanıcıya ait notlar (başlık, içerik, yıldız durumu, tarih bilgileri)  
  → Etiketlerle çoktan-çoğa ilişkili.  
- **Task:** Kullanıcıya ait görevler (başlık, içerik, bitiş tarihi, tamamlanma durumu, sıralama, hatırlatma)  
  → Etiketlerle çoktan-çoğa ilişkili.  
- **Tag:** Notlar ve görevler için etiketler (isim, kullanıcıya özel).  
- **Badge:** Kullanıcıların kazanabileceği başarımlar (isim, açıklama, ikon, kriter anahtarı).  
  → Kullanıcılarla çoktan-çoğa ilişkili.

Veritabanı şeması `models.py` dosyasında tanımlanmıştır ve **Flask-Migrate** ile yönetilir.

---

## 💻 Kullanılan Teknolojiler

### 🧠 Backend
- Python 3.x  
- Flask  
- Flask-SQLAlchemy (ORM)  
- PostgreSQL  
- Celery (Asenkron görevler ve e-posta hatırlatmaları için)  
- Redis (Celery broker ve backend)  
- Flask-Login  
- Flask-Migrate  
- Flask-Mail  
- Werkzeug (şifreleme ve güvenlik)  
- Bleach (HTML sanitization)

### 🎨 Frontend
- HTML5  
- CSS3 (özel temalar dahil)  
- Bootstrap 5  
- JavaScript (Vanilla JS)  
- Sortable.js (sürükle-bırak görev sıralaması)  
- Confetti.js (rozet bildirimleri)

---

## ⚙️ Kurulum

1. **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/tuba453/your-repo-name.git
    cd your-repo-name
    ```

2. **Sanal Ortam Oluşturun ve Aktif Edin:**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3. **Bağımlılıkları Yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```

4. **Ortam Değişkenlerini Ayarlayın (.env dosyası):**
    ```
    SECRET_KEY=your_secret_key_here
    DATABASE_URL=postgresql://user:password@host:port/database_name
    CELERY_BROKER_URL=redis://localhost:6379/0
    CELERY_RESULT_BACKEND=redis://localhost:6379/0
    MAIL_USERNAME=your_email@gmail.com
    MAIL_PASSWORD=your_email_app_password
    ```

5. **Veritabanını Başlatın ve Migrasyonları Uygulayın:**
    ```bash
    flask db init
    flask db migrate -m "Initial migration"
    flask db upgrade
    ```

6. **Celery Worker'ı Başlatın:**
    ```bash
    celery -A app.celery worker -l info
    ```

7. **Flask Uygulamasını Başlatın:**
    ```bash
    flask run
    ```

Uygulama şu adreste çalışacaktır:  
👉 **http://127.0.0.1:5000**

---



## 📝 Not

Bu proje, modern Python ve Flask geliştirme pratiklerine uygun olarak tasarlanmıştır.  
Temiz kod, modüler yapı ve genişletilebilirlik prensipleri ön planda tutulmuştur.
