import React from 'react';
import { Download, Plus, Search } from 'lucide-react';

export function ApplicationsView({ onNewApplication }: { onNewApplication: () => void }) {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Мои заявки</h1>
          <p className="text-sm text-slate-500">Все бизнес-идеи и расчёты SSI</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Импорт JSON
          </button>
          <button 
            onClick={onNewApplication}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Новая заявка
          </button>
        </div>
      </div>

      <div className="bg-[#FAF9F6] border border-slate-200/60 rounded-xl p-4 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск по названию стартапа..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          <select className="w-full md:w-48 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm">
            <option>Все статусы</option>
            <option>Черновик</option>
            <option>Завершён</option>
          </select>
        </div>

        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border border-slate-200 bg-white rounded-lg overflow-hidden shadow-sm">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider first:rounded-l-lg">СТАРТАП</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">АВТОР</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">SSI</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">SSI_ADJ</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">СТАТУС</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ДАТА</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider last:rounded-r-lg">ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty state for now */}
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm border-x border-b border-slate-200 bg-white/50 rounded-b-lg">
                  Заявок пока нет. Создайте новую или импортируйте JSON.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
