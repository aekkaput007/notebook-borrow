import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverdueBanner from './components/OverdueBanner';
import ScannerModal from './components/ScannerModal';
import BorrowModal from './components/BorrowModal';
import ReturnModal from './components/ReturnModal';
import StickerPrintModal from './components/StickerPrintModal';
import LoginModal from './components/LoginModal';

import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import NotebooksPage from './pages/NotebooksPage';
import HistoryPage from './pages/HistoryPage';

import { api } from './utils/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [notebooks, setNotebooks] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isStickerPrintOpen, setIsStickerPrintOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeDeviceNumber, setActiveDeviceNumber] = useState('01');

  // Admin user
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('notebook_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loadData = async () => {
    try {
      const [nbRes, ovRes] = await Promise.all([
        api.getNotebooks(),
        api.getOverdue()
      ]);
      setNotebooks(nbRes.data || []);
      setOverdueItems(ovRes.data || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Check if opened with URL query e.g. /?device=01 or /?borrow=01
    const params = new URLSearchParams(window.location.search);
    const devParam = params.get('device') || params.get('borrow');
    if (devParam) {
      handleDeviceSelectForBorrow(devParam);
    }
  }, []);

  const handleDeviceSelectForBorrow = (devNum = '01') => {
    const padded = String(devNum).padStart(2, '0');
    setActiveDeviceNumber(padded);
    setIsBorrowOpen(true);
  };

  const handleDeviceSelectForReturn = (devNum = '01') => {
    const padded = String(devNum).padStart(2, '0');
    setActiveDeviceNumber(padded);
    setIsReturnOpen(true);
  };

  // Smart scanner handler
  const handleScanSuccess = async (scannedCode) => {
    setIsScannerOpen(false);
    try {
      // Lookup the scanned notebook
      const res = await api.getNotebookByIdentifier(scannedCode);
      const nb = res.data;
      if (nb.status === 'borrowed') {
        // If borrowed, open return modal
        handleDeviceSelectForReturn(nb.device_number);
      } else {
        // If available, open borrow modal
        handleDeviceSelectForBorrow(nb.device_number);
      }
    } catch (err) {
      // Fallback: try opening borrow modal with raw input
      handleDeviceSelectForBorrow(scannedCode);
    }
  };

  const handleLoginSuccess = (user) => {
    setAdminUser(user);
    localStorage.setItem('notebook_admin_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('notebook_admin_user');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Overdue alert banner if any items are overdue */}
      <OverdueBanner
        overdueItems={overdueItems}
        onOpenHistory={() => setCurrentTab('history')}
        onOpenReturn={(devNum) => handleDeviceSelectForReturn(devNum)}
      />

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        adminUser={adminUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenStickerPrint={() => setIsStickerPrintOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">กำลังเชื่อมต่อฐานข้อมูลและโหลดข้อมูลเครื่อง...</p>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <HomePage
                notebooks={notebooks}
                onOpenBorrow={(devNum) => handleDeviceSelectForBorrow(devNum)}
                onOpenReturn={(devNum) => handleDeviceSelectForReturn(devNum)}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {currentTab === 'dashboard' && (
              <AdminDashboard
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenStickerPrint={() => setIsStickerPrintOpen(true)}
                onOpenReturn={(devNum) => handleDeviceSelectForReturn(devNum)}
              />
            )}

            {currentTab === 'notebooks' && (
              <NotebooksPage
                notebooks={notebooks}
                onReloadNotebooks={loadData}
                onOpenStickerPrint={() => setIsStickerPrintOpen(true)}
                adminUser={adminUser}
                onOpenLogin={() => setIsLoginOpen(true)}
              />
            )}

            {currentTab === 'history' && (
              <HistoryPage
                onOpenReturn={(devNum) => handleDeviceSelectForReturn(devNum)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ระบบบริหารจัดการการยืม-คืน โน้ตบุ๊กสำนักงาน (01-99)</span>
          <span className="font-mono text-slate-400">Node.js + React + SQLite</span>
        </div>
      </footer>

      {/* Modals */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <BorrowModal
        isOpen={isBorrowOpen}
        onClose={() => setIsBorrowOpen(false)}
        initialDeviceNumber={activeDeviceNumber}
        onBorrowSuccess={() => loadData()}
      />

      <ReturnModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        initialDeviceNumber={activeDeviceNumber}
        onReturnSuccess={() => loadData()}
      />

      <StickerPrintModal
        isOpen={isStickerPrintOpen}
        onClose={() => setIsStickerPrintOpen(false)}
        notebooks={notebooks}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
