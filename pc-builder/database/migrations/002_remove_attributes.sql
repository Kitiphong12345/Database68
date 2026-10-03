USE pc_builder;

-- ใช้กับฐานข้อมูลเดิมจากเวอร์ชันที่มี Attributes JSON
ALTER TABLE products DROP COLUMN IF EXISTS attributes;
