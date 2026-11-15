import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';

export default function OverdueBanner({ overdueItems = [], onOpenHistory, onOpenReturn }) {
  if (!overdueItems || overdueItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-white/20 rounded-lg animate-bounce">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide">
              แจ้งเตือนรายการเกินกำหนดส่งคืน!
            </span>
            <span className="text-xs text-white/90 ml-2">
              มีโน้ตบุ๊กที่เกินกำหนดส่งคืนทั้งหมด <strong>{overdueItems.length} เครื่อง</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {overdueItems.slice(0, 2).map((item) => (
            <button
              key={item.id}
              onClick={() => onOpenReturn && onOpenReturn(item.device_number)}
              className="text-xs bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-md transition font-mono flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>เครื่อง {item.device_number}: {item.borrower_name}</span>
            </button>
          ))}
          {overdueItems.length > 2 && (
            <button
              onClick={onOpenHistory}
              className="text-xs underline hover:text-white/80 font-medium ml-1 flex items-center gap-1"
            >
              <span>ดูทั้งหมด ({overdueItems.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

