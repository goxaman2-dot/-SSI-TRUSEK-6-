import React, { useState } from 'react';
import { Download, Plus, Search, BarChart3, TrendingUp, AlertCircle, CheckCircle2, GraduationCap, Building2 } from 'lucide-react';

const NCFU_INSTITUTES = [
  { id: 'hum', name: 'Гуманитарный институт', total: 45, revision: 12, highSsi: 18 },
  { id: 'econ', name: 'Институт экономики и управления', total: 32, revision: 8, highSsi: 10 },
  { id: 'law', name: 'Юридический институт', total: 28, revision: 5, highSsi: 9 },
  { id: 'eng', name: 'Институт перспективной инженерии', total: 25, revision: 4, highSsi: 7 },
  { id: 'med', name: 'Медико-биологический факультет', total: 15, revision: 4, highSsi: 3 },
  { id: 'psy', name: 'Психолого-педагогический факультет', total: 12, revision: 2, highSsi: 4 },
  { id: 'math', name: 'Факультет математики и компьютерных наук', total: 20, revision: 5, highSsi: 8 },
  { id: 'oil', name: 'Факультет нефтегазовой инженерии', total: 10, revision: 3, highSsi: 2 },
  { id: 'food', name: 'Факультет пищевой инженерии и биотехнологий', total: 14, revision: 4, highSsi: 5 },
  { id: 'sport', name: 'Факультет физической культуры и спорта', total: 6, revision: 1, highSsi: 1 },
  { id: 'phys', name: 'Физико-технический факультет', total: 9, revision: 2, highSsi: 4 },
  { id: 'chem', name: 'Химический факультет', total: 8, revision: 1, highSsi: 3 },
  { id: 'inter', name: 'Факультет международных отношений', total: 10, revision: 2, highSsi: 5 },
  { id: 'creative', name: 'Высшая школа креативных индустрий', total: 14, revision: 3, highSsi: 4 },
];

export function ApplicationsView({ onNewApplication }: { onNewApplication: () => void }) {
  const [selectedInstitute, setSelectedInstitute] = useState('all');

  const totalApplications = NCFU_INSTITUTES.reduce((acc, inst) => acc + inst.total, 0);
  const totalRevision = NCFU_INSTITUTES.reduce((acc, inst) => acc + inst.revision, 0);
  const totalHighSsi = NCFU_INSTITUTES.reduce((acc, inst) => acc + inst.highSsi, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            База заявок Технопарка СКФУ
          </h1>
          <p className="text-sm text-slate-500 mt-1">Аналитика стартапов по институтам и факультетам Северо-Кавказского федерального университета</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Экспорт отчета
          </button>
          <button 
            onClick={onNewApplication}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Добавить стартап
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Всего заявок</div>
            <div className="text-2xl font-black text-slate-800 flex items-end gap-2">
              {totalApplications}
              <span className="text-xs font-semibold text-emerald-500 mb-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">На доработке</div>
            <div className="text-2xl font-black text-slate-800">
              {totalRevision}
              <span className="text-xs font-medium text-slate-400 ml-2">проектов</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Высокий SSI (&gt;7.0)</div>
            <div className="text-2xl font-black text-slate-800">
              {totalHighSsi}
              <span className="text-xs font-medium text-slate-400 ml-2">стартапов</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Institutes Sidebar */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm lg:col-span-1 h-fit">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            Институты СКФУ
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedInstitute('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                selectedInstitute === 'all' 
                  ? 'bg-indigo-50 text-indigo-700 font-bold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Все подразделения</span>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs border border-slate-200">{totalApplications}</span>
            </button>
            
            {NCFU_INSTITUTES.map(inst => (
              <button
                key={inst.id}
                onClick={() => setSelectedInstitute(inst.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                  selectedInstitute === inst.id 
                    ? 'bg-indigo-50 text-indigo-700 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate pr-2" title={inst.name}>{inst.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedInstitute === inst.id ? 'bg-indigo-100' : 'bg-slate-100'
                }`}>{inst.total}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Database Table */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm lg:col-span-2">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Поиск по названию или ФИО..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <select className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
              <option>Все статусы</option>
              <option>На доработке</option>
              <option>Высокий SSI</option>
            </select>
          </div>

          {/* Table Header */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">СТАРТАП</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">АВТОР / ИНСТИТУТ</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">SSI</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">СТАТУС</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Mock data entries based on selected institute */}
                {selectedInstitute === 'all' || selectedInstitute === 'math' ? (
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 text-sm">Цифровой логистический хаб</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">IT, SaaS, Logistics</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700 font-medium">Иванов А.С.</div>
                      <div className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded inline-block mt-1">Факультет математики и компьютерных наук</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100">
                        8.4
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> Успешно
                      </span>
                    </td>
                  </tr>
                ) : null}

                {selectedInstitute === 'all' || selectedInstitute === 'eng' ? (
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 text-sm">Новые композитные материалы</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">DeepTech, Hardware</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700 font-medium">Смирнова Е.В.</div>
                      <div className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1">Институт перспективной инженерии</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-700 font-bold text-sm border border-amber-100">
                        3.2
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                        <AlertCircle className="w-3 h-3" /> Доработка
                      </span>
                    </td>
                  </tr>
                ) : null}

                {selectedInstitute === 'all' || selectedInstitute === 'econ' ? (
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 text-sm">Финтех скоринг-платформа</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">FinTech, B2B</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700 font-medium">Петров Д.Н.</div>
                      <div className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded inline-block mt-1">Институт экономики и управления</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100">
                        7.8
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> Успешно
                      </span>
                    </td>
                  </tr>
                ) : null}

                {/* Always show this empty row if filter matches none of the mock data */}
                {selectedInstitute !== 'all' && selectedInstitute !== 'math' && selectedInstitute !== 'eng' && selectedInstitute !== 'econ' && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm bg-white">
                      Заявок от данного подразделения пока нет.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

