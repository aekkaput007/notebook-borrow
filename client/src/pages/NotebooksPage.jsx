import React, { useState } from 'react';
import { Database, Plus, Search, Edit2, Trash2, Printer, CheckCircle2, Clock, AlertTriangle, X, Laptop } from 'lucide-react';
import { api } from '../utils/api';

export default function NotebooksPage({
  notebooks = [],
  onReloadNotebooks,
  onOpenStickerPrint,
  adminUser,
  onOpenLogin
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add / Edit Modal state
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [currentNotebook, setCurrentNotebook] = useState(null);
  const [formDeviceNumber, setFormDeviceNumber] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formBrandModel, setFormBrandModel] = useState('Dell Latitude 3420');
  const [formStatus, setFormStatus] = useState('available');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = notebooks.filter(nb => {
    const matchesStatus = statusFilter === 'all' || nb.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      nb.device_number.toLowerCase().includes(q) ||
      nb.serial_number.toLowerCase().includes(q) ||
      nb.brand_model.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const openAddModal = () => {
    if (!adminUser) {
      onOpenLogin();
      return;
    }
    // Find next available number
    const existingNums = notebooks.map(n => parseInt(n.device_number, 10)).filter(n => !isNaN(n));
    let nextNum = 1;
    while (existingNums.includes(nextNum) && nextNum <= 99) {
      nextNum++;
    }

    setFormDeviceNumber(String(nextNum).padStart(2, '0'));
    setFormSerialNumber(`SN-DELL-10${nextNum.toString().padStart(2, '0')}-${String(nextNum).padStart(2, '0')}`);
    setFormBrandModel('Dell Latitude 3420');
    setFormStatus('available');
    setFormNotes('');
    setFormError('');
    setModalMode('add');
  };

  const openEditModal = (nb) => {
    if (!adminUser) {
      onOpenLogin();
      return;
    }
    setCurrentNotebook(nb);
    setFormDeviceNumber(nb.device_number);
    setFormSerialNumber(nb.serial_number);
    setFormBrandModel(nb.brand_model);
    setFormStatus(nb.status);
    setFormNotes(nb.notes || '');
    setFormError('');
    setModalMode('edit');
  };

  const handleDelete = async (nb) => {
    if (!adminUser) {
      onOpenLogin();
      return;
    }
    if (nb.status === 'borrowed') {
      alert('ไม่สามารถลบโน้ตบุ๊กที่กำลังถูกยืมอยู่ได้');
      return;
    }
    if (!confirm(`คุณต้องการลบโน้ตบุ๊กหมายเลข ${nb.device_number} (${nb.serial_number}) ออกจากระบบใช่หรือไม่?`)) {
      return;
    }

    try {
      await api.deleteNotebook(nb.id);
      onReloadNotebooks();
    } catch (err) {
      alert(err.message || 'ลบข้อมูลไม่สำเร็จ');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formDeviceNumber || !formSerialNumber) {
      setFormError('กรุณากรอกหมายเลขเครื่องและ Serial Number');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'add') {
        await api.createNotebook({
          device_number: formDeviceNumber,
          serial_number: formSerialNumber,
          brand_model: formBrandModel,
          notes: formNotes
        });
      } else if (modalMode === 'edit') {
        await api.updateNotebook(currentNotebook.id, {
          device_number: formDeviceNumber,
          serial_number: formSerialNumber,
          brand_model: formBrandModel,
          status: formStatus,
          notes: formNotes
        });
      }

      onReloadNotebooks();
      setModalMode(null);
    } catch (err) {
      setFormError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            <span>จัดการข้อมูลเครื่องโน้ตบุ๊ก (01-99)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ลงทะเบียนหมายเลขเครื่อง (01-99), หมายเลขประจำเครื่อง (Serial Number), และสถานะ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStickerPrint}
            className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>พิมพ์สติกเกอร์บาร์โค้ด</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มเครื่องใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="ค้นหาตามเลขเครื่อง, Serial No., รุ่น..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            ทั้งหมด ({notebooks.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statusFilter === 'available' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            พร้อมใช้ ({notebooks.filter(n => n.status === 'available').length})
          </button>
          <button
            onClick={() => setStatusFilter('borrowed')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statusFilter === 'borrowed' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
            }`}
          >
            ถูกยืม ({notebooks.filter(n => n.status === 'borrowed').length})
          </button>
          <button
            onClick={() => setStatusFilter('maintenance')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statusFilter === 'maintenance' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
            }`}
          >
            ส่งซ่อม ({notebooks.filter(n => n.status === 'maintenance').length})
          </button>
        </div>
      </div>

      {/* Notebooks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">หมายเลขเครื่อง</th>
                <th className="px-5 py-3.5">หมายเลขประจำเครื่อง (Serial No.)</th>
                <th className="px-5 py-3.5">ยี่ห้อ / รุ่น</th>
                <th className="px-5 py-3.5">สถานะ</th>
                <th className="px-5 py-3.5">หมายเหตุ</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((nb) => (
                <tr key={nb.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3 font-mono font-bold text-slate-900 text-sm">
                    #{nb.device_number}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-700 select-all font-semibold">
                    {nb.serial_number}
                  </td>
                  <td className="px-5 py-3 text-slate-800">
                    {nb.brand_model}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      nb.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : nb.status === 'borrowed'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {nb.status === 'available' ? '● พร้อมให้ยืม' : nb.status === 'borrowed' ? '● กำลังถูกยืม' : '● ส่งซ่อม/ชำรุด'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 max-w-xs truncate">
                    {nb.notes || '-'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => openEditModal(nb)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(nb)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="ลบเครื่อง"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            ไม่พบโน้ตบุ๊กที่ค้นหา
          </div>
        )}
      </div>

      {/* Add / Edit Notebook Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Laptop className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {modalMode === 'add' ? 'เพิ่มเครื่องโน้ตบุ๊กใหม่' : `แก้ไขโน้ตบุ๊กหมายเลข #${currentNotebook.device_number}`}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมายเลขเครื่อง (01-99)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 01"
                    value={formDeviceNumber}
                    onChange={(e) => setFormDeviceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สถานะ</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="available">พร้อมใช้งาน (ว่าง)</option>
                    <option value="borrowed">กำลังถูกยืม</option>
                    <option value="maintenance">ส่งซ่อม/ชำรุด</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หมายเลขประจำเครื่อง (Serial Number / S/N) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น SN-DELL-1001-01"
                  value={formSerialNumber}
                  onChange={(e) => setFormSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ยี่ห้อ / รุ่น</label>
                <input
                  type="text"
                  placeholder="เช่น Dell Latitude 3420"
                  value={formBrandModel}
                  onChange={(e) => setFormBrandModel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุ</label>
                <textarea
                  rows="2"
                  placeholder="เช่น อุปกรณ์ประจำห้องประชุม 2"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

