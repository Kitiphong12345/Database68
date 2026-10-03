USE pc_builder;

-- สำหรับฐานข้อมูลที่ยังไม่มีคอลัมน์เหล่านี้
ALTER TABLE products
  ADD COLUMN previous_price DECIMAL(12,2) NULL AFTER price,
  ADD COLUMN change_note VARCHAR(255) NULL AFTER image_url;
