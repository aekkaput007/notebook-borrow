import * as XLSX from 'xlsx';

export function exportRecordsToExcel(records, filename = 'รายงานการยืมคืน_โน้ตบุ๊ก') {
  if (!records || records.length === 0) {
    alert('ไม่มีข้อมูลสำหรับ Export');
    return;
  }

  // Format data for Excel
  const excelData = records.map((r, index) => {
    let statusTh = 'กำลังยืม';
    if (r.status === 'returned') statusTh = 'คืนแล้ว';
    else if (r.is_overdue) statusTh = 'เกินกำหนดคืน (เตือน)';

    return {
      'ลำดับ': index + 1,
      'หมายเลขเครื่อง': r.device_number,
      'หมายเลขประจำเครื่อง (Serial)': r.serial_number,
      'ชื่อ-นามสกุล ผู้ยืม': r.borrower_name,
      'หน่วยงาน/แผนก': r.department,
      'เบอร์โทรศัพท์': r.phone_number,
      'วันที่ยืม': r.borrow_date,
      'กำหนดวันคืน': r.expected_return_date,
      'วันที่คืนจริง': r.actual_return_date || '-',
      'สถานะ': statusTh,
      'วัตถุประสงค์': r.purpose || '-',
      'หมายเหตุ': r.notes || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 15 }, // หมายเลขเครื่อง
    { wch: 22 }, // Serial
    { wch: 22 }, // ชื่อผู้ยืม
    { wch: 22 }, // แผนก
    { wch: 16 }, // เบอร์โทร
    { wch: 20 }, // วันที่ยืม
    { wch: 15 }, // กำหนดวันคืน
    { wch: 20 }, // วันที่คืนจริง
    { wch: 18 }, // สถานะ
    { wch: 25 }, // วัตถุประสงค์
    { wch: 30 }, // หมายเหตุ
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ประวัติการยืมคืน');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}_${today}.xlsx`);
}

export function exportRecordsToCSV(records, filename = 'รายงานการยืมคืน_โน้ตบุ๊ก') {
  if (!records || records.length === 0) {
    alert('ไม่มีข้อมูลสำหรับ Export');
    return;
  }

  const excelData = records.map((r, index) => ({
    'ลำดับ': index + 1,
    'หมายเลขเครื่อง': r.device_number,
    'หมายเลขประจำเครื่อง': r.serial_number,
    'ชื่อผู้ยืม': r.borrower_name,
    'หน่วยงาน': r.department,
    'เบอร์โทร': r.phone_number,
    'วันที่ยืม': r.borrow_date,
    'กำหนดวันคืน': r.expected_return_date,
    'วันที่คืนจริง': r.actual_return_date || '-',
    'สถานะ': r.is_overdue ? 'เกินกำหนดคืน' : (r.status === 'returned' ? 'คืนแล้ว' : 'กำลังยืม'),
    'วัตถุประสงค์': r.purpose || '-',
    'หมายเหตุ': r.notes || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  // Add UTF-8 BOM so Thai characters show correctly in Excel CSV
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

