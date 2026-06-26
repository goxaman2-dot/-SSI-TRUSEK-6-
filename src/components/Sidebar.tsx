import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Calculator, 
  Scale, 
  FileText, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Zap,
  Info,
  BookOpen,
  Bot,
  FileEdit,
  Microscope,
  Flower2,
  Rocket,
  CheckCircle
} from 'lucide-react';
import { MiniLily } from './MiniLily';
import { Subfactors } from '../utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  calcTab: string;
  setCalcTab: (tab: 'anketa' | 'expert' | 'result' | 'compare' | 'agent') => void;
  onOpenConsent: () => void;
  onLogout: () => void;
  user: { name: string; email: string; phone: string };
  subfactors: Subfactors;
  consentAccepted: boolean;
}

export function Sidebar({ activeTab, setActiveTab, calcTab, setCalcTab, onOpenConsent, onLogout, user, subfactors, consentAccepted }: SidebarProps) {
  const [isCalcExpanded, setIsCalcExpanded] = useState(true);

  const menuSections = [
    {
      title: 'КАБИНЕТЫ ПРОЕКТОВ',
      items: [
        { id: 'dashboard', label: 'Рабочий стол студента', icon: LayoutDashboard, color: 'text-emerald-600' },
        { id: 'supervisor', label: 'Научный руководитель', icon: FileEdit, color: 'text-blue-600' },
        { id: 'applications', label: 'База заявок', icon: FolderOpen, color: 'text-amber-500' },
      ]
    },
    {
      title: 'ОЦЕНКА SSI (РАСЧЕТ)',
      items: [
        { id: 'calculator', label: 'Запуск оценки', icon: Calculator, color: 'text-indigo-500' },
        { id: 'agent', label: 'ИИ-консультант', icon: Bot, color: 'text-purple-500' },
        { id: 'expert', label: 'Режим экспертизы', icon: Microscope, color: 'text-rose-500' },
        { id: 'result', label: 'Итоговый индекс', icon: Flower2, color: 'text-pink-500' },
        { id: 'compare', label: 'Сравнение проектов', icon: Scale, color: 'text-orange-400' },
      ]
    },
    {
      title: 'ТЕХНОПАРК СКФУ',
      items: [
        { id: 'park_status', label: 'Статусы (Экспертиза)', icon: LayoutDashboard, color: 'text-indigo-600' },
        { id: 'park_stats', label: 'Сводка и KPI', icon: FileText, color: 'text-slate-500' },
      ]
    },
    {
      title: 'СИСТЕМА',
      items: [
        { id: 'profile', label: 'Настройки', icon: Settings, color: 'text-slate-400' },
      ]
    }
  ];

  const handleMenuClick = (item: any) => {
    
    // Map flattened items back to the correct states for App.tsx
    if (['agent', 'anketa', 'expert', 'result', 'compare'].includes(item.id)) {
      setActiveTab('calculator');
      setCalcTab(item.id as 'anketa' | 'expert' | 'result' | 'compare' | 'agent');
      const el = document.getElementById('calc-tabs');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveTab(item.id);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[100vh] flex flex-col sticky top-0 shrink-0 hidden md:flex">
      {/* Logo Area */}
      <div className="flex flex-col px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col">
            <div className="flex items-center">
              <div className="bg-emerald-600 text-white rounded pr-2 pl-1.5 py-1 text-xs font-black tracking-wider flex items-center gap-1 shadow-sm mr-2">
                <span>SSI</span>
              </div>
              <span className="font-extrabold text-slate-800 text-sm tracking-tight">Navigator</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-wider">
              стартапов v.2.0 2026
            </span>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center bg-white p-0.5 rounded-lg border border-indigo-100/60 w-10 h-10 select-none shadow-xs">
            <MiniLily subfactors={subfactors} className="w-[32px] h-[32px] drop-shadow-sm" />
          </div>
        </div>

        <p className="text-[10px] text-slate-500 leading-tight mb-2">
          Лаборатория прединвестиционной экспресс-оценки самодостаточности технологических стартапов.
        </p>
        <div className="text-[9px] text-slate-400 font-medium mb-1.5 leading-relaxed">
          Выполнено по техзаданию:
          <strong className="text-slate-600 block mt-0.5">Кузьменко В.В., Мандрица И.В.</strong>
          Техн. специалисты:
          <strong className="text-slate-600 block mt-0.5">Ренат, Максим</strong>
        </div>
      </div>

      {/* Menu Area */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
        {menuSections.map((section, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || 
                  (activeTab === 'calculator' && calcTab === item.id) || 
                  (item.id === 'calculator' && activeTab === 'calculator' && !['agent', 'expert', 'result', 'compare'].includes(calcTab));
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm border border-indigo-100/50' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : item.color}`} />
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Info / Logout Area */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
          </div>
        </div>
        
        {consentAccepted ? (
          <div className="mb-3 p-2 bg-emerald-50/80 border border-emerald-100 rounded-lg text-center flex flex-col items-center justify-center gap-0.5">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 tracking-wide">ПДн получено</span>
            </div>
            <span className="text-[9px] text-emerald-600/80 block leading-tight">Согласие принято</span>
          </div>
        ) : (
          <div 
            onClick={onOpenConsent}
            className="mb-3 cursor-pointer p-2 bg-indigo-50/80 border border-indigo-100 rounded-lg text-center hover:bg-indigo-100/80 transition-colors"
          >
            <span className="text-[10px] font-bold text-indigo-700 tracking-wide uppercase">Принять оферту</span>
            <span className="text-[9px] text-indigo-600/80 block mt-0.5 leading-tight">Согласие на обработку ПДн</span>
          </div>
        )}
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
