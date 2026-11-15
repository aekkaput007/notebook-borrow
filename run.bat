@echo off
chcp 65001 > nul
echo ========================================================
echo   ระบบบันทึกข้อมูลการยืม - คืน โน้ตบุ๊ก (01-99)
echo   Notebook Borrow & Return Management System
echo ========================================================
echo.
echo กำลังเริ่มต้นระบบเซิร์ฟเวอร์...
echo.

start "" "http://localhost:3001"
node server/index.js
pause

