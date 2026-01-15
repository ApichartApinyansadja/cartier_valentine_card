# Cartier Valentine Card - LINE LIFF App

โปรเจค Next.js สำหรับสร้างการ์ดวาเลนไทน์ผ่าน LINE LIFF

## 🚀 เทคโนโลยีที่ใช้

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** (Mobile-first design)
- **LINE LIFF SDK** (@line/liff)

## 📱 คุณสมบัติ

- ✅ Mobile-first responsive design (320px-768px)
- ✅ LINE LIFF integration
- ✅ TypeScript สำหรับ type safety
- ✅ Tailwind CSS สำหรับ styling
- ✅ การจัดการ LIFF state ด้วย custom hooks

## 🛠️ การติดตั้ง

1. ติดตั้ง dependencies
```bash
npm install
```

2. สร้างไฟล์ `.env` จาก `.env.example`
```bash
cp .env.example .env
```

3. เพิ่ม LIFF ID ของคุณใน `.env`
```
NEXT_PUBLIC_LIFF_ID=your-liff-id-here
```

## 🚀 การรันโปรเจค

### Development Mode
```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

## 📂 โครงสร้างโปรเจค

```
cartier_valentine_card/
├── app/
│   ├── layout.tsx      # Root layout (Mobile-optimized)
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── hooks/
│   └── useLiff.ts      # Custom LIFF hook
├── lib/
│   └── liff.ts         # LIFF utilities
├── public/             # Static assets
└── .env.example        # Environment variables template
```

## 🔧 LIFF Configuration

1. สร้าง LIFF app ใน [LINE Developers Console](https://developers.line.biz/)
2. คัดลอก LIFF ID
3. เพิ่มใน `.env`
4. ตั้งค่า Endpoint URL ใน LIFF console เป็น URL ของโปรเจคคุณ

## 📱 Mobile-First Design

โปรเจคนี้ออกแบบสำหรับมือถือเป็นหลัก:
- Viewport optimized สำหรับอุปกรณ์มือถือ
- Responsive breakpoints ด้วย Tailwind CSS
- Touch-friendly UI components
- Mobile performance optimization

## 🎨 Tailwind CSS

ใช้ Tailwind CSS v4 พร้อม:
- Custom color scheme (Rose/Pink theme)
- Mobile-first utilities
- Responsive design patterns

## 📝 หมายเหตุ

- ต้องใช้ Node.js 18+ 
- ทดสอบใน LINE app สำหรับ LIFF features
- สำหรับ production ควร deploy บน HTTPS

## 🔗 เอกสารเพิ่มเติม

- [Next.js Documentation](https://nextjs.org/docs)
- [LINE LIFF Documentation](https://developers.line.biz/en/docs/liff/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
