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
  Rocket
} from 'lucide-react';
import { MiniLily } from './MiniLily';
import { Subfactors } from '../utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  calcTab: string;
  setCalcTab: (tab: 'anketa' | 'expert' | 'result' | 'compare' | 'agent') => void;
  onOpenMethodology: () => void;
  onLogout: () => void;
  user: { name: string; email: string; phone: string };
  subfactors: Subfactors;
}

export function Sidebar({ activeTab, setActiveTab, calcTab, setCalcTab, onOpenMethodology, onLogout, user, subfactors }: SidebarProps) {
  const [isCalcExpanded, setIsCalcExpanded] = useState(true);

  const menuSections = [
    {
      title: 'ОСНОВНОЕ',
      items: [
        { id: 'dashboard', label: 'Сводная панель', icon: LayoutDashboard, color: 'text-rose-500' },
        { id: 'applications', label: 'Мои заявки', icon: FolderOpen, color: 'text-amber-500' },
        { 
          id: 'calculator', 
          label: 'Расчёт SSI', 
          icon: Calculator, 
          color: 'text-indigo-500',
          hasSubItems: true
        },
      ]
    },
    {
      title: 'АНАЛИТИКА',
      items: [
        { id: 'compare', label: 'Сравнение идей', icon: Scale, color: 'text-orange-400' },
        { id: 'reports', label: 'Отчёты', icon: FileText, color: 'text-slate-400' },
      ]
    },
    {
      title: 'НАСТРОЙКИ',
      items: [
        { id: 'profile', label: 'Профиль', icon: Settings, color: 'text-purple-500' },
      ]
    }
  ];

  const calcSubItems = [
    { id: 'intro', label: 'Калькулятор индекса', icon: Calculator },
    { id: 'autofill', label: 'Умное автозаполнение', icon: Rocket },
    { id: 'agent', label: 'БЛОК 1: ИИ Агент', icon: Bot },
    { id: 'anketa', label: 'БЛОК 2: Аутлайн', icon: FileEdit },
    { id: 'expert', label: 'БЛОК 3: Режим эксперта', icon: Microscope },
    { id: 'result', label: 'БЛОК 4: Результат', icon: Flower2 },
    { id: 'compare', label: 'БЛОК 5: Сравнение', icon: Scale },
    { id: 'methodology', label: 'Методология', icon: BookOpen },
  ];

  const handleCalcSubItemClick = (subId: string) => {
    if (subId === 'methodology') {
      onOpenMethodology();
      return;
    }
    
    setActiveTab('calculator');
    
    if (subId === 'intro') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (subId === 'autofill') {
      const el = document.getElementById('smart-autofill');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (['agent', 'anketa', 'expert', 'result', 'compare'].includes(subId)) {
      setCalcTab(subId as 'anketa' | 'expert' | 'result' | 'compare' | 'agent');
      const el = document.getElementById('calc-tabs');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[100vh] flex flex-col sticky top-0 shrink-0 hidden md:flex">
      {/* Logo Area */}
      <div className="flex flex-col px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-emerald-600 text-white rounded pr-2 pl-1.5 py-1 text-xs font-black tracking-wider flex items-center gap-1 shadow-sm mr-2">
              <span>SSI</span>
            </div>
            <span className="font-extrabold text-slate-800 text-sm tracking-tight">Navigator</span>
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
          <strong className="text-slate-600 block mt-0.5">Кузьменко В.В.</strong>
        </div>
        <div 
          onClick={onOpenMethodology}
          className="text-[9px] text-slate-400 font-medium cursor-pointer hover:text-indigo-600 transition-colors mb-1.5 leading-relaxed"
          title="Подробнее об авторах проекта и научной публикации"
        >
          Методическое обеспечение:
          <strong className="text-slate-600 block mt-0.5">Мандрица И.В.</strong>
          <strong className="text-slate-600 block">Мандрица О.В.</strong>
        </div>
        <div className="text-[9px] text-slate-400 font-medium leading-relaxed mt-2">
          Технические специалисты лаборатории:
          <strong className="text-slate-600 block mt-0.5">Смакуев Р.А.</strong>
          <strong className="text-slate-600 block">Ткаченко М.М.</strong>
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
                const isActive = activeTab === item.id;
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (item.hasSubItems) {
                          setIsCalcExpanded(!isCalcExpanded);
                          setActiveTab(item.id);
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive 
                          ? 'bg-emerald-50/80 text-emerald-900 font-semibold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : item.color}`} />
                        {item.label}
                      </div>
                      {item.hasSubItems && (
                        isCalcExpanded ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                      )}
                    </button>
                    
                    {/* Render Sub-items for Calculator */}
                    {item.hasSubItems && isCalcExpanded && (
                      <div className="ml-5 mt-1 border-l border-slate-200 pl-2 space-y-1 py-1">
                        {calcSubItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = activeTab === 'calculator' && 
                            (calcTab === subItem.id || 
                             (subItem.id === 'intro' && !['agent', 'anketa', 'expert', 'result', 'compare'].includes(calcTab)));
                             
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => handleCalcSubItemClick(subItem.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                                isSubActive && ['agent', 'anketa', 'expert', 'result', 'compare'].includes(subItem.id)
                                  ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 ${isSubActive && ['agent', 'anketa', 'expert', 'result', 'compare'].includes(subItem.id) ? 'text-indigo-600' : 'opacity-60'}`} />
                              {subItem.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
