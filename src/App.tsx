import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  FileJson, 
  Upload, 
  Printer, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  RotateCcw, 
  Copy, 
  Maximize2,
  ListFilter,
  X,
  Mail,
  Users,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Scale,
  ArrowLeftRight,
  Bot
} from 'lucide-react';
import { StartupData, Subfactors, CalculationResult, DataWarning } from './types';
import { 
  INITIAL_STARTUP_DATA, 
  EMPTY_STARTUP_DATA, 
  STUDENT_STARTUP_DATA,
  STUDENT_JSON_TEMPLATE,
  calculateResult, 
  calculateSubfactors,
  getFactorInterpretations, 
  looksLikeSSIJson, 
  parseSSIJson,
  norm,
  validateStartupData
} from './utils';
import { motion, AnimatePresence } from 'motion/react';
import { AIAgentTab } from './components/AIAgentTab';
import { MarketCompareChart } from './components/MarketCompareChart';
import { StartupReserves } from './components/StartupReserves';
import { SalesRealismValidator } from './components/SalesRealismValidator';

export default function App() {
  const [data, setData] = useState<StartupData>(() => {
    try {
      const saved = localStorage.getItem('ssi_calculator_data');
      return saved ? JSON.parse(saved) : INITIAL_STARTUP_DATA;
    } catch {
      return INITIAL_STARTUP_DATA;
    }
  });
  const [activeTab, setActiveTab] = useState<'anketa' | 'expert' | 'result' | 'compare' | 'agent'>(() => {
    try {
      const saved = localStorage.getItem('ssi_calculator_tab');
      return (saved === 'anketa' || saved === 'expert' || saved === 'result' || saved === 'compare' || saved === 'agent') ? saved : 'agent';
    } catch {
      return 'agent';
    }
  });

  const [compareA, setCompareA] = useState<StartupData | null>(() => {
    try {
      const saved = localStorage.getItem('ssi_compare_a');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [compareB, setCompareB] = useState<StartupData | null>(() => {
    try {
      const saved = localStorage.getItem('ssi_compare_b');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Save changes to localStorage for comparison
  useEffect(() => {
    try {
      if (compareA) {
        localStorage.setItem('ssi_compare_a', JSON.stringify(compareA));
      } else {
        localStorage.removeItem('ssi_compare_a');
      }
    } catch (e) {
      console.error(e);
    }
  }, [compareA]);

  useEffect(() => {
    try {
      if (compareB) {
        localStorage.setItem('ssi_compare_b', JSON.stringify(compareB));
      } else {
        localStorage.removeItem('ssi_compare_b');
      }
    } catch (e) {
      console.error(e);
    }
  }, [compareB]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [highlightMode, setHighlightMode] = useState<'weak' | 'strong' | 'none'>('none');
  const [isAuthorsOpen, setIsAuthorsOpen] = useState(false);
  const [authorsActiveTab, setAuthorsActiveTab] = useState<number>(1);
  const [showValidationResults, setShowValidationResults] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ssi_calculator_data', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem('ssi_calculator_tab', activeTab);
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Global paste handler to detect any copied startup JSON
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept if user is active in name/author fields to prevent interrupting typical typing
      const activeElement = document.activeElement;

      // Support pasting actual file objects copied from Windows Explorer / macOS Finder
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.json') || file.type === 'application/json' || file.type === 'text/plain') {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            const parsed = parseSSIJson(content);
            if (parsed) {
              setData(prev => ({ ...prev, ...parsed }));
              showToast('✅ Анкета успешно интегрирована из файла в буфере обмена!', 'success');
              setActiveTab('result');
            } else {
              showToast('❌ Файл из буфера обмена не является правильной JSON анкетой.', 'error');
            }
          };
          reader.readAsText(file);
          return;
        }
      }

      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        const text = e.clipboardData?.getData('text') || '';
        if (text.trim().startsWith('{') && looksLikeSSIJson(text)) {
          e.preventDefault();
          processJsonString(text);
        }
        return;
      }

      const text = e.clipboardData?.getData('text') || '';
      if (looksLikeSSIJson(text)) {
        e.preventDefault();
        processJsonString(text);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const processJsonString = (text: string) => {
    const parsed = parseSSIJson(text);
    if (parsed) {
      setData(prev => ({ ...prev, ...parsed }));
      showToast('✅ Анкета успешно заполнена из буфера обмена!', 'success');
      setActiveTab('result');
    } else {
      showToast('❌ Ошибка при распознавании JSON анкеты. Проверьте формат.', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const handleInputChange = (key: keyof StartupData, value: string | number) => {
    setData(prev => ({
      ...prev,
      [key]: typeof value === 'number' ? value : value
    }));
  };

  const handleNumberInput = (key: keyof StartupData, valStr: string) => {
    const val = parseFloat(valStr);
    handleInputChange(key, isNaN(val) ? 0 : val);
  };

  const handleCompareAImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseSSIJson(content);
      if (parsed) {
        setCompareA({ ...INITIAL_STARTUP_DATA, ...parsed });
        showToast('✅ Стартап А успешно загружен!', 'success');
      } else {
        showToast('❌ Ошибка чтения файла. Проверьте формат JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleCompareBImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseSSIJson(content);
      if (parsed) {
        setCompareB({ ...INITIAL_STARTUP_DATA, ...parsed });
        showToast('✅ Стартап Б успешно загружен!', 'success');
      } else {
        showToast('❌ Ошибка чтения файла. Проверьте формат JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const validationWarnings = validateStartupData(data);

  const handleValidateData = () => {
    setShowValidationResults(true);
    const errorsCount = validationWarnings.filter(w => w.level === 'error').length;
    const warningsCount = validationWarnings.filter(w => w.level === 'warning').length;

    if (validationWarnings.length === 0) {
      showToast('✅ Проверка пройдена! Логических ошибок и нестыковок в анкете не обнаружено.', 'success');
    } else {
      showToast(
        `⚠️ Найдено ${errorsCount} критических ошибок и ${warningsCount} предупреждений в данных. Подробная панель добавлена внизу!`,
        'info'
      );
    }
  };

  const scrollToField = (field: string) => {
    const el = document.getElementById(`input-${field}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-amber-500', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-500');
      }, 2000);
    }
  };

  const loadPresetDemo = () => {
    setData(INITIAL_STARTUP_DATA);
    setShowValidationResults(false);
    showToast('🌱 Загружен демонстрационный проект "Умный Сенсорный Сад"', 'success');
  };

  const loadStudentSample = () => {
    setData(STUDENT_STARTUP_DATA);
    setShowValidationResults(false);
    showToast('🎓 Вечный образец JSON анкеты стартапера успешно загружен в калькулятор!', 'success');
  };

  const downloadStudentJsonTemplate = () => {
    try {
      const blob = new Blob([JSON.stringify(STUDENT_JSON_TEMPLATE, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'STUDENT_STARTUP_SAMPLE_TRUSEK6.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('⬇️ Студенческий образец JSON анкеты успешно скачан!', 'success');
    } catch {
      showToast('❌ Не удалось скачать шаблон JSON', 'error');
    }
  };

  const resetForm = () => {
    setData(EMPTY_STARTUP_DATA);
    setShowValidationResults(false);
    showToast('🧹 Все поля анкеты успешно очищены', 'info');
  };

  const exportToJsonFile = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (data.name ? data.name : 'SSI_questionnaire') + '_TRUSEK6.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('⬇️ Файл анкеты успешно сохранен на ваше устройство', 'success');
    } catch {
      showToast('❌ Не удалось сгенерировать JSON файл', 'error');
    }
  };

  const handlePrint = () => {
    try {
      // Trigger native browser print dialog
      window.print();
    } catch (e) {
      console.error('Print error:', e);
    }
    // Show supportive guidance toast since the app runs in an iframe inside dev environment
    showToast(
      '💡 Если диалог печати не открылся автоматически, откройте приложение в новой вкладке (кнопка в правом верхнем углу) и запустите печать повторно!',
      'info'
    );
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseSSIJson(content);
      if (parsed) {
        setData(prev => ({ ...prev, ...parsed }));
        showToast('✅ Анкета успешно загружена из файла!', 'success');
        setActiveTab('result');
      } else {
        showToast('❌ Ошибка чтения файла. Убедитесь, что это правильный JSON анкеты.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input target
    e.target.value = '';
  };

  const handlePasteConsole = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (looksLikeSSIJson(clipText)) {
        processJsonString(clipText);
      } else {
        showToast('📋 В буфере обмена не обнаружен подходящий JSON анкеты. Скопируйте данные заново.', 'info');
      }
    } catch {
      showToast('⚠️ Нет доступа к системному буферу. Просто нажмите Ctrl + V на клавиатуре!', 'info');
    }
  };

  const copyResultsText = (result: CalculationResult) => {
    const info = `
--- РЕЗУЛЬТАТЫ СЕРТИФИКАЦИИ СТАРТАПА SSI ---
Стартап: ${data.name || 'Без названия'}
Автор анкеты: ${data.author || 'Не указан'}
Финальный индекс SSI: ${result.finalSsi.toFixed(2)} / 10
Рыночный мультипликатор MEI: ${result.mei.toFixed(2)}

Оценки по факторам (TRUSEK-6):
- Утилитарность (U): ${result.subfactors.U.toFixed(1)} / 10
- Эмоция (E): ${result.subfactors.E.toFixed(1)} / 10
- Повторяемость (R): ${result.subfactors.R.toFixed(1)} / 10
- Капитал (K): ${result.subfactors.K.toFixed(1)} / 10
- Время окупаемости (T): ${result.subfactors.T.toFixed(1)} / 10
- Социальный (S): ${result.subfactors.S.toFixed(1)} / 10

Рыночные показатели:
- TAM: ${data.tam} млн. руб.
- SAM: ${data.sam} млн. руб.
- SOM: ${data.som} млн. руб.
- TAV (Порог автономии): ${data.tav} млн. руб.

Вердикт: ${result.interpretation}
    `.trim();

    navigator.clipboard.writeText(info).then(() => {
      setCopiedText(true);
      showToast('📋 Сводка результатов скопирована в буфер!', 'success');
      setTimeout(() => setCopiedText(false), 2000);
    }).catch(() => {
      showToast('❌ Ошибка при копировании', 'error');
    });
  };

  const results = calculateResult(data);
  const factorInterpretations = getFactorInterpretations(results.subfactors);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-20 selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl border text-sm font-semibold transition-all ${
              notification.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : notification.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`}
          >
            <span className="text-base">
              {notification.type === 'success' ? '⚡' : notification.type === 'error' ? '💥' : 'ℹ️'}
            </span>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL BACKGROUND ELEMENTS (HIDDEN IN PRINT) */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-900/10 via-transparent to-transparent pointer-events-none print:hidden -z-10" />

      {/* HEADER SECTION */}
      <header className="container max-w-6xl mx-auto pt-8 px-4 print:pt-4">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-900/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          
          {/* Decorative background vectors */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {/* Left badge fallback / logo placeholder */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 w-36 h-24 select-none z-10 mx-auto md:mx-0">
            <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-200 via-white to-indigo-100 bg-clip-text text-transparent">
              СКФУ
            </span>
            <span className="text-[9px] font-medium tracking-widest text-indigo-300 mt-1 uppercase text-center leading-tight">
              Технопарк
            </span>
          </div>

          <div className="flex-1 text-center flex flex-col items-center z-10 w-full px-2">
            <button
              onClick={() => setIsAuthorsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 text-xs font-bold rounded-full mb-3 tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md group"
              title="Нажмите, чтобы увидеть информацию об авторах методологии и публикации"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse group-hover:rotate-12 transition-transform duration-300" />
              <span>TRUSEK-6 FRAMEWORK</span>
              <Info className="w-3 h-3 text-indigo-300 opacity-80 group-hover:opacity-100" />
            </button>
            <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight leading-snug text-center">
              Калькулятор индекса SSI <br />
              самодостаточности бизнес-идеи
            </h1>
            <p className="text-indigo-200 text-sm mt-2 opacity-90 font-light max-w-2xl text-center">
              Инструмент прединвестиционной экспресс-оценки самодостаточности технологических стартапов. Разработка для Технопарка Северо-Кавказского федерального университета.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-slate-400 text-xs mt-3.5 italic border-t border-white/5 pt-3 w-full">
              <button
                onClick={() => setIsAuthorsOpen(true)}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer group/author py-0.5"
                title="Подробнее об авторах проекта и научной публикации"
              >
                <span>Авторы методологии: <strong className="text-slate-300 group-hover/author:text-amber-100 transition-colors">Мандрица И.В., Мандрица О.В.</strong></span>
                <Info className="w-3.5 h-3.5 text-indigo-400 opacity-60 group-hover/author:opacity-100 transition-opacity shrink-0" />
              </button>
              <span className="hidden md:inline text-white/20">•</span>
              <span>Версия калькулятора: <strong className="text-indigo-300 font-mono">v2.0 (2026)</strong></span>
            </div>
          </div>

          {/* Right badge - Beautiful Lily mirroring the Technopark logo */}
          <div className="flex-shrink-0 flex items-center justify-center bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-36 h-24 select-none z-10 mx-auto md:mx-0">
            <MiniLily subfactors={results.subfactors} />
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 mt-6">

        {/* SMART PASTE HINT BAR (HIDDEN IN PRINT) */}
        <section className="print:hidden mb-6">
          <div 
            className="group relative bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 text-white p-5 md:p-6 rounded-2xl shadow-xl border border-indigo-500/20 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />
            
            <div className="flex flex-col gap-5 relative z-10">
              {/* Header Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
                  <FileJson className="w-5 h-5 text-amber-300" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-base md:text-lg tracking-wide text-white drop-shadow-sm flex items-center gap-2">
                    🚀 Умное автозаполнение по Ctrl + V <span className="text-xs md:text-sm font-normal text-indigo-200">— для тех кто &quot;не боится&quot; утечки своих бизнес-идей в &quot;космос интернета&quot;</span>
                  </h3>
                </div>
              </div>

              {/* 6 Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10 hover:bg-white/15 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-3xl md:text-[36px] font-black text-amber-300 mb-1.5 leading-none">1 этап</div>
                    <p className="text-xs text-indigo-100 font-light leading-snug">
                      Скачайте анкету <strong>"Анкета стартапа .JSON"</strong> на свой комп, ноут или гаджет (tablet) — нажмите кнопку ниже.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadStudentJsonTemplate();
                    }}
                    className="mt-2.5 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                    title="Скачать анкету стартапа (.JSON файл)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Анкета стартапа .JSON</span>
                  </button>
                  <div className="mt-1.5 text-[10px] text-indigo-100/90 font-light leading-snug border-t border-white/5 pt-1.5">
                    <strong className="text-amber-300/95 font-medium">Примечание:</strong> обычно загруженный файл окажется в папке "Загрузки" или "Документы" (настройки Windows, iOS, Linux, Android)
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10 hover:bg-white/15 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-3xl md:text-[36px] font-black text-amber-300 mb-1.5 leading-none">2 этап</div>
                    <p className="text-xs text-indigo-100 font-light leading-snug">
                      Откройте чат в любой условно-бесплатной/ платной нейросети <strong>Claude / Qwen / Deepseek / ChatGPT / GigaChat / Kimi</strong> — и поочередно загрузите в чат: JSON анкету, презентации PPTX, документы по вашему стартапу в формате DOXC, файлы стартапа (сметы, исследование рынка и конкурентов, бизнес-план EXCELL, план производства и т.п.)
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-500/20 leading-snug font-medium">
                    ⚠️ Помните: закачанные файлы и их обработка в виде выходных файлов уже становятся достоянием нейросетей, в которых вы работаете.
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10 hover:bg-white/15 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-3xl md:text-[36px] font-black text-amber-300 mb-1.5 leading-none">3 этап</div>
                    <p className="text-xs text-indigo-100 font-light leading-snug">
                      Скопируйте текст промта для вашей нейросети:
                    </p>
                    <div className="relative mt-1.5 flex flex-col gap-1.5">
                      <div className="font-mono text-amber-100 text-[11px] bg-indigo-950/40 p-2 pr-2.5 rounded border border-white/5 select-all leading-normal">
                        "Создай мне JSON анкету моего стартапа по прикрепленным документам JSON, DOCX, XXLS, PPTX"
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('Создай мне JSON анкету моего стартапа по прикрепленным документам JSON, DOCX, XXLS, PPTX');
                          showToast('📋 Текст промпта скопирован в буфер обмена!', 'success');
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1 rounded text-[10px] font-bold transition-all duration-150 flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                        title="Скопировать в буфер памяти / обмена"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Скопировать в буфер обмена</span>
                      </button>
                      <div className="text-[10px] text-indigo-200 text-center font-semibold mt-0.5">
                        — Начните чат с нейросетью
                      </div>
                      <div className="mt-1.5 text-[10px] text-indigo-100/90 font-light leading-snug border-t border-white/5 pt-1.5">
                        <strong className="text-amber-300/95 font-medium">Примечание:</strong> "Вы ТАКЖЕ можете расширить поиск данных по стартапу внутри чата с нейросетью новыми промтами для поиска всех необходимых данных согласно анкете JSON".
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                  <div className="text-3xl md:text-[36px] font-black text-amber-300 mb-1.5 leading-none">4 этап</div>
                  <p className="text-xs text-indigo-100 font-light leading-snug">
                    Из чата с нейросетью скачайте полученный результат анкеты, и откройте проводник и перейдите в папку, куда скачан файл. Встав на файл анкеты <code className="text-amber-100 font-mono">[*****.json]</code> нажмите сочетание клавиш <kbd className="bg-white/15 px-1 rounded text-[10px] font-mono text-white">CTRL+C</kbd> — взять в память (в буфер обмена).
                  </p>
                  <div className="mt-1.5 text-[10px] text-indigo-200 font-normal leading-snug border-t border-white/5 pt-1.5">
                    Для удобства пользователя, если ваша операционная система загружает все в папку "Загрузки" — перейдите на <strong className="text-amber-300 font-medium">5 этап</strong>.
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-3xl md:text-[36px] font-black text-amber-300 mb-1.5 leading-none">5 этап</div>
                    <p className="text-xs text-indigo-100 font-light leading-snug">
                      Интегрируйте полученный JSON-файл анкеты в платформу любым удобным способом:
                    </p>
                    
                    <div className="mt-3 flex flex-col gap-2.5">
                      {/* Способ А (Файл) */}
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-[10px] text-amber-300 block font-semibold mb-1">Способ А: Загрузить файл с устройства (самый надежный)</span>
                        <label className="w-full bg-white hover:bg-indigo-50 text-indigo-800 px-3 py-2 rounded-lg text-[11px] font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Выбрать и загрузить .json файл</span>
                          <input 
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            onChange={handleFileImport} 
                          />
                        </label>
                      </div>

                      {/* Способ Б (Буфер) */}
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-[10px] text-indigo-200 block font-normal mb-1">
                          Способ Б: Если нажали <kbd className="bg-white/10 px-1 rounded text-[9px] font-mono text-white">CTRL+C</kbd> на файле или скопировали текстовое содержимое:
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePasteConsole();
                          }}
                          className="w-full bg-indigo-600/80 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow active:scale-95 border border-white/10"
                        >
                          <FileJson className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                          <span>Интегрировать из буфера</span>
                        </button>
                      </div>

                      <div className="text-[10px] text-indigo-100/90 font-light leading-snug border-t border-white/5 pt-1.5 mt-0.5">
                        <strong className="text-amber-300/95 font-medium">Примечание:</strong> При копировании самого файла в проводнике Windows через Ctrl+C, некоторые браузеры блокируют чтение файла из буфера. В таком случае просто используйте <strong className="text-amber-300 font-normal">Способ А</strong>!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-3xl md:text-[36px] font-black text-amber-300 mb-1.5 leading-none">6 этап</div>
                    <p className="text-xs text-indigo-100 font-light leading-snug">
                      Запустите рендер расчетного интерактивного лепесткового графика:
                    </p>

                    {/* Premium, high-contrast dynamic vector illustration of the TRUSEK-6 Lily flower */}
                    <div className="my-3 bg-indigo-950/50 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group/stage-lily shadow-inner">
                      {/* Scaled MiniLily widget */}
                      <div className="w-56 h-56 flex items-center justify-center transition-transform duration-500 hover:scale-110 select-none">
                        <MiniLily subfactors={results.subfactors} className="w-full h-full block drop-shadow-2xl select-none" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('result');
                        showToast('🌸 Расчет индекса SSI и рендер лилии завершен!', 'success');
                      }}
                      className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border border-amber-300 px-3 py-2.5 rounded-xl text-xs font-black tracking-wide shadow-md transition-all duration-250 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>🌸 Построить лилию SSI</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NAVIGATION CONTROLS & UTILITY PRESETS */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-6 print:hidden">
          
          {/* Main Module Tabs (Sleek Progressive Workflow) */}
          <div className="bg-slate-200/85 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 border border-slate-300/40 overflow-x-auto scrollbar-none shadow-inner max-w-full">
            
            {/* STEP 1: AI AGENT */}
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 relative ${
                activeTab === 'agent' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-md ring-2 ring-purple-300' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
              }`}
              title="Начните здесь! Искусственный Интеллект заполнит анкету по вашему описанию проекта"
            >
              <Bot className="w-4.5 h-4.5 text-current shrink-0" />
              <span className="flex items-center gap-1.5">
                <span className="opacity-75 font-mono text-[10px] bg-purple-900/30 text-white px-1.5 py-0.5 rounded-md">1</span>
                <span>🤖 ИИ Агент (Старт)</span>
              </span>
              <span className="absolute -top-1 -right-0.5 block h-2.5 w-2.5 rounded-full bg-purple-500 ring-2 ring-slate-100 animate-pulse" />
            </button>

            {/* STEP 2: MANUAL SURVEY */}
            <button
              onClick={() => setActiveTab('anketa')}
              title="От авторов калькулятора: Калькулятор не собирает ваши персональные и иные данные, согласно 152-ФЗ РФ, не является ЦОД (центром обработки данных). Калькулятор не имеет сервера хранения данных, является автономно работающим ПО. После нажатия кнопки &quot;Очистить&quot; все введенные данные навсегда удаляются. Но если нажать кнопку &quot;Экспортировать JSON анкету&quot;, то вы сохраняете у себя на компьютере (гаджете) анкету текущих значений индекса SSI вашего стартапа."
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 group shrink-0 relative ${
                activeTab === 'anketa' 
                  ? 'bg-white text-slate-900 shadow-md border border-slate-200 ring-1 ring-slate-100' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="opacity-75 font-mono text-[10px] bg-slate-300 text-slate-800 px-1.5 py-0.5 rounded-md">2</span>
                <span>📝 Ручной ввод</span>
              </span>
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            {/* STEP 3: EXPERT REGIME */}
            <button
              onClick={() => setActiveTab('expert')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${
                activeTab === 'expert' 
                  ? 'bg-slate-800 text-white font-extrabold shadow-md' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
              }`}
              title="Настройка весов и экспертных оценок"
            >
              <span className="flex items-center gap-1.5">
                <span className="opacity-75 font-mono text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md">3</span>
                <span>🔬 Режим эксперта</span>
              </span>
            </button>

            {/* STEP 4: RESULTS */}
            <button
              onClick={() => setActiveTab('result')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 relative ${
                activeTab === 'result' 
                  ? 'bg-emerald-650 text-white shadow-md ring-2 ring-emerald-300' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
              }`}
              title="Красивый интерактивный цветок Лилии SSI и аналитика рынка"
            >
              <span className="flex items-center gap-1.5">
                <span className="opacity-75 font-mono text-[10px] bg-emerald-900/30 text-white px-1.5 py-0.5 rounded-md">4</span>
                <span>🌸 Результат & Лилия</span>
              </span>
              <span className="absolute -top-1 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-100" />
            </button>

            {/* STEP 5: COMPARE */}
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 relative ${
                activeTab === 'compare' 
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/40'
              }`}
              title="Сравните ваш проект с другими или с гипотетическим сценарием"
            >
              <Scale className="w-3.5 h-3.5 text-current shrink-0 animate-pulse" />
              <span className="flex items-center gap-1.5">
                <span className="opacity-75 font-mono text-[10px] bg-amber-700/30 text-amber-950 px-1.5 py-0.5 rounded-md">5</span>
                <span>⚖️ Сравнение анкет</span>
              </span>
            </button>

          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={handleValidateData}
              className={`px-3.5 py-2.5 text-xs border rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                validationWarnings.length > 0 && showValidationResults
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600'
              }`}
              title="Проверить введенные данные анкеты стартапа на логические ошибки"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>ПРОВЕРИТЬ данные</span>
              {validationWarnings.length > 0 && (
                <span className="bg-red-650 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full">
                  {validationWarnings.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={loadPresetDemo}
              className="px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 text-slate-700 font-semibold transition-all flex items-center gap-1.5 shadow-sm"
              title="Загрузить полностью заготовленные демонстрационные данные"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Загрузить демостартап</span>
            </button>
            
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold transition-all flex items-center gap-1.5 shadow-sm"
              title="Сбросить все показатели анкеты"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
              <span>Очистить</span>
            </button>
          </div>

        </div>

        {/* AUTHOR NOTE BANNER (PRINT HIDDEN) */}
        <div className="print:hidden mb-6 bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 md:p-5 flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-0.5">💡 От авторов калькулятора:</span>
            Калькулятор не собирает ваши персональные и иные данные, согласно 152-ФЗ РФ, не является ЦОД (центром обработки данных). Калькулятор не имеет сервера хранения данных, является автономно работающим ПО. После нажатия кнопки <strong className="text-rose-700">"Очистить"</strong> все введенные данные навсегда удаляются. Но если нажать кнопку <strong className="text-indigo-700">"Экспортировать JSON анкету"</strong>, то вы сохраняете у себя на компьютере (гаджете) анкету текущих значений индекса SSI вашего стартапа.
          </div>
        </div>

        {/* CONTAINER CARD FOR VIEWS */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8">
          
          {/* 🛡️ ДИАГНОСТИЧЕСКАЯ ПАНЕЛЬ ПРОВЕРКИ ДАННЫХ */}
          <AnimatePresence>
            {showValidationResults && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden print:hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/30">
                      <Bot className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-white text-base md:text-lg tracking-tight">
                        Интеллектуальный ассистент проверки данных (SSI Validator)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Автоматическая верификация исходных бизнес-показателей на логическую связность и устойчивость бизнес-модели.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowValidationResults(false)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {validationWarnings.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl mb-2">🎉</span>
                    <h4 className="font-bold text-emerald-400">Ошибок и нестыковок не обнаружено!</h4>
                    <p className="text-xs text-slate-400 max-w-md mt-1">
                      Все проверенные показатели (соотношения LTV/CAC, маржинальность, лимиты времени, масштабы рынков TAM/SAM/SOM) абсолютно логически корректны и соответствуют инвестиционным стандартам.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 bg-slate-950/40 px-4 py-2.5 rounded-xl border border-slate-800/60 w-fit">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block animate-ping" />
                        <span>Критических нестыковок (ошибок): <strong className="text-rose-400 font-mono">{validationWarnings.filter(w => w.level === 'error').length}</strong></span>
                      </span>
                      <span className="text-slate-700">|</span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                        <span>Предупреждений: <strong className="text-amber-400 font-mono">{validationWarnings.filter(w => w.level === 'warning').length}</strong></span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                      {validationWarnings.map((warning, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                            warning.level === 'error'
                              ? 'bg-rose-950/25 border-rose-500/30 hover:border-rose-500/50'
                              : 'bg-amber-950/15 border-amber-500/20 hover:border-amber-500/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                                warning.level === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {warning.level === 'error' ? 'Критическая ошибка' : 'Предупреждение'}
                              </span>
                              {warning.field !== 'general' && warning.field !== 'market' && (
                                <span className="text-[10px] text-slate-500 font-mono">Параметр: {warning.field.toUpperCase()}</span>
                              )}
                            </div>
                            <h5 className="font-bold text-sm text-slate-100 leading-snug">{warning.message}</h5>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-light">{warning.explanation}</p>
                          </div>

                          {warning.field !== 'general' && warning.field !== 'market' && (
                            <button
                              onClick={() => {
                                if (activeTab !== 'anketa' && activeTab !== 'expert') {
                                  setActiveTab('anketa');
                                }
                                setTimeout(() => scrollToField(warning.field), 150);
                              }}
                              className={`mt-3 w-fit text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${
                                warning.level === 'error'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                              }`}
                            >
                              <span>Найти поле ввода</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* ======================================================== */}
          {/* TAB: ANKETA (STUDENT FORM)                               */}
          {/* ======================================================== */}
          {activeTab === 'anketa' && (
            <div className="space-y-6">
              
              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Название вашего стартапа</label>
                  <input 
                    id="input-name"
                    type="text" 
                    value={data.name} 
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="Например: Цифровой логистический хаб"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">ФИО разработчика (стартапера)</label>
                  <input 
                    id="input-author"
                    type="text" 
                    value={data.author} 
                    onChange={e => handleInputChange('author', e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">ФИО экспертного наставника</label>
                  <input 
                    id="input-expert"
                    type="text" 
                    value={data.expert || ''} 
                    onChange={e => handleInputChange('expert', e.target.value)}
                    placeholder="Пример: д.т.н., проф. Сидоров П.И."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {/* FACTOR U */}
              <div className="factor-section bg-gradient-to-br from-indigo-50/20 to-slate-50 border-l-[6px] border-indigo-500 p-6 rounded-2xl">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-lg text-indigo-900 flex items-center gap-1.5">
                      <span>U · Утилитарность</span>
                      <span className="text-xs bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: 15%</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Фактор определяет силу реальной зависимости покупателя от вашего продукта (изделия, услуги, товара). Чем сильнее "боль" клиента без вашего решения, тем выше маркер фактора.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-mono">Сводный балл U:</span>
                    <div className="text-xl font-black text-indigo-600 font-mono">
                      {calculateSubfactors(data).U.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* U1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>U₁ — Стоимость альтернативы (в рублях)</span>
                        <Tooltip text="Сумма, которую клиент тратит на решение проблемы текущими способами, либо сумма штрафов за отсутствие решения." />
                      </label>
                      <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.u1, 0, 300000).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      У конкурентов стоит 300 руб., вы предлагаете за 127 руб. Клиент экономит 173 руб. на единицу → введите <strong className="text-indigo-600 font-mono">173</strong> в качестве альтернативной разницы. Максимальный лимит для шкалы равен 300&nbsp;000 руб.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="300000" 
                        step="500" 
                        value={data.u1}
                        onChange={e => handleNumberInput('u1', e.target.value)}
                        className="flex-1 accent-indigo-600 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-u1"
                        type="number" 
                        value={data.u1} 
                        onChange={e => handleNumberInput('u1', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* U2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>U₂ — Эпизодов потребности в год</span>
                        <Tooltip text="Как часто в году возникает острая необходимость воспользоваться продуктом." />
                      </label>
                      <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.u2, 1, 52).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Частота циклов плановой покупки вашего изделия, работы, услуги, товара. Подсказка: Раз в год = 1 цикл · Раз в месяц = 12 · Раз в неделю = 52 · Ежедневно = 365. Нормализация от 1 до 52 событий.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="365" 
                        step="1" 
                        value={data.u2}
                        onChange={e => handleNumberInput('u2', e.target.value)}
                        className="flex-1 accent-indigo-600 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-u2"
                        type="number" 
                        value={data.u2} 
                        onChange={e => handleNumberInput('u2', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* FACTOR E */}
              <div className="factor-section bg-gradient-to-br from-amber-50/20 to-slate-50 border-l-[6px] border-amber-500 p-6 rounded-2xl">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-lg text-amber-950 flex items-center gap-1.5">
                      <span>E · Эмоция</span>
                      <span className="text-xs bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: 20%</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Определяет глубину эмоционального вовлечения клиента, преданности вашему продукту (изделию, услуге, товару) и готовность доплачивать премию за Ваш бренд.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-mono">Сводный балл E:</span>
                    <div className="text-xl font-black text-amber-600 font-mono">
                      {calculateSubfactors(data).E.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* E1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>E₁ — Минут взаимодействия за сессию</span>
                        <Tooltip text="Продолжительность непосредственного фокусного контакта пользователя с ценностью продукта за один раз." />
                      </label>
                      <span className="font-mono text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.e1, 0, 60).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Время контакта. Для приложений — время у экрана. Консервы или еда — время трапезы (в среднем 20 минут). Нормализация шкалы от 0 до 60 минут.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="120" 
                        step="1" 
                        value={data.e1}
                        onChange={e => handleNumberInput('e1', e.target.value)}
                        className="flex-1 accent-amber-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-e1"
                        type="number" 
                        value={data.e1} 
                        onChange={e => handleNumberInput('e1', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* E2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>E₂ — Соотношение Наша цена / Цена конкурента</span>
                        <Tooltip text="Отношение вашей цены к средней рыночной цене главных конкурентов." />
                      </label>
                      <span className="font-mono text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.e2, 0, 2).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Пример: 127 руб / 300 руб = <strong className="font-mono">0.42</strong> (дешевле альтернативы, высокая привлекательность). Лимит шкалы отношений от 0 до 2.0.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0.1" 
                        max="3" 
                        step="0.05" 
                        value={data.e2}
                        onChange={e => handleNumberInput('e2', e.target.value)}
                        className="flex-1 accent-amber-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-e2"
                        type="number" 
                        step="0.01" 
                        value={data.e2} 
                        onChange={e => handleNumberInput('e2', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* FACTOR R */}
              <div className="factor-section bg-gradient-to-br from-rose-50/20 to-slate-50 border-l-[6px] border-rose-500 p-6 rounded-2xl">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-lg text-rose-950 flex items-center gap-1.5">
                      <span>R · Повторяемость</span>
                      <span className="text-xs bg-rose-100 text-rose-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: 15%</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Отражает уровень удержания клиентов вашей фокус-группы, частоту регулярных покупок ими вашего изделия (услуги, работ, товара), что формирует жизнеспособность финансовой пропорции LTV/CAC (LTV, Lifetime Value — пожизненная ценность клиента / CAC, Customer Acquisition Cost — стоимость привлечения клиента).</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-mono">Сводный балл R:</span>
                    <div className="text-xl font-black text-rose-600 font-mono">
                      {calculateSubfactors(data).R.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* R1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>R₁ — Покупок в год (одним клиентом)</span>
                        <Tooltip text="Какое среднее количество заказов совершает один лояльный покупатель за 12 месяцев." />
                      </label>
                      <span className="font-mono text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.r1, 0, 52).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Консервы: ~6 раз в год · Платная подписка: ~12 раз · Новая одежда: 2–3 раза · Архитектура/Дизайн: 0.2 раза. Шкала нормирования от 0 до 52 повторных покупок.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="52" 
                        step="1" 
                        value={data.r1}
                        onChange={e => handleNumberInput('r1', e.target.value)}
                        className="flex-1 accent-rose-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-r1"
                        type="number" 
                        value={data.r1} 
                        onChange={e => handleNumberInput('r1', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* R2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>R₂ — Соотношение LTV / CAC (LTV — пожизненная ценность клиента / CAC — стоимость привлечения клиента)</span>
                        <Tooltip text="Ценность жизненного цикла клиента к стоимости его привлечения. Ключевой критерий масштабируемости." />
                      </label>
                      <span className="font-mono text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.r2, 0, 10).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Пример: LTV 15 000 руб, CAC 3 000 руб → Ваше соотношение 5.0. Инвестиционная норма: более 3.0. Если вы не научились считать CAC → введите значение <strong className="font-mono">3.0</strong>. Максимум 10.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="15" 
                        step="0.1" 
                        value={data.r2}
                        onChange={e => handleNumberInput('r2', e.target.value)}
                        className="flex-1 accent-rose-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-r2"
                        type="number" 
                        step="0.01" 
                        value={data.r2} 
                        onChange={e => handleNumberInput('r2', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* FACTOR K */}
              <div className="factor-section bg-gradient-to-br from-emerald-50/20 to-slate-50 border-l-[6px] border-emerald-500 p-6 rounded-2xl">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-lg text-emerald-950 flex items-center gap-1.5">
                      <span>K · Капитал</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: 15%</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Определяет объем требуемых капитальных инвестиций (CAPEX, Capital Expenditure — капитальные расходы) на запуск Вашего проекта и уровень маржинальности Ваших бизнес-процессов.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-mono">Сводный балл K:</span>
                    <div className="text-xl font-black text-emerald-600 font-mono">
                      {calculateSubfactors(data).K.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* K1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>K₁ — Стартовые затраты, CAPEX (капитальные расходы), тыс. руб.</span>
                        <Tooltip text="Инвестиции на закупку оборудования, разработку MVP софта, аренду помещений до первых продаж." />
                      </label>
                      <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.k1, 0, 5000, true).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Меньше вложений = сильнее жизнеспособность. До 300 тыс = супер. 300–1000 тыс = стандарт. 1–5 млн = сложно. Шкала инвертирована, максимальный лимит — 5 000 тыс (5 млн руб).
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="5000" 
                        step="50" 
                        value={data.k1}
                        onChange={e => handleNumberInput('k1', e.target.value)}
                        className="flex-1 accent-emerald-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-k1"
                        type="number" 
                        value={data.k1} 
                        onChange={e => handleNumberInput('k1', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* K2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>K₂ — Маржинальность продукции (%)</span>
                        <Tooltip text="Какая доля выручки остается после вычета прямых расходов на производство товара или оказание услуги (COGS)." />
                      </label>
                      <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.k2, 0, 80).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Пример расчета: Цена 127 руб, себестоимость 95 руб → маржа: <strong className="font-mono">25%</strong>. IT-сервисы: 60–80%. Пищевое производство: 20-30%. Шкала нормирована до 80%.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="1" 
                        value={data.k2}
                        onChange={e => handleNumberInput('k2', e.target.value)}
                        className="flex-1 accent-emerald-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-k2"
                        type="number" 
                        value={data.k2} 
                        onChange={e => handleNumberInput('k2', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* FACTOR T */}
              <div className="factor-section bg-gradient-to-br from-purple-50/20 to-slate-50 border-l-[6px] border-purple-500 p-6 rounded-2xl">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-lg text-purple-950 flex items-center gap-1.5">
                      <span>T · Время окупаемости</span>
                      <span className="text-xs bg-purple-100 text-purple-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: 20%</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Оценивает скорость разгона вашего проекта до нормы прибыли выше чем у конкурентов и общий срок возврата (окупаемости) стартового первоначального капитала.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-mono">Сводный балл T:</span>
                    <div className="text-xl font-black text-purple-600 font-mono">
                      {calculateSubfactors(data).T.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* T1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>T₁ — Месяцев до EBITDA+ (Окупаемость OPEX)</span>
                        <Tooltip text="Сколько реальных месяцев пройдет от старта до выхода текущей выручки выше ежемесячных операционных расходов (зарплаты, аренда)." />
                      </label>
                      <span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.t1, 1, 36, true).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      До 6 месяцев — образцово. 6-12 мес — штатно. Более 24 месяцев — высокий износ ресурсов. Инвертированная шкала нормирована в диапазоне от 1 до 36 мес.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="36" 
                        step="1" 
                        value={data.t1}
                        onChange={e => handleNumberInput('t1', e.target.value)}
                        className="flex-1 accent-purple-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-t1"
                        type="number" 
                        value={data.t1} 
                        onChange={e => handleNumberInput('t1', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* T2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>T₂ — Месяцев до полной окупаемости CAPEX (капитальных расходов)</span>
                        <Tooltip text="Через сколько месяцев проект вернет все стартовые инвестиции и выйдет в чистую прибыль." />
                      </label>
                      <span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.t2, 1, 60, true).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Пример: стартовые вложения 490 тыс., плановая прибыль 32 тыс/мес → окупаемость 490/32 = 15 мес. Оптимально до 12 месяцев. Инвертированная нормализация от 1 до 60 месяцев.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="60" 
                        step="1" 
                        value={data.t2}
                        onChange={e => handleNumberInput('t2', e.target.value)}
                        className="flex-1 accent-purple-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-t2"
                        type="number" 
                        value={data.t2} 
                        onChange={e => handleNumberInput('t2', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* FACTOR S */}
              <div className="factor-section bg-gradient-to-br from-teal-50/20 to-slate-50 border-l-[6px] border-teal-500 p-6 rounded-2xl">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-lg text-teal-950 flex items-center gap-1.5">
                      <span>S · Социальный</span>
                      <span className="text-xs bg-teal-100 text-teal-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: 15%</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Фактор оценивает силу &quot;сарафанного маркетинга&quot; как реакция на ваш продукт (услугу, изделие, товар), некую самоспособность органически (естественно) распространяться и общий уровень удовлетворенности клиентов (NPS) вашим изделием (продукцией, услугой, работой).</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-mono">Сводный балл S:</span>
                    <div className="text-xl font-black text-teal-600 font-mono">
                      {calculateSubfactors(data).S.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* S1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>S₁ — Доля клиентов по рекомендации (%)</span>
                        <Tooltip text="Какой процент целевого трафика вашей воронки продаж покупает продукт благодаря органическому сарафанному радио." />
                      </label>
                      <span className="font-mono text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.s1, 0, 100).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      Из 100 новых клиентов — сколько пришли по отзывам и рекомендациям друзей? Если вы еще не запустились и не проводили замеры → введите <strong className="font-mono">0</strong>. Диапазон от 0% до 100%.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="1" 
                        value={data.s1}
                        onChange={e => handleNumberInput('s1', e.target.value)}
                        className="flex-1 accent-teal-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-s1"
                        type="number" 
                        value={data.s1} 
                        onChange={e => handleNumberInput('s1', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* S2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>S₂ — Индекс потребительской лояльности NPS</span>
                        <Tooltip text="Net Promoter Score: доля active сторонников продукта за вычетом критиков. Измеряется от -100 до +100." />
                      </label>
                      <span className="font-mono text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">
                        {norm(data.s2, -100, 100).toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      60% рекомендуют товар, 10% недовольны → NPS = 50. Отсутствие полевой статистики или опросов → введите значение <strong className="font-mono">0</strong>. Шкала измерения от -100 до +100.
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        step="5" 
                        value={data.s2}
                        onChange={e => handleNumberInput('s2', e.target.value)}
                        className="flex-1 accent-teal-500 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
                      />
                      <input 
                        id="input-s2"
                        type="number" 
                        value={data.s2} 
                        onChange={e => handleNumberInput('s2', e.target.value)}
                        className="w-24 px-3 py-1.5 text-right font-mono border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* MARKET BLOCK (TAM SAM SOM TAV) */}
              <div className="factor-section bg-gradient-to-br from-amber-500/5 to-slate-50 border-l-[6px] border-amber-600 p-6 rounded-2xl">
                <div className="mb-2">
                  <h3 className="font-display font-bold text-lg text-amber-900 flex items-center gap-1.5">
                    <span>M · Показатели рынка для модификатора MEI</span>
                    <span className="text-xs bg-amber-600/10 text-amber-800 font-mono px-2 py-0.5 rounded">млн рублей</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Определяет рыночную жизнеспособность вашей бизнес-идеи (стартапа) и внутреннее качество вашей бизнес-идеи на только вашей нише рынке, которая формирует финансовый &quot;насос&quot; от вашего проекта и принесет стабильную финансовую автономию.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
                  
                  {/* TAM */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>TAM (Весь рынок РФ)</span>
                      <Tooltip text="Total Addressable Market: Финансовый объем потенциального спроса по всей стране в вашей категории." />
                    </label>
                    <input 
                      id="input-tam"
                      type="number" 
                      value={data.tam} 
                      onChange={e => handleNumberInput('tam', e.target.value)}
                      placeholder="млн руб в год"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold font-mono"
                    />
                    <div className="text-[10px] text-slate-400">Объем всей ниши. Например: 15 000 млн.</div>
                  </div>

                  {/* SAM */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>SAM (Ваш сегмент рынка)</span>
                      <Tooltip text="Serviceable Available Market: Доля рынка, доступная для имеющихся каналов сбыта и дистрибуции." />
                    </label>
                    <input 
                      id="input-sam"
                      type="number" 
                      value={data.sam} 
                      onChange={e => handleNumberInput('sam', e.target.value)}
                      placeholder="млн руб в год"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold font-mono"
                    />
                    <div className="text-[10px] text-slate-400">Достижимый сегмент. Например: 450 млн.</div>
                  </div>

                  {/* SOM */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>SOM (Реальный захват 3 года)</span>
                      <Tooltip text="Serviceable Obtainable Market: Консервативный плановый объем продаж, который вы точно займете своей сетью за 3 года." />
                    </label>
                    <input 
                      id="input-som"
                      type="number" 
                      value={data.som} 
                      onChange={e => handleNumberInput('som', e.target.value)}
                      placeholder="млн руб в год"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold font-mono"
                    />
                    <div className="text-[10px] text-slate-400">Реалистичный план продаж. Например: 18 млн.</div>
                  </div>

                  {/* TAV */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>TAV (Порог автономии)</span>
                      <Tooltip text="Threshold Autonomy Value: Минимально необходимый объем годовой маржинальной прибыли для покрытия всех OPEX расходов бизнеса." />
                    </label>
                    <input 
                      id="input-tav"
                      type="number" 
                      value={data.tav} 
                      onChange={e => handleNumberInput('tav', e.target.value)}
                      placeholder="млн руб в год"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold font-mono"
                    />
                    <div className="text-[10px] text-slate-400">Точка окупаемости в год. Например: 4.5 млн.</div>
                  </div>

                </div>
              </div>


              {/* ACTIONS BOTTOM BLOCK */}
              <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-6 gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={exportToJsonFile}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <FileJson className="w-4 h-4 text-slate-500" />
                    <span>Скачать текущую рабочую версию стартапа JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    title="Очистить все поля анкеты для новой бизнес-идеи"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Очистить для новой бизнес-идеи</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: EXPERT VIEW (SYNCED WEIGHTED FORMS)                 */}
          {/* ======================================================== */}
          {activeTab === 'expert' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                  <p>
                    <strong className="text-slate-800">Режим эксперта</strong> подразумевает, что вы можете выступать в двух ролях:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong className="text-slate-700">Первая роль:</strong> вы честно вводите показатели стартапа через <strong className="text-indigo-600">Анкету стартапа (*.json)</strong> — это истинное положение собранных и просчитанных показателей вашего стартапа.
                    </li>
                    <li>
                      <strong className="text-slate-700">Вторая роль:</strong> экспертно-свободное поведение стартапера («притянутые за уши» показатели, «цифры с потолка» и т.п. поведение с возможностью прямой симуляции значений ползунками).
                    </li>
                  </ul>
                  <p className="text-slate-500 pt-1 border-t border-slate-250/50">
                    Все весовые показатели жестко соответствуют зафиксированной математической модели системы <strong className="text-indigo-600 font-medium">TRUSEK-6</strong>. Данные автоматически дублируются во вкладку анкеты стартапера.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* U SECTION */}
                <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl relative">
                  <span className="absolute top-4 right-4 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-mono font-bold">Вес: 15%</span>
                  <h4 className="font-bold text-indigo-950 font-display">Фактор U — Утилитарность ценностного предложения</h4>
                  
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Стоимость альтернативы (U₁)</span>
                        <span className="font-mono text-indigo-600 font-bold">{data.u1} руб.</span>
                      </div>
                      <input 
                        type="range" min="0" max="300000" step="1000" value={data.u1} 
                        onChange={e => handleNumberInput('u1', e.target.value)}
                        className="w-full accent-indigo-600 cursor-ew-resize h-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Эпизодов потребности в год (U₂)</span>
                        <span className="font-mono text-indigo-600 font-bold">{data.u2}</span>
                      </div>
                      <input 
                        type="range" min="1" max="365" step="1" value={data.u2} 
                        onChange={e => handleNumberInput('u2', e.target.value)}
                        className="w-full accent-indigo-600 cursor-ew-resize h-1"
                      />
                    </div>
                  </div>
                </div>

                {/* E SECTION */}
                <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl relative">
                  <span className="absolute top-4 right-4 bg-amber-100 text-amber-850 px-2 py-0.5 rounded text-xs font-mono font-bold">Вес: 20%</span>
                  <h4 className="font-bold text-slate-900 font-display">Фактор E — Эмоциональное превосходство бренд-контакта</h4>
                  
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Минут взаимодействия (E₁)</span>
                        <span className="font-mono text-amber-700 font-bold">{data.e1} мин</span>
                      </div>
                      <input 
                        type="range" min="0" max="120" step="1" value={data.e1} 
                        onChange={e => handleNumberInput('e1', e.target.value)}
                        className="w-full accent-amber-500 cursor-ew-resize h-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Соотношение цен (E₂)</span>
                        <span className="font-mono text-amber-700 font-bold">{data.e2}</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="3" step="0.05" value={data.e2} 
                        onChange={e => handleNumberInput('e2', e.target.value)}
                        className="w-full accent-amber-500 cursor-ew-resize h-1"
                      />
                    </div>
                  </div>
                </div>

                {/* R SECTION */}
                <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl relative">
                  <span className="absolute top-4 right-4 bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-xs font-mono font-bold">Вес: 15%</span>
                  <h4 className="font-bold text-rose-950 font-display">Фактор R — Коэффициент удержания и повторяемость</h4>
                  
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Покупок в год (R₁)</span>
                        <span className="font-mono text-rose-600 font-bold">{data.r1} покупок</span>
                      </div>
                      <input 
                        type="range" min="0" max="52" step="1" value={data.r1} 
                        onChange={e => handleNumberInput('r1', e.target.value)}
                        className="w-full accent-rose-500 cursor-ew-resize h-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Пропорция LTV/CAC (LTV — пожизненная ценность / CAC — стоимость привлечения) (R₂)</span>
                        <span className="font-mono text-rose-600 font-bold">{data.r2}</span>
                      </div>
                      <input 
                        type="range" min="0" max="15" step="0.1" value={data.r2} 
                        onChange={e => handleNumberInput('r2', e.target.value)}
                        className="w-full accent-rose-500 cursor-ew-resize h-1"
                      />
                    </div>
                  </div>
                </div>

                {/* K SECTION */}
                <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl relative">
                  <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded text-xs font-mono font-bold">Вес: 15%</span>
                  <h4 className="font-bold text-slate-900 font-display">Фактор K — Ограничения по капиталу CAPEX (капитальные расходы)</h4>
                  
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Стартовые затраты K₁ (CAPEX — капитальные расходы)</span>
                        <span className="font-mono text-emerald-700 font-bold">{data.k1} тыс. руб.</span>
                      </div>
                      <input 
                        type="range" min="0" max="5000" step="50" value={data.k1} 
                        onChange={e => handleNumberInput('k1', e.target.value)}
                        className="w-full accent-emerald-500 cursor-ew-resize h-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Прямая маржинальность K₂ (%)</span>
                        <span className="font-mono text-emerald-700 font-bold">{data.k2} %</span>
                      </div>
                      <input 
                        type="range" min="1" max="100" step="1" value={data.k2} 
                        onChange={e => handleNumberInput('k2', e.target.value)}
                        className="w-full accent-emerald-500 cursor-ew-resize h-1"
                      />
                    </div>
                  </div>
                </div>

                {/* T SECTION */}
                <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl relative">
                  <span className="absolute top-4 right-4 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-mono font-bold">Вес: 20%</span>
                  <h4 className="font-bold text-purple-950 font-display">Фактор T — Скорость окупаемости инвестиций</h4>
                  
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Месяцев до EBITDA+ (T₁)</span>
                        <span className="font-mono text-purple-600 font-bold">{data.t1} мес</span>
                      </div>
                      <input 
                        type="range" min="1" max="36" step="1" value={data.t1} 
                        onChange={e => handleNumberInput('t1', e.target.value)}
                        className="w-full accent-purple-500 cursor-ew-resize h-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Полная финансовая окупаемость (T₂)</span>
                        <span className="font-mono text-purple-600 font-bold">{data.t2} мес</span>
                      </div>
                      <input 
                        type="range" min="1" max="60" step="1" value={data.t2} 
                        onChange={e => handleNumberInput('t2', e.target.value)}
                        className="w-full accent-purple-500 cursor-ew-resize h-1"
                      />
                    </div>
                  </div>
                </div>

                {/* S SECTION */}
                <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl relative">
                  <span className="absolute top-4 right-4 bg-teal-100 text-teal-850 px-2 py-0.5 rounded text-xs font-mono font-bold">Вес: 15%</span>
                  <h4 className="font-bold text-teal-950 font-display">Фактор S — Социальное вовлечение и сарафан</h4>
                  
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Рекомендательный трафик (S₁)</span>
                        <span className="font-mono text-teal-600 font-bold">{data.s1} %</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1" value={data.s1} 
                        onChange={e => handleNumberInput('s1', e.target.value)}
                        className="w-full accent-teal-500 cursor-ew-resize h-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Потребительская лояльность NPS (S₂)</span>
                        <span className="font-mono text-teal-600 font-bold">{data.s2}</span>
                      </div>
                      <input 
                        type="range" min="-100" max="100" step="5" value={data.s2} 
                        onChange={e => handleNumberInput('s2', e.target.value)}
                        className="w-full accent-teal-500 cursor-ew-resize h-1"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* MARKET EXP MOD */}
              <div className="p-6 bg-slate-900 text-slate-100 rounded-3xl mt-6">
                <h4 className="font-bold font-display text-base text-amber-400 mb-4 flex items-center gap-1.5">
                  <span>Рыночная емкость (Модификатор MEI)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">TAM (млн руб)</span>
                    <input 
                      type="number" value={data.tam} onChange={e => handleNumberInput('tam', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-sm text-yellow-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">SAM (млн руб)</span>
                    <input 
                      type="number" value={data.sam} onChange={e => handleNumberInput('sam', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-sm text-yellow-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">SOM (млн руб)</span>
                    <input 
                      type="number" value={data.som} onChange={e => handleNumberInput('som', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-sm text-yellow-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">TAV (Порог автономии)</span>
                    <input 
                      type="number" value={data.tav} onChange={e => handleNumberInput('tav', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-sm text-yellow-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Очистить все поля анкеты для новой бизнес-идеи"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Очистить для новой идеи</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('result');
                    showToast('🎛️ Расчеты обновлены для экспертного вида!', 'success');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-xs"
                >
                  Выйти на страницу результатов →
                </button>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: RESULT (DETAILED FLOWER GRID & RECS)                 */}
          {/* ======================================================== */}
          {activeTab === 'result' && (
            <div className="space-y-8 print:space-y-6">

              {/* CRITICAL RENDER RESULTS CARD */}
              <div className="relative text-white rounded-3xl p-6 md:p-8 overflow-hidden shadow-lg border border-slate-800" 
                   style={{ background: `linear-gradient(135deg, ${results.color} 0%, #0f172a 100%)` }}>
                
                {/* Visual decoration inside result report banner */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:justify-between gap-6">
                  
                  <div className="text-center md:text-left">
                    <span className="bg-white/15 backdrop-blur-md text-[10px] font-bold tracking-widest uppercase py-1 px-3 rounded-full text-indigo-100">
                      Прогноз самодостаточности бизнес идеи стартапа на основе модели SSI
                    </span>
                    <h2 className="font-display font-black text-3xl md:text-4xl mt-3 tracking-tight">
                      {data.name || 'Проект без названия'}
                    </h2>
                    <div className="text-sm font-medium text-slate-350 mt-2 space-y-0.5">
                      <p>👥 Автор разработки: <strong className="text-white font-medium">{data.author || 'Не указан'}</strong></p>
                      {data.expert && <p>🎓 Эксперт-наставник: <strong className="text-indigo-200 font-medium">{data.expert}</strong></p>}
                    </div>
                    <p className="text-xs md:text-sm text-slate-200 mt-4 leading-relaxed max-w-2xl font-light">
                      {results.interpretation}
                    </p>
                  </div>

                  <div className="flex flex-col items-center shrink-0 bg-white/10 backdrop-blur-md px-6 py-5 rounded-2xl border border-white/15 w-full md:w-56 text-center shadow-inner">
                    <span className="text-[10px] tracking-widest uppercase text-slate-300 font-bold whitespace-nowrap">Финальный Индекс SSI</span>
                    <span className="font-display font-extrabold text-6xl text-white my-1.5 leading-none">
                      {results.finalSsi.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-indigo-200/90 font-medium">
                      из 10.0 возможных
                    </span>
                  </div>

                </div>

                {/* HORIZONTAL SCALE BAR VISUALIZER */}
                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="relative flex justify-between text-xs text-slate-200 font-bold mb-3 px-1">
                    <span>0.0 (Критический)</span>
                    <span>3.5</span>
                    <span>5.0</span>
                    <span>6.5</span>
                    <span>7.5</span>
                    <span>8.5</span>
                    <span>10.0 (Образцовый)</span>
                  </div>
                  
                  {/* Visual slider track enlarged strictly by 3 times (from h-2.5 to h-7.5 / 30px) */}
                  <div className="h-[30px] bg-white/20 rounded-full overflow-hidden relative shadow-inner border border-white/10">
                    
                    {/* The colored background representing scale milestones */}
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 opacity-95" />
                    
                    {/* The white dot cursor/slider handle enlarged 3 times (from w-4 h-4 to w-12 h-12) with score value inside! */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-white border-[3px] border-slate-900 rounded-full shadow-2xl transition-all duration-1000 ease-out flex items-center justify-center cursor-pointer select-none"
                      style={{ left: `${Math.min(94, Math.max(3, results.finalSsi * 10))}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <span className="text-slate-950 font-mono font-black text-xs">
                        {results.finalSsi.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* LILY FLOWER SVG GRAPHICS & INTRO */}
              <div className="space-y-8">
                
                {/* Vector Canvas Container - Expanded size for premium visual fidelity and layout clarity */}
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/60 p-6 md:p-10 rounded-3xl shadow-sm relative min-h-[640px]">
                  <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Лилия бизнес идеи TRUSEK-6 (+Оценки подфакторов)
                  </div>

                  {/* Interactive Highlight Control Panel */}
                  <div className="mt-8 mb-4 flex flex-wrap gap-3 justify-center z-10 w-full max-w-xl">
                    <button
                      type="button"
                      id="btn-result-highlight-weak"
                      onClick={() => setHighlightMode('weak')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-sm border cursor-pointer ${
                        highlightMode === 'weak'
                          ? 'bg-rose-500 text-white border-rose-500 scale-[1.03] ring-4 ring-rose-100'
                          : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      ⚠️ Слабые факторы
                    </button>
                    <button
                      type="button"
                      id="btn-result-highlight-strong"
                      onClick={() => setHighlightMode('strong')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-sm border cursor-pointer ${
                        highlightMode === 'strong'
                          ? 'bg-emerald-500 text-white border-emerald-500 scale-[1.03] ring-4 ring-emerald-100'
                          : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      🌟 Сильные факторы
                    </button>
                    <button
                      type="button"
                      id="btn-result-highlight-none"
                      onClick={() => setHighlightMode('none')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-sm border cursor-pointer ${
                        highlightMode === 'none'
                          ? 'bg-slate-800 text-white border-slate-800 scale-[1.03] ring-4 ring-slate-100'
                          : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      🔕 Не мигать
                    </button>
                  </div>
                  
                  <div className="w-full max-w-[820px] aspect-square relative selection:bg-none mt-2">
                    <LilySvg subfactors={results.subfactors} ssi={results.finalSsi} data={data} highlightMode={highlightMode} />
                  </div>

                  <div className="text-center text-xs text-slate-500 max-w-xl mt-6 font-light leading-relaxed">
                    Каждый лепесток представляет долю нормированного фактора. Оценки 12 подфакторов нанесены на внешние карточки каждого сектора. Сбалансированный крупный цветок символизирует устойчивую бизнес-модель.
                  </div>
                </div>

                {/* SIDE STATS AND INTERACTIVE KEY LEGEND - Now rendered in a modern 2-column grid beneath the majestic flower! */}
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-lg text-slate-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                    Сводный факторный профиль
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {factorInterpretations.map(f => (
                      <div 
                        key={f.key}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all hover:shadow-xs group ${
                          f.status === 'strong' 
                            ? 'bg-emerald-50/50 border-emerald-100' 
                            : f.status === 'medium'
                            ? 'bg-amber-50/20 border-amber-100'
                            : 'bg-rose-50/40 border-rose-100'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500 uppercase">
                              {f.key}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-slate-800">
                              {f.name.split(' ')[1]}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              f.status === 'strong' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : f.status === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {f.statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 group-hover:line-clamp-none transition-all">
                            {f.desc}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-mono">Балл</span>
                          <span className={`font-mono font-extrabold text-base ${
                            f.status === 'strong' 
                              ? 'text-emerald-700' 
                              : f.status === 'medium'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}>
                            {f.score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* MARKET MODIFIER MEI STATS PANEL */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden border border-slate-850">
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="font-display font-semibold uppercase tracking-wider text-amber-400 text-xs sm:text-sm">
                      Рыночный модификатор MEI (Market Efficiency Index)
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-light leading-relaxed max-w-4xl">
                    Рыночный модификатор калибрует базовый индекс <strong className="text-indigo-300">SSI</strong> на основе масштаба доступного сегмента и реалистичности планов по взятию точки безубыточности. Если соотношение планируемой выручки (<strong className="text-amber-200">SOM</strong>) к порогу автономии операционных расходов (<strong className="text-emerald-200 font-mono">TAV</strong>) меньше единицы — коэффициент опускается до <strong className="text-orange-400 font-mono">0.3</strong>, ослабляя общую оценку стартапа.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center flex flex-col justify-between min-h-[115px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold tracking-wide uppercase">TAM</span>
                        <span className="font-mono text-base font-extrabold mt-1 block">
                          {data.tam ? `${data.tam} млн` : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-2 block leading-snug">
                        Общий объем рынка (весь потенциальный спрос)
                      </span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center flex flex-col justify-between min-h-[115px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold tracking-wide uppercase">SAM</span>
                        <span className="font-mono text-base font-extrabold mt-1 block">
                          {data.sam ? `${data.sam} млн` : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-2 block leading-snug">
                        Доступный сегмент рынка (целевая аудитория)
                      </span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center flex flex-col justify-between min-h-[115px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold tracking-wide uppercase font-semibold text-amber-400">SOM</span>
                        <span className="font-mono text-base font-extrabold mt-1 block text-amber-300">
                          {data.som ? `${data.som} млн` : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] text-amber-400/80 mt-2 block leading-snug">
                        Реальный план продаж стартапа за 3 года
                      </span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center flex flex-col justify-between min-h-[115px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold tracking-wide uppercase font-semibold text-emerald-400">TAV (Порог)</span>
                        <span className="font-mono text-base font-extrabold mt-1 block text-emerald-300">
                          {data.tav ? `${data.tav} млн` : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-400/80 mt-2 block leading-snug">
                        Порог безубыточности и финансовой автономии
                      </span>
                    </div>

                    <div className="bg-indigo-950/60 border border-indigo-500/30 col-span-2 md:col-span-1 p-3 rounded-2xl text-center group flex flex-col justify-between min-h-[115px]">
                      <div>
                        <span className="text-[10px] text-indigo-300 block font-bold tracking-wide uppercase">MEI Коэф.</span>
                        <span className="font-mono text-lg font-black mt-1 block text-indigo-200">
                          × {results.mei.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[9px] text-indigo-300/90 mt-2 block leading-snug font-medium">
                        Индекс рыночной эффективности (отношение SOM к TAV)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* D3 HISTOGRAM FOR MARKET BENCHMARKS COMPARISON */}
              <MarketCompareChart 
                data={data}
                resultsColor={results.color}
              />

              {/* D3 STARTUP RESERVES ENGINE FROM AI AGENT */}
              <StartupReserves
                data={data}
                resultsColor={results.color}
              />

              {/* SALES VOLUME REALISM VALIDATION TOOL */}
              <SalesRealismValidator
                data={data}
                setData={setData}
                resultsColor={results.color}
              />

              {/* DYNAMIC SYSTEM RECOMMENDATIONS */}
              <div className="bg-indigo-50/30 p-6 md:p-8 rounded-3xl border border-indigo-100/60">
                <h3 className="font-display font-extrabold text-indigo-900 text-lg flex items-center gap-2 mb-4">
                  <span>🎯 Векторы стратегического развития</span>
                </h3>

                <div className="space-y-4">
                  {factorInterpretations.some(f => f.status !== 'strong') ? (
                    factorInterpretations
                      .filter(f => f.status !== 'strong')
                      .map(f => (
                        <div 
                          key={f.key}
                          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-start"
                        >
                          <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            f.status === 'weak' 
                              ? 'bg-rose-100 text-rose-850' 
                              : 'bg-amber-100 text-amber-850'
                          }`}>
                            {f.key}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                              Рекомендация по фактору {f.name}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-light">
                              {f.advice}
                            </p>
                          </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 text-center font-bold text-sm">
                      🎉 Все факторы устойчивости превышают 7.0 баллов! Ваша бизнес-модель идеально сбалансирована — выходите на крупные инвестиционные раунды!
                    </div>
                  )}
                </div>
              </div>

              {/* BRAND NEW SECTION: RISK & THREAT ANALYSIS ON ABNORMALLY LOW FACTORS */}
              <div className="bg-rose-50/15 p-6 md:p-8 rounded-3xl border border-rose-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className="font-display font-extrabold text-rose-950 text-lg flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse shrink-0" />
                  <span>⚠️ Карта критических рисков и угроз стартапа</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-3xl mb-6 font-light leading-relaxed">
                  Анализ уязвимостей бизнес-модели на основе аномально низких показателей TRUSEK-6. Факторы со значением менее <strong className="text-rose-700">5.0 баллов</strong> представляют прямую угрозу выживанию вашего проекта.
                </p>

                <div className="space-y-4">
                  {(() => {
                    const criticalRisks = factorInterpretations.filter(f => f.score < 5.0);
                    const moderateRisks = factorInterpretations.filter(f => f.score >= 5.0 && f.score < 7.0);

                    const riskDetails: Record<string, { title: string; desc: string; tip: string }> = {
                      U: {
                        title: "Отсутствие острой боли у клиента (Угроза невостребованности)",
                        desc: "Клиенты легко обходятся без вашего продукта или быстро уходят к конкурентам при первом же изменении цен. Продукт выступает в роли необязательной «витаминки», а не критически важной «таблетки». Это ведет к крайне высокой стоимости привлечения (CAC) и отсутствию реальной рыночной тяги.",
                        tip: "Рекомендуется немедленно провести серию интервью (CustDev) для поиска реальной «горящей» боли аудитории, сузить нишу до сегмента с наивысшей потребностью или радикально переработать ценностное предложение."
                      },
                      E: {
                        title: "Безликий бренд и нулевая привязанность (Угроза ценовой конкуренции)",
                        desc: "У стартапа нет харизмы, запоминающегося бренда или эмоциональной вовлеченности клиентов. Покупатели выбирают вас только из-за низкой цены. Малейшее повышение стоимости или появление более дешевого конкурента мгновенно уничтожит продажи.",
                        tip: "Рекомендуется разработать яркую идентичность бренда, внедрить сильную историю основателей (Storytelling), добавить интерактивные элементы или геймификацию в продукт, а также запустить программы лояльности с эмоциональными вознаграждениями."
                      },
                      R: {
                        title: "Одноразовые продажи и высокий отток (Угроза истощения трафика)",
                        desc: "Потребители покупают продукт один раз и больше не возвращаются. Бизнес вынужден постоянно закупать дорогой платный трафик. При росте цен на рекламу юнит-экономика сойдет в глубокий минус, и проект прекратит существование.",
                        tip: "Срочно перестройте продуктовую линейку. Внедрите подписочные планы (SaaS / абонементы), регулярные расходные материалы, автоматические повторные напоминания, кросс-продажи сопутствующих товаров или услуги поддержки."
                      },
                      K: {
                        title: "Высокая капиталоемкость и низкая маржа (Угроза кассового разрыва)",
                        desc: "Стартап требует огромных первоначальных затрат (CAPEX) на запуск и страдает от высокой себестоимости каждой сделки (низкий OPEX-коэффициент). При малейшей задержке в финансировании или спаде продаж компания столкнется с неплатежеспособностью.",
                        tip: "Переходите на модель Lean Asset (облегченные активы). Замените покупку оборудования арендой, используйте аутсорсинговые платформы, перейдите на контрактное производство и безжалостно сократите постоянные накладные расходы."
                      },
                      T: {
                        title: "Смерть от долгого релиза (Угроза паралича разработки)",
                        desc: "Слишком длинный цикл разработки MVP и долгое время до выхода на точку безубыточности. Стартовые инвестиции будут израсходованы задолго до того, как продукт получит первую рыночную обратную связь и докажет свою жизнеспособность.",
                        tip: "Сократите текущие планы до жесткого функционального ядра. Запустите ручную или полуавтоматическую версию (Wizard of Oz) за 2 недели, чтобы начать собирать первые рубли и фидбек от живых пользователей прямо сейчас."
                      },
                      S: {
                        title: "Органическая глухота бизнеса (Угроза маркетинговой зависимости)",
                        desc: "О стартапе никто не рассказывает добровольно, индекс лояльности NPS близок к нулю. Рост компании возможен исключительно за счет прямой рекламы. При отключении платных каналов привлечение полностью останавливается.",
                        tip: "Внедрите реферальную программу с обоюдным вознаграждением, активно стимулируйте отзывы клиентов бонусами за обзоры, собирайте честную обратную связь по качеству сервиса и устраняйте точки негатива до того, как они попадут в сеть."
                      }
                    };

                    if (criticalRisks.length === 0 && moderateRisks.length === 0) {
                      return (
                        <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-100 flex items-start gap-3.5 text-emerald-850">
                          <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-sm">Потенциальные угрозы отсутствуют!</h4>
                            <p className="text-xs text-emerald-700/90 mt-1 leading-relaxed font-light">
                              Поздравляем! Все ваши показатели находятся на уровне выше критического порога. Цветок лилии TRUSEK-6 раскрыт сбалансировано, что свидетельствует о превосходной устойчивости бизнес-модели к внешним потрясениям.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {/* Render Critical Risks */}
                        {criticalRisks.map(f => {
                          const details = riskDetails[f.key] || { 
                            title: `Высокий риск по фактору ${f.key}`, 
                            desc: f.desc, 
                            tip: f.advice 
                          };
                          return (
                            <div key={`crit-${f.key}`} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-rose-200">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-50 pb-3 mb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                    {f.key}
                                  </span>
                                  <h4 className="font-bold text-xs sm:text-sm text-rose-950">
                                    {details.title}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider bg-rose-50 px-2 py-0.5 rounded">
                                    Критическая угроза
                                  </span>
                                  <span className="font-mono text-xs font-black text-rose-700 bg-rose-100/50 px-2 py-0.5 rounded">
                                    {f.score.toFixed(1)} / 10
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-2.5">
                                <p className="text-xs text-slate-600 leading-relaxed font-light">
                                  {details.desc}
                                </p>
                                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 flex gap-2 items-start text-slate-750">
                                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">Совет</span>
                                  <p className="text-[11px] leading-relaxed font-normal">
                                    {details.tip}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Render Moderate Risks */}
                        {moderateRisks.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-100">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450 mb-3">
                              Вторичные зоны риска (умеренные угрозы):
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {moderateRisks.map(f => (
                                <div key={`mod-${f.key}`} className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-3xs flex gap-3 items-start">
                                  <span className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                                    {f.key}
                                  </span>
                                  <div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-xs text-slate-800 font-semibold">Фактор {f.key} (Средне)</span>
                                      <span className="font-mono text-[10px] font-bold text-amber-700">{f.score.toFixed(1)} / 10</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-normal font-light">
                                      {f.desc}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* REPORT PRINT & ACTION TOOLS */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6 print:hidden">
                
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Печать текущего варианта стартапа</span>
                </button>

                <button
                  type="button"
                  onClick={exportToJsonFile}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  <FileJson className="w-4 h-4 text-slate-400" />
                  <span>Экспортировать JSON анкету</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('anketa');
                    showToast('📝 Переход на страницу редактирования анкеты', 'info');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all"
                >
                  Изменить параметры анкеты
                </button>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: COMPARE (SIDE-BY-SIDE LILY CHARTS & SSI SCORE)       */}
          {/* ======================================================== */}
          {activeTab === 'compare' && (() => {
            const resultsA = compareA ? calculateResult(compareA) : null;
            const resultsB = compareB ? calculateResult(compareB) : null;
            return (
              <div className="space-y-8 print:space-y-4">
                
                {/* HEADER EXPLANATORY CARD */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 animate-fade-in">
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full">
                      Модуль аналитического сравнения моделей
                    </span>
                    <h2 className="font-display font-black text-2xl md:text-3xl mt-3 tracking-tight">
                      Сравнение двух стартапов (А и Б)
                    </h2>
                    <p className="text-xs md:text-sm text-indigo-150 mt-2 max-w-3xl leading-relaxed font-light">
                      Загрузите два файла сохраненных анкет стартапа <code className="text-amber-100 font-mono">.json</code>, чтобы сравнить их сильные и слабые стороны, финальные индексы SSI и форму лепестков лилии. Вы также можете перенести ваши текущие рабочие данные анкеты в качестве одного из сравниваемых образцов!
                    </p>
                  </div>
                </div>

                {/* TWO COLUMNS LOADING GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* COLUMN: STARTUP A */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">А</span>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-wider">Стартап А</h3>
                        </div>
                        {compareA && (
                          <button 
                            type="button"
                            onClick={() => setCompareA(null)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Очистить</span>
                          </button>
                        )}
                      </div>

                      {!compareA ? (
                        <div className="border border-slate-200/80 rounded-2xl p-6 text-center hover:border-indigo-400/80 transition-colors flex flex-col items-center justify-center bg-slate-50/50">
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-xs font-semibold text-slate-700 mb-1">Файл не выбран</p>
                          <p className="text-[10px] text-slate-450 mb-4 max-w-xs">Загрузите или скопируйте показатели для стартапа А</p>
                          
                          <div className="flex flex-col gap-2 w-full max-w-xs">
                            <label className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-extrabold transition-all text-center cursor-pointer flex items-center justify-center gap-1">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Выбрать JSON файл А</span>
                              <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                onChange={handleCompareAImport} 
                              />
                            </label>
                            <button 
                              type="button"
                              onClick={() => {
                                setCompareA(data);
                                showToast('✅ Рабочая анкета перенесена в Стартап А!', 'success');
                              }}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-750 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              Использовать рабочую анкету
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setCompareA(STUDENT_STARTUP_DATA);
                                showToast('✅ Студенческий БПЛА проект загружен в Стартап А!', 'success');
                              }}
                              className="w-full bg-indigo-50 hover:bg-indigo-100/80 text-indigo-750 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                            >
                              Загрузить студенческий демо (БПЛА)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="space-y-1 mb-4">
                            <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-wider">Модель загружена</span>
                            <h4 className="font-extrabold text-base text-slate-900 leading-tight mt-1">{compareA.name || 'Без названия'}</h4>
                            <p className="text-xs text-slate-600 mt-1">👤 Автор: <strong className="text-slate-900 font-medium">{compareA.author || 'Не указан'}</strong></p>
                            {compareA.expert && <p className="text-[11px] text-slate-500">🎓 Эксперт: {compareA.expert}</p>}
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-3">
                            <div className="p-2.5 bg-white rounded-xl border border-slate-150 text-center shadow-inner">
                              <span className="text-[9px] block text-slate-500 font-bold uppercase tracking-wider">Финальный SSI</span>
                              <span className="text-xl font-black block mt-0.5" style={{ color: resultsA!.color }}>{resultsA!.finalSsi.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-400">из 10.0</span>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-slate-150 text-center flex flex-col justify-center shadow-inner">
                              <span className="text-[9px] block text-slate-500 font-bold uppercase tracking-wider">Множитель MEI</span>
                              <span className="text-lg font-black text-slate-750 block mt-0.5">x{resultsA!.mei.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-400">Рыночный охват</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COLUMN: STARTUP B */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">Б</span>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-wider">Стартап Б</h3>
                        </div>
                        {compareB && (
                          <button 
                            type="button"
                            onClick={() => setCompareB(null)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Очистить</span>
                          </button>
                        )}
                      </div>

                      {!compareB ? (
                        <div className="border border-slate-200/80 rounded-2xl p-6 text-center hover:border-emerald-400/80 transition-colors flex flex-col items-center justify-center bg-slate-50/50">
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-xs font-semibold text-slate-700 mb-1">Файл не выбран</p>
                          <p className="text-[10px] text-slate-450 mb-4 max-w-xs">Загрузите или скопируйте показатели для стартапа Б</p>
                          
                          <div className="flex flex-col gap-2 w-full max-w-xs">
                            <label className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-extrabold transition-all text-center cursor-pointer flex items-center justify-center gap-1">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Выбрать JSON файл Б</span>
                              <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                onChange={handleCompareBImport} 
                              />
                            </label>
                            <button 
                              type="button"
                              onClick={() => {
                                setCompareB(data);
                                showToast('✅ Рабочая анкета перенесена в Стартап Б!', 'success');
                              }}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-705 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              Использовать рабочую анкету
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setCompareB(INITIAL_STARTUP_DATA);
                                showToast('✅ Проект Сенсорного Сада загружен в Стартап Б!', 'success');
                              }}
                              className="w-full bg-emerald-50 hover:bg-emerald-100/80 text-emerald-750 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                            >
                              Загрузить образцовый демо (Сад)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="space-y-1 mb-4">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded tracking-wider">Модель загружена</span>
                            <h4 className="font-extrabold text-base text-slate-900 leading-tight mt-1">{compareB.name || 'Без названия'}</h4>
                            <p className="text-xs text-slate-600 mt-1">👤 Автор: <strong className="text-slate-900 font-medium">{compareB.author || 'Не указан'}</strong></p>
                            {compareB.expert && <p className="text-[11px] text-slate-500">🎓 Эксперт: {compareB.expert}</p>}
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-3">
                            <div className="p-2.5 bg-white rounded-xl border border-slate-150 text-center shadow-inner">
                              <span className="text-[9px] block text-slate-500 font-bold uppercase tracking-wider">Финальный SSI</span>
                              <span className="text-xl font-black block mt-0.5" style={{ color: resultsB!.color }}>{resultsB!.finalSsi.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-400">из 10.0</span>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-slate-150 text-center flex flex-col justify-center shadow-inner">
                              <span className="text-[9px] block text-slate-500 font-bold uppercase tracking-wider">Множитель MEI</span>
                              <span className="text-lg font-black text-slate-750 block mt-0.5">x{resultsB!.mei.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-400">Рыночный охват</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* VISUAL DIAGRAM LILY SIDE BY SIDE COMPARISON */}
                {(compareA || compareB) && (
                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-display font-extrabold text-slate-900 text-lg uppercase tracking-wide border-b border-slate-100 pb-3 mb-6 flex items-center justify-between">
                      <span>🌸 Сравнительные лепестковые диаграммы лилии</span>
                      <span className="text-xs text-slate-500 font-normal normal-case">Зависят от баланса факторов TRUSEK-6</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center max-w-4xl mx-auto">
                      {/* Flower A */}
                      <div className="flex flex-col items-center">
                        <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider max-w-[260px] truncate">
                          {compareA ? compareA.name : 'Стартап А не выбран'}
                        </div>
                        
                        <div className="w-full max-w-[325px] aspect-square relative selection:bg-none bg-slate-50/60 p-4 rounded-2xl border border-slate-100 flex items-center justify-center shadow-inner">
                          {compareA && resultsA ? (
                            <div className="w-full h-full relative">
                              <LilySvg subfactors={resultsA.subfactors} ssi={resultsA.finalSsi} data={compareA} highlightMode="none" />
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic text-center">Загрузите Стартап А, чтобы построить диаграмму</div>
                          )}
                        </div>
                        {compareA && resultsA && (
                          <div className="mt-3 text-[11px] text-center max-w-xs text-slate-500 font-light leading-relaxed">
                            Индекс SSI: <strong className="font-extrabold text-slate-800">{resultsA.finalSsi.toFixed(2)}</strong>. <span className="text-indigo-650 font-medium">{resultsA.interpretation.split('—')[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Flower B */}
                      <div className="flex flex-col items-center">
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider max-w-[260px] truncate">
                          {compareB ? compareB.name : 'Стартап Б не выбран'}
                        </div>
                        
                        <div className="w-full max-w-[325px] aspect-square relative selection:bg-none bg-slate-50/60 p-4 rounded-2xl border border-slate-100 flex items-center justify-center shadow-inner">
                          {compareB && resultsB ? (
                            <div className="w-full h-full relative">
                              <LilySvg subfactors={resultsB.subfactors} ssi={resultsB.finalSsi} data={compareB} highlightMode="none" />
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic text-center">Загрузите Стартап Б, чтобы построить диаграмму</div>
                          )}
                        </div>
                        {compareB && resultsB && (
                          <div className="mt-3 text-[11px] text-center max-w-xs text-slate-500 font-light leading-relaxed">
                            Индекс SSI: <strong className="font-extrabold text-slate-800">{resultsB.finalSsi.toFixed(2)}</strong>. <span className="text-emerald-650 font-medium">{resultsB.interpretation.split('—')[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* DETAILED FACTOR MATRIX */}
                {resultsA && resultsB && (
                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-display font-extrabold text-slate-900 text-lg uppercase tracking-wide border-b border-slate-100 pb-3 flex items-center justify-between">
                      <span>⚖️ Сопоставление факторов TRUSEK-6</span>
                      <span className="text-[10px] text-slate-500 font-mono font-normal">Сравнение по шкале от 0 до 10</span>
                    </h3>

                    <div className="overflow-x-auto rounded-2xl border border-slate-150">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4">Показатель устойчивости</th>
                            <th className="py-3 px-4 text-center">Балл А</th>
                            <th className="py-3 px-4 text-center">Балл Б</th>
                            <th className="py-3 px-4 text-center">Разница (А vs Б)</th>
                            <th className="py-3 px-4">У кого сильнее?</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const factorsList = [
                              { key: 'U', name: 'Потеря покупателя по цене конкурентов (U)', desc: 'Минимизация цены альтернативы и частота контакта' },
                              { key: 'E', name: 'Эмоциональный фактор бизнес-идеи (E)', desc: 'Вау-эффект, вовлеченность и ценовая наценка' },
                              { key: 'R', name: 'Регулярность продаж и удержание (R)', desc: 'Спросовая цикличность и соотношение LTV/CAC' },
                              { key: 'K', name: 'Капитал-эффективность модели (K)', desc: 'Низкий стартовый CAPEX и высокая рентабельность' },
                              { key: 'T', name: 'Скорость окупаемости инвестиций (T)', desc: 'Разработка MVP, точка безубыточности и окупаемость' },
                              { key: 'S', name: 'Сарафанное радио и виральность (S)', desc: 'Доля органики, лояльность клиентов и NPS' },
                            ];

                            return factorsList.map(f => {
                              const scoreA = resultsA.subfactors[f.key as keyof Subfactors];
                              const scoreB = resultsB.subfactors[f.key as keyof Subfactors];
                              const delta = scoreA - scoreB;
                              const isSignificant = Math.abs(delta) > 0.01;
                              const leader = delta > 0.01 ? 'A' : (delta < -0.01 ? 'Б' : 'Равны');
                              
                              return (
                                <tr key={f.key} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="py-3.5 px-4 max-w-xs sm:max-w-none">
                                    <div className="font-bold text-slate-800">{f.name}</div>
                                    <div className="text-[10px] text-slate-450 mt-0.5">{f.desc}</div>
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-extrabold text-indigo-700 text-sm">
                                    {scoreA.toFixed(2)}
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-extrabold text-emerald-700 text-sm">
                                    {scoreB.toFixed(2)}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                      delta > 0.01 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : (delta < -0.01 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500')
                                    }`}>
                                      {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-xs">
                                    {leader === 'A' && <span className="text-indigo-600 flex items-center gap-1">🏆 {compareA?.name || 'А'}</span>}
                                    {leader === 'Б' && <span className="text-emerald-600 flex items-center gap-1">🏆 {compareB?.name || 'Б'}</span>}
                                    {leader === 'Равны' && <span className="text-slate-400">Равные позиции</span>}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* MARKET STATS ROW COMPARISON */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                        <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-indigo-700 mb-2">Финансы и объемы Стартапа А</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-705">
                          <div>TAM рынок: <span className="font-bold text-slate-900">{compareA.tam?.toLocaleString() || 0} млн</span></div>
                          <div>SAM охват: <span className="font-bold text-slate-900">{compareA.sam?.toLocaleString() || 0} млн</span></div>
                          <div>SOM планка: <span className="font-bold text-slate-900">{compareA.som?.toLocaleString() || 0} млн</span></div>
                          <div>Автономия TAV: <span className="font-bold text-slate-900">{compareA.tav?.toLocaleString() || 0} млн</span></div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                        <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-emerald-700 mb-2">Финансы и объемы Стартапа Б</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-705">
                          <div>TAM рынок: <span className="font-bold text-slate-900">{compareB.tam?.toLocaleString() || 0} млн</span></div>
                          <div>SAM охват: <span className="font-bold text-slate-900">{compareB.sam?.toLocaleString() || 0} млн</span></div>
                          <div>SOM планка: <span className="font-bold text-slate-900">{compareB.som?.toLocaleString() || 0} млн</span></div>
                          <div>Автономия TAV: <span className="font-bold text-slate-900">{compareB.tav?.toLocaleString() || 0} млн</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Summary recommendation report card */}
                    <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/60 mt-4">
                      <h4 className="font-bold text-xs sm:text-sm text-indigo-900 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Рекомендация прединвестиционной аналитики:</span>
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-light">
                        {resultsA.finalSsi > resultsB.finalSsi ? (
                          <span>Проект <strong className="text-indigo-800 font-bold">{compareA.name}</strong> показывает общую более высокую прогнозируемую выживаемость и жизнеспособность за счет превосходящих факторов TRUSEK-6 (разница { (resultsA.finalSsi - resultsB.finalSsi).toFixed(2) } балла). Рекомендуется со стороны Технопарка отдать предпочтение данной модели, так как её лепестковый цветок более гармонично раскрыт, что означает минимизацию стратегических уязвимостей.</span>
                        ) : (resultsA.finalSsi < resultsB.finalSsi ? (
                          <span>Проект <strong className="text-emerald-800 font-bold">{compareB.name}</strong> демонстрирует лучшие показатели по формуле SSI с разницей { (resultsB.finalSsi - resultsA.finalSsi).toFixed(2) } балла. Этот стартап более автономен, обладает сильной капитал-эффективностью или мощным виральным удержанием. Данная бизнес-модель является предпочтительным объектом инвестирования при соблюдении плановых издержек.</span>
                        ) : (
                          <span>Оба анализируемых стартапа (<strong className="text-indigo-700">{compareA.name}</strong> и <strong className="text-emerald-700">{compareB.name}</strong>) имеют абсолютно одинаковый интегральный коэффициент самодостаточности SSI ({resultsA.finalSsi.toFixed(2)}). Это редкий паритет. Рекомендуется оценить качество команды фаундеров, технологический порог входа и регуляторные риски каждого стартапа.</span>
                        ))}
                      </p>
                    </div>

                  </div>
                )}

                {/* EMPTY CORNER WARNING */}
                {(!compareA || !compareB) && (
                  <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-200 text-center max-w-xl mx-auto shadow-inner">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800">Ожидание данных для сравнения</h4>
                    <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                      Для выполнения сопоставительного анализа факторов жизнеспособности по методике TRUSEK-6 необходимо загрузить <strong>оба стартапа (А и Б)</strong>. Воспользуйтесь кнопками быстрого переноса текущей рабочей анкеты или ознакомьтесь с демоданными!
                    </p>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* TAB: AGENT (AI STARTUP AGENT WITH CUSTOM AUTO-COST CALC) */}
          {/* ======================================================== */}
          {activeTab === 'agent' && (
            <AIAgentTab 
              onApplyData={(newData) => {
                setData(newData);
                setActiveTab('anketa');
              }}
              showToast={(msg, type) => showToast(msg, type)}
            />
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="container max-w-6xl mx-auto px-4 mt-12 text-center text-xs text-slate-400 font-light leading-relaxed print:hidden">
        <p className="border-t border-slate-200 pt-6">
          <strong>Индекс самодостаточности SSI (Self-Sufficiency Index) — TRUSEK-6 + MEI</strong>
        </p>
        <p className="mt-1">
          Методический проект Технопарка Северо-Кавказского федерального университета (СКФУ). © 2025–2026 Все права защищены.
        </p>
      </footer>

      {/* AUTHORS MODAL OVERLAY */}
      <AnimatePresence>
        {isAuthorsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthorsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[92vh]"
            >
              {/* Decorative top strip */}
              <div className="h-2 bg-gradient-to-r from-amber-400 via-indigo-600 to-violet-600 shrink-0" />

              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <BookOpen className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-slate-900 text-sm md:text-base leading-tight">Методология TRUSEK-6 / SSI</h2>
                    <p className="text-[11px] text-slate-500 font-medium font-sans mt-0.5">Лист {authorsActiveTab} из 7 · {
                      authorsActiveTab === 1 ? "Авторы и публикация" : 
                      authorsActiveTab === 2 ? "Что такое индекс SSI?" : 
                      authorsActiveTab === 3 ? "Формула индекса SSI" : 
                      authorsActiveTab === 4 ? "12 микро-метрик" : 
                      authorsActiveTab === 5 ? "Формирование факторов" : 
                      authorsActiveTab === 6 ? "Лилия SSI" : 
                      "Научное обоснование"
                    }</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthorsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Закрыть окно"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* TABS SELECTOR (HORIZONTAL SCROLLABLE ON MOBILE) */}
              <div className="px-4 py-2 bg-slate-100/50 border-b border-slate-200/60 overflow-x-auto flex gap-1.5 scrollbar-thin shrink-0 select-none">
                {[
                  { id: 1, name: '1. Авторы' },
                  { id: 2, name: '2. Суть SSI' },
                  { id: 3, name: '3. Формула' },
                  { id: 4, name: '4. 12 метрик' },
                  { id: 5, name: '5. Расчет' },
                  { id: 6, name: '6. Лилия SSI' },
                  { id: 7, name: '7. Источники' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAuthorsActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      authorsActiveTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/50'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Scrollable Content */}
              <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
                
                {/* LIST 1: AUTHORS AND PUBLICATION */}
                {authorsActiveTab === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Представленный калькулятор является полной программной реализацией комплексной прединвестиционной экспресс-оценки инновационных бизнес-идей на основе международных методик оценки стартапов и отечественных разработок РФ и СКФУ.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Author 1 */}
                      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 p-4.5 rounded-2xl border border-slate-150 relative group overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-5 text-indigo-950 scale-150 pointer-events-none">
                          <Users className="w-20 h-20" />
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5 text-amber-500">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[9px] font-black tracking-widest uppercase">Профессор</span>
                        </div>
                        <h3 className="font-display font-extrabold text-slate-900 text-sm mb-1 leading-snug">
                          Мандрица Игорь Владимирович
                        </h3>
                        <p className="text-[11px] text-slate-600 font-semibold mb-2">
                          Доктор экономических наук, доцент
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal border-t border-slate-100 pt-2 font-normal">
                          Профессор кафедры организации и технологии защиты информации <br />
                          <span className="text-indigo-600 font-semibold">Северо-Кавказский федеральный университет, Ставрополь</span>
                        </p>
                      </div>

                      {/* Author 2 */}
                      <div className="bg-gradient-to-br from-slate-50 to-violet-50/20 p-4.5 rounded-2xl border border-slate-150 relative group overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-5 text-indigo-950 scale-150 pointer-events-none">
                          <Users className="w-20 h-20" />
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5 text-indigo-500">
                          <Award className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] font-black tracking-widest uppercase">Зав. кафедрой</span>
                        </div>
                        <h3 className="font-display font-extrabold text-slate-900 text-sm mb-1 leading-snug">
                          Мандрица Ольга Владимировна
                        </h3>
                        <p className="text-[11px] text-slate-600 font-semibold mb-2">
                          Кандидат экономических наук, доцент
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal border-t border-slate-100 pt-2 font-normal">
                          Заведующая кафедрой региональной экономики <br />
                          <span className="text-violet-600 font-semibold">МИРЭА — Российский технологический университет, Ставропольский филиал</span>
                        </p>
                      </div>
                    </div>

                    {/* Publication */}
                    <div className="bg-slate-900 text-slate-100 p-4 md:p-5 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-gradient-to-b from-indigo-500/10 to-transparent w-36 h-36 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span className="text-[9px] font-bold tracking-widest uppercase text-amber-300">Научная публикация</span>
                      </div>
                      <h4 className="font-display font-bold text-xs text-white mb-2.5 italic leading-relaxed">
                        «Индекс самодостаточности бизнес-идеи стартапа (SSI) как предиктивный инструмент прединвестиционной оценки венчурной привлекательности инновационных проектов»
                      </h4>
                      <div className="border-t border-slate-800 pt-2.5 space-y-1 text-[10px] text-slate-300 font-normal">
                        <p><strong className="text-slate-100">Издание:</strong> Журнал МИР (Модернизация. Инновации. Развитие) · Рецензия ВАК · ISSN 2079-4665</p>
                        <p className="text-amber-400"><strong className="text-slate-200">Статус:</strong> Подана в издательство · 2026</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LIST 2: WHAT IS SSI? */}
                {authorsActiveTab === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 font-sans text-xs text-slate-700 font-normal leading-relaxed">
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 text-slate-800">
                      <p className="font-bold text-indigo-950 mb-1.5 text-sm">SSI (Startup Self-Sufficiency Index)</p>
                      <p>
                        Индекс самодостаточности бизнес-идеи стартапа (SSI) — это интегральный показатель из интервала <strong className="text-slate-900">[0; 10]</strong>, измеряющий уровень жизнеспособности инновационного проекта при выходе в конкурентную среду. Индекс предиктивно оценивает шансы стартапа на окупаемость и минимизирует риски кассового разрыва.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/60">
                        <h4 className="font-bold text-slate-900 mb-1">Основные задачи индекса:</h4>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                          <li>Оценка устойчивости стартап-модели без внешней подпитки грантами;</li>
                          <li>Ранжирование инновационных студенческих бизнес-планов технопарком;</li>
                          <li>Прединвестиционный скоринг для венчурных студий и «бизнес-ангелов»;</li>
                          <li>Поиск "узких мест" до непосредственного привлечения первого CAPEX.</li>
                        </ul>
                      </div>

                      <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/60">
                        <h4 className="font-bold text-slate-900 mb-1">Факторный баланс:</h4>
                        <p className="text-slate-600 leading-relaxed">
                          Методика базируется на 6 ключевых факторах устойчивости модели (TRUSEK-6): утилитарность решения, эмоциональная наценка, спросовая регулярность удержания, капитал-эффективность, скорость достижения безубыточности и органический вирусный коэффициент рекомендации.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LIST 3: THE FORMULA OF INDEX SSI */}
                {authorsActiveTab === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 font-sans text-xs text-slate-700 font-normal leading-relaxed">
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2.5">
                      <h4 className="font-bold text-slate-900 text-sm">Сбалансированная взвешенность MIMIC</h4>
                      <p className="text-slate-600">
                        Интегральная формула вычисляет финальный индекс SSI посредством суммирования нормализованных баллов по 6 базовым осям, где каждая ось обладает жестко верификационным весом в зависимости от силы влияния на выживаемость бизнеса:
                      </p>
                      <div className="font-mono bg-slate-900 text-amber-300 py-3 px-4 rounded-xl text-center text-xs md:text-sm font-black tracking-wide shadow-inner">
                        SSI = 0.15·U + 0.20·E + 0.15·R + 0.15·K + 0.20·T + 0.15·S
                      </div>
                    </div>

                    <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <div className="grid grid-cols-12 bg-slate-100 px-3 py-2 text-[10px] font-black tracking-wider text-slate-500 uppercase">
                        <div className="col-span-1">Ось</div>
                        <div className="col-span-3">Название фактора</div>
                        <div className="col-span-1 text-center">Вес</div>
                        <div className="col-span-7">Описание математической сути</div>
                      </div>
                      <div className="divide-y divide-slate-150">
                      <div className="grid grid-cols-12 px-3 py-1.5 items-center bg-white">
                          <div className="col-span-1 font-mono text-blue-600 font-extrabold">U</div>
                          <div className="col-span-3 font-semibold text-slate-800">Утилитарность</div>
                          <div className="col-span-1 text-center font-mono font-bold text-slate-500">0.15</div>
                          <div className="col-span-7 text-slate-600">Сколько денег в рублях теряет клиент без использования вашего решения.</div>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1.5 items-center bg-slate-50/50">
                          <div className="col-span-1 font-mono text-rose-600 font-extrabold">E</div>
                          <div className="col-span-3 font-semibold text-slate-800">Эмоция</div>
                          <div className="col-span-1 text-center font-mono font-bold text-slate-500">0.20</div>
                          <div className="col-span-7 text-slate-600">Насколько сильно клиент привыкает и эмоционально вовлекается в потребление.</div>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1.5 items-center bg-white">
                          <div className="col-span-1 font-mono text-pink-600 font-extrabold">R</div>
                          <div className="col-span-3 font-semibold text-slate-800">Повторяемость</div>
                          <div className="col-span-1 text-center font-mono font-bold text-slate-500">0.15</div>
                          <div className="col-span-7 text-slate-600">Инициирует ли потребитель повторные закупки сам, или требуется массированная реклама.</div>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1.5 items-center bg-slate-50/50">
                          <div className="col-span-1 font-mono text-emerald-600 font-extrabold">K</div>
                          <div className="col-span-3 font-semibold text-slate-800">Капитал⁻¹</div>
                          <div className="col-span-1 text-center font-mono font-bold text-slate-500">0.15</div>
                          <div className="col-span-7 text-slate-600">Чем меньше требуемый стартовый капитал (CAPEX) — тем выше присуждаемый модели балл.</div>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1.5 items-center bg-white">
                          <div className="col-span-1 font-mono text-purple-600 font-extrabold">T</div>
                          <div className="col-span-3 font-semibold text-slate-800">Время⁻¹</div>
                          <div className="col-span-1 text-center font-mono font-bold text-slate-500">0.20</div>
                          <div className="col-span-7 text-slate-600">Чем динамичнее происходит выход стартапа в реальную чистую прибыль — тем выше балл.</div>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-1.5 items-center bg-slate-50/50">
                          <div className="col-span-1 font-mono text-cyan-600 font-extrabold">S</div>
                          <div className="col-span-3 font-semibold text-slate-800">Социальность</div>
                          <div className="col-span-1 text-center font-mono font-bold text-slate-500">0.15</div>
                          <div className="col-span-7 text-slate-600">Насколько активно клиенты рекомендуют проект своим партнерам и друзьям.</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] bg-indigo-50 text-indigo-900/90 rounded-xl p-3 border border-indigo-150 leading-relaxed font-normal">
                      <strong>★ Научное примечание:</strong> Исключительные весовые коэффициенты факторов <strong>E (Эмоция)</strong> и <strong>T (Время)</strong> равные <strong>0.20</strong> продиктованы открытиями поведенческой экономики (Kahneman & Tversky, 1979), доказывающими доминирование эмоционального фактора в более чем 70% потребительских решений, а также критичной важностью сокращения горизонта окупаемости в пределах 3–5 лет для профессиональных венчурных инвесторов.
                    </div>
                  </motion.div>
                )}

                {/* LIST 4: 12 MICRO-METRICS */}
                {authorsActiveTab === 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
                    <p className="text-xs text-slate-600 leading-normal font-normal">
                      Каждый из 6 факторов TRUSEK-6 математически раскладывается на две микро-метрики, исключающие субъективные суждения студента:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Factor U */}
                      <div className="border border-slate-150 rounded-2xl p-3 bg-indigo-50/10 hover:bg-indigo-50/20 transition-all">
                        <span className="text-[10px] font-black tracking-wider text-blue-600 uppercase">U — Утилитарность</span>
                        <div className="space-y-1.5 mt-1 text-[11px] leading-relaxed">
                          <p><strong className="text-slate-900 font-bold font-mono">U1 Переключаемость:</strong> Отношение стоимости перехода на продукт конкурента к ежемесячным потерям клиента.</p>
                          <p><strong className="text-slate-900 font-bold font-mono">U2 Критичность боли:</strong> Число суток, которое клиент способен безболезненно обходиться без вашего продукта.</p>
                        </div>
                      </div>

                      {/* Factor E */}
                      <div className="border border-slate-150 rounded-2xl p-3 bg-rose-50/10 hover:bg-rose-50/20 transition-all">
                        <span className="text-[10px] font-black tracking-wider text-rose-600 uppercase">E — Эмоция</span>
                        <div className="space-y-1.5 mt-1 text-[11px] leading-relaxed">
                          <p><strong className="text-slate-900 font-bold font-mono">E1 Вовлечённость:</strong> Отношение минут сеанса к 10 + доля активно генерируемого UGC (User Generated Content) × 5.</p>
                          <p><strong className="text-slate-900 font-bold font-mono">E2 Ценовая премия:</strong> Индекс наценки (превосходство вашей розничной стоимости над среднерыночной базой).</p>
                        </div>
                      </div>

                      {/* Factor R */}
                      <div className="border border-slate-150 rounded-2xl p-3 bg-pink-50/10 hover:bg-pink-50/20 transition-all">
                        <span className="text-[10px] font-black tracking-wider text-pink-600 uppercase">R — Повторяемость</span>
                        <div className="space-y-1.5 mt-1 text-[11px] leading-relaxed">
                          <p><strong className="text-slate-900 font-bold font-mono">R1 Частота возврата:</strong> Доля повторных транзакций по закупкам внутри всей совокупности заказов за год.</p>
                          <p><strong className="text-slate-900 font-bold font-mono">R2 Коэффициент окупаемости LTV / CAC:</strong> Соотношение жизненного цикла клиента к стоимости его привлечения.</p>
                        </div>
                      </div>

                      {/* Factor K */}
                      <div className="border border-slate-150 rounded-2xl p-3 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all">
                        <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase">K — Капитал⁻¹</span>
                        <div className="space-y-1.5 mt-1 text-[11px] leading-relaxed">
                          <p><strong className="text-slate-900 font-bold font-mono">K1 Порог входа:</strong> Формульный индикатор: <code>10 − (CAPEX в млн руб.) / 30</code> (чем меньше CAPEX — тем выше балл).</p>
                          <p><strong className="text-slate-900 font-bold font-mono">K2 Операционная эффективность:</strong> <code>10 − (OPEX / Целевая Выручка) × 10</code>.</p>
                        </div>
                      </div>

                      {/* Factor T */}
                      <div className="border border-slate-150 rounded-2xl p-3 bg-purple-50/10 hover:bg-purple-50/20 transition-all">
                        <span className="text-[10px] font-black tracking-wider text-purple-600 uppercase">T — Время⁻¹</span>
                        <div className="space-y-1.5 mt-1 text-[11px] leading-relaxed">
                          <p><strong className="text-slate-900 font-bold font-mono">T1 Выход в чистую прибыль:</strong> Время достижения точки EBITDA+. Рассчитывается как <code>10 − (месяцев) / 12</code>.</p>
                          <p><strong className="text-slate-900 font-bold font-mono">T2 Операционная самоокупаемость:</strong> Скорость генерации потока за счет покрытия Опекс.</p>
                        </div>
                      </div>

                      {/* Factor S */}
                      <div className="border border-slate-150 rounded-2xl p-3 bg-cyan-50/10 hover:bg-cyan-50/20 transition-all">
                        <span className="text-[10px] font-black tracking-wider text-cyan-600 uppercase">S — Социальность</span>
                        <div className="space-y-1.5 mt-1 text-[11px] leading-relaxed">
                          <p><strong className="text-slate-900 font-bold font-mono">S1 Вирусный рост:</strong> Общий численный объем привлеченных клиентов по пользовательским промокодам.</p>
                          <p><strong className="text-slate-900 font-bold font-mono">S2 Индекс NPS лояльности:</strong> Процент активных сторонников бренда за вычетом процента критиков.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LIST 5: DETAILED STEP CALCULATION & THEORY */}
                {authorsActiveTab === 5 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="relative min-h-[380px] p-1 flex items-center justify-center"
                  >
                    {/* Background content "70% hidden like in fog" (opacity-30 + blur) */}
                    <div className="opacity-30 blur-[2.5px] select-none pointer-events-none space-y-4 text-xs text-slate-700 font-normal leading-relaxed w-full">
                      <div className="space-y-2.5">
                        <h4 className="font-bold text-slate-900 text-sm border-l-2 border-amber-500 pl-2">Шаг 1 — Нормализация каждого подфактора</h4>
                        <p>
                          Поскольку показатели измеряются в абсолютно несопоставимых единицах (сроки в месяцах, объемы в рублях, доли в процентах), модель TRUSEK-6 нормализует «сырые» данные по кусочно-линейным функциям с использованием жестко заданных отраслевых бенчмарков в диапазоне [2; 10].
                        </p>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium text-[11px] grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="font-bold text-indigo-700">Пример по U1 (Переключаемость):</span>
                            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-600 font-normal">
                              <li>Отношение затрат &gt; 4× → балл 10</li>
                              <li>Отношение 3–4× → балл 8</li>
                              <li>Отношение 2–3× → балл 6</li>
                              <li>Отношение 1–2× → балл 4</li>
                              <li>Отношение &lt; 1× → балл 2</li>
                            </ul>
                          </div>
                          <div>
                            <span className="font-bold text-rose-700">Пример по U2 (Критичность боли):</span>
                            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-600 font-normal">
                              <li>Безболезненно без продукта &lt; 1 дня → 10</li>
                              <li>Безболезненно от 1 до 7 дней → 8</li>
                              <li>Безболезненно от 7 до 30 дней → 5</li>
                              <li>Безболезненно свыше 30 дней → 2</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <h4 className="font-bold text-slate-900 text-sm border-l-2 border-indigo-500 pl-2">Шаг 2 — Агрегационное слияние двух подфакторов в один фактор</h4>
                        <p>
                          Внутри каждого укрупненного фактора пара определяющих его микро-метрик взвешивается с равными долями влияния (через математическое среднее арифметическое):
                        </p>
                        <div className="font-mono bg-indigo-50 text-indigo-900 px-4 py-2 rounded-xl text-center text-[11px] space-y-1">
                          <div>U = (U1_норм + U2_норм) / 2</div>
                          <div>E = (E1_норм + E2_норм) / 2</div>
                          <div>R = (R1_норм + R2_норм) / 2</div>
                          <div>K = (K1_норм + K2_норм) / 2</div>
                          <div>T = (T1_норм + T2_норм) / 2</div>
                          <div>S = (S1_норм + S2_норм) / 2</div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <h4 className="font-bold text-slate-900 text-sm border-l-2 border-violet-500 pl-2">Шаг 3 — Сборка итогового индекса SSI</h4>
                        <p>
                          На третьем завершающем уровне шесть сбалансированных факторов взвешиваются коэффициентами модели <strong>MIMIC</strong> (Multiple Indicators Multiple Causes):
                        </p>
                        <p className="font-mono bg-slate-900 text-slate-200 px-4 py-2.5 rounded-xl text-center text-xs">
                          SSI = 0.15·U + 0.20·E + 0.15·R + 0.15·K + 0.20·T + 0.15·S
                        </p>
                      </div>

                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/50 space-y-2 text-[11px] leading-relaxed">
                        <h5 className="font-extrabold text-slate-900">Прикладной сквозной пример (Месяцы до EBITDA+):</h5>
                        <p>
                          Возьмем микро-метрику <strong>T1</strong> (время до EBITDA+) для SaaS-платформы:
                        </p>
                        <ul className="list-decimal pl-5 space-y-1 text-slate-700 font-normal">
                          <li><strong>Сырые данные:</strong> 3 календарных месяца до планируемого выхода в чистый плюс.</li>
                          <li><strong>Нормализация:</strong> <code>T1_норм = 10 − (3 / 12) = 9.75</code>. Калькулятор округляет показатель до нормативного ровного шага <code>9.0</code> по шкале бенчмарка.</li>
                          <li><strong>Агрегация с T2:</strong> Если измеритель T2 показал 9.0, то расчетный агрегированный фактор <code>T = (9.0 + 9.0) / 2 = 9.0</code>.</li>
                          <li><strong>Вклад в итоговый индекс SSI:</strong> <code>0.20 × 9.0 = 1.80 пунктов</code> из условных максимальных 2.0 возможных.</li>
                        </ul>
                      </div>

                      <div className="border border-slate-200 p-3 bg-slate-50/70 rounded-xl space-y-1.5 text-[10px] leading-normal text-slate-500 font-sans">
                        <strong className="text-slate-800">Матричная нотация модели:</strong> <br />
                        <code>Уровень 3 → 2: x_ij_норм = f(x_ij_raw, benchmarks_j)</code> <br />
                        <code>Уровень 2 → 2: F_i = (x_i1_норм + x_i2_норм) / 2</code> <br />
                        <code>Уровень 2 → 1: SSI = Σ (β_i · F_i), где совокупная сумма весов Σ β_i = 1.0</code>
                      </div>
                    </div>

                    {/* Highly readable watermark overlay */}
                    <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center p-4 bg-slate-100/10 rounded-2xl">
                      <div className="bg-slate-900/95 hover:bg-slate-900 text-white rounded-2xl border border-amber-400/35 p-6 max-w-lg text-center shadow-2xl backdrop-blur-sm transition-all duration-300">
                        <div className="w-11 h-11 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3.5 border border-amber-500/20">
                          <Mail className="w-5 h-5 text-amber-300" />
                        </div>
                        <h4 className="text-[10px] uppercase tracking-widest font-black text-amber-300 mb-2">Обращение авторов научной методики</h4>
                        <p className="font-display font-medium text-xs md:text-sm text-slate-100 leading-relaxed">
                          Авторы будут признательны если вы пришлете на почту <a href="mailto:indexSSI@mail.ru" className="text-amber-300 hover:text-amber-200 underline font-mono font-bold">indexSSI@mail.ru</a> - скриншот из <a href="https://elibrary.ru/" target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline font-bold">elibrary.ru</a> о цитировании ВАМИ нашей любой статьи в своих научных публикациях — мы сразу же вышлем вам методику расчета на ваш email
                        </p>
                        <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-400 font-light leading-snug">
                          Данный лист методологии временно скрыт. Ваша поддержка в признании академических публикаций авторов позволяет развивать этот алгоритм!
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LIST 6: LILIYA SSI & 4 CIRCLES (SOM SAM TOM TAV) */}
                {authorsActiveTab === 6 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-xs text-slate-700 leading-relaxed">
                    
                    {/* Header Block and Description */}
                    <div className="bg-gradient-to-r from-indigo-50/70 to-purple-50/70 p-4 rounded-2xl border border-indigo-100/80">
                      <h4 className="font-display font-bold text-sm text-indigo-950 flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                        <span>Концептуальный образ «Лилия SSI»</span>
                      </h4>
                      <p className="font-normal text-slate-600">
                        Методология оценивает самодостаточность стартапа по форме «лилии» факторов: 
                        чем более сбалансированы и развиты сильные стороны её лепестков (показателей), 
                        тем более жизнеспособна бизнес-идея проекта в реальной рыночной среде.
                      </p>
                    </div>

                    {/* TWO-COLUMN VISUAL LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      
                      {/* Left side: Interactive SVG Lily */}
                      <div className="lg:col-span-6 bg-white border border-slate-150 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[300px]">
                        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Интерактивный чертёж «Лилия»</span>
                        <div className="w-full max-w-[260px] h-[260px] relative mt-4">
                          {/* CSS SVG Lily flower */}
                          <svg viewBox="0 0 200 200" className="w-full h-full">
                            <defs>
                              <linearGradient id="petal-u-tab6" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#4f46e5" />
                              </linearGradient>
                              <linearGradient id="petal-e-tab6" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f472b6" />
                                <stop offset="100%" stopColor="#db2777" />
                              </linearGradient>
                              <linearGradient id="petal-r-tab6" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fb7185" />
                                <stop offset="100%" stopColor="#e11d48" />
                              </linearGradient>
                              <linearGradient id="petal-k-tab6" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#34d399" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                              <linearGradient id="petal-t-tab6" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#c084fc" />
                                <stop offset="100%" stopColor="#9333ea" />
                              </linearGradient>
                              <linearGradient id="petal-s-tab6" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#0891b2" />
                              </linearGradient>
                            </defs>
                            
                            {/* Petals */}
                            {/* U - Utility (0 deg) */}
                            <g transform="translate(100, 100) rotate(0)" className="cursor-pointer group select-none">
                              <path d="M0,0 Q-20,-55 0,-85 Q20,-55 0,0" fill="url(#petal-u-tab6)" opacity="0.85" className="hover:opacity-100 transition-all duration-200 hover:scale-105 transform origin-bottom" />
                              <circle cx="0" cy="-60" r="8" fill="#ffffff" opacity="0.9" />
                              <text x="0" y="-57" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#4f46e5">U</text>
                            </g>
                            
                            {/* E - Emotion (60 deg) */}
                            <g transform="translate(100, 100) rotate(60)" className="cursor-pointer group select-none">
                              <path d="M0,0 Q-20,-55 0,-85 Q20,-55 0,0" fill="url(#petal-e-tab6)" opacity="0.85" className="hover:opacity-100 transition-all duration-200 hover:scale-105 transform origin-bottom" />
                              <circle cx="0" cy="-60" r="8" fill="#ffffff" opacity="0.9" />
                              <text x="0" y="-57" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#db2777">E</text>
                            </g>

                            {/* R - Recurrence (120 deg) */}
                            <g transform="translate(100, 100) rotate(120)" className="cursor-pointer group select-none">
                              <path d="M0,0 Q-20,-55 0,-85 Q20,-55 0,0" fill="url(#petal-r-tab6)" opacity="0.85" className="hover:opacity-100 transition-all duration-200 hover:scale-105 transform origin-bottom" />
                              <circle cx="0" cy="-60" r="8" fill="#ffffff" opacity="0.9" />
                              <text x="0" y="-57" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#e11d48">R</text>
                            </g>

                            {/* K - Capital (180 deg) */}
                            <g transform="translate(100, 100) rotate(180)" className="cursor-pointer group select-none">
                              <path d="M0,0 Q-20,-55 0,-85 Q20,-55 0,0" fill="url(#petal-k-tab6)" opacity="0.85" className="hover:opacity-100 transition-all duration-200 hover:scale-105 transform origin-bottom" />
                              <circle cx="0" cy="-60" r="8" fill="#ffffff" opacity="0.9" />
                              <text x="0" y="-57" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#059669">K</text>
                            </g>

                            {/* T - Time (240 deg) */}
                            <g transform="translate(100, 100) rotate(240)" className="cursor-pointer group select-none">
                              <path d="M0,0 Q-20,-55 0,-85 Q20,-55 0,0" fill="url(#petal-t-tab6)" opacity="0.85" className="hover:opacity-100 transition-all duration-200 hover:scale-105 transform origin-bottom" />
                              <circle cx="0" cy="-60" r="8" fill="#ffffff" opacity="0.9" />
                              <text x="0" y="-57" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#9333ea">T</text>
                            </g>

                            {/* S - Social (300 deg) */}
                            <g transform="translate(100, 100) rotate(300)" className="cursor-pointer group select-none">
                              <path d="M0,0 Q-20,-55 0,-85 Q20,-55 0,0" fill="url(#petal-s-tab6)" opacity="0.85" className="hover:opacity-100 transition-all duration-200 hover:scale-105 transform origin-bottom" />
                              <circle cx="0" cy="-60" r="8" fill="#ffffff" opacity="0.9" />
                              <text x="0" y="-57" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0891b2">S</text>
                            </g>

                            {/* Central core */}
                            <circle cx="100" cy="100" r="22" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                            <circle cx="100" cy="100" r="18" fill="#312e81" />
                            <text x="100" y="103" textAnchor="middle" fontSize="7" fontWeight="black" fill="#fcd34d">SSI</text>
                          </svg>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 text-center italic">Цветок лилии символизирует сбалансированную структуру из 6 лепестков модели TRUSEK-6</div>
                      </div>

                      {/* Right side: Detailed weights table */}
                      <div className="lg:col-span-6 space-y-3 flex flex-col justify-between">
                        <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Веса и влияние лепестков в формуле Lily SSI</span>
                          <div className="space-y-2 text-[11px]">
                            <div className="flex items-center justify-between p-1.5 bg-white border border-slate-150 rounded-xl leading-relaxed">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />U (Утилитарность)</span>
                              <span className="font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-[10px]">Вес: 25% (0.25)</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 bg-white border border-slate-150 rounded-xl leading-relaxed">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />T (Время до автономии)</span>
                              <span className="font-mono font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg text-[10px]">Вес: 20% (0.20)</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 bg-white border border-slate-150 rounded-xl leading-relaxed">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />E (Эмоциональная ценность)</span>
                              <span className="font-mono font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-[10px]">Вес: 15% (0.15)</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 bg-white border border-slate-150 rounded-xl leading-relaxed">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-pink-500 rounded-full" />R (Повторяемость спроса)</span>
                              <span className="font-mono font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-lg text-[10px]">Вес: 15% (0.15)</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 bg-white border border-slate-150 rounded-xl leading-relaxed">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />K (Капиталоэффективность)</span>
                              <span className="font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px]">Вес: 15% (0.15)</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 bg-white border border-slate-150 rounded-xl leading-relaxed">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-400 rounded-full" />S (Социальный рост)</span>
                              <span className="font-mono font-extrabold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-lg text-[10px]">Вес: 10% (0.10)</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] bg-slate-900 text-slate-300 p-3 rounded-xl font-mono leading-relaxed border border-slate-800">
                          <span className="text-amber-300 font-bold block mb-1">Формула Математической Гармонии Лилии:</span>
                          SSI = 0.25·U + 0.15·E + 0.15·R + 0.15·K + 0.20·T + 0.10·S
                        </div>
                      </div>

                    </div>

                    {/* FOUR CONCENTRIC CIRCLES OF MARKET ENTRY: SOM, SAM, TOM, TAV */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-white space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span>4 круга рыночного вхождения стартапа (SOM, SAM, TOM, TAV)</span>
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Структура масштабирования</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        
                        {/* Interactive concentric circle graphics */}
                        <div className="md:col-span-12 lg:col-span-5 flex justify-center py-4">
                          <div className="relative w-48 h-48 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 shadow-inner overflow-hidden select-none">
                            
                            {/* TAV - Inner Core */}
                            <div className="absolute w-[44px] h-[44px] rounded-full bg-indigo-600/10 border-2 border-indigo-600 flex items-center justify-center animate-pulse z-40 shadow-sm" title="TAV: Порог автономии за счет OPEX">
                              <span className="text-[9px] font-black text-indigo-900">TAV</span>
                            </div>

                            {/* SOM - Second Ring */}
                            <div className="absolute w-[90px] h-[90px] rounded-full border-2 border-emerald-500/70 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors flex items-center justify-center z-30" title="SOM: Реальный план продаж за 3 года">
                              <span className="text-[9px] font-bold text-emerald-800 mt-[52px]">SOM</span>
                            </div>

                            {/* SAM - Third Ring */}
                            <div className="absolute w-[136px] h-[136px] rounded-full border-2 border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex items-center justify-center z-20" title="SAM: Доступный по каналам дистрибуции сегмент">
                              <span className="text-[9px] font-bold text-amber-800 mt-[105px]">SAM</span>
                            </div>

                            {/* TOM / TAM - Outer Ring */}
                            <div className="absolute w-[180px] h-[180px] rounded-full border-2 border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 transition-colors flex items-center justify-center z-10" title="TOM / TAM: Целевой / Общий объем национального спроса">
                              <span className="text-[9px] font-bold text-rose-800 mt-[155px]">TOM / TAM</span>
                            </div>

                          </div>
                        </div>

                        {/* Detailed Description Columns */}
                        <div className="md:col-span-12 lg:col-span-7 space-y-2.5 text-[11px]">
                          <div className="grid grid-cols-12 gap-2 p-2 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl border border-rose-500/10 transition-all font-sans">
                            <div className="col-span-2 font-mono font-black text-rose-700 bg-rose-100 flex items-center justify-center rounded-lg text-xs leading-none">TOM</div>
                            <div className="col-span-10">
                              <strong className="text-slate-900 font-bold block">Target Obtainable Market (или TAM - Общий объем):</strong>
                              Потенциальный финансовый объем спроса по всей стране или макрорегионе, соответствующий профилю вашей категории решений.
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-2 p-2 bg-amber-500/5 hover:bg-amber-500/10 rounded-xl border border-amber-500/10 transition-all font-sans">
                            <div className="col-span-2 font-mono font-black text-amber-700 bg-amber-100 flex items-center justify-center rounded-lg text-xs leading-none">SAM</div>
                            <div className="col-span-10">
                              <strong className="text-slate-900 font-bold block">Serviceable Addressable Market (Доступный сегмент):</strong>
                              Доля целевого рынка, которую стартап физически может охватить с помощью своей бизнес-модели, технологий и текущих рекламных каналов.
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-2 p-2 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/10 transition-all font-sans">
                            <div className="col-span-2 font-mono font-black text-emerald-700 bg-emerald-100 flex items-center justify-center rounded-lg text-xs leading-none">SOM</div>
                            <div className="col-span-10">
                              <strong className="text-slate-900 font-bold block">Serviceable Obtainable Market (Реальный захват):</strong>
                              Консервативный реалистичный объем продаж, который молодая компания планирует завоевать в течение первых 3-х лет деятельности.
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-2 p-2 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl border border-indigo-500/10 transition-all font-sans font-normal">
                            <div className="col-span-2 font-mono font-black text-indigo-700 bg-indigo-100 flex items-center justify-center rounded-lg text-xs leading-none">TAV</div>
                            <div className="col-span-10">
                              <strong className="text-slate-900 font-bold block">Total Available Value / Порог автономии (Микро-ядро):</strong>
                              Жизненно важный внутренний круг окупаемости OPEX. Показывает необходимый минимальный порог выручки, ниже которого проект начинает терпеть чистые убытки.
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </motion.div>
                )}

                {/* LIST 7: BIBLIOGRAPHY & SCIENTIFIC SOURCES */}
                {authorsActiveTab === 7 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-xs text-slate-700 font-normal leading-relaxed">
                    <p className="font-semibold text-slate-950">
                      Научно-теоретическое основание: метаанализ ключевых 15 фундаментальных научных трудов (период публикации с 1984 по 2025 гг.):
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-[10px] text-slate-600 font-sans">
                        <thead className="bg-slate-100 text-slate-700 text-[9px] uppercase font-black tracking-wider text-left border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 w-8">№</th>
                            <th className="px-3 py-2 w-48">Автор, Источник, Год</th>
                            <th className="px-2 py-2 text-center">U</th>
                            <th className="px-2 py-2 text-center">E</th>
                            <th className="px-2 py-2 text-center">R</th>
                            <th className="px-2 py-2 text-center">K</th>
                            <th className="px-2 py-2 text-center">T</th>
                            <th className="px-2 py-2 text-center">S</th>
                            <th className="px-3 py-2 text-center">Ранг</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-normal">
                          {[
                            { id: 1, ref: 'Maxwell et al. (2011)', u: '~', e: '✗', r: '✗', k: '~', t: '~', s: '✗', score: '4/10' },
                            { id: 2, ref: 'Tyebjee & Bruno (1984)', u: '~', e: '✗', r: '~', k: '~', t: '~', s: '✗', score: '3/10' },
                            { id: 3, ref: 'Franke et al. (2006)', u: '✗', e: '✗', r: '✗', k: '✗', t: '✗', s: '✗', score: '2/10' },
                            { id: 4, ref: 'Żbikowski & Antosiuk (2021)', u: '~', e: '✗', r: '~', k: '~', t: '✓', s: '✗', score: '5/10' },
                            { id: 5, ref: 'Bhattu & Bedi (2022)', u: '✓', e: '✗', r: '~', k: '~', t: '~', s: '✗', score: '6/10' },
                            { id: 6, ref: 'Maarouf et al. (2025)', u: '✓', e: '✓', r: '~', k: '✗', t: '~', s: '~', score: '6/10' },
                            { id: 7, ref: 'Jafari et al. (2025)', u: '~', e: '✗', r: '✗', k: '~', t: '✗', s: '✗', score: '7/10' },
                            { id: 8, ref: 'Valdivieso et al. (2025)', u: '~', e: '✗', r: '~', k: '~', t: '✓', s: '✗', score: '7/10' },
                            { id: 9, ref: 'Preuveneers et al. (2025)', u: '✓', e: '✓', r: '~', k: '✗', t: '~', s: '✗', score: '5/10' },
                            { id: 10, ref: 'Coad et al. (2013)', u: '~', e: '✗', r: '✓', k: '✓', t: '✓', s: '✗', score: '6/10' },
                            { id: 11, ref: 'Franke et al. (2008)', u: '✗', e: '✗', r: '✗', k: '✗', t: '~', s: '✗', score: '3/10' },
                            { id: 12, ref: 'Li et al. (2024)', u: '~', e: '~', r: '~', k: '~', t: '✓', s: '✓', score: '5/10' },
                            { id: 13, ref: 'Collewaert & Manigart (2016)', u: '~', e: '✗', r: '✗', k: '✓', t: '~', s: '✗', score: '4/10' },
                            { id: 14, ref: 'Pardo-del-Val et al. (2024)', u: '✓', e: '~', r: '✓', k: '✓', t: '✓', s: '✓', score: '8/10' },
                            { id: 15, ref: 'SSI / TRUSEK-6 (Авторская разработка)', u: '✓', e: '✓', r: '✓', k: '✓', t: '✓', s: '✓', score: '10/10', highlight: true }
                          ].map(row => (
                            <tr key={row.id} className={`${row.highlight ? 'bg-indigo-50/80 font-bold text-indigo-950' : 'hover:bg-slate-50'}`}>
                              <td className="px-3 py-1.5 font-mono">{row.id}</td>
                              <td className="px-3 py-1.5 font-semibold text-slate-800">{row.ref}</td>
                              <td className="px-2 py-1.5 text-center font-mono font-bold">
                                {row.u === '✓' ? <span className="text-emerald-600">✓</span> : row.u === '~' ? <span className="text-amber-500">~</span> : <span className="text-slate-350">✗</span>}
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono font-bold">
                                {row.e === '✓' ? <span className="text-emerald-600">✓</span> : row.e === '~' ? <span className="text-amber-500">~</span> : <span className="text-slate-350">✗</span>}
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono font-bold">
                                {row.r === '✓' ? <span className="text-emerald-600">✓</span> : row.r === '~' ? <span className="text-amber-500">~</span> : <span className="text-slate-350">✗</span>}
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono font-bold">
                                {row.k === '✓' ? <span className="text-emerald-600">✓</span> : row.k === '~' ? <span className="text-amber-500">~</span> : <span className="text-slate-350">✗</span>}
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono font-bold">
                                {row.t === '✓' ? <span className="text-emerald-600">✓</span> : row.t === '~' ? <span className="text-amber-500">~</span> : <span className="text-slate-350">✗</span>}
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono font-bold">
                                {row.s === '✓' ? <span className="text-emerald-600">✓</span> : row.s === '~' ? <span className="text-amber-500">~</span> : <span className="text-slate-350">✗</span>}
                              </td>
                              <td className="px-3 py-1.5 text-center font-mono font-extrabold">{row.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-4 text-[9px] text-slate-500 font-sans italic border-t border-slate-100 pt-2 shrink-0">
                      <span>✓ фактор полноценно операционализирован в модели</span>
                      <span>~ фактор учтен лишь частично</span>
                      <span>✗ фактор полностью отсутствует</span>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Footer action button */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                {/* Pagination Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAuthorsActiveTab(prev => Math.max(1, prev - 1))}
                    disabled={authorsActiveTab === 1}
                    className="p-2 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
                    title="Предыдущий лист"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-extrabold text-slate-500 px-2 min-w-[70px] text-center">
                    {authorsActiveTab} / 7
                  </span>
                  <button
                    type="button"
                    onClick={() => setAuthorsActiveTab(prev => Math.min(7, prev + 1))}
                    disabled={authorsActiveTab === 7}
                    className="p-2 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
                    title="Следующий лист"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAuthorsOpen(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    Понятно
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================================================
// UTILITY: TOOLTIP COMPONENT WITH CUSTOM LABELS
// ========================================================
interface TooltipProps {
  text: string;
}

function Tooltip({ text }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  
  return (
    <div className="relative inline-block print:hidden select-none">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="w-4 h-4 rounded-full bg-slate-150 inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-850 text-white text-[11px] p-3 rounded-lg shadow-xl border border-slate-700 z-30 leading-snug font-normal text-center select-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-850" />
        </div>
      )}
    </div>
  );
}

// ========================================================
// UTILITY: DETAILED LILY SWEEP FLOWER GEOMETRY RENDERING  
// ========================================================
function MiniLily({ subfactors, className = "w-[84px] h-[84px] md:w-[94px] md:h-[94px] block drop-shadow-2xl select-none" }: { subfactors: Subfactors; className?: string }) {
  const cx = 50;
  const cy = 50;
  const maxRadius = 38;
  const factorKeys: (keyof Subfactors)[] = ['T', 'U', 'R', 'S', 'E', 'K'];
  
  const factorColors: Record<keyof Subfactors, string> = {
    T: '#a855f7', // purple
    U: '#3b82f6', // blue
    R: '#ec4899', // pink
    S: '#06b6d4', // cyan
    E: '#f43f5e', // rose
    K: '#10b981'  // emerald
  };

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        {factorKeys.map(key => (
          <linearGradient key={`mini-grad-${key}`} id={`mini-grad-${key}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
            <stop offset="85%" stopColor={factorColors[key]} stopOpacity={0.88} />
            <stop offset="100%" stopColor={factorColors[key]} stopOpacity={0.98} />
          </linearGradient>
        ))}
      </defs>

      {/* Shaggy Golden Stamens / Тычинки, делающие лилию лохматой */}
      {factorKeys.map((_, index) => {
        const midAngle = index * 60 - 60; // Gaps centered between petals
        const offsets = [-13, 0, 13]; // 3 delicate golden stems in each gap
        
        return offsets.map((offset, oIdx) => {
          const angleRad = ((midAngle + offset) * Math.PI) / 180;
          const stamenLen = 16 + (oIdx % 2 === 0 ? 6 : 9);
          
          const xTip = cx + Math.cos(angleRad) * stamenLen;
          const yTip = cy + Math.sin(angleRad) * stamenLen;
          
          const bendAngleRad = ((midAngle + offset * 0.55) * Math.PI) / 180;
          const xControl = cx + Math.cos(bendAngleRad) * stamenLen * 0.55;
          const yControl = cy + Math.sin(bendAngleRad) * stamenLen * 0.55;
          
          return (
            <g key={`mini-stamen-${index}-${oIdx}`}>
              <path
                d={`M ${cx} ${cy} Q ${xControl} ${yControl} ${xTip} ${yTip}`}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="0.75"
                opacity="0.9"
              />
              <circle
                cx={xTip}
                cy={yTip}
                r="1.2"
                fill="#d97706"
                stroke="#fef08a"
                strokeWidth="0.4"
              />
            </g>
          );
        });
      })}

      {/* Petals */}
      {factorKeys.map((key, index) => {
        const angleDeg = index * 60 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const leftWingRad = (angleDeg - 25) * Math.PI / 180;
        const rightWingRad = (angleDeg + 25) * Math.PI / 180;

        const valueScore = subfactors[key];
        // Mini logarithmic petal projection
        const pRadius = 10 + (maxRadius - 10) * (Math.log2(1 + valueScore) / Math.log2(11));

        const xTip = cx + Math.cos(angleRad) * pRadius;
        const yTip = cy + Math.sin(angleRad) * pRadius;

        const xControlLeft = cx + Math.cos(leftWingRad) * pRadius * 0.75;
        const yControlLeft = cy + Math.sin(leftWingRad) * pRadius * 0.75;

        const xControlRight = cx + Math.cos(rightWingRad) * pRadius * 0.75;
        const yControlRight = cy + Math.sin(rightWingRad) * pRadius * 0.75;

        return (
          <g key={key}>
            <path
              d={`M ${cx} ${cy} C ${xControlLeft} ${yControlLeft}, ${xTip} ${yTip}, ${xTip} ${yTip} C ${xTip} ${yTip}, ${xControlRight} ${yControlRight}, ${cx} ${cy} Z`}
              fill={`url(#mini-grad-${key})`}
              stroke={factorColors[key]}
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            {/* White/light central rib for realistic lily petal feel */}
            <path
              d={`M ${cx + Math.cos(angleRad) * 6} ${cy + Math.sin(angleRad) * 6} Q ${cx + Math.cos(angleRad) * pRadius * 0.55} ${cy + Math.sin(angleRad) * pRadius * 0.55} ${xTip - Math.cos(angleRad) * 1.5} ${yTip - Math.sin(angleRad) * 1.5}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.65"
            />
          </g>
        );
      })}

      {/* Inner small core representing the SSI index label */}
      <circle cx={cx} cy={cy} r="8.5" fill="#ffffff" stroke="#6366f1" strokeWidth="1.5" />
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="6.2" fontWeight="950" fill="#4f46e5" className="font-sans">
        SSI
      </text>
    </svg>
  );
}

interface LilyProps {
  subfactors: Subfactors;
  ssi: number;
  data: StartupData;
  highlightMode: 'weak' | 'strong' | 'none';
}

function LilySvg({ subfactors, ssi, data, highlightMode }: LilyProps) {
  const cx = 700;
  const cy = 700;
  const maxRadius = 450; // Doubled petals size (from original ~200-240) for outstanding readability

  // Logarithmic projection maps score [0..10] to the radius [90..450].
  // Gives intuitive vision to which factors are the main drivers to cross the SOM market entry line!
  const getLogarithmicRadius = (score: number) => {
    const minRadius = 90; // Center circle boundary
    const logVal = Math.log2(1 + score) / Math.log2(11);
    return minRadius + (maxRadius - minRadius) * logVal;
  };

  // Ordering of the factors to draw a continuous cyclic loop
  // Order: Time (T), Utility (U), Retention (R), Social (S), Emotion (E), Capital (K)
  const factorKeys: (keyof Subfactors)[] = ['T', 'U', 'R', 'S', 'E', 'K'];
  
  const factorLabels: Record<keyof Subfactors, string> = {
    T: 'T Окупаемость бизнеса',
    U: 'U Потеря покупателя, если продолжит покупать по цене конкурентов',
    R: 'R LTV и лояльность клиентов',
    S: 'S Органический рост (сарафан)',
    E: 'E Эмоциональная зависимость от бизнес-идеи',
    K: 'K Капитал-эффективность и маржа'
  };

  const factorLines: Record<keyof Subfactors, string[]> = {
    T: ['Окупаемость бизнеса'],
    U: ['Потеря покупателя, если продолжит', 'покупать по цене конкурентов'],
    R: ['LTV и лояльность клиентов'],
    S: ['Органический рост (сарафан)'],
    E: ['Эмоциональная зависимость', 'от бизнес-идеи'],
    K: ['Капитал-эффективность', 'и маржа']
  };

  const factorColors: Record<keyof Subfactors, string> = {
    T: '#a855f7', // purple
    U: '#6366f1', // indigo
    R: '#f43f5e', // rose
    S: '#14b8a6', // teal
    E: '#f59e0b', // amber
    K: '#10b981'  // emerald
  };

  // Find which of the 6 core factor scores is the highest (the "pulling factor")
  const maxFactorKey = factorKeys.reduce((max, key) => subfactors[key] > subfactors[max] ? key : max, factorKeys[0]);

  // Subfactors list calculator utilizing the norm utility
  const getSubfactorInfo = (key: keyof Subfactors): { key: string; label: string; rawVal: string; score: number }[] => {
    switch (key) {
      case 'T':
        return [
          {
            key: 'T1',
            label: 'До EBITDA+',
            rawVal: `${data.t1} мес`,
            score: norm(data.t1, 1, 36, true),
          },
          {
            key: 'T2',
            label: 'Окупаемость',
            rawVal: `${data.t2} мес`,
            score: norm(data.t2, 1, 60, true),
          },
        ];
      case 'U':
        return [
          {
            key: 'U1',
            label: 'Ущерб отказа',
            rawVal: data.u1 >= 1000 ? `${(data.u1 / 1000).toFixed(0)} тыс.р.` : `${data.u1} руб`,
            score: norm(data.u1, 0, 300000),
          },
          {
            key: 'U2',
            label: 'Потребность',
            rawVal: `${data.u2} раз/г`,
            score: norm(data.u2, 1, 52),
          },
        ];
      case 'R':
        return [
          {
            key: 'R1',
            label: 'Частота покуп',
            rawVal: `${data.r1} р/г`,
            score: norm(data.r1, 0, 52),
          },
          {
            key: 'R2',
            label: 'LTV/CAC',
            rawVal: `${Number(data.r2).toFixed(1)}x`,
            score: norm(data.r2, 0, 10),
          },
        ];
      case 'S':
        return [
          {
            key: 'S1',
            label: 'Рекомендац.',
            rawVal: `${data.s1}%`,
            score: norm(data.s1, 0, 100),
          },
          {
            key: 'S2',
            label: 'Лояльность NPS',
            rawVal: `${data.s2}`,
            score: norm(data.s2, -100, 100),
          },
        ];
      case 'E':
        return [
          {
            key: 'E1',
            label: 'Время сессии',
            rawVal: `${data.e1} мин`,
            score: norm(data.e1, 0, 60),
          },
          {
            key: 'E2',
            label: 'Качество/Цена',
            rawVal: `${Number(data.e2).toFixed(2)}x`,
            score: norm(data.e2, 0, 2),
          },
        ];
      case 'K':
        return [
          {
            key: 'K1',
            label: 'Старт CAPEX',
            rawVal: data.k1 >= 1000 ? `${(data.k1 / 1000).toFixed(1)} млн` : `${data.k1} тыс.р.`,
            score: norm(data.k1, 0, 5000, true),
          },
          {
            key: 'K2',
            label: 'Маржа OPEX',
            rawVal: `${data.k2}%`,
            score: norm(data.k2, 0, 80),
          },
        ];
      default:
        return [];
    }
  };

  return (
    <svg 
      viewBox="-600 -600 2600 2600" 
      className="w-full h-full select-none"
    >
      <defs>
        {/* Gradients for each beautiful petal */}
        {factorKeys.map(key => (
          <linearGradient key={key} id={`grad-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
            <stop offset="80%" stopColor={factorColors[key]} stopOpacity={0.8} />
            <stop offset="100%" stopColor={factorColors[key]} stopOpacity={0.95} />
          </linearGradient>
        ))}
        {/* Soft shadow for center circle and cards */}
        <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.16" />
        </filter>
        {/* Golden glow for the pulling factor */}
        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#f59e0b" floodOpacity="0.8" />
        </filter>
        {/* Stamen gradient for shaggy lily stamens */}
        <linearGradient id="stamen-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
          <stop offset="25%" stopColor="#fde047" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Decorative Outer Grid and Logarithmic guidelines */}
      <circle cx={cx} cy={cy} r={maxRadius + 30} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2.5" />
      
      {/* 1. Zone of Dominance (SAM/Scale) - Score >= 8 */}
      <circle cx={cx} cy={cy} r={getLogarithmicRadius(8.0)} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
      <text x={cx} y={cy - getLogarithmicRadius(8.0) - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#047857" opacity="0.8" className="font-sans">
        🚀 ЗОНА SAM • МАСШТАБНЫЙ РОСТ (Оценка &ge; 8)
      </text>

      {/* 2. Zone of Life/Survival (SOM/Life) - Score >= 5 */}
      <circle cx={cx} cy={cy} r={getLogarithmicRadius(5.0)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />
      <text x={cx} y={cy - getLogarithmicRadius(5.0) - 10} textAnchor="middle" fontSize="13" fontWeight="800" fill="#1d4ed8" className="font-sans">
        ⚡ ТОЧКА ВХОДА В SOM • ЖИЗНЬ ИМЕЕТСЯ! (Барьер &ge; 5)
      </text>

      {/* 3. Operational Break-even (TAV/Danger) - Score <= 3 */}
      <circle cx={cx} cy={cy} r={getLogarithmicRadius(3.0)} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.8" />
      <text x={cx} y={cy - getLogarithmicRadius(3.0) - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#b91c1c" opacity="0.9" className="font-sans">
        ⚠️ ПОРОГ ВЫЖИВАНИЯ TAV • ЗОНА РИСКА (Ниже 3)
      </text>

      {/* MARKET METRICS WIDGETS IN THE CORNERS OF THE IMAGE */}
      
      {/* 1. TAM Widget - Top Left */}
      <g transform="translate(-560, -560)" filter="url(#soft-shadow)">
        <rect x="0" y="0" width="570" height="330" rx="32" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4" />
        <rect x="0" y="0" width="570" height="90" rx="32" fill="#f1f5f9" />
        <rect x="0" y="45" width="570" height="45" fill="#f1f5f9" />
        <text x="285" y="55" textAnchor="middle" fontSize="33" fontWeight="800" fill="#475569" className="font-sans tracking-wider uppercase">
          TAM • Весь Рынок
        </text>
        <text x="285" y="195" textAnchor="middle" fontSize="66" fontWeight="900" fill="#0f172a" className="font-mono">
          {data.tam} млн
        </text>
        <text x="285" y="270" textAnchor="middle" fontSize="26" fontWeight="600" fill="#64748b" className="font-sans">
          Общий потенциал в РФ (руб.)
        </text>
      </g>

      {/* 2. SAM Widget - Top Right */}
      <g transform="translate(1390, -560)" filter="url(#soft-shadow)">
        <rect x="0" y="0" width="570" height="330" rx="32" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4" />
        <rect x="0" y="0" width="570" height="90" rx="32" fill="#e0e7ff" />
        <rect x="0" y="45" width="570" height="45" fill="#e0e7ff" />
        <text x="285" y="55" textAnchor="middle" fontSize="33" fontWeight="800" fill="#4338ca" className="font-sans tracking-wider uppercase">
          SAM • Доступный Рынок
        </text>
        <text x="285" y="195" textAnchor="middle" fontSize="66" fontWeight="900" fill="#4338ca" className="font-mono">
          {data.sam} млн
        </text>
        <text x="285" y="270" textAnchor="middle" fontSize="26" fontWeight="600" fill="#6366f1" className="font-sans">
          Региональный целевой сегмент
        </text>
      </g>

      {/* 3. SOM Widget - Bottom Left */}
      <g transform="translate(-560, 1630)" filter="url(#soft-shadow)">
        <rect x="0" y="0" width="570" height="330" rx="32" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4" />
        <rect x="0" y="0" width="570" height="90" rx="32" fill="#fef3c7" />
        <rect x="0" y="45" width="570" height="45" fill="#fef3c7" />
        <text x="285" y="55" textAnchor="middle" fontSize="33" fontWeight="800" fill="#b45309" className="font-sans tracking-wider uppercase">
          SOM • Достижимый Рынок
        </text>
        <text x="285" y="195" textAnchor="middle" fontSize="66" fontWeight="900" fill="#b45309" className="font-mono">
          {data.som} млн
        </text>
        <text x="285" y="270" textAnchor="middle" fontSize="26" fontWeight="600" fill="#d97706" className="font-sans">
          Реальная доля продаж за 3 года
        </text>
      </g>

      {/* 4. TAV Widget - Bottom Right (Operational Break-even Threshold comparison) */}
      <g transform="translate(1390, 1630)" filter="url(#soft-shadow)">
        <rect x="0" y="0" width="570" height="330" rx="32" fill="#ffffff" stroke="#fecdd3" strokeWidth="4" />
        <rect x="0" y="0" width="570" height="90" rx="32" fill="#ffe4e6" />
        <rect x="0" y="45" width="570" height="45" fill="#ffe4e6" />
        <text x="285" y="55" textAnchor="middle" fontSize="33" fontWeight="800" fill="#be123c" className="font-sans tracking-wider uppercase">
          TAV • Порог Выживания
        </text>
        <text x="285" y="195" textAnchor="middle" fontSize="66" fontWeight="900" fill="#be123c" className="font-mono">
          {data.tav} млн
        </text>
        <text x="285" y="270" textAnchor="middle" fontSize="26" fontWeight="600" fill="#be123c" className="font-sans">
          Запас: {(data.som / (data.tav || 1)).toFixed(1)}x от операцион. OPEX
        </text>
      </g>

      {/* Petals Grid */}
      {factorKeys.map((key, index) => {
        // Angles separated into 6 equal sectors starting from -90 degrees (top vertical point)
        const angleDeg = index * 60 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        
        // Value bounded to 0-10 scale mapped into radius fraction
        const valueScore = subfactors[key];
        // Calculate dynamic length of the petal utilizing logarithmic survival formula
        const petalLength = getLogarithmicRadius(valueScore);

        // Peak target coordinate of the outer petal tip
        const xTip = cx + Math.cos(angleRad) * petalLength;
        const yTip = cy + Math.sin(angleRad) * petalLength;

        // Control vectors for drafting realistic curved bezier petals with custom expansion
        const leftWingRad = ((angleDeg - 25) * Math.PI) / 180;
        const rightWingRad = ((angleDeg + 25) * Math.PI) / 180;

        const xControlLeft = cx + Math.cos(leftWingRad) * petalLength * 0.75;
        const yControlLeft = cy + Math.sin(leftWingRad) * petalLength * 0.75;

        const xControlRight = cx + Math.cos(rightWingRad) * petalLength * 0.75;
        const yControlRight = cy + Math.sin(rightWingRad) * petalLength * 0.75;

        // Outer label location coordinates situate on a wide radius circle
        const labelDistance = 780; // Placed optimally for perfect visual margins and zero overlapping with expanded petals
        const xLabel = cx + Math.cos(angleRad) * labelDistance;
        const yLabel = cy + Math.sin(angleRad) * labelDistance;

        const [sub1, sub2] = getSubfactorInfo(key);
        const isMaxFactor = key === maxFactorKey;

        // Determine whether this factor should blink based on highlightMode
        let shouldBlink = false;
        if (highlightMode === 'weak') {
          shouldBlink = valueScore < 5.0; // weak factor
        } else if (highlightMode === 'strong') {
          shouldBlink = valueScore >= 7.0; // strong factor
        } else {
          shouldBlink = false; // 'none'
        }

        const blinkKeys = factorKeys.filter(k => {
          if (highlightMode === 'weak') return subfactors[k] < 5.0;
          if (highlightMode === 'strong') return subfactors[k] >= 7.0;
          return false;
        });
        const blinkIndex = blinkKeys.indexOf(key);
        const animationDelayStr = shouldBlink && blinkIndex !== -1 ? `${blinkIndex * 0.4}s` : undefined;

        return (
          <g key={key} className="transition-all duration-700">
            {/* Curved elegant petal drawn using cubic beziers */}
            <path
              d={`M ${cx} ${cy} C ${xControlLeft} ${yControlLeft}, ${xTip} ${yTip}, ${xTip} ${yTip} C ${xTip} ${yTip}, ${xControlRight} ${yControlRight}, ${cx} ${cy} Z`}
              fill={`url(#grad-${key})`}
              stroke={isMaxFactor ? '#f59e0b' : factorColors[key]}
              strokeWidth={isMaxFactor ? '6' : '4'}
              filter={isMaxFactor ? 'url(#gold-glow)' : undefined}
              strokeLinecap="round"
              className={`hover:fill-opacity-95 transition-all duration-300 cursor-pointer ${shouldBlink ? 'som-petal-blink' : ''}`}
              style={{
                '--base-petal-stroke': isMaxFactor ? '6px' : '4px',
                '--pulse-petal-stroke': isMaxFactor ? '9px' : '7px',
                '--factor-color-stroke': factorColors[key],
                '--factor-color-bg-light': factorColors[key] + '22',
                animationDelay: animationDelayStr
              } as React.CSSProperties}
            >
              <title>{`${factorLabels[key]}: ${valueScore.toFixed(1)} / 10 ${isMaxFactor ? '(Главный вытягивающий драйвер!)' : ''}`}</title>
            </path>

            {/* Delicately detailed central rib and contour veins inside the petal */}
            <path
              d={`M ${cx + Math.cos(angleRad) * 90} ${cy + Math.sin(angleRad) * 90} Q ${cx + Math.cos(angleRad) * petalLength * 0.58} ${cy + Math.sin(angleRad) * petalLength * 0.58} ${xTip - Math.cos(angleRad) * 5} ${yTip - Math.sin(angleRad) * 5}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              opacity="0.6"
              strokeLinecap="round"
            />
            <path
              d={`M ${cx + Math.cos(angleRad) * 95} ${cy + Math.sin(angleRad) * 95} Q ${cx + Math.cos(angleRad) * petalLength * 0.58} ${cy + Math.sin(angleRad) * petalLength * 0.58} ${xTip - Math.cos(angleRad) * 5} ${yTip - Math.sin(angleRad) * 5}`}
              fill="none"
              stroke={factorColors[key]}
              strokeWidth="1.2"
              opacity="0.4"
              strokeDasharray="4 4"
            />

            {/* Glowing dot representing the tip coordinate of factor strength */}
            <circle 
              cx={xTip} 
              cy={yTip} 
              r={isMaxFactor ? '9' : '6'} 
              fill={isMaxFactor ? '#f59e0b' : factorColors[key]} 
              stroke="#ffffff" 
              strokeWidth="2.5" 
              className="shadow-md" 
            />

            {/* Connecting thin line to give it structural depth */}
            <line
              x1={xTip}
              y1={yTip}
              x2={cx + Math.cos(angleRad) * (labelDistance - 40)}
              y2={cy + Math.sin(angleRad) * (labelDistance - 40)}
              stroke={isMaxFactor ? '#f59e0b' : factorColors[key]}
              strokeWidth={isMaxFactor ? '2' : '1.2'}
              strokeDasharray="2 3"
              opacity="0.75"
            />

            {/* Sub-factor cards with custom positioning */}
            <g transform={`translate(${xLabel}, ${yLabel})`}>
              <rect
                x="-290"
                y="-140"
                width="580"
                height="280"
                rx="24"
                fill="#ffffff"
                stroke={isMaxFactor ? '#f59e0b' : factorColors[key]}
                strokeWidth={isMaxFactor ? '5' : '3'}
                filter="url(#soft-shadow)"
                className={shouldBlink ? 'som-card-blink' : ''}
                style={{
                  '--base-stroke': isMaxFactor ? '5px' : '3px',
                  '--pulse-stroke': isMaxFactor ? '8px' : '5px',
                  '--glow-color': factorColors[key] + '66',
                  '--factor-color-stroke': factorColors[key],
                  '--factor-color-bg-light': factorColors[key] + '22',
                  animationDelay: animationDelayStr
                } as React.CSSProperties}
              />
              
              {/* If this is the highest score factor, render a prominent gold crown button badge at the top */}
              {isMaxFactor && (
                <g transform="translate(0, -172)">
                  <rect
                    x="-230"
                    y="0"
                    width="460"
                    height="42"
                    rx="10"
                    fill="#f59e0b"
                    stroke="#d97706"
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    y="26"
                    fontSize="18"
                    fontWeight="900"
                    fill="#ffffff"
                    className="font-sans tracking-wider"
                  >
                    🌟 ВЫТЯГИВАЮЩИЙ ДРАЙВЕР
                  </text>
                </g>
              )}

              <text
                textAnchor="middle"
                fontSize="38"
                fontWeight="900"
                fill={isMaxFactor ? '#d97706' : factorColors[key]}
                y="-80"
                className="font-sans"
              >
                {key} • {valueScore.toFixed(1)} / 10
              </text>
              
              {factorLines[key].map((lineText, idx) => {
                const linesCount = factorLines[key].length;
                const startingY = linesCount === 1 ? -25 : -45;
                const lineSpacing = 30;
                return (
                  <text
                    key={idx}
                    textAnchor="middle"
                    fontSize="24"
                    fill="#475569"
                    fontWeight="800"
                    y={startingY + idx * lineSpacing}
                    className="font-sans uppercase tracking-wider"
                  >
                    {lineText}
                  </text>
                );
              })}

              <line x1="-260" y1="18" x2="260" y2="18" stroke="#e2e8f0" strokeWidth="2" />

              <text
                textAnchor="middle"
                fontSize="23"
                fill="#1e293b"
                fontWeight="500"
                y="55"
                className="font-sans"
              >
                <tspan fontWeight="800" fill={factorColors[key]}>{sub1.key}:</tspan> {sub1.label} → <tspan fontWeight="700" fill="#030712">{sub1.rawVal}</tspan> <tspan fontWeight="850" fill={factorColors[key]}>[{sub1.score.toFixed(1)}]</tspan>
              </text>

              <text
                textAnchor="middle"
                fontSize="23"
                fill="#1e293b"
                fontWeight="500"
                y="95"
                className="font-sans"
              >
                <tspan fontWeight="800" fill={factorColors[key]}>{sub2.key}:</tspan> {sub2.label} → <tspan fontWeight="700" fill="#030712">{sub2.rawVal}</tspan> <tspan fontWeight="850" fill={factorColors[key]}>[{sub2.score.toFixed(1)}]</tspan>
              </text>

              {/* SOM Surpassed Ribbon Indicator */}
              {valueScore >= 5.0 && (
                <g transform="translate(0, 140)">
                  <rect
                    x="-140"
                    y="-15"
                    width="280"
                    height="30"
                    rx="15"
                    fill={factorColors[key]}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    textAnchor="middle"
                    y="5"
                    fontSize="15"
                    fontWeight="800"
                    fill="#ffffff"
                    className="font-sans tracking-wide"
                  >
                    ⚡ ПРЕОДОЛЕЛ SOM
                  </text>
                </g>
              )}
            </g>
          </g>
        );
      })}

      {/* 30 Glorious and Shaggy Golden Stamens / 30 золотых раскидистых тычинок как на рисунке */}
      {factorKeys.map((_, index) => {
        const midAngle = index * 60 - 60; // Gaps centered between the 6 petals
        const offsets = [-16, -8, 0, 8, 16]; // 5 rich staggered filaments per gap
        
        return offsets.map((offset, oIdx) => {
          const angleDeg = midAngle + offset;
          const angleRad = (angleDeg * Math.PI) / 180;
          
          // Organic staggering lengths so it looks beautifully shaggy (лохматая лилия!)
          const stamenLen = 170 + (oIdx % 2 === 0 ? 55 : 85) + Math.sin(oIdx * 1.5) * 15; 
          
          const xTip = cx + Math.cos(angleRad) * stamenLen;
          const yTip = cy + Math.sin(angleRad) * stamenLen;
          
          // Slight natural curving bend
          const bendAngleRad = (angleDeg - offset * 0.45) * Math.PI / 180;
          const xControl = cx + Math.cos(bendAngleRad) * stamenLen * 0.55;
          const yControl = cy + Math.sin(bendAngleRad) * stamenLen * 0.55;
          
          return (
            <g key={`stamen-${index}-${oIdx}`}>
              {/* Filament Shadow */}
              <path
                d={`M ${cx} ${cy} Q ${xControl} ${yControl} ${xTip} ${yTip}`}
                fill="none"
                stroke="#78350f"
                strokeWidth="3.2"
                opacity="0.12"
              />
              {/* Filament core thread */}
              <path
                d={`M ${cx} ${cy} Q ${xControl} ${yControl} ${xTip} ${yTip}`}
                fill="none"
                stroke="url(#stamen-grad)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Double-lobe natural Lily Anther / Круглые пыльники с легким раздвоением */}
              <g transform={`translate(${xTip}, ${yTip}) rotate(${angleDeg + 90})`}>
                <ellipse cx="-1.8" cy="0" rx="3" ry="5.5" fill="#d97706" stroke="#fbbf24" strokeWidth="0.6" />
                <ellipse cx="1.8" cy="0" rx="3" ry="5.5" fill="#be123c" stroke="#fef08a" strokeWidth="0.6" />
                <circle cx="-1.2" cy="-1.5" r="0.8" fill="#ffffff" opacity="0.7" />
              </g>
            </g>
          );
        });
      })}

      {/* Polished Core Centre circle showing aggregate results */}
      <g filter="url(#soft-shadow)" className="cursor-pointer">
        <circle 
          cx={cx} 
          cy={cy} 
          r="90" 
          fill="#ffffff" 
          stroke="#6366f1" 
          strokeWidth="6" 
        />
        
        <text 
          x={cx} 
          y={cy - 16} 
          textAnchor="middle" 
          fontSize="20" 
          fontWeight="850" 
          fill="#6366f1"
          className="font-display tracking-widest"
        >
          SSI
        </text>

        <text 
          x={cx} 
          y={cy + 34} 
          textAnchor="middle" 
          fontSize="48" 
          fontWeight="900" 
          fill="#0f172a"
          className="font-mono tracking-tighter"
        >
          {ssi.toFixed(1)}
        </text>
      </g>
    </svg>
  );
}
