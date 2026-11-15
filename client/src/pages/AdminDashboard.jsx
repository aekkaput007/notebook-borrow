import React, { useEffect, useState } from 'react';
import { BarChart3, Laptop, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, TrendingUp, Building, User, Calendar, ShieldCheck, Printer, FileSpreadsheet } from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboard({ onNavigateTab, onOpenStickerPrint, onOpenReturn }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.getStats();
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดสถิติได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        <Clock className="w-5 h-5 animate-spin mr-2" />
        <span>กำลังคำนวณสถิติภาพรวม...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
        {error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'}
      </div>
    );
  }

  const {
    totalNotebooks,
    availableNotebooks,
    borrowedNotebooks,
    maintenanceNotebooks,
    totalBorrows,
    overdueCount,
    deptStats = [],
    topNotebooks = [],
    recentActivity = []
  } = stats;

  const maxDeptCount = deptStats.length > 0 ? Math.max(...deptStats.map(d => d.count), 1) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>แดชบอร์ดและสถิติภาพรวม (Admin Analytics)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ภาพรวมการใช้งานเครื่องโน้ตบุ๊ก อัตราการยืม และสถานะประจำวัน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('history')}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export ข้อมูล</span>
          </button>
          <button
            onClick={onOpenStickerPrint}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์สติกเกอร์ 01-99</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">โน้ตบุ๊กทั้งหมด</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalNotebooks}</div>
            <span className="text-[11px] text-slate-400">หมายเลข 01 - 99</span>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
            <Laptop className="w-6 h-6" />
          </div>
        </div>

        {/* Available */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-700">พร้อมให้ยืม (ว่าง)</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{availableNotebooks}</div>
            <span className="text-[11px] text-emerald-700">
              {totalNotebooks ? Math.round((availableNotebooks / totalNotebooks) * 100) : 0}% ของทั้งหมด
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Borrowed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-amber-700">กำลังถูกยืม</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{borrowedNotebooks}</div>
            <span className="text-[11px] text-amber-700">ยืมสะสม {totalBorrows} ครั้ง</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-rose-700">เกินกำหนดส่งคืน</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{overdueCount}</div>
            <span className="text-[11px] text-rose-600 font-semibold">
              {overdueCount > 0 ? 'ต้องติดตามเร่งด่วน' : 'ไม่มีรายการค้าง'}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${overdueCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Statistics Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>สถิติการยืมแยกตามหน่วยงาน / แผนก</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Top Departments</span>
          </div>

          <div className="space-y-3 pt-2">
            {deptStats.map((dept, idx) => {
              const percentage = Math.round((dept.count / maxDeptCount) * 100);
              return (
                <div key={dept.department} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800">{dept.department}</span>
                    <span className="text-indigo-600 font-bold">{dept.count} ครั้ง</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {deptStats.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">ยังไม่มีข้อมูลสถิติ</div>
            )}
          </div>
        </div>

        {/* Top Borrowed Notebooks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>โน้ตบุ๊กที่มีอัตราการยืมสูงสุด</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Most Utilized</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {topNotebooks.map((nb, i) => (
              <div
                key={nb.device_number}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">เครื่อง #{nb.device_number}</div>
                    <div className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                      {nb.serial_number}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {nb.count} ครั้ง
                </span>
              </div>
            ))}

            {topNotebooks.length === 0 && (
              <div className="col-span-2 text-center py-8 text-xs text-slate-400">ยังไม่มีข้อมูล</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>รายการเคลื่อนไหวล่าสุด (Recent Activity)</span>
          </h3>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <span>ดูประวัติทั้งหมด</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">เครื่อง</th>
                <th className="px-4 py-3">ผู้ยืม</th>
                <th className="px-4 py-3">หน่วยงาน</th>
                <th className="px-4 py-3">วันที่ยืม</th>
                <th className="px-4 py-3">กำหนดคืน</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    #{r.device_number}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {r.borrower_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.department}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.borrow_date ? r.borrow_date.split(' ')[0] : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.expected_return_date}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'returned' ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
                        คืนแล้ว
                      </span>
                    ) : r.is_overdue ? (
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold text-[11px] animate-pulse">
                        เกินกำหนด
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
                        กำลังยืม
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'borrowed' && (
                      <button
                        onClick={() => onOpenReturn && onOpenReturn(r.device_number)}
                        className="text-[11px] px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
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
      </div>
    </div>
  );
}

