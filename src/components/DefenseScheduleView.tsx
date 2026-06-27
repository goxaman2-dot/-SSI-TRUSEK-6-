import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, ChevronRight, Filter, Search, Plus } from 'lucide-react';

const MOCK_DEFENSES = [
  {
    id: 1,
    title: 'Цифровой логистический хаб',
    date: '15.11.2026',
    time: '14:00 - 14:45',
    location: 'Точка кипения СКФУ, зал "Эльбрус"',
    institute: 'Факультет математики и компьютерных наук',
    author: 'Иванов А.С.',
    experts: ['Петров Д.В. (CEO "Логистика-ЮГ")', 'Смирнова Е.А. (Инвестор)'],
    status: 'upcoming'
  },
  {
    id: 2,
    title: 'Новые композитные материалы',
    date: '15.11.2026',
    time: '15:00 - 15:45',
    location: 'Точка кипения СКФУ, зал "Эльбрус"',
    institute: 'Институт перспективной инженерии',
    author: 'Смирнова Е.В.',
    experts: ['Мамонтов И.Р. (ОАО "Завод Монокристалл")'],
    status: 'upcoming'
  },
  {
    id: 3,
    title: 'Финтех скоринг-платформа',
    date: '20.11.2026',
    time: '10:00 - 10:45',
    location: 'Главный корпус, ауд. 312',
    institute: 'Институт экономики и управления',
    author: 'Петров Д.Н.',
    experts: ['Сотрудники ПАО Сбербанк'],
    status: 'scheduled'
  },
  {
    id: 4,
    title: 'Умная теплица для фермеров',
    date: '10.11.2026',
    time: '11:00 - 12:00',
    location: 'Точка кипения СКФУ, зал "Машук"',
    institute: 'Факультет пищевой инженерии и биотехнологий',
    author: 'Морозов К.А.',
    experts: ['Представители АПК края'],
    status: 'completed'
  }
];

export function DefenseScheduleView() {
  const [filter, setFilter] = useState('all');

  const filteredDefenses = MOCK_DEFENSES.filter(d => filter === 'all' || d.status === filter);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            График защиты бизнес-идей
          </h1>
          <p className="text-sm text-slate-500 mt-1">Пичинг-сессии стартапов СКФУ перед реальными предпринимателями и инвесторами СКФО</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Фильтры
          </button>
          <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Назначить защиту
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Все
          </button>
          <button 
            onClick={() => setFilter('upcoming')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${filter === 'upcoming' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ближайшие
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${filter === 'completed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Завершенные
          </button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Поиск по стартапам..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDefenses.map(defense => (
          <div key={defense.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex flex-col items-center justify-center min-w-28 text-center shrink-0 border-r border-slate-100 pr-6">
              <div className="text-xl font-black text-slate-800">{defense.date.substring(0, 5)}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{defense.date.substring(6)}</div>
              <div className="mt-2 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3" /> {defense.time}
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{defense.title}</h3>
                  <div className="text-sm text-slate-500 mt-1">{defense.institute} • {defense.author}</div>
                </div>
                <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                  defense.status === 'completed' ? 'bg-slate-50 text-slate-500 border-slate-200' : 
                  defense.status === 'upcoming' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                  'bg-indigo-50 text-indigo-600 border-indigo-200'
                }`}>
                  {defense.status === 'completed' ? 'Завершено' : defense.status === 'upcoming' ? 'Скоро' : 'Запланировано'}
                </span>
              </div>
              
              <div className="pt-3 flex flex-wrap gap-y-2 gap-x-6 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{defense.location}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 mb-0.5">Приглашенные эксперты:</span>
                    {defense.experts.map((expert, idx) => (
                      <span key={idx} className="text-sm font-medium text-slate-700">{expert}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 flex items-center justify-center">
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {filteredDefenses.length === 0 && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-500">
            Нет запланированных защит для выбранного фильтра
          </div>
        )}
      </div>
    </div>
  );
}
