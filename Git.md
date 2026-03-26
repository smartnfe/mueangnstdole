
# 1. ตั้งค่า Git (ครั้งแรกเท่านั้น)
git config --global user.name "smartnfe"
git config --global user.email "nakhonsinfe@gmail.com"

# 2. สร้าง Git repository ในโฟลเดอร์ (ถ้ายังไม่มี)
git init

# 3. เพิ่มไฟล์ทั้งหมด
git add .

# 4. Commit
git commit -m "Initial Reading Adventure Kingdom game"

# 5. เพิ่ม remote (thay URL ด้วย repo ของคุณ)
git remote add origin https://github.com/smartnfe/mueangnstdole

# 6. Push ขึ้น Github
git branch -M main
git push -u origin main