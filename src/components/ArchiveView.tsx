import React from 'react';
import { ArchivedRecord, StartupData } from '../types';
import { FileJson, Upload, Trash2 } from 'lucide-react';

interface ArchiveViewProps {
  title: string;
  archives: ArchivedRecord[];
  onLoad: (data: StartupData) => void;
  onDelete: (id: string) => void;
  actions?: React.ReactNode;
}

export function ArchiveView({ title, archives, onLoad, onDelete, actions }: ArchiveViewProps) {
  return (
    <div className="container max-w-6xl mx-auto px-4 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          {actions}
        </div>
      </div>

      {archives.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500">Архив пуст. Сохраненные анкеты будут отображаться здесь.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archives.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-1">{record.name}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {new Date(record.date).toLocaleString()}
                </p>
                <div className="flex flex-col gap-1 text-sm text-slate-600 mb-6">
                  <div>👤 Автор: {record.data.author || '—'}</div>
                  {record.data.expert && <div>🎓 Эксперт: {record.data.expert}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => onLoad(record.data)}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  Загрузить в работу
                </button>
                <button
                  onClick={() => onDelete(record.id)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                  title="Удалить из архива"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
