import React, { useEffect, useState } from 'react';
import { History, Search, Filter, FileSpreadsheet, Download, RefreshCw, Calendar, CheckCircle2, Clock, AlertTriangle, Phone, Building, User } from 'lucide-react';
import { api } from '../utils/api';
import { exportRecordsToExcel, exportRecordsToCSV } from '../utils/exportExcel';

export default function HistoryPage({ onOpenReturn }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getRecords({
        q: searchQuery,
        status: statusFilter,
        startDate,
        endDate
      });
      setRecords(res.data);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลประวัติได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [statusFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRecords();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            <span>ประวัติและรายงานการยืม-คืน โน้ตบุ๊ก</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ค้นหาและกรองข้อมูลตามชื่อผู้ยืม, แผนก, เบอร์โทร, หมายเลขเครื่อง พร้อม Export รายงาน
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportRecordsToExcel(records)}
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm shadow-emerald-100"
            title="ดาวน์โหลดเป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export เป็น Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportRecordsToCSV(records)}
            className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
            title="ดาวน์โหลดเป็นไฟล์ CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="ค้นหา: ชื่อผู้ยืม, แผนก, เบอร์โทร, เลขเครื่อง, Serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="borrowed">กำลังยืม (ยังไม่คืน)</option>
              <option value="returned">คืนแล้วเรียบร้อย</option>
              <option value="overdue">เกินกำหนดคืน (เตือน)</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ค้นหา</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
              title="ล้างตัวกรอง"
            >
              ล้าง
            </button>
          </div>
        </form>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>กรองตามวันที่ยืม:</span>
          </span>
          <div className="flex items-center gap-1">
            <span>จาก</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <span>ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <span className="text-[11px] text-slate-400 ml-auto">
            พบข้อมูลทั้งหมด <strong>{records.length}</strong> รายการ
          </span>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-xs">
            <Clock className="w-4 h-4 animate-spin mr-2" />
            <span>กำลังโหลดข้อมูลประวัติ...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">เครื่อง</th>
                  <th className="px-4 py-3.5">หมายเลขประจำเครื่อง (Serial No.)</th>
                  <th className="px-4 py-3.5">ชื่อ-นามสกุล ผู้ยืม</th>
                  <th className="px-4 py-3.5">หน่วยงาน / แผนก</th>
                  <th className="px-4 py-3.5">เบอร์โทรศัพท์</th>
                  <th className="px-4 py-3.5">วันที่ยืม</th>
                  <th className="px-4 py-3.5">กำหนดคืน</th>
                  <th className="px-4 py-3.5">วันที่คืนจริง</th>
                  <th className="px-4 py-3.5">สถานะ</th>
                  <th className="px-4 py-3.5">วัตถุประสงค์</th>
                  <th className="px-4 py-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      #{r.device_number}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 select-all font-semibold">
                      {r.serial_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{r.borrower_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{r.department}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{r.phone_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {r.borrow_date || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      <span className={r.is_overdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                        {r.expected_return_date}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {r.actual_return_date || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.status === 'returned' ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                          ✓ คืนแล้ว
                        </span>
                      ) : r.is_overdue ? (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold text-[11px] animate-pulse">
                          ⚠ เกินกำหนด
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                          ● กำลังยืม
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={r.purpose}>
                      {r.purpose || '-'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {r.status === 'borrowed' && (
                        <button
                          onClick={() => onOpenReturn && onOpenReturn(r.device_number)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 transition"
                        >
                          รับคืน
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && records.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">
            ไม่พบประวัติการยืม-คืนตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>
    </div>
  );
}

