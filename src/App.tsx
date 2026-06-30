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
  Image,
  Scale,
  ArrowLeftRight,
  Bot,
  FileText,
  Microscope,
  Rocket,
  Presentation,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Archive
} from 'lucide-react';
import { StartupData, Subfactors, CalculationResult, DataWarning, ArchivedRecord } from './types';
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
  validateStartupData,
  getWeights
} from './utils';
import { motion, AnimatePresence } from 'motion/react';
import { AIAgentTab } from './components/AIAgentTab';
import { MarketCompareChart } from './components/MarketCompareChart';
import { StartupReserves } from './components/StartupReserves';
import { SalesRealismValidator } from './components/SalesRealismValidator';
import { AuthPortal } from './components/AuthPortal';
import { Sidebar } from './components/Sidebar';
import { ArchiveView } from './components/ArchiveView';
import { ApplicationsView } from './components/ApplicationsView';
import { DefenseScheduleView } from './components/DefenseScheduleView';
import { WordReportView } from './components/WordReportView';
import { MiniLily } from './components/MiniLily';
import { getAccessToken } from './firebase';

function getPastelBackground(ssi: number): { bg: string, text: string, border: string, badgeBg: string, badgeText: string } {
  if (ssi >= 8.5) {
    return {
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
      text: 'text-emerald-950',
      border: 'border-emerald-200/80',
      badgeBg: 'bg-emerald-100/80',
      badgeText: 'text-emerald-900'
    };
  } else if (ssi >= 7.5) {
    return {
      bg: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
      text: 'text-blue-950',
      border: 'border-blue-200/80',
      badgeBg: 'bg-blue-100/80',
      badgeText: 'text-blue-900'
    };
  } else if (ssi >= 6.5) {
    return {
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
      text: 'text-amber-950',
      border: 'border-amber-200/80',
      badgeBg: 'bg-amber-100/80',
      badgeText: 'text-amber-900'
    };
  } else if (ssi >= 5.0) {
    return {
      bg: 'linear-gradient(135deg, #fff7ed 0%, #fffaf5 100%)',
      text: 'text-orange-950',
      border: 'border-orange-200/80',
      badgeBg: 'bg-orange-100/80',
      badgeText: 'text-orange-900'
    };
  } else if (ssi >= 3.5) {
    return {
      bg: 'linear-gradient(135deg, #fdf2f8 0%, #fdf4ff 100%)',
      text: 'text-pink-950',
      border: 'border-pink-200/80',
      badgeBg: 'bg-pink-100/80',
      badgeText: 'text-pink-900'
    };
  } else {
    return {
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
      text: 'text-rose-950',
      border: 'border-rose-200/80',
      badgeBg: 'bg-rose-100/80',
      badgeText: 'text-rose-900'
    };
  }
}

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string; phone: string } | null>(() => {
    try {
      const saved = localStorage.getItem('ssi_user_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    import('./firebase').then(({ initAuth }) => {
      initAuth(
        (authUser) => {
          // optionally update auth user
        },
        () => {
          // optionally handle failure
        }
      );
    });
  }, []);

  const isSupervisor = Boolean(user?.name?.includes('Мандрица') || user?.name?.includes('Ренат') || user?.name?.includes('Максим') || user?.name?.includes('Кузьменко') || user?.name?.includes('руководител'));
  
  const [currentView, setCurrentView] = useState<string>('calculator');

  const [data, setData] = useState<StartupData>(() => {
    try {
      const saved = localStorage.getItem('ssi_calculator_data');
      return saved ? JSON.parse(saved) : { ...EMPTY_STARTUP_DATA };
    } catch {
      return { ...EMPTY_STARTUP_DATA };
    }
  });
  
  const w = getWeights(data.bizType);
  const [activeTab, setActiveTab] = useState<'anketa' | 'expert' | 'result' | 'compare' | 'agent'>(() => {
    try {
      const saved = localStorage.getItem('ssi_calculator_tab');
      return (saved === 'anketa' || saved === 'expert' || saved === 'result' || saved === 'compare' || saved === 'agent') ? saved : 'agent';
    } catch {
      return 'agent';
    }
  });
  const [activeSmartStep, setActiveSmartStep] = useState<number>(1);

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

  const [studentArchive, setStudentArchive] = useState<ArchivedRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ssi_archive_student');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [supervisorArchive, setSupervisorArchive] = useState<ArchivedRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ssi_archive_supervisor');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('ssi_archive_student', JSON.stringify(studentArchive));
  }, [studentArchive]);

  useEffect(() => {
    localStorage.setItem('ssi_archive_supervisor', JSON.stringify(supervisorArchive));
  }, [supervisorArchive]);

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
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(() => {
    try {
      return localStorage.getItem('ssi_consent_accepted') === 'true';
    } catch {
      return false;
    }
  });
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
    setData({ ...INITIAL_STARTUP_DATA });
    setShowValidationResults(false);
    showToast('🌱 Загружен демонстрационный проект "Умный Сенсорный Сад"', 'success');
  };

  const loadStudentSample = () => {
    setData({ ...STUDENT_STARTUP_DATA });
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
    setData({ ...EMPTY_STARTUP_DATA });
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

  const saveToArchive = () => {
    if (!data.name || data.name === 'Безымянный стартап') {
      showToast('❌ Заполните название стартапа перед сохранением', 'error');
      return;
    }
    const newRecord: ArchivedRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name: data.name,
      date: new Date().toISOString(),
      type: isSupervisor ? 'supervisor' : 'student',
      data: { ...data }
    };
    if (isSupervisor) {
      setSupervisorArchive(prev => [newRecord, ...prev]);
    } else {
      setStudentArchive(prev => [newRecord, ...prev]);
    }
    showToast('💾 Анкета успешно сохранена в архив', 'success');
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

  const handleExportDocx = async () => {
    showToast('⏳ Генерируем академический отчет в Word (DOCX по ГОСТ)...', 'info');
    try {
      const { generateDocx } = await import('./exportDocx');
      await generateDocx(data, results);
      showToast('✅ Академический отчет DOCX успешно сохранен!', 'success');
    } catch (e: any) {
      console.error('Docx export error:', e);
      showToast('❌ Ошибка при генерации Word-отчета: ' + e.message, 'error');
    }
  };

  const handleDownloadPdf = async () => {
    showToast('⏳ Генерируем профессиональный PDF-отчет...', 'info');
    
    try {
      const { default: jsPDF } = await import('jspdf');
      const { toCanvas } = await import('html-to-image');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeightMm = 297;
      const pageWidthMm = 210;
      const marginMm = 10;
      const contentStartY = 15;
      const contentMaxY = 280;
      const usableWidth = pageWidthMm - 2 * marginMm; // 190mm
      const usableHeight = contentMaxY - contentStartY; // 265mm

      // Cards we want to render in sequence
      const cards = [
        { id: 'pdf-results-header', name: 'Результаты' },
        { id: 'pdf-lily-chart', name: 'Диаграмма Лилия' },
        { id: 'pdf-factor-profile', name: 'Сводный профиль' },
        { id: 'pdf-risk-analysis', name: 'Карта рисков' }
      ];

      let currentY = contentStartY;

      for (const card of cards) {
        const element = document.getElementById(card.id);
        if (!element) continue;

        // Render card to canvas
        const canvas = await toCanvas(element, {
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });

        const cardHeightMm = (canvas.height * usableWidth) / canvas.width;

        if (cardHeightMm <= usableHeight) {
          // Normal card that fits on one page
          if (currentY + cardHeightMm > contentMaxY) {
            pdf.addPage();
            currentY = contentStartY;
          }
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginMm, currentY, usableWidth, cardHeightMm, undefined, 'FAST');
          currentY += cardHeightMm + 8;
        } else {
          // Tall card that needs slicing
          let remainingHeight = canvas.height;
          let sourceY = 0;

          while (remainingHeight > 0) {
            const currentUsableHeight = contentMaxY - currentY;
            const currentCanvasHeight = (canvas.width * currentUsableHeight) / usableWidth;

            const sliceHeight = Math.min(remainingHeight, currentCanvasHeight);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = sliceHeight;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
              const sliceImgData = tempCanvas.toDataURL('image/png');
              const destHeight = (sliceHeight * usableWidth) / canvas.width;

              pdf.addImage(sliceImgData, 'PNG', marginMm, currentY, usableWidth, destHeight, undefined, 'FAST');
              currentY += destHeight;
            }

            remainingHeight -= sliceHeight;
            sourceY += sliceHeight;

            if (remainingHeight > 0) {
              pdf.addPage();
              currentY = contentStartY;
            }
          }
          currentY += 8;
        }
      }

      // Add Headers & Footers to all generated pages
      const totalPages = (pdf as any).getNumberOfPages();
      const timestamp = new Date().toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Header
        pdf.setFontSize(8);
        pdf.setTextColor(140, 140, 140);
        pdf.text("TRUSEK-6 STARTUP STABILITY INDEX REPORT", marginMm, 8);
        pdf.text(timestamp, pageWidthMm - marginMm - 45, 8);

        // Header separator line
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.setLineWidth(0.2);
        pdf.line(marginMm, 10, pageWidthMm - marginMm, 10);

        // Footer separator line
        pdf.line(marginMm, pageHeightMm - 10, pageWidthMm - marginMm, pageHeightMm - 10);

        // Footer
        pdf.text(`Страница ${i} из ${totalPages}`, marginMm, pageHeightMm - 6);
        pdf.text("Индекс самодостаточности бизнес-идеи стартапа", pageWidthMm - marginMm - 75, pageHeightMm - 6);
      }

      // Save the generated document
      const fileName = `${data.name ? data.name.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '_') : 'Startup'}_SSI_Report.pdf`;
      pdf.save(fileName);
      showToast('✅ PDF-отчет успешно сохранен!', 'success');
    } catch (e) {
      console.error('PDF creation error:', e);
      showToast('❌ Ошибка при генерации PDF', 'error');
    }
  };

  const handleExportAll = async () => {
    showToast('⏳ Начинаем последовательную генерацию 3х отчетов...', 'info');
    try {
      await handleDownloadPdf();
      await handleExportPptx();
      await handleExportDocx();
      showToast('🏆 Все три отчета (PDF, PPTX, DOCX) успешно скачаны!', 'success');
    } catch (error) {
      console.error('Batch export error:', error);
      showToast('❌ Произошла ошибка при пакетной генерации отчетов', 'error');
    }
  };

  const handleExportPptx = async () => {
    showToast('⏳ Генерируем презентацию PowerPoint (PPTX)...', 'info');
    try {
      const pptxgen = (await import('pptxgenjs')).default;
      const { toCanvas } = await import('html-to-image');

      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9'; 

      const cards = [
        { id: 'pdf-results-header', name: 'Результаты' },
        { id: 'pdf-lily-chart', name: 'Диаграмма Лилия' },
        { id: 'pdf-factor-profile', name: 'Сводный профиль' },
        { id: 'pdf-risk-analysis', name: 'Карта рисков' }
      ];

      for (const card of cards) {
        const element = document.getElementById(card.id);
        if (!element) continue;

        const canvas = await toCanvas(element, {
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const slide = pptx.addSlide();

        const slideW = 10;
        const slideH = 5.625;
        const margin = 0.5;

        const canvasRatio = canvas.width / canvas.height;
        const slideRatio = (slideW - margin * 2) / (slideH - margin * 2);

        let finalW, finalH;
        if (canvasRatio > slideRatio) {
          finalW = slideW - margin * 2;
          finalH = finalW / canvasRatio;
        } else {
          finalH = slideH - margin * 2;
          finalW = finalH * canvasRatio;
        }

        const x = (slideW - finalW) / 2;
        const y = (slideH - finalH) / 2;

        slide.addImage({ data: imgData, x, y, w: finalW, h: finalH });
      }

      const fileName = `${data.name ? data.name.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '_') : 'Startup'}_Presentation.pptx`;
      await pptx.writeFile({ fileName });
      showToast('✅ Презентация PPTX успешно скачана!', 'success');
    } catch (e) {
      console.error('PPTX creation error:', e);
      showToast('❌ Ошибка при генерации PPTX', 'error');
    }
  };

  const handleDownloadPng = async () => {
    showToast('⏳ Генерируем PNG-изображение диаграммы...', 'info');
    try {
      const { toCanvas } = await import('html-to-image');
      const element = document.getElementById('pdf-lily-chart');
      if (!element) {
        showToast('❌ Диаграмма не найдена', 'error');
        return;
      }

      const canvas = await toCanvas(element, {
        pixelRatio: 3, // High scale for great print quality
        backgroundColor: '#ffffff'
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const fileName = `${data.name ? data.name.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '_') : 'Startup'}_Lily_Chart.png`;
      link.download = fileName;
      link.href = image;
      link.click();
      showToast('✅ Изображение успешно скачано!', 'success');
    } catch (e) {
      console.error('PNG creation error:', e);
      showToast('❌ Ошибка при генерации PNG', 'error');
    }
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

  const blockNames: Record<string, string> = {
    agent: 'БЛОК 1: 🤖 ИИ Агент (Старт)',
    anketa: 'БЛОК 2: 📝 Ручной ввод показателей',
    expert: 'БЛОК 3: 🔬 Режим эксперта',
    result: 'БЛОК 4: 🌸 Результат & Лилия SSI',
    compare: 'БЛОК 5: ⚖️ Сравнение анкет'
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <AuthPortal 
          onAuthSuccess={(u) => {
            setUser(u);
            localStorage.setItem('ssi_user_auth', JSON.stringify(u));
          }} 
          showToast={showToast} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Full Width Top Banner representing the user's uploaded image similar to RSF site */}
      <div className="w-full h-48 md:h-64 lg:h-[340px] shrink-0 bg-slate-200 relative overflow-hidden flex-none z-10 print:hidden">
        <div className="absolute inset-0 bg-indigo-900/10 flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-800 bg-white/70 px-4 py-2 rounded-lg backdrop-blur-sm shadow-sm border border-indigo-100">
              {/* Note for the user since I can't read the chat attachment directly into code */}
              Ваше фото Технопарка СКФУ (перетащите изображение в папку public как technopark_bg.jpg)
            </span>
        </div>
        <img 
          src="https://www.ncfu.ru/export/sites/SKFU/science/technopark/image/tekhnopark.jpg" 
          alt="Технопарк СКФУ" 
          className="w-full h-full object-cover relative z-10"
          onError={(e) => {
            // Fallback to local image if NCFU site blocks hotlinking
            const target = e.target as HTMLImageElement;
            if (target.src !== '/technopark_bg.jpg') {
              target.src = '/technopark_bg.jpg';
            } else {
              target.style.opacity = '0';
            }
          }}
          onLoad={(e) => {
            (e.target as HTMLImageElement).style.opacity = '1';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent pointer-events-none z-20"></div>
        <div className="absolute top-8 md:top-12 left-6 md:left-12 z-30">
           <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-lg tracking-tight">Технопарк СКФУ</h1>
           <p className="text-indigo-100 text-xl md:text-3xl lg:text-4xl font-bold mt-2 md:mt-4 opacity-95 drop-shadow-md tracking-wide max-w-2xl leading-tight">
             Лаборатория прединвестиционной<br />
             экспресс-оценки стартапов
           </p>
        </div>
        
        <div className="absolute top-6 right-6 md:top-10 md:right-12 z-30 bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col shadow-2xl max-w-[300px]">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="bg-emerald-600 text-white rounded pr-2 pl-1.5 py-1 text-xs font-black tracking-wider flex items-center gap-1 shadow-sm mr-2">
                  <span>SSI</span>
                </div>
                <span className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight">Navigator</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 mt-1.5 uppercase tracking-wider">
                стартапов v.3.0 (ОКВЭД)
              </span>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center bg-white p-1 rounded-xl border border-indigo-100/60 w-12 h-12 select-none shadow-sm">
              <MiniLily subfactors={results.subfactors} className="w-[36px] h-[36px] drop-shadow-md" />
            </div>
          </div>

          <p className="text-[11px] md:text-xs text-slate-600 leading-snug font-semibold">
            Навигатор готовности заявки стартапа и оценка бизнес-успешности
          </p>
        </div>
      </div>

      {/* Main Layout Area below the banner */}
      <div className="flex-1 flex min-h-0 relative">
        <Sidebar 
          activeTab={currentView} 
          setActiveTab={setCurrentView} 
          calcTab={activeTab}
          setCalcTab={setActiveTab as any}
          onOpenConsent={() => setIsConsentOpen(true)}
          onLogout={() => {
            setUser(null);
            localStorage.removeItem('ssi_user_auth');
          }}
          user={user}
          subfactors={results.subfactors}
          consentAccepted={hasAcceptedConsent}
          isApproved={data.supervisorApproved || false}
          onApprove={() => {
            setData({...data, supervisorApproved: !data.supervisorApproved});
            setNotification({message: data.supervisorApproved ? 'Подтверждение снято' : 'Заявка подтверждена', type: 'success'});
          }}
          currentStartup={data.name || ''}
        />
        
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative pb-20">
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

        {currentView === 'applications' && (
          <ApplicationsView onNewApplication={() => { setCurrentView('calculator'); setActiveTab('agent'); }} />
        )}

        {currentView === 'applications_new' && (
          <ArchiveView 
            title="Архив заявок 2026-2027 учеб. года"
            archives={[...studentArchive, ...supervisorArchive].filter(r => new Date(r.date).getFullYear() >= 2026)}
            onLoad={(archivedData) => {
              setData(archivedData);
              setCurrentView('calculator');
              setActiveTab('anketa');
              showToast('✅ Анкета успешно загружена', 'success');
            }}
            onDelete={(id) => {
              setStudentArchive(prev => prev.filter(r => r.id !== id));
              setSupervisorArchive(prev => prev.filter(r => r.id !== id));
              showToast('🗑️ Анкета удалена из архива', 'info');
            }}
            actions={
              <button 
                onClick={() => {
                  const dataStr = JSON.stringify({ studentArchive, supervisorArchive }, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `backup_anketi_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('💾 Бэкап успешно выгружен', 'success');
                }}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-200"
              >
                <Download className="w-4 h-4" />
                Создать backup - выгрузить базу анкет json анкет
              </button>
            }
          />
        )}

        {currentView === 'defense_schedule' && (
          <DefenseScheduleView />
        )}

        {currentView === 'word_report' && (
          <WordReportView data={data} ssiScore={calculateResult(data).finalSsi} />
        )}

        {currentView === 'archive_student' && (
          <ArchiveView 
            title="Архив анкет (Студент)"
            archives={studentArchive}
            onLoad={(archivedData) => {
              setData(archivedData);
              setCurrentView('calculator');
              setActiveTab('anketa');
              showToast('✅ Анкета студента успешно загружена', 'success');
            }}
            onDelete={(id) => {
              setStudentArchive(prev => prev.filter(r => r.id !== id));
              showToast('🗑️ Анкета удалена из архива', 'info');
            }}
          />
        )}

        {currentView === 'archive_supervisor' && (
          <ArchiveView 
            title="Архив анкет (Руководитель)"
            archives={supervisorArchive}
            onLoad={(archivedData) => {
              setData(archivedData);
              setCurrentView('calculator');
              setActiveTab('expert');
              showToast('✅ Анкета руководителя успешно загружена', 'success');
            }}
            onDelete={(id) => {
              setSupervisorArchive(prev => prev.filter(r => r.id !== id));
              showToast('🗑️ Анкета удалена из архива', 'info');
            }}
          />
        )}

        {currentView === 'dashboard' && (
          <div className="container max-w-6xl mx-auto px-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Рабочий стол студента</h2>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-sm font-semibold flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Стартап: {data?.name?.trim() ? data.name : "Готов к вводу данных"}
                </div>
                <button
                  onClick={() => {
                    setData({ ...EMPTY_STARTUP_DATA });
                    setNotification({ message: 'Рабочий стол студента очищен', type: 'success' });
                  }}
                  className="px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 hover:bg-rose-100 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  title="Очистить стол студента"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Очистить стол студента</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Мои активные проекты</h3>
                <p className="text-4xl font-black text-indigo-600">0</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">На доработке</h3>
                <p className="text-4xl font-black text-amber-500">0</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Средний индекс SSI</h3>
                <p className="text-4xl font-black text-emerald-600">0%</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
              <p className="text-slate-500">Здесь будет отображаться детальная информация о ходе работы над вашими стартапами, рекомендации ИИ и комментарии научного руководителя.</p>
              <button onClick={() => { setCurrentView('calculator'); setActiveTab('agent'); }} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors">Начать заполнять новый стартап</button>
            </div>
          </div>
        )}

        {currentView === 'supervisor' && (
          <div className="container max-w-6xl mx-auto px-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Кабинет научного руководителя</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    className="appearance-none pl-10 pr-10 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm hover:bg-emerald-100 transition-colors"
                    defaultValue=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'student') {
                        setCurrentView('archive_student');
                      } else if (val === 'supervisor') {
                        setCurrentView('archive_supervisor');
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="" disabled hidden>{data?.name?.trim() ? data.name : "Выбрать стартап на проверку"}</option>
                    <option value="student">Стартап студента</option>
                    <option value="supervisor">Стартап правка руководителя</option>
                  </select>
                  <Rocket className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={() => {
                    setData({ ...EMPTY_STARTUP_DATA });
                    setNotification({ message: 'Кабинет руководителя очищен', type: 'success' });
                  }}
                  className="px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 hover:bg-rose-100 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  title="Очистить кабинет руководителя"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Очистить кабинет</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Проекты моих студентов</h3>
                <p className="text-4xl font-black text-emerald-600">0</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">На проверке</h3>
                <p className="text-4xl font-black text-amber-500">0</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Допущено к защите</h3>
                <p className="text-4xl font-black text-indigo-600">0</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
              <Microscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              {data.name && data.name.trim() !== '' ? (
                <>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Стартап: {data.name}</h3>
                  <p className="text-slate-500 mb-6">В этом разделе вы сможете просматривать стартап-проект вашего студента.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                    <button onClick={() => { setCurrentView('calculator'); setActiveTab('agent'); }} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm transition-colors shadow-sm">Перейти к проверке анкеты</button>
                    {data.supervisorApproved ? (
                      <button onClick={() => { setData({...data, supervisorApproved: false}); setNotification({message: 'Подтверждение снято', type: 'success'}); }} className="px-6 py-2.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-semibold text-sm transition-colors shadow-sm">Отменить подтверждение</button>
                    ) : (
                      <button onClick={() => { setData({...data, supervisorApproved: true}); setNotification({message: 'Заявка подтверждена', type: 'success'}); }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors shadow-sm">Подтверждаю заявку стартапа</button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Проекты моих студентов</h3>
                  <p className="text-slate-500 mb-6">В этом разделе вы сможете просматривать стартап-проекты ваших студентов, оставлять правки и рекомендации перед отправкой в Технопарк.</p>
                  <button onClick={() => { setCurrentView('calculator'); setActiveTab('agent'); }} className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm transition-colors shadow-sm">Перейти к проверке анкеты</button>
                </>
              )}
            </div>
          </div>
        )}

        {currentView === 'park_status' && (
          <div className="container max-w-6xl mx-auto px-4 mt-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Статусы проектов (Технопарк)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100/60">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> На доработке
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100">Нейросеть для агрономов <span className="float-right font-bold text-amber-600">SSI: 34%</span></div>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100">Умные остановки СКФУ <span className="float-right font-bold text-amber-600">SSI: 41%</span></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100/60">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> На экспертизе
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100">Платформа поиска стажировок <span className="float-right font-bold text-blue-600">SSI: 68%</span></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100/60">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Готовы к подаче
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100">Медицинский VR-тренажер <span className="float-right font-bold text-emerald-600">SSI: 92%</span></div>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100">Дрон-доставщик реактивов <span className="float-right font-bold text-emerald-600">SSI: 87%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'park_stats' && (
          <div className="container max-w-6xl mx-auto px-4 mt-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Сводка и KPI (Технопарк)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Всего подано идей</h3>
                <p className="text-3xl font-black text-indigo-600">142</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Высокий SSI (&gt;80%)</h3>
                <p className="text-3xl font-black text-emerald-600">28</p>
                <p className="text-[10px] text-emerald-600/70 mt-1 font-medium">Вероятно успешные</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Отклонено экспертами</h3>
                <p className="text-3xl font-black text-rose-500">45</p>
                <p className="text-[10px] text-rose-500/70 mt-1 font-medium">Низкий индекс / недоработка</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">В работе (Воронка)</h3>
                <p className="text-3xl font-black text-blue-500">69</p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-64 flex items-center justify-center">
              <p className="text-slate-400 font-medium">Здесь будет размещена инфографика (графики конверсии, воронка успешности стартапов)</p>
            </div>
          </div>
        )}

        {currentView === 'calculator' && (
          <>
            {/* GLOBAL BACKGROUND ELEMENTS (HIDDEN IN PRINT) */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-900/10 via-transparent to-transparent pointer-events-none print:hidden -z-10" />




      <main className="container max-w-6xl mx-auto px-4 mt-6">

        {/* SMART PASTE HINT BAR REMOVED */}

        {/* WORKSPACE HEADER INSIDE CALCULATOR */}
        <div className="container max-w-6xl mx-auto px-4 mt-2">
          {activeTab === 'compare' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                Сравнение проектов бизнес-идей
              </h2>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView(isSupervisor ? 'supervisor' : 'dashboard')}
                  className="p-2.5 bg-yellow-400 border border-yellow-500 rounded-xl text-yellow-900 hover:bg-yellow-500 transition-colors animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]"
                  title="Вернуться назад"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                  Заполнение анкеты стартапа
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`px-4 py-2 ${isSupervisor ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'} border rounded-xl text-sm font-semibold flex items-center gap-2`}>
                  <Rocket className="w-4 h-4" />
                  {isSupervisor ? 'Проверяемый стартап:' : 'Текущий стартап:'} {data?.name?.trim() ? data.name : "Готов к вводу данных"}
                </div>
                <button
                  onClick={() => {
                    setData({ ...EMPTY_STARTUP_DATA });
                    setNotification({ message: 'Данные стартапа очищены', type: 'success' });
                  }}
                  className="px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 hover:bg-rose-100 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  title="Очистить данные анкеты"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Очистить анкету</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* QUICK ACTION BUTTONS */}
        {activeTab !== 'compare' && (
          <div id="calc-tabs" className="mb-6 print:hidden">
            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
              <span className="text-[11px] text-slate-500 font-semibold pl-1">
                🛠️ Быстрые команды управления:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleValidateData}
                  className={`px-3.5 py-2 text-xs border rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
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
                  className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Загрузить полностью заготовленные демонстрационные данные"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
                  <span>Загрузить демостартап</span>
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Сбросить все показатели анкеты"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Очистить</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTAINER CARD FOR VIEWS */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8">
          
          {/* Dynamic Active Startup Banner (Глазами смотрящего) */}
          {activeTab !== 'compare' && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 mb-6 border border-indigo-500/20 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 print:hidden">
              <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3.5 z-10">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-400/25 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner print:hidden">
                  {activeTab === 'agent' && <Bot className="w-5 h-5 text-purple-350 animate-pulse" />}
                  {activeTab === 'anketa' && <Info className="w-5 h-5 text-indigo-350" />}
                  {activeTab === 'expert' && <Sparkles className="w-5 h-5 text-yellow-350" />}
                  {activeTab === 'result' && <span className="text-lg">🌸</span>}
                  {activeTab === 'compare' && <Scale className="w-5 h-5 text-amber-300" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider print:border-slate-400 print:text-black print:bg-none">
                      {blockNames[activeTab] || 'Калькулятор'}
                    </span>
                    {data.name === 'Умный Сенсорный Сад' ? (
                      <span className="text-[10px] bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold px-2 py-0.5 rounded-full print:border-slate-400 print:text-black print:bg-none">
                        🌱 Активен демо-стартап СКФУ
                      </span>
                    ) : data.name ? (
                      <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full print:border-slate-400 print:text-black print:bg-none">
                        🚀 Пользовательский проект
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/20 border border-rose-400/30 text-rose-300 font-bold px-2 py-0.5 rounded-full animate-pulse print:hidden">
                        ⚠️ Ожидание названия проекта
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-black text-base md:text-lg text-white mt-1 leading-tight flex items-center gap-2 print:text-black">
                    <span>Проект:</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-indigo-250 to-emerald-200 underline decoration-indigo-400 decoration-wavy decoration-1 underline-offset-4 print:text-black print:no-underline">
                      «{data.name || 'Безымянный стартап'}»
                    </span>
                  </h2>
                  <p className="text-slate-350 text-xs mt-1 print:text-slate-700">
                    👤 Разработчик: <strong className="text-white font-semibold print:text-black">{data.author || 'Студент СКФУ'}</strong>
                    {data.expert ? (
                      <> | 🔬 Ментор-наставник: <strong className="text-white font-semibold print:text-black">{data.expert}</strong></>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-3 rounded-xl self-start md:self-auto shrink-0 z-10 backdrop-blur-md print:bg-none print:border-slate-300 print:text-black">
                <div className="text-center">
                  <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold print:text-slate-650">Индекс SSI</div>
                  <div className="text-2xl font-black font-mono text-emerald-400 leading-none mt-1 print:text-black">
                    {results.finalSsi.toFixed(2)}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10 print:bg-slate-300" />
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold print:text-slate-650">Устойчивость</div>
                  <div className="text-xs font-black text-slate-100 mt-1 leading-tight max-w-[155px] truncate print:text-black" title={results.interpretation.split('—')[0]}>
                    {results.interpretation.split('—')[0]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🎓 Interactive Student Guides for each Active Step */}
          <div className="mb-6 print:hidden">
            {activeTab === 'agent' && (
              <div className="bg-purple-50/75 border border-purple-100 rounded-2xl p-4 text-xs md:text-sm text-purple-950 leading-relaxed font-sans relative shadow-inner">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0 mt-0.5">🎓</span>
                  <div>
                    <strong className="text-purple-900 block font-bold mb-1">Гид по Блоку 1 (Старт): Какую кнопку нажать первой?</strong>
                    <p className="font-normal text-purple-950">
                      Это ваша стартовая площадка. Чтобы калькулятор заработал, проекту нужны исходные цифры. У вас есть три простых пути:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-purple-900/90 font-normal">
                      <li><strong className="text-purple-950 font-bold">Путь А (Для быстрого старта ⚡):</strong> Нажмите белую кнопку <strong className="text-purple-950 font-bold">«Загрузить демостартап»</strong> на панели быстрого управления чуть выше. Калькулятор мгновенно наполнится готовыми рыночными данными проекта «Умный Сенсорный Сад»!</li>
                      <li><strong className="text-purple-950 font-bold">Путь Б (Ваш собственный проект 🤖):</strong> Опишите вашу бизнес-идею в поле ввода слева (выберите отрасль и укажите суть стартапа) и нажмите фиолетовую кнопку <strong className="text-purple-950 font-bold">«Сгенерировать показатели ИИ»</strong>. Наш ИИ-ассистент подберет реалистичные рыночные данные!</li>
                      <li><strong className="text-purple-950 font-bold">Путь В (Ручной ввод 📝):</strong> Если у вас уже есть готовые цифры, сразу переходите в <strong className="text-purple-950 font-bold">«Шаг 2 (Ввод метрик)»</strong> для их ручной детальной настройки.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'anketa' && (
              <div className="bg-blue-50/75 border border-blue-100 rounded-2xl p-4 text-xs md:text-sm text-blue-950 leading-relaxed font-sans relative shadow-inner">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0 mt-0.5">🎓</span>
                  <div>
                    <strong className="text-blue-900 block font-bold mb-1">Гид по Блоку 2: Ручная регулировка метрик TRUSEK-6</strong>
                    <p className="font-normal text-blue-950">
                      В этом блоке вы задаете 12 ключевых метрик вашего проекта и определяете объем целевого рынка:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-blue-900/90 font-normal">
                      <li><strong className="text-blue-950 font-bold">Шаг 1 (Имя проекта):</strong> Во вкладке <strong className="text-blue-950 font-bold">«Профиль проекта»</strong> ниже введите название вашего стартапа, ФИО автора-студента и ФИО ментора, чтобы все отчеты и графики персонализировались под вас.</li>
                      <li><strong className="text-blue-950 font-bold">Шаг 2 (Интерактивные ползунки):</strong> Настройте 6 ключевых факторов устойчивости (утилитарность, окупаемость, удержание и др.). Читайте понятные подсказки с примерами под каждым параметром.</li>
                      <li><strong className="text-blue-950 font-bold">Шаг 3 (Проверка качества данных):</strong> Нажмите кнопку <strong className="text-blue-950 font-bold">«ПРОВЕРИТЬ данные»</strong> на панели быстрого управления. Наш встроенный алгоритм проверит ваши цифры на экономическую логику и выведет подсказки.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'expert' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs md:text-sm text-slate-800 leading-relaxed font-sans relative shadow-inner">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0 mt-0.5">🎓</span>
                  <div>
                    <strong className="text-slate-950 block font-bold mb-1">Гид по Блоку 3: Экспертная калибровка весов факторов</strong>
                    <p className="font-normal text-slate-700">
                      Этот инструмент предназначен для глубокого научно-исследовательского анализа и тонкой настройки калькулятора:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-650 font-normal">
                      <li>Каждый из 6 факторов TRUSEK-6 вносит свой вклад в итоговый индекс SSI. По умолчанию установлены научно доказанные весовые значения.</li>
                      <li>Если для специфики вашего стартапа (например, вирусная соцсеть) виральность намного важнее утилитарности, вы можете скорректировать их вес вручную.</li>
                      <li><strong className="text-slate-900 font-bold">Главное условие:</strong> Сумма всех 6 долей должна равняться строго <strong className="text-indigo-600 font-bold">100%</strong>. Интерактивный счетчик внизу экрана поможет не ошибиться с балансом!</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'result' && (
              <div className="bg-emerald-50/75 border border-emerald-100 rounded-2xl p-4 text-xs md:text-sm text-emerald-950 leading-relaxed font-sans relative shadow-inner">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0 mt-0.5">🎓</span>
                  <div>
                    <strong className="text-emerald-900 block font-bold mb-1">Гид по Блоку 4: Цветок устойчивости (Лилия SSI) и Аналитика</strong>
                    <p className="font-normal text-emerald-950">
                      Ваш стартап полностью рассчитан! Изучите полученные результаты для защиты проекта:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-emerald-900/90 font-normal">
                      <li><strong className="text-emerald-950 font-bold">Индекс SSI (в центре Лилии):</strong> Итоговая оценка устойчивости. Идеально — 10. Показывает, насколько ваш стартап защищен от провала.</li>
                      <li><strong className="text-emerald-950 font-bold">Лепестки Лилии:</strong> Каждый лепесток отображает один из факторов. Узкие и короткие лепестки — это «слабые места» вашего бизнеса. Используйте кнопки <strong className="text-emerald-950 font-bold">«Слабые факторы»</strong> для их подсветки и получите рекомендации по исправлению.</li>
                      <li><strong className="text-emerald-950 font-bold">Экспорт для диплома:</strong> Внизу страницы доступна кнопка <strong className="text-emerald-950 font-bold">«Cоздать три отчета стартапа»</strong>. Она автоматически сгенерирует для вас PDF-отчет, презентацию PowerPoint (PPTX) и академический отчет Word (DOCX), оформленный строго по стандартам ГОСТ!</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="bg-amber-50/75 border border-amber-100 rounded-2xl p-4 text-xs md:text-sm text-amber-950 leading-relaxed font-sans relative shadow-inner">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0 mt-0.5">🎓</span>
                  <div>
                    <strong className="text-amber-900 block font-bold mb-1">Гид по Блоку 5: Инвестиционный баттл стартапов side-by-side</strong>
                    <p className="font-normal text-amber-950">
                      Здесь вы можете наглядно сравнить сильные и слабые стороны двух разных проектов или вариантов развития одного бизнеса:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-900/90 font-normal">
                      <li><strong className="text-amber-950 font-bold">Выбор стартапов:</strong> Загрузите сохраненные проекты из Архива (студента или руководителя), импортируйте JSON-файлы, используйте текущую анкету из калькулятора или загрузите демо-версии.</li>
                      <li><strong className="text-amber-950 font-bold">Интерактивная аналитика:</strong> Система сравнит 12 подфакторов проектов и автоматически выведет цветного победителя по шкале от 0 до 10 в каждом факторе TRUSEK-6.</li>
                      <li><strong className="text-amber-950 font-bold">Бюджетная эффективность (BEI):</strong> Оценка окупаемости гранта для бюджета через расчет налоговых поступлений, точки безубыточности и созданных рабочих мест для экспертной комиссии!</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          
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
                      <span className="text-xs bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: {Math.round(w.U * 100)}%</span>
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
                      <span className="text-xs bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: {Math.round(w.E * 100)}%</span>
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
                      <span className="text-xs bg-rose-100 text-rose-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: {Math.round(w.R * 100)}%</span>
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
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: {Math.round(w.K * 100)}%</span>
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
                      <span className="text-xs bg-purple-100 text-purple-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: {Math.round(w.T * 100)}%</span>
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
                      <span className="text-xs bg-teal-100 text-teal-800 font-mono px-2 py-0.5 rounded">весовой коэффициент: {Math.round(w.S * 100)}%</span>
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
                <div className="flex flex-wrap items-center gap-3">
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
                    onClick={saveToArchive}
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4 text-emerald-600" />
                    <span>В архив</span>
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

              {/* AUTOMATIC TRANSITION BUTTONS */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="text-sm text-slate-500">Завершили заполнение метрик? Переходите к просмотру результатов!</div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('expert')}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    К Шагу 3 (Режим Эксперта)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('result')}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>К Шагу 4 (Смотреть результаты SSI)</span>
                    <ArrowRight className="w-4 h-4" />
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
              <div className="p-6 bg-amber-50/50 text-slate-900 rounded-3xl mt-6 border border-amber-100 shadow-xs">
                <h4 className="font-bold font-display text-base text-amber-800 mb-4 flex items-center gap-1.5">
                  <span>Рыночная емкость (Модификатор MEI)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">TAM (млн руб)</span>
                    <input 
                      type="number" value={data.tam} onChange={e => handleNumberInput('tam', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 font-mono shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">SAM (млн руб)</span>
                    <input 
                      type="number" value={data.sam} onChange={e => handleNumberInput('sam', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 font-mono shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">SOM (млн руб)</span>
                    <input 
                      type="number" value={data.som} onChange={e => handleNumberInput('som', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 font-mono shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">TAV (Порог автономии)</span>
                    <input 
                      type="number" value={data.tav} onChange={e => handleNumberInput('tav', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-800 font-mono shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
              {(() => {
                const pastelColors = getPastelBackground(results.finalSsi);
                return (
                  <div 
                    id="pdf-results-header" 
                    className={`relative ${pastelColors.text} rounded-3xl p-6 md:p-8 overflow-hidden shadow-xs border ${pastelColors.border}`} 
                    style={{ background: pastelColors.bg }}
                  >
                    {/* Visual decoration inside result report banner */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:justify-between gap-6">
                      
                      <div className="text-center md:text-left">
                        <span className={`${pastelColors.badgeBg} ${pastelColors.badgeText} text-[10px] font-bold tracking-widest uppercase py-1 px-3 rounded-full border border-current/10`}>
                          Прогноз самодостаточности бизнес идеи стартапа на основе модели SSI
                        </span>
                        <h2 className="font-display font-black text-3xl md:text-4xl mt-3 tracking-tight text-slate-900">
                          {data.name || 'Проект без названия'}
                        </h2>
                        <div className="text-sm font-medium text-slate-600 mt-2 space-y-0.5">
                          <p>👥 Автор разработки: <strong className="text-slate-900 font-semibold">{data.author || 'Не указан'}</strong></p>
                          {data.expert && <p>🎓 Эксперт-наставник: <strong className="text-slate-900 font-semibold">{data.expert}</strong></p>}
                        </div>
                        <p className="text-xs md:text-sm text-slate-700 mt-4 leading-relaxed max-w-2xl font-light">
                          {results.interpretation}
                        </p>
                      </div>

                      <div className={`flex flex-col items-center shrink-0 ${pastelColors.badgeBg} border ${pastelColors.border} px-6 py-5 rounded-2xl w-full md:w-56 text-center shadow-inner`}>
                        <span className={`text-[10px] tracking-widest uppercase ${pastelColors.badgeText} font-bold whitespace-nowrap`}>Финальный Индекс SSI</span>
                        <span className={`font-display font-extrabold text-6xl ${pastelColors.badgeText} my-1.5 leading-none`}>
                          {results.finalSsi.toFixed(2)}
                        </span>
                        <span className={`text-[11px] ${pastelColors.badgeText} opacity-80 font-medium`}>
                          из 10.0 возможных
                        </span>
                      </div>

                    </div>

                    {/* HORIZONTAL SCALE BAR VISUALIZER */}
                    <div className="mt-6 border-t border-slate-200/60 pt-6">
                      <div className="relative flex justify-between text-xs text-slate-600 font-bold mb-3 px-1">
                        <span>0.0 (Критический)</span>
                        <span>3.5</span>
                        <span>5.0</span>
                        <span>6.5</span>
                        <span>7.5</span>
                        <span>8.5</span>
                        <span>10.0 (Образцовый)</span>
                      </div>
                      
                      {/* Visual slider track enlarged strictly by 3 times (from h-2.5 to h-7.5 / 30px) */}
                      <div className="h-[30px] bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner border border-slate-300/40">
                        
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
                );
              })()}

              {/* LILY FLOWER SVG GRAPHICS & INTRO */}
              <div className="space-y-8">
                
                {/* Vector Canvas Container - Expanded size for premium visual fidelity and layout clarity */}
                <div id="pdf-lily-chart" className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/60 p-6 md:p-10 rounded-3xl shadow-sm relative min-h-[640px]">
                  <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Лилия бизнес идеи TRUSEK-6 (+Оценки подфакторов)
                  </div>

                  {/* Interactive Highlight Control Panel */}
                  <div className="mt-8 mb-4 flex flex-wrap gap-3 justify-center z-10 w-full max-w-xl print:hidden">
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
                <div id="pdf-factor-profile" className="space-y-4">
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
              <div className="bg-[#f0f8ec] text-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden border border-[#d6e9ce] shadow-xs">
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <h3 className="font-display font-semibold uppercase tracking-wider text-emerald-800 text-xs sm:text-sm">
                      Рыночный модификатор MEI (Market Efficiency Index)
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 font-normal leading-relaxed max-w-4xl">
                    Рыночный модификатор калибрует базовый индекс <strong className="text-indigo-750 font-semibold">SSI</strong> на основе масштаба доступного сегмента и реалистичности планов по взятию точки безубыточности. Если соотношение планируемой выручки (<strong className="text-amber-700 font-semibold">SOM</strong>) к порогу автономии операционных расходов (<strong className="text-emerald-700 font-mono font-semibold">TAV</strong>) меньше единицы — коэффициент опускается до <strong className="text-orange-600 font-mono font-semibold">0.3</strong>, ослабляя общую оценку стартапа.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    <div className="bg-white/80 border border-[#d6e9ce]/60 p-3 rounded-2xl text-center flex flex-col justify-between min-h-[115px] shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold tracking-wide uppercase">TAM</span>
                        <span className="font-mono text-base font-extrabold mt-1 block text-slate-900">
                          {data.tam ? `${data.tam} млн` : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-2 block leading-snug">
                        Общий объем рынка (весь потенциальный спрос)
                      </span>
                    </div>

                    <div className="bg-white/80 border border-[#d6e9ce]/60 p-3 rounded-2xl text-center flex flex-col justify-between min-h-[115px] shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold tracking-wide uppercase">SAM</span>
                        <span className="font-mono text-base font-extrabold mt-1 block text-slate-900">
                          {data.sam ? `${data.sam} млн` : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-2 block leading-snug">
                        Доступный сегмент рынка (целевая аудитория)
                      </span>
                    </div>

                    <div className="bg-white/80 border border-[#d6e9ce]/60 p-3 rounded-2xl text-center flex flex-col justify-between min-h-[115px] shadow-2xs">
                      <div>
                        <span className="text-[10px] text-amber-800 block font-bold tracking-wide uppercase font-semibold">SOM</span>
                        <span className="font-mono text-base font-extrabold mt-1 block text-amber-700">
                          {data.som ? `${data.som} млн` : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] text-amber-850 mt-2 block leading-snug">
                        Реальный план продаж стартапа за 3 года
                      </span>
                    </div>

                    <div className="bg-white/80 border border-[#d6e9ce]/60 p-3 rounded-2xl text-center flex flex-col justify-between min-h-[115px] shadow-2xs">
                      <div>
                        <span className="text-[10px] text-emerald-800 block font-bold tracking-wide uppercase font-semibold">TAV (Порог)</span>
                        <span className="font-mono text-base font-extrabold mt-1 block text-emerald-700">
                          {data.tav ? `${data.tav} млн` : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-800 mt-2 block leading-snug">
                        Порог безубыточности и финансовой автономии
                      </span>
                    </div>

                    <div className="bg-indigo-50/80 border border-indigo-200/60 col-span-2 md:col-span-1 p-3 rounded-2xl text-center group flex flex-col justify-between min-h-[115px] shadow-2xs">
                      <div>
                        <span className="text-[10px] text-indigo-700 block font-bold tracking-wide uppercase">MEI Коэф.</span>
                        <span className="font-mono text-lg font-black mt-1 block text-indigo-800">
                          × {results.mei.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[9px] text-indigo-800 mt-2 block leading-snug font-medium">
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
              <div id="pdf-risk-analysis" className="bg-rose-50/15 p-6 md:p-8 rounded-3xl border border-rose-200/40 relative overflow-hidden">
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
                  onClick={handleExportAll}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold px-4 py-3 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Скачать все три отчета одним пакетом: PDF, презентацию PPTX и академический отчет Word DOCX"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Cоздать три отчета стартапа (PDF, PPTX, DOCX)</span>
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
                  onClick={saveToArchive}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-4 py-3 rounded-xl text-xs transition-all flex items-center gap-1.5 border border-emerald-200/50"
                >
                  <Archive className="w-4 h-4 text-emerald-500" />
                  <span>В архив</span>
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

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('compare');
                    showToast('⚖️ Переход к сравнению проектов', 'info');
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>К Шагу 5 (Сравнение проектов)</span>
                  <ArrowRight className="w-4 h-4" />
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

                            {(isSupervisor ? supervisorArchive : studentArchive).length > 0 && (
                              <select 
                                className="w-full bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all outline-none focus:border-indigo-500"
                                onChange={(e) => {
                                  const id = e.target.value;
                                  if (!id) return;
                                  const record = (isSupervisor ? supervisorArchive : studentArchive).find(r => r.id === id);
                                  if (record) {
                                    setCompareA(record.data);
                                    showToast('✅ Анкета А загружена из архива!', 'success');
                                  }
                                  e.target.value = "";
                                }}
                              >
                                <option value="">⬇️ Загрузить из архива А</option>
                                {(isSupervisor ? supervisorArchive : studentArchive).map(r => (
                                  <option key={r.id} value={r.id}>{r.name} ({new Date(r.date).toLocaleDateString()})</option>
                                ))}
                              </select>
                            )}

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
                                setCompareA({ ...STUDENT_STARTUP_DATA });
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

                            {(isSupervisor ? supervisorArchive : studentArchive).length > 0 && (
                              <select 
                                className="w-full bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all outline-none focus:border-emerald-500"
                                onChange={(e) => {
                                  const id = e.target.value;
                                  if (!id) return;
                                  const record = (isSupervisor ? supervisorArchive : studentArchive).find(r => r.id === id);
                                  if (record) {
                                    setCompareB(record.data);
                                    showToast('✅ Анкета Б загружена из архива!', 'success');
                                  }
                                  e.target.value = "";
                                }}
                              >
                                <option value="">⬇️ Загрузить из архива Б</option>
                                {(isSupervisor ? supervisorArchive : studentArchive).map(r => (
                                  <option key={r.id} value={r.id}>{r.name} ({new Date(r.date).toLocaleDateString()})</option>
                                ))}
                              </select>
                            )}

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
                                setCompareB({ ...INITIAL_STARTUP_DATA });
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
                      <div className="flex flex-col items-center relative">
                        <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider max-w-[260px] truncate">
                          {compareA ? compareA.name : 'Стартап А не выбран'}
                        </div>
                        
                        {compareA && (
                          <div className="absolute top-10 -left-4 md:-left-8 z-20 shadow-md rounded-lg overflow-hidden border border-slate-200">
                             {(compareA.expert || compareA.supervisorApproved) ? (
                                 <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-1.5 flex items-center gap-1.5"><Microscope className="w-3.5 h-3.5"/> Экспертная корректировка</span>
                             ) : (
                                 <span className="bg-purple-100 text-purple-900 text-[10px] font-black uppercase px-2.5 py-1.5 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5"/> Базовая ИИ-модель</span>
                             )}
                          </div>
                        )}

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
                            Индекс SSI: <strong className="font-extrabold text-slate-800">{resultsA.finalSsi.toFixed(2)}</strong>. <span className="text-indigo-600 font-medium">{resultsA.interpretation.split('—')[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Flower B */}
                      <div className="flex flex-col items-center relative">
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider max-w-[260px] truncate">
                          {compareB ? compareB.name : 'Стартап Б не выбран'}
                        </div>
                        
                        {compareB && (
                          <div className="absolute top-10 -right-4 md:-right-8 z-20 shadow-md rounded-lg overflow-hidden border border-slate-200">
                             {(compareB.expert || compareB.supervisorApproved) ? (
                                 <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-1.5 flex items-center gap-1.5"><Microscope className="w-3.5 h-3.5"/> Экспертная корректировка</span>
                             ) : (
                                 <span className="bg-purple-100 text-purple-900 text-[10px] font-black uppercase px-2.5 py-1.5 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5"/> Базовая ИИ-модель</span>
                             )}
                          </div>
                        )}

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

                    {/* INVESTMENT COMMISSION METRICS - BUDGET EFFICIENCY INDEX */}
                    {(() => {
                      const calcMetrics = (proj: StartupData, res: ReturnType<typeof calculateResult>) => {
                        const activeRevenue = proj.som > 0 ? proj.som : (proj.sam > 0 ? proj.sam : 100);
                        const baseK = res.subfactors.K;
                        const baseS = res.subfactors.S;
                        const baseT = res.subfactors.T;
                        const baseU = res.subfactors.U;

                        const capexRatio = 0.5 - (baseK / 10) * 0.4; 
                        const capex = Math.max(0.1, activeRevenue * capexRatio);
                        
                        const opexRatio = 0.25 - (baseS / 10) * 0.15;
                        const opexYr = activeRevenue * opexRatio;
                        
                        const salariesYr = opexYr * 0.4;
                        const jobs = Math.max(1, Math.round(salariesYr / 1.0));
                        
                        const bep = Math.max(3, Math.round(36 - (baseT / 10) * 33));
                        
                        const growth = 1 + (baseU / 10) * 0.5;
                        const revY1 = activeRevenue;
                        const revY2 = revY1 * growth;
                        const revY3 = revY2 * growth;
                        const rev3Yr = revY1 + revY2 + revY3;
                        
                        const salaryTaxes3Yr = (salariesYr * 0.432) * 3;
                        const revTaxes3Yr = rev3Yr * 0.06;
                        const totalTaxes = salaryTaxes3Yr + revTaxes3Yr;
                        
                        const bei = totalTaxes / capex;
                        
                        return { capex, jobs, bep, bei };
                      };

                      const metricsA = calcMetrics(compareA, resultsA);
                      const metricsB = calcMetrics(compareB, resultsB);

                      return (
                        <div className="bg-slate-800 text-white p-6 md:p-8 rounded-3xl mt-6 shadow-lg border border-slate-700">
                          <h3 className="font-display font-extrabold text-white text-lg uppercase tracking-wide border-b border-slate-700 pb-3 flex items-center justify-between mb-6">
                            <span>💼 Сводная инвестиционная карта для экспертной комиссии</span>
                            <span className="text-[10px] text-amber-400 font-mono font-normal bg-amber-400/10 px-2 py-1 rounded-md">BEI Index</span>
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs sm:text-sm">
                              <thead>
                                <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                                  <th className="py-3 px-4">Показатель</th>
                                  <th className="py-3 px-4 text-center">Проект А</th>
                                  <th className="py-3 px-4 text-center">Проект Б</th>
                                  <th className="py-3 px-4">Победитель раунда</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700/50">
                                <tr>
                                  <td className="py-3 px-4 font-bold text-slate-300">Название стартапа</td>
                                  <td className="py-3 px-4 text-center font-bold text-indigo-300">{compareA.name}</td>
                                  <td className="py-3 px-4 text-center font-bold text-emerald-300">{compareB.name}</td>
                                  <td className="py-3 px-4">—</td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-4 font-bold text-slate-300">SSI (Отраслевой индекс)</td>
                                  <td className="py-3 px-4 text-center">{resultsA.finalSsi.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-center">{resultsB.finalSsi.toFixed(2)}</td>
                                  <td className="py-3 px-4">
                                    {resultsA.finalSsi > resultsB.finalSsi ? <span className="text-indigo-400 font-bold">Проект А (+{(resultsA.finalSsi - resultsB.finalSsi).toFixed(2)})</span> : (resultsA.finalSsi < resultsB.finalSsi ? <span className="text-emerald-400 font-bold">Проект Б (+{(resultsB.finalSsi - resultsA.finalSsi).toFixed(2)})</span> : <span className="text-slate-500">Паритет</span>)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-4 font-bold text-slate-300 flex flex-col">
                                    <span>CAPEX (Сумма гранта)</span>
                                    <span className="text-[9px] font-normal text-slate-500">Оценка стартовых вложений</span>
                                  </td>
                                  <td className="py-3 px-4 text-center">{metricsA.capex.toFixed(1)} млн ₽</td>
                                  <td className="py-3 px-4 text-center">{metricsB.capex.toFixed(1)} млн ₽</td>
                                  <td className="py-3 px-4">
                                    {metricsA.capex < metricsB.capex ? <span className="text-indigo-400 font-bold">Проект А (дешевле)</span> : (metricsA.capex > metricsB.capex ? <span className="text-emerald-400 font-bold">Проект Б (дешевле)</span> : <span className="text-slate-500">Одинаково</span>)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-4 font-bold text-slate-300 flex flex-col">
                                    <span>Точка безубыточности</span>
                                    <span className="text-[9px] font-normal text-slate-500">Месяцев до автономности</span>
                                  </td>
                                  <td className="py-3 px-4 text-center">{metricsA.bep} мес.</td>
                                  <td className="py-3 px-4 text-center">{metricsB.bep} мес.</td>
                                  <td className="py-3 px-4">
                                    {metricsA.bep < metricsB.bep ? <span className="text-indigo-400 font-bold">Проект А (быстрее)</span> : (metricsA.bep > metricsB.bep ? <span className="text-emerald-400 font-bold">Проект Б (быстрее)</span> : <span className="text-slate-500">Одинаково</span>)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-4 font-bold text-slate-300 flex flex-col">
                                    <span>Новые рабочие места</span>
                                    <span className="text-[9px] font-normal text-slate-500">За 3 года реализации</span>
                                  </td>
                                  <td className="py-3 px-4 text-center">{metricsA.jobs} чел.</td>
                                  <td className="py-3 px-4 text-center">{metricsB.jobs} чел.</td>
                                  <td className="py-3 px-4">
                                    {metricsA.jobs > metricsB.jobs ? <span className="text-indigo-400 font-bold">Проект А (больше)</span> : (metricsA.jobs < metricsB.jobs ? <span className="text-emerald-400 font-bold">Проект Б (больше)</span> : <span className="text-slate-500">Одинаково</span>)}
                                  </td>
                                </tr>
                                <tr className="bg-slate-900/50">
                                  <td className="py-3 px-4 font-black text-amber-300 flex flex-col">
                                    <span>BEI — Бюджетная эффективность</span>
                                    <span className="text-[9px] font-normal text-amber-300/60">Σ(налоги) / Сумма_гранта за 3 года</span>
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-amber-300">{metricsA.bei.toFixed(2)}×</td>
                                  <td className="py-3 px-4 text-center font-bold text-amber-300">{metricsB.bei.toFixed(2)}×</td>
                                  <td className="py-3 px-4">
                                    {metricsA.bei > metricsB.bei ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-indigo-400 font-bold">Проект А</span>
                                        <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30">Победитель</span>
                                      </div>
                                    ) : (metricsA.bei < metricsB.bei ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-emerald-400 font-bold">Проект Б</span>
                                        <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30">Победитель</span>
                                      </div>
                                    ) : <span className="text-slate-500">Паритет</span>)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

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
              onUpdatePartialData={(partial) => {
                setData(prev => ({ ...prev, ...partial }));
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

      
      {/* CONSENT MODAL OVERLAY */}
      <AnimatePresence>
        {isConsentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConsentOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[92vh]"
            >
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600 shrink-0" />

              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-slate-900 text-sm md:text-base leading-tight">Согласие на обработку персональных данных</h2>
                    <p className="text-[11px] text-slate-500 font-medium font-sans mt-0.5">Оферта платформы</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConsentOpen(false)}
                  className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-sm text-slate-600 space-y-4">
                <p>Настоящим я, пользователь системы "Лаборатория прединвестиционной экспресс-оценки самодостаточности технологических стартапов" Технопарка СКФУ, (далее – «Стартапер» или «Научный руководитель») даю свое согласие Технопарку СКФУ на обработку моих персональных данных.</p>
                <h3 className="font-bold text-slate-800">1. Перечень обрабатываемых данных</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Фамилия, имя, отчество;</li>
                  <li>Контактная информация (телефон, адрес электронной почты);</li>
                  <li>Сведения об образовании, месте учебы/работы;</li>
                  <li>Информация о стартап-проекте и связанные с ним материалы.</li>
                </ul>
                <h3 className="font-bold text-slate-800">2. Цели обработки</h3>
                <p>Мои персональные данные могут обрабатываться в целях:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Оценки и экспертизы стартап-проекта (расчет индекса SSI);</li>
                  <li>Осуществления коммуникации между стартапером, научным руководителем и экспертами Технопарка;</li>
                  <li>Ведения статистики и мониторинга деятельности платформы.</li>
                </ul>
                <h3 className="font-bold text-slate-800">3. Действия с персональными данными</h3>
                <p>Согласие предоставляется на осуществление следующих действий: сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ), обезличивание, блокирование, удаление, уничтожение персональных данных.</p>
                <h3 className="font-bold text-slate-800">4. Срок действия согласия</h3>
                <p>Настоящее согласие действует бессрочно с момента его принятия и может быть отозвано путем направления письменного заявления в адрес Технопарка СКФУ.</p>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4">
                <p className="text-[10px] text-slate-500 px-2 max-w-sm">
                  Нажимая «Принять оферту», вы подтверждаете свое ознакомление с текстом согласия и даете полное и безоговорочное согласие на обработку ваших персональных данных.
                </p>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsConsentOpen(false)}
                    className="flex-1 md:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Отклонить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('ssi_consent_accepted', 'true');
                      setHasAcceptedConsent(true);
                      setIsConsentOpen(false);
                      setNotification({ message: 'Согласие успешно принято.', type: 'success' });
                      setTimeout(() => setNotification(null), 3000);
                    }}
                    className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Принять оферту
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
          </>
        )}
      </main>
      </div>
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
