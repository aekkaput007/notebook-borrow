import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Laptop, Clock, User, Building, Phone, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

export default function ReturnModal({ isOpen, onClose, initialDeviceNumber = '', onReturnSuccess }) {
  const [deviceNumber, setDeviceNumber] = useState('');
  const [notebookInfo, setNotebookInfo] = useState(null);
  const [activeBorrow, setActiveBorrow] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [returnNotes, setReturnNotes] = useState('สภาพตัวเครื่องปกติ อุปกรณ์ครบถ้วน');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSubmitError('');
      setInfoError('');
      setReturnNotes('สภาพตัวเครื่องปกติ อุปกรณ์ครบถ้วน');

      const targetNum = initialDeviceNumber || '01';
      setDeviceNumber(targetNum);
      lookupNotebook(targetNum);
    }
  }, [isOpen, initialDeviceNumber]);

  const lookupNotebook = async (num) => {
    if (!num) return;
    setLoadingInfo(true);
    setInfoError('');
    try {
      const res = await api.getNotebookByIdentifier(num);
      setNotebookInfo(res.data);
      if (res.activeBorrow) {
        setActiveBorrow(res.activeBorrow);
      } else {
        setActiveBorrow(null);
        if (res.data.status === 'available') {
          setInfoError('โน้ตบุ๊กเครื่องนี้อยู่ในสถานะ "พร้อมใช้งาน" (ไม่ได้ถูกยืมอยู่)');
        }
      }
    } catch (err) {
      setNotebookInfo(null);
      setActiveBorrow(null);
      setInfoError('ไม่พบหมายเลขเครื่องนี้ในระบบ');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleDeviceChange = (e) => {
    const val = e.target.value;
    setDeviceNumber(val);
    lookupNotebook(val);
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!notebookInfo || !activeBorrow) {
      setSubmitError('ไม่พบรายการยืมที่ต้องคืนสำหรับเครื่องนี้');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.returnNotebook({
        device_number: notebookInfo.device_number,
        record_id: activeBorrow.id,
        notes: returnNotes.trim()
      });

      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.6 }
      });

      onReturnSuccess && onReturnSuccess(res.data);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'บันทึกการรับคืนไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">บันทึกรับคืนโน้ตบุ๊ก</h3>
              <p className="text-xs text-emerald-100">ตรวจสอบสภาพเครื่องและยืนยันการรับคืน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReturn} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Device Selection & Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-emerald-600" />
                <span>ระบุเครื่องที่ต้องการคืน</span>
              </label>
              {notebookInfo && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  notebookInfo.status === 'borrowed'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {notebookInfo.status === 'borrowed' ? '● มีรายการกำลังยืม' : '● ว่าง (ไม่ได้ถูกยืม)'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">หมายเลขเครื่อง (01-99)</label>
                <select
                  value={deviceNumber}
                  onChange={handleDeviceChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: 99 }, (_, i) => {
                    const num = String(i + 1).padStart(2, '0');
                    return (
                      <option key={num} value={num}>
                        เครื่องหมายเลข {num}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">หมายเลขประจำเครื่อง (Serial No.)</label>
                <input
                  type="text"
                  readOnly
                  value={loadingInfo ? 'กำลังโหลด...' : (notebookInfo ? notebookInfo.serial_number : '-')}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-mono text-slate-700"
                />
              </div>
            </div>

            {infoError && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                {infoError}
              </p>
            )}
          </div>

          {/* Active Borrower Information Card */}
          {activeBorrow && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase">ข้อมูลผู้ยืมในปัจจุบัน</span>
                {activeBorrow.is_overdue && (
                  <span className="text-[11px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                    เกินกำหนดส่งคืน!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">ผู้ยืม:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {activeBorrow.borrower_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">หน่วยงาน:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {activeBorrow.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">เบอร์โทร:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {activeBorrow.phone_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">กำหนดวันคืน:</span>
                  <span className={`font-semibold flex items-center gap-1 mt-0.5 ${activeBorrow.is_overdue ? 'text-rose-600' : 'text-slate-800'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {activeBorrow.expected_return_date}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Inspection / Return Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ผลการตรวจรับ / บันทึกสภาพเครื่องตอนคืน
            </label>
            <input
              type="text"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="เช่น สภาพเครื่องปกติ พร้อมสายชาร์จและกระเป๋า"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition"
            >
              ปิด
            </button>
            <button
              type="submit"
              disabled={submitting || !activeBorrow}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-md flex items-center gap-2 transition ${
                activeBorrow
                  ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'ยืนยันการรับคืนเครื่อง'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

