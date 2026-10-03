# BuildForge — PC Builder (Vue 3 + MySQL)

เว็บจัดสเปคคอมพิวเตอร์ด้วย Vue 3 + Vite พร้อม API/Database สำหรับ Categories และ Products

## สิ่งที่เพิ่ม/แก้ในรอบนี้
- หน้า **Admin Login** ก่อนเข้าเมนูจัดการสินค้า
- Admin สามารถเพิ่มสินค้า แก้ไขราคา/สินค้า และลบสินค้าได้
- เมื่อเปลี่ยนราคา ระบบเก็บราคาเดิมใน `previous_price` และหมายเหตุใน `change_note` เพื่อแสดง “จุดเปลี่ยนราคา”
- เอา **Database Error / ข้อความเชื่อมต่อ Database ไม่สำเร็จ** ออกจากหน้า Admin แล้ว
- เอา **Attributes JSON** และช่องกรอก Attributes ออกจากหน้า Admin และ Database
- ดึง **Categories และ Products จาก MySQL Database** ผ่าน API `/api/categories` และ `/api/products`
- หน้า builder เหลือ **บันทึกสเปค** และเอา My Gaming PC / Export ออก
- สินค้าใน catalog คลิกเพื่อดูรายละเอียดได้

## Admin Login
ค่าเริ่มต้นสำหรับการพัฒนา:

- Username: `admin`
- Password: `admin123`

สามารถเปลี่ยนได้ด้วย environment variables:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=เปลี่ยนเป็นรหัสของคุณ
```

> สำหรับ production ควรใช้รหัสผ่านจาก secret manager และเปลี่ยนระบบ session แบบ in-memory เป็น session/JWT ที่เหมาะกับการ deploy จริง

## ตั้งค่า Database
1. สร้างฐานข้อมูลด้วย `pc-builder/database/schema.sql`
2. ถ้ามีฐานข้อมูลเดิมจากเวอร์ชันก่อนหน้า ให้รัน `pc-builder/database/migrations/002_remove_attributes.sql` เพื่อลบ Attributes JSON (และใช้ 001 เฉพาะกรณีที่ยังไม่มี previous_price/change_note)
3. ตั้งค่า `pc-builder/server/.env` ตามตัวอย่างใน `.env.example`

ตัวอย่าง:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=pc_builder
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## รันระบบ

Terminal 1:
```bash
cd backend
npm install
npm run dev
```

Terminal 2:
```bash
cd pc-builder
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง เช่น `http://localhost:5173`

## ทดสอบ Categories จาก Database
- เปิดเมนู **Admin** และเข้าสู่ระบบ
- หน้า Admin จะโหลด Categories และ Products ผ่าน API โดยตรง
- API `GET /api/categories` ใช้ข้อมูลจากตาราง `categories`
- API `GET /api/products` ใช้ข้อมูลจากตาราง `products`

API สำคัญ:
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/categories`
- `GET /api/products`
- `POST /api/products` (Admin)
- `PUT /api/products/:id` (Admin)
- `DELETE /api/products/:id` (Admin)

## Admin Login
Admin Login is handled locally in the Vue frontend and does not call `/api/admin/login`.
- Username: `admin`
- Password: `admin123`

The product management API remains available for CRUD operations and no longer requires an Admin API token.
