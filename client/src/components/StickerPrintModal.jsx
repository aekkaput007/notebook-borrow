import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Filter, Laptop, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';

function BarcodeCanvas({ text }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && text) {
      try {
        JsBarcode(canvasRef.current, text, {
          format: 'CODE128',
          width: 1.4,
          height: 38,
          displayValue: true,
          fontSize: 10,
          margin: 4
        });
      } catch (err) {
        console.warn('JsBarcode render error:', err);
      }
    }
  }, [text]);

  return <canvas ref={canvasRef} className="max-w-full" />;
}

export default function StickerPrintModal({ isOpen, onClose, notebooks = [] }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'range', 'single'
  const [selectedSingle, setSelectedSingle] = useState('01');
  const [rangeStart, setRangeStart] = useState('1');
  const [rangeEnd, setRangeEnd] = useState('10');

  if (!isOpen) return null;

  // Filter notebooks to display
  let printableNotebooks = [...notebooks];
  if (filterMode === 'single') {
    printableNotebooks = notebooks.filter(n => n.device_number === selectedSingle);
  } else if (filterMode === 'range') {
    const start = parseInt(rangeStart, 10) || 1;
    const end = parseInt(rangeEnd, 10) || 99;
    printableNotebooks = notebooks.filter(n => {
      const num = parseInt(n.device_number, 10);
      return num >= start && num <= end;
    });
  }

  const handlePrint = () => {
    window.print();
  };

  const getBorrowUrl = (deviceNumber) => {
    // Current base URL + ?device=XX
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/?device=${deviceNumber}`;
    }
    return `/?device=${deviceNumber}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header - Not printed */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">พิมพ์ป้ายสติกเกอร์บาร์โค้ด & QR Code ประจำเครื่อง</h3>
              <p className="text-xs text-slate-400">สำหรับติดบนตัวเครื่องโน้ตบุ๊ก 01-99 สแกนผ่านมือถือได้ทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar - Not printed */}
        <div className="print:hidden bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-4 text-sm">
            <span className="font-medium text-slate-700 flex items-center gap-1">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>เลือกพิมพ์:</span>
            </span>

            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="radio"
                name="filterMode"
                value="all"
                checked={filterMode === 'all'}
                onChange={() => setFilterMode('all')}
                className="text-indigo-600"
              />
              <span>ทั้งหมด ({notebooks.length} เครื่อง)</span>
            </label>

            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="radio"
                name="filterMode"
                value="range"
                checked={filterMode === 'range'}
                onChange={() => setFilterMode('range')}
                className="text-indigo-600"
              />
              <span>ตามช่วงลำดับ</span>
            </label>

            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="radio"
                name="filterMode"
                value="single"
                checked={filterMode === 'single'}
                onChange={() => setFilterMode('single')}
                className="text-indigo-600"
              />
              <span>เครื่องเดียว</span>
            </label>
          </div>

          {filterMode === 'range' && (
            <div className="flex items-center space-x-2 text-xs">
              <span>ตั้งแต่หมายเลข</span>
              <input
                type="number"
                min="1"
                max="99"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded"
              />
              <span>ถึง</span>
              <input
                type="number"
                min="1"
                max="99"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded"
              />
            </div>
          )}

          {filterMode === 'single' && (
            <div className="flex items-center space-x-2 text-xs">
              <span>เลือกเครื่อง:</span>
              <select
                value={selectedSingle}
                onChange={(e) => setSelectedSingle(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
              >
                {notebooks.map(n => (
                  <option key={n.device_number} value={n.device_number}>
                    เครื่อง {n.device_number} ({n.serial_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 transition ml-auto"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์สติกเกอร์ (Print)</span>
          </button>
        </div>

        {/* Printable Area */}
        <div id="printable-sticker-area" className="p-6 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
            {printableNotebooks.map((nb) => (
              <div
                key={nb.device_number}
                className="border-2 border-slate-800 rounded-xl p-3 bg-white shadow-xs flex flex-col justify-between print:border-black print:rounded-lg print:break-inside-avoid print:shadow-none"
                style={{ minHeight: '180px' }}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 tracking-wide uppercase">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>ทรัพย์สินสำนักงาน</span>
                  </div>
                  <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                    NO. {nb.device_number}
                  </span>
                </div>

                {/* Middle Info + QR & Barcode */}
                <div className="flex items-center justify-between gap-2 my-1">
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-medium">หมายเลขประจำเครื่อง (S/N)</div>
                    <div className="font-mono text-xs font-bold text-slate-900 tracking-tight select-all">
                      {nb.serial_number}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      รุ่น: <span className="font-medium">{nb.brand_model}</span>
                    </div>

                    {/* Barcode */}
                    <div className="mt-1">
                      <BarcodeCanvas text={nb.device_number} />
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center bg-slate-50 p-1.5 rounded-lg border border-slate-200 shrink-0">
                    <QRCodeSVG
                      value={getBorrowUrl(nb.device_number)}
                      size={74}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="text-[8px] font-semibold text-indigo-700 mt-1">
                      สแกนเพื่อยืม
                    </span>
                  </div>
                </div>

                {/* Footer instructions */}
                <div className="border-t border-slate-300 pt-1 text-[9px] text-slate-500 flex justify-between items-center">
                  <span>โปรดดูแลรักษาอุปกรณ์</span>
                  <span className="font-mono text-[8px]">ID: {nb.device_number}</span>
                </div>
              </div>
            ))}
          </div>

          {printableNotebooks.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              ไม่พบเครื่องที่ตรงกับเงื่อนไขการพิมพ์
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

