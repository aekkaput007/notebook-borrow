import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, Search, AlertCircle } from 'lucide-react';

export default function ScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setErrorMsg('');
    // Discover cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to back camera if available (usually contains 'back' or 'environment')
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        const defaultCamId = backCamera ? backCamera.id : devices[devices.length - 1].id;
        setSelectedCameraId(defaultCamId);
        startScanner(defaultCamId);
      } else {
        setErrorMsg('ไม่พบกล้องในอุปกรณ์นี้ คุณสามารถพิมพ์หมายเลขเครื่องได้ที่ช่องด้านล่าง');
      }
    }).catch(err => {
      console.warn('Camera get error:', err);
      setErrorMsg('ไม่สามารถเข้าถึงกล้องได้ (กรุณาอนุญาตสิทธิ์การเข้าถึงกล้อง) หรือสามารถพิมพ์หมายเลขเครื่องได้ที่ด้านล่าง');
    });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async (cameraId) => {
    try {
      await stopScanner();
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          // Success callback
          handleDetected(decodedText);
        },
        () => {
          // Frame error (ignore, normal while scanning)
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Start scanner error:', err);
      setErrorMsg('ไม่สามารถเปิดใช้งานกล้องนี้ได้: ' + (err.message || 'ข้อผิดพลาดระบบ'));
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Stop scanner warn:', err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const handleDetected = (rawText) => {
    let cleanCode = rawText.trim();
    
    // Check if QR code is a URL (e.g., http://.../?device=01 or /borrow/01)
    if (cleanCode.includes('device=')) {
      const match = cleanCode.match(/device=([A-Za-z0-9_-]+)/);
      if (match && match[1]) cleanCode = match[1];
    } else if (cleanCode.startsWith('NB-') || cleanCode.startsWith('nb-')) {
      cleanCode = cleanCode.substring(3);
    }

    stopScanner();
    onScanSuccess(cleanCode);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleDetected(manualInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-lg">สแกนบาร์โค้ด / QR Code</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Scanner View */}
        <div className="p-4 bg-slate-100 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[320px] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            <div id="qr-reader-container" className="w-full h-full"></div>
            
            {/* Visual Guide Border */}
            <div className="pointer-events-none absolute inset-8 border-2 border-dashed border-indigo-400/70 rounded-lg flex items-center justify-center">
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-xs">
                จัดให้บาร์โค้ดอยู่ตรงกลางกรอบ
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 w-full p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Camera switch if multiple */}
          {cameras.length > 1 && (
            <div className="mt-3 flex items-center space-x-2 text-xs text-slate-600">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>สลับกล้อง:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startScanner(e.target.value);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              >
                {cameras.map(cam => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `กล้อง ${cam.id.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Fallback Manual Input */}
        <div className="p-5 border-t border-slate-200 bg-white">
          <p className="text-xs font-medium text-slate-500 mb-2">หรือกรอกหมายเลขเครื่อง / Serial Number ด้วยตนเอง:</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="เช่น 01 หรือ SN-DELL-..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-1 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>ค้นหา</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

