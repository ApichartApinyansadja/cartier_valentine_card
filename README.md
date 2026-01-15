# Cartier Valentine Card Creator

สร้างการ์ดอวยพรวาเลนไทน์ Cartier แบบอินเทอร์แอกทีฟพร้อม Page Flip Animation

## 🚀 เทคโนโลยีที่ใช้

- **Next.js 16** (App Router + Turbopack)
- **React 19** 
- **TypeScript 5**
- **Tailwind CSS v4**
- **react-pageflip v2.0.3** (HTMLFlipBook)

## ✨ คุณสมบัติ

- ✅ 4 Steps interactive flow
- ✅ Page flip animation สำหรับเลือกสินค้า
- ✅ Dynamic form input (To, From, Message)
- ✅ Live preview พร้อม background image
- ✅ Bad word filter (16 คำหยาบ)
- ✅ Responsive design
- ✅ Non-interactive book (navigation via buttons only)

## 📋 Steps Flow

### Step 0: Welcome Screen
- หน้าต้อนรับ CARTIER Valentine's Card
- ปุ่ม "คลิกเพื่อรังสรรค์การ์ดอวยพร"

### Step 1: Product Selection
- Page Flip Book แสดง 4 สินค้า Cartier:
  - Cartier Rings (Timeless Elegance)
  - Cartier Bracelets (Luxury in Motion)
  - Cartier Watches (Time in Perfection)
  - Cartier Fragrances (Essence of Luxury)
- ปุ่ม Previous/Next เพื่อเลือก
- ปุ่ม "ตกลง" เมื่อเลือกสินค้า

### Step 2: Fill Form
- Input To: (ชื่อผู้รับ)
- Input From: (ชื่อผู้ส่ง)
- Textarea Message: (ข้อความ max 50 ตัวอักษร)
- Default message: "Happy Valentine's Day"
- ปุ่ม "เรียบร้อย" (disabled if form incomplete)
- ปุ่ม "กลับ"

### Step 3: Card Preview
- Display card พร้อม:
  - Product image as background
  - To, Message, From text overlay
  - ข้อความอยู่ชิดขอบล่าง
- ปุ่ม "กลับ", "บันทึก", "แชร์ให้เพื่อน"

## 🛠️ การติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# รัน dev server
npm run dev

# Build production
npm run build
npm start
```

เปิด [http://localhost:3000](http://localhost:3000)

## 📂 โครงสร้างโปรเจค

```
cartier_valentine_card/
├── app/
│   ├── layout.tsx
│   ├── page.tsx        # Main app (4-step flow)
│   ├── globals.css
│   └── design/
├── hooks/
│   └── useLiff.ts
├── lib/
│   └── liff.ts
├── public/
├── package.json
└── tsconfig.json
```

## 🎨 Design

- **Color Scheme**: Red & Stone gradient
- **Typography**: Serif font (elegant)
- **Layout**: Centered mobile-first
- **Animation**: 1000ms page flip transition

## 🚫 Bad Word Filter

อัตโนมัติกรองคำหยาบ 16 คำดังต่อไปนี้:
- Thai: ไอ้, อี, มึง, กู, ชั่ว, เลว, ควาย, เหี้ย, สัตว์, ไม่ดี, หยาบคาย
- English: shit, damn, hell, fuck, bitch

แทนที่ด้วย `*` ตามจำนวนตัวอักษร

## 📱 HTMLFlipBook Configuration

- Width: 400px, Height: 500px
- Animation: 1000ms flip time
- No mirror effect (single-sided)
- Click disabled (buttons only)
- Swipe disabled
- Mobile scroll disabled

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build
npm run build

# Start production server
npm start
```

## 🌟 Future Enhancements

- [ ] Save to localStorage
- [ ] Download as image
- [ ] Share via LINE
- [ ] Multiple language support
- [ ] Custom message templates

