# Inkwell — Видеодемонстрация бўйича yo'riqnoma (VIDEO GUIDE)

Ushbu yo'riqnoma `task.txt` (ТЗ) talablariga mos ravishda 3–5 daqiqalik video-namoyishni muvaffaqiyatli va professional tarzda yozib olish uchun mo'ljallangan.

---

## 📋 Videoga qo'yilgan asosiy talablar (ТЗ bo'yicha)

1. **Davomiyligi:** 3–5 daqiqa.
2. **Asosiy nuqtalar (Must-have):**
   - **Real-time collaboration:** 2 ta foydalanuvchi (2 ta brauzer oynasi) bir vaqtda hujjatni tahrirlashi, kursorlar va ishtirokchilar ko'rinishi.
   - **Offline mode & Merge:** Tarmoqni o'chirish → oflayn tahrirlash → tarmoqni qayta yoqish → ma'lumotlar yo'qolmasdan va nizosiz (without conflict/overwriting) avtomatik birlashishi.
   - **UI/UX & Dizayn:** Loyihaning o'ziga xos mualliflik dizayni (Inkwell — qog'oz, siyoh, latun, dengiz to'lqini stilistikasi).

---

## 🚀 Videoni yozib olishdan oldin tayyorgarlik

### 1. Server va Client-ni ishga tushirish
Ikkita terminal oynasini oching:

**1-terminal (Server):**
```bash
cd server
npm start
```
*(Server `http://localhost:4000` va WebSocket `ws://localhost:4000/ws` manzilida ishga tushadi)*

**2-terminal (Client):**
```bash
cd client
npm run dev
```
*(Client `http://localhost:5173` manzilida ishga tushadi)*

### 2. Brauzer oynalarini joylashtirish
- Ekranni teng 2 qismga bo'ling (Chap tomonda 1-oyna, O'ng tomonda 2-oyna).
- Chap oynada: `http://localhost:5173` (masalan, Oddiy rejim).
- O'ng oynada: `http://localhost:5173` (masalan, Incognito / Maxfiy rejim yoki boshqa brauzer).

---

## 🎬 Video Ssenariysi (Step-by-step Timeline)

### ⏱ 0:00 – 0:30 | Kirish va Loyiha taqdimoti
* **Ekran:** Bosh sahifa (Hujjatlar ro'yxati).
* **Nima deyish/tushuntirish kerak:**
  - *"Assalomu alaykum! Bu Inkwell loyihasi — Google Docs muqobili bo'lgan real-time birgalikda tahrirlash va oflayn ishlash tizimiga ega hujjatlar muharriri."*
  - *"Dizayn mutlaqo mualliflik dizayni bo'lib, 'yozuv stoli va siyoh' estetikasida (Warm Paper, Ink, Marine Accent) yaratilgan."*
* **Harakat:** Chap oynada **"+ Новый документ"** (Yangi hujjat) tugmasini bosing va hosil bo'lgan hujjat havolasini (URL) o'ng oynaga nusxalab o'ting.

---

### ⏱ 0:30 – 1:40 | Real-time Birgalikda Tahrirlash va Kursorlar
* **Ekran:** Chap va o'ng oynada bir xil hujjat ochiq.
* **Nima deyish/tushuntirish kerak:**
  - *"Tizimda real-time muloqot uchun Yjs (CRDT) va WebSocket qo'llanilgan. Oynaning yuqori o'ng burchagida faol ishtirokchilar va ularning rangli avatarlari ko'rinadi."*
* **Harakat:**
  1. Chap oynada sarlavha va bir necha qator matn yozing — o'ng oynada bu o'zgarishlar real-vaqtda darhol paydo bo'lishini ko'rsating.
  2. O'ng oynadagi kursor va ajratib ko'rsatish (selection) chap oynada boshqa foydalanuvchining ismi va unga ajratilgan maxsus rang bilan ko'rinishini namoyish eting.
  3. Matnni formatlang: **Bold**, *Italic*, sarlavha (H1/H2), va matn rangini / marker rangi (Highlight) ni o'zgartirib ko me'yorda ishlashini ko'rsating.

---

### ⏱ 1:40 – 3:30 | Oflayn Rejim va Avtomatik Merge (Asosiy Sinov)
* **Ekran:** Chap va o'ng oynalar yonma-yon.
* **Nima deyish/tushuntirish kerak:**
  - *"Endi loyihaning eng muhim qismi — oflayn rejim va ma'lumotlarni nizo (conflict) siz birlashtirishni sinab ko'ramiz."*
* **Harakat (Bosqichma-bosqich):**
  1. **Internetni uzish (Chap oynada):** Chap oynada `F12` (DevTools) bosing → **Network** varag'iga o'ting → **No throttling** o'rniga **Offline** tanlang.
  2. **Indikatorni ko'rsatish:** Chap oynada sarlavha yonidagi indikator **"Офлайн — правки сохраняются локально"** holatiga o'tadi.
  3. **Oflayn tahrirlash:** Chap oynada (internet yo'q holatda) yangi paragraf yoki vazifalar ro'yxatini (Task List) yozing. Barcha o'zgarishlar brauzerning **IndexedDB** xotirasiga avtomatik yoziladi.
  4. **Paralel tahrirlash:** Shu vaqtning o'zida o'ng oynada (onlayn foydalanuvchi) hujjatning boshqa joyiga yangi matn yoki sarlavha qo'shing.
  5. **Internetni qayta yoqish:** Chap oynadagi DevTools'da **Offline** ni qaytarib **Online** (No throttling) ga o'tkazing.
  6. **Natijani ko me'yorga keltirish:** Indikator **"Синхронизация..."** bo'lib, so'ng **"В сети — изменения сохранены"** ga o'tadi. 
  7. **Merge natijasi:** Chap va o'ng oynada ikkala foydalanuvchining oflayn va onlayn qilgan barcha tuzatishlari biron bir harf yo'qolmasdan va bir-birini ustiga yozib yubormasdan mukammal birlashganini (merge bo'lganini) ta'kidlang!

---

### ⏱ 3:30 – 4:00 | Xotira (SQLite) va Yakun
* **Ekran:** Bosh sahifaga qaytish.
* **Harakat:**
  1. Chap va o'ng oynada chap yuqoridagi **"←"** tugmasini bosib hujjatlar ro'yxatiga qayting.
  2. Yaratilgan hujjat ro'yxatda paydo bo'lganini, oxirgi o'zgarishlar SQLite bazasida va har bir mijoz brauzerida saqlanganini ko'rsating.
* **Yakuniy so'z:**
  - *"Loyiha architecture va kodi clean, y-indexeddb, WebSocket va node:sqlite texnologiyalarida to'liq ТЗ talablariga mos yaratildi. E'tiboringiz uchun rahmat!"*

---

## 🎥 Videoni yozib olish uchun tavsiya etiladigan dasturlar

- **Windows Game Bar:** `Win + Alt + R` (Standart va juda qulay).
- **OBS Studio:** Ekranni 1080p sifatda yozib olish uchun eng yaxshi tezochar dastur.
- **Loom / Screenity:** Brauzer kengaytmasi orqali tezda yozib olib havola berish uchun.

---

## Check-list (Topsirishdan oldin):
- [x] Server va Client xatosiz ishlayapti.
- [x] Real-time muloqot va kursorlar ishlayapti.
- [x] Oflayn rejim va IndexedDB merge ishlayapti.
- [x] README.md to'liq va tushunarli.
- [x] Video 3-5 daqiqa oralig'ida yozib olindi.
