import React, { useState } from 'react';
import { Laptop, Camera, ArrowDownLeft, ArrowUpRight, Search, CheckCircle2, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function HomePage({
  notebooks = [],
  onOpenBorrow,
  onOpenReturn,
  onOpenScanner
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notebooks
  const filteredNotebooks = notebooks.filter(nb => {
    const matchesStatus = filterStatus === 'all' || nb.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      nb.device_number.toLowerCase().includes(q) || 
      nb.serial_number.toLowerCase().includes(q) ||
      nb.brand_model.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const availableCount = notebooks.filter(n => n.status === 'available').length;
  const borrowedCount = notebooks.filter(n => n.status === 'borrowed').length;
  const maintenanceCount = notebooks.filter(n => n.status === 'maintenance').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Borrow Card */}
        <div
          onClick={() => onOpenBorrow()}
          className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 hover:shadow-xl hover:scale-[1.01] transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs group-hover:scale-110 transition">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
              พร้อมยืม {availableCount} เครื่อง
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold">ยืมโน้ตบุ๊ก</h3>
            <p className="text-indigo-100 text-xs mt-1">
              เลือกหมายเลขเครื่อง 01-99 แล้ว Serial Number จะเด้งขึ้นมาอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Return Card */}
        <div
          onClick={() => onOpenReturn()}
          className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100 hover:shadow-xl hover:scale-[1.01] transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs group-hover:scale-110 transition">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
              ถูกยืม {borrowedCount} เครื่อง
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold">คืนโน้ตบุ๊ก</h3>
            <p className="text-emerald-100 text-xs mt-1">
              สแกนหรือระบุหมายเลขเครื่องเพื่อตรวจรับคืนพร้อมตรวจสภาพ
            </p>
          </div>
        </div>

        {/* Mobile Camera Scan Card */}
        <div
          onClick={onOpenScanner}
          className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 rounded-2xl p-6 text-white shadow-lg shadow-slate-200 hover:shadow-xl hover:scale-[1.01] transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs group-hover:scale-110 transition">
              <Camera className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2.5 py-1 rounded-full">
              Mobile Camera
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>สแกนบาร์โค้ด / QR</span>
            </h3>
            <p className="text-slate-300 text-xs mt-1">
              ส่องกล้องมือถือที่ป้ายสติกเกอร์บนโน้ตบุ๊กเพื่อทำรายการทันที
            </p>
          </div>
        </div>
      </div>

      {/* Notebooks Inventory Grid Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-600" />
              <span>สถานะเครื่องโน้ตบุ๊กทั้งหมด (01-99)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่การ์ดเครื่องใดก็ได้เพื่อทำรายการ ยืม หรือ คืน เครื่องนั้นได้ทันที
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="ค้นหาเลขเครื่อง, Serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({notebooks.length})
          </button>
          <button
            onClick={() => setFilterStatus('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'available'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            พร้อมให้ยืม ({availableCount})
          </button>
          <button
            onClick={() => setFilterStatus('borrowed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'borrowed'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            กำลังถูกยืม ({borrowedCount})
          </button>
          <button
            onClick={() => setFilterStatus('maintenance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'maintenance'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            ส่งซ่อม/ชำรุด ({maintenanceCount})
          </button>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredNotebooks.map((nb) => {
            const isAvail = nb.status === 'available';
            const isBorrowed = nb.status === 'borrowed';
            const isMaint = nb.status === 'maintenance';

            return (
              <div
                key={nb.device_number}
                onClick={() => {
                  if (isAvail) onOpenBorrow(nb.device_number);
                  else if (isBorrowed) onOpenReturn(nb.device_number);
                }}
                className={`group relative rounded-xl p-3 border transition-all text-left flex flex-col justify-between ${
                  isAvail
                    ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer'
                    : isBorrowed
                    ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400 hover:shadow-md cursor-pointer'
                    : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
                style={{ minHeight: '120px' }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                      #{nb.device_number}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isAvail
                          ? 'bg-emerald-500'
                          : isBorrowed
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  <div className="mt-1 text-[11px] font-mono text-slate-500 truncate" title={nb.serial_number}>
                    {nb.serial_number}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {nb.brand_model}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${
                      isAvail
                        ? 'text-emerald-600'
                        : isBorrowed
                        ? 'text-amber-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {isAvail ? 'ว่าง' : isBorrowed ? 'กำลังยืม' : 'ส่งซ่อม'}
                  </span>

                  {isAvail && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium group-hover:bg-indigo-600 group-hover:text-white transition">
                      กดยืม
                    </span>
                  )}
                  {isBorrowed && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium group-hover:bg-emerald-600 group-hover:text-white transition">
                      กดคืน
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredNotebooks.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            ไม่พบโน้ตบุ๊กที่ตรงกับเงื่อนไขการค้นหา
          </div>
        )}
      </div>
    </div>
  );
}

