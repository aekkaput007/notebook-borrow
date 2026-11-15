import React, { useState, useEffect } from 'react';
import { X, Laptop, User, Building, Phone, Calendar, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

export default function BorrowModal({ isOpen, onClose, initialDeviceNumber = '', onBorrowSuccess }) {
  const [deviceNumber, setDeviceNumber] = useState('');
  const [notebookInfo, setNotebookInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState('');

  // Form Fields
  const [borrowerName, setBorrowerName] = useState('');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Pre-set default expected return date to 3 days ahead
  useEffect(() => {
    if (isOpen) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 3);
      setExpectedReturnDate(targetDate.toISOString().split('T')[0]);
      setSubmitError('');
      setInfoError('');

      if (initialDeviceNumber) {
        setDeviceNumber(initialDeviceNumber);
        lookupNotebook(initialDeviceNumber);
      } else {
        setDeviceNumber('01');
        lookupNotebook('01');
      }
    }
  }, [isOpen, initialDeviceNumber]);

  // Lookup notebook whenever deviceNumber changes
  const lookupNotebook = async (num) => {
    if (!num) {
      setNotebookInfo(null);
      return;
    }
    setLoadingInfo(true);
    setInfoError('');
    try {
      const res = await api.getNotebookByIdentifier(num);
      setNotebookInfo(res.data);
      if (res.data.status === 'borrowed') {
        setInfoError(`เครื่องนี้กำลังถูกยืมอยู่โดย ${res.activeBorrow ? res.activeBorrow.borrower_name : 'ผู้อื่น'}`);
      } else if (res.data.status === 'maintenance') {
        setInfoError('เครื่องนี้อยู่ในระหว่างส่งซ่อม/ชำรุด ไม่สามารถยืมได้');
      }
    } catch (err) {
      setNotebookInfo(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notebookInfo) {
      setSubmitError('กรุณาเลือกหมายเลขเครื่องที่ถูกต้อง');
      return;
    }

    if (notebookInfo.status !== 'available') {
      setSubmitError('เครื่องนี้ไม่พร้อมให้ยืมในขณะนี้');
      return;
    }

    if (!borrowerName.trim() || !department.trim() || !phoneNumber.trim() || !expectedReturnDate) {
      setSubmitError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.borrowNotebook({
        device_number: notebookInfo.device_number,
        borrower_name: borrowerName.trim(),
        department: department.trim(),
        phone_number: phoneNumber.trim(),
        expected_return_date: expectedReturnDate,
        purpose: purpose.trim(),
        notes: notes.trim()
      });

      // Celebration effect!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Reset form
      setBorrowerName('');
      setDepartment('');
      setPhoneNumber('');
      setPurpose('');
      setNotes('');
      onBorrowSuccess && onBorrowSuccess(res.data);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'บันทึกการยืมไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">แบบฟอร์มยืมคอมพิวเตอร์โน้ตบุ๊ก</h3>
              <p className="text-xs text-indigo-100">กรอกข้อมูลผู้ยืมและกำหนดวันส่งคืน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section 1: Notebook Auto-fill Information */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                <span>ข้อมูลเครื่องโน้ตบุ๊ก</span>
              </label>
              {notebookInfo && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  notebookInfo.status === 'available' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : notebookInfo.status === 'borrowed'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {notebookInfo.status === 'available' ? '● พร้อมให้ยืม' : notebookInfo.status === 'borrowed' ? '● ถูกยืมอยู่' : '● ส่งซ่อม'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Select or type Device Number */}
              <div>
                <label className="block text-xs text-slate-600 mb-1">หมายเลขเครื่อง (01-99)</label>
                <select
                  value={deviceNumber}
                  onChange={handleDeviceChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
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

              {/* Serial Number Auto-filled! */}
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  หมายเลขประจำเครื่อง (Serial No.)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={loadingInfo ? 'กำลังโหลดข้อมูล...' : (notebookInfo ? notebookInfo.serial_number : '-')}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-mono text-slate-700 select-all"
                  />
                  {notebookInfo && (
                    <span className="absolute right-2 top-2 text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">
                      Auto
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Model & Spec preview */}
            {notebookInfo && (
              <div className="text-xs text-slate-500 pt-1 flex items-center justify-between border-t border-slate-200">
                <span>รุ่น: <strong className="text-slate-700">{notebookInfo.brand_model}</strong></span>
                {notebookInfo.notes && <span className="text-slate-400">({notebookInfo.notes})</span>}
              </div>
            )}

            {infoError && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {infoError}
              </p>
            )}
          </div>

          {/* Section 2: Borrower Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>ข้อมูลผู้ยืม</span>
            </h4>

            {/* Borrower Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อ-นามสกุล ผู้ยืม <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  หน่วยงาน / แผนก <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="เช่น ฝ่ายการเงิน / HR"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 081-234-5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Expected Return Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                กำหนดวันส่งคืน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">วัตถุประสงค์การยืม</label>
              <input
                type="text"
                placeholder="เช่น นำไปอบรมภายนอก, ปฏิบัติงานนอกสถานที่"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting || (notebookInfo && notebookInfo.status !== 'available')}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-md flex items-center gap-2 transition ${
                notebookInfo && notebookInfo.status === 'available'
                  ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'ยืนยันการยืมเครื่อง'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

