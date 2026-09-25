# BuildForge — PC Builder (Vue 3)

เว็บจัดสเปคคอมพิวเตอร์ตัวอย่างแบบ SPA สร้างด้วย Vue 3 + Vite

## ฟีเจอร์หลัก
- PC Builder เลือก CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler
- ตรวจสอบ compatibility ระหว่าง CPU / Mainboard / RAM / Case / PSU
- คำนวณราคารวมและงบประมาณ
- ประเมินกำลังไฟโดยประมาณ
- Performance score แบบเบื้องต้น
- Product catalog + search + category filter + sorting
- เปรียบเทียบสินค้าได้สูงสุด 4 รายการ
- บันทึก/โหลดสเปคด้วย localStorage
- Export สเปคเป็น JSON
- AI-style recommendation สำหรับจัดสเปคตามงบ (ใช้ mock logic ใน frontend)
- Dark mode
- Responsive สำหรับมือถือ
- ใช้ข้อมูลสินค้า mock ใน `src/data/products.js`

## วิธีรัน

ต้องมี Node.js 18+ หรือใหม่กว่า

```bash
npm install
npm run dev
```

จากนั้นเปิด URL ที่ Vite แสดง เช่น `http://localhost:5173`

## Build production

```bash
npm run build
npm run preview
```

## หมายเหตุ
โปรเจกต์นี้เป็น frontend prototype โดยยังไม่ได้ต่อฐานข้อมูล/API ราคาจริง หากต้องการใช้งานจริง สามารถต่อ backend/API สำหรับสินค้า ราคา สต็อก สมาชิก และระบบ login ได้
