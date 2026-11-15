import React from 'react';
import { Laptop, BarChart3, Database, History, Camera, Printer, Lock, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({
  currentTab,
  setCurrentTab,
  adminUser,
  onOpenLogin,
  onLogout,
  onOpenScanner,
  onOpenStickerPrint
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-1.5">
                <span>Notebook Manager</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                  01-99
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">ระบบยืม-คืน โน้ตบุ๊กสำนักงาน</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'home'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>หน้าหลัก / ยืม-คืน</span>
            </button>

            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>สถิติ & แดชบอร์ด</span>
            </button>

            <button
              onClick={() => setCurrentTab('notebooks')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'notebooks'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>จัดการเครื่อง (01-99)</span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'history'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>ประวัติ & รายงาน</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Mobile Scan Camera Button */}
            <button
              onClick={onOpenScanner}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium shadow-sm transition flex items-center gap-1.5 animate-pulse"
              title="เปิดกล้องสแกนบาร์โค้ด / QR Code"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">สแกนบาร์โค้ด</span>
              <span className="sm:hidden">สแกน</span>
            </button>

            {/* Print Sticker Button */}
            <button
              onClick={onOpenStickerPrint}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition hover:bg-slate-50"
              title="พิมพ์ป้ายสติกเกอร์สำหรับติดเครื่อง 01-99"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>พิมพ์สติกเกอร์</span>
            </button>

            {/* Admin Auth Status / Button */}
            {adminUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">{adminUser.full_name}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">● เข้าสู่ระบบแล้ว</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="ออกจากระบบ Admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-100 text-xs overflow-x-auto gap-2">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentTab === 'home' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
          >
            หน้าหลัก
          </button>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentTab === 'dashboard' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
          >
            สถิติ
          </button>
          <button
            onClick={() => setCurrentTab('notebooks')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentTab === 'notebooks' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
          >
            จัดการเครื่อง
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentTab === 'history' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
          >
            ประวัติ
          </button>
          <button
            onClick={onOpenStickerPrint}
            className="px-2.5 py-1.5 rounded-lg whitespace-nowrap text-slate-600 border border-slate-200"
          >
            พิมพ์สติกเกอร์
          </button>
        </div>
      </div>
    </header>
  );
}

