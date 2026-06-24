import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  TrendingUp, 
  Percent, 
  Briefcase, 
  Coins, 
  Clock, 
  Users, 
  Download, 
  Copy, 
  Check, 
  RefreshCw,
  Info,
  AlertTriangle,
  Play
} from 'lucide-react';
import { StartupData, Subfactors, CalculationResult } from '../types';
import { 
  calculateResult, 
  calculateSubfactors, 
  getFactorInterpretations 
} from '../utils';

interface AIAgentTabProps {
  onApplyData: (data: StartupData) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Preset ideas for quick loading
const PRESET_IDEAS = [
  {
    type: 'saas',
    name: 'АгроПоиск SaaS',
    author: 'Иванов Иван (Студент СКФУ)',
    desc: 'SaaS-платформа для мониторинга сельскохозяйственных угодий с помощью дронов. ИИ распознает сорняки и болезни растений по снимкам. Подписка для фермеров стоит 3500 руб/мес. Конкуренты берут от 8000 руб за разовый облет. Экономия колоссальная. Рынок огромный, сарафанное радио в агросфере сильное.'
  },
  {
    type: 'service',
    name: 'Чистый Дом Ковры',
    author: 'Петрова Анна Михайловна',
    desc: 'Профессиональная выездная химчистка мебели и ковров в Ставрополе. Быстрый заказ через Telegram-бот. Услуга стоит 2500 руб. Основные расходы — химия и зарплата клинеров. Отток клиентов низкий, так как чистку заказывают стабильно 2-3 раза в год.'
  },
  {
    type: 'product',
    name: 'BioBag — Эко-упаковка',
    author: 'Семенов Даниил',
    desc: 'Производство биоразлагаемых пакетов из кукурузного крахмала для ресторанов и кафе. Пакет разлагается за 40 дней. Себестоимость производства низкая, продажная цена — 12 руб/шт (при заказе от 1000 шт). Постоянный спрос из-за тренда на экологичность.'
  },
  {
    type: 'work',
    name: 'SmartLoft — Мебель на заказ',
    author: 'Козлов Илья Викторович',
    desc: 'Изготовление дизайнерской лофт-мебели для офисов и коворкингов. Средний чек проекта — 180 000 руб. Выполняется под ключ: от 3D-модели до сборки. Вся металлообработка на аутсорсе, сборка в арендованном цеху.'
  }
];

export function AIAgentTab({ onApplyData, showToast }: AIAgentTabProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bizType, setBizType] = useState<string>('saas');
  const [startupName, setStartupName] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Step 2: 12 subfactors and market sizes (TAM, SAM, SOM, TAV)
  const [subfactorsData, setSubfactorsData] = useState({
    u1: 45000,   // Cost of alternative
    u2: 6,       // Episodes per year
    e1: 20,      // Contact minutes
    e2: 0.5,     // Price ratio (us / competitor)
    r1: 3,       // Repetitions per year
    r2: 4.5,     // LTV / CAC
    k1: 350,     // CAPEX (in thousands) - will be synchronized with Step 3
    k2: 65,      // Margin % - will be synchronized with Step 3
    t1: 8,       // Months to EBITDA+
    t2: 12,      // Months to payback
    s1: 40,      // Viral/recommendation %
    s2: 70,      // NPS
    tam: 1200,   // TAM (M rubles)
    sam: 250,    // SAM (M rubles)
    som: 15,     // SOM (M rubles)
    tav: 3.0     // TAV (M rubles)
  });

  // Step 3: CAPEX Budget & Auto-calculation of Cost Price
  const [autoCalcEnabled, setAutoCalcEnabled] = useState<boolean>(true);
  
  // CAPEX Inputs (thousands of rubles)
  const [capexDev, setCapexDev] = useState<number>(100);
  const [capexDesign, setCapexDesign] = useState<number>(50);
  const [capexHost, setCapexHost] = useState<number>(30);
  const [capexMark, setCapexMark] = useState<number>(40);
  const [capexLic, setCapexLic] = useState<number>(10);
  const [capexTeam, setCapexTeam] = useState<number>(120);

  // Financial / Operational inputs
  const [unitPrice, setUnitPrice] = useState<number>(990);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(150); // thousands of rubles
  const [monthlyOpex, setMonthlyOpex] = useState<number>(60); // thousands of rubles
  const [manualCost, setManualCost] = useState<number>(150);

  // AUTO-CALC DETAIL FIELDS DEPENDING ON BUSINESS TYPE
  // 1. SaaS Detail Fields
  const [saasHostingPerUser, setSaasHostingPerUser] = useState<number>(50);
  const [saasSupportCount, setSaasSupportCount] = useState<number>(1);
  const [saasSupportSalary, setSaasSupportSalary] = useState<number>(50000);
  const [saasOutsourceSupport, setSaasOutsourceSupport] = useState<number>(10000);
  const [saasUserCount, setSaasUserCount] = useState<number>(1000);

  // 2. Services (Услуги) Detail Fields
  const [serviceMaterialsCost, setServiceMaterialsCost] = useState<number>(200);
  const [serviceWorkersCount, setServiceWorkersCount] = useState<number>(2);
  const [serviceWorkersSalary, setServiceWorkersSalary] = useState<number>(45000);
  const [serviceOutsource, setServiceOutsource] = useState<number>(15000);
  const [serviceOtherMonthly, setServiceOtherMonthly] = useState<number>(5000);
  const [serviceCountPerMonth, setServiceCountPerMonth] = useState<number>(150);

  // 3. Goods/Production (Товары) Detail Fields
  const [productRawCost, setProductRawCost] = useState<number>(500);
  const [productWorkersCount, setProductWorkersCount] = useState<number>(3);
  const [productWorkersSalary, setProductWorkersSalary] = useState<number>(50000);
  const [productOutsource, setProductOutsource] = useState<number>(0);
  const [productAmortization, setProductAmortization] = useState<number>(10000);
  const [productCountPerMonth, setProductCountPerMonth] = useState<number>(500);

  // 4. Works/Projects (Работы) Detail Fields
  const [workMaterialsCost, setWorkMaterialsCost] = useState<number>(50000);
  const [workWorkersCount, setWorkWorkersCount] = useState<number>(4);
  const [workWorkersSalary, setWorkWorkersSalary] = useState<number>(65000);
  const [workOutsource, setWorkOutsource] = useState<number>(30000);
  const [workOtherMonthly, setWorkOtherMonthly] = useState<number>(15000);
  const [workCountPerMonth, setWorkCountPerMonth] = useState<number>(5);

  // Computed Cost Price (Себестоимость единицы)
  const [computedCost, setComputedCost] = useState<number>(0);

  // Calculated CAPEX Sum
  const capexSum = capexDev + capexDesign + capexHost + capexMark + capexLic + capexTeam;

  // Recalculate cost price based on type
  useEffect(() => {
    let cost = 0;
    if (bizType === 'saas') {
      const payroll = saasSupportCount * saasSupportSalary;
      const totalSupport = payroll + saasOutsourceSupport;
      const divisor = saasUserCount || 1;
      cost = saasHostingPerUser + (totalSupport / divisor);
    } else if (bizType === 'service') {
      const payroll = serviceWorkersCount * serviceWorkersSalary;
      const monthlyTotal = payroll + serviceOutsource + serviceOtherMonthly;
      const divisor = serviceCountPerMonth || 1;
      cost = serviceMaterialsCost + (monthlyTotal / divisor);
    } else if (bizType === 'product') {
      const payroll = productWorkersCount * productWorkersSalary;
      const monthlyOverhead = payroll + productOutsource + productAmortization;
      const divisor = productCountPerMonth || 1;
      cost = productRawCost + (monthlyOverhead / divisor);
    } else if (bizType === 'work') {
      const payroll = workWorkersCount * workWorkersSalary;
      const monthlyWorks = payroll + workOutsource + workOtherMonthly;
      const divisor = workCountPerMonth || 1;
      cost = workMaterialsCost + (monthlyWorks / divisor);
    }
    setComputedCost(Math.round(cost));
  }, [
    bizType,
    saasHostingPerUser, saasSupportCount, saasSupportSalary, saasOutsourceSupport, saasUserCount,
    serviceMaterialsCost, serviceWorkersCount, serviceWorkersSalary, serviceOutsource, serviceOtherMonthly, serviceCountPerMonth,
    productRawCost, productWorkersCount, productWorkersSalary, productOutsource, productAmortization, productCountPerMonth,
    workMaterialsCost, workWorkersCount, workWorkersSalary, workOutsource, workOtherMonthly, workCountPerMonth
  ]);

  // Actual Cost Price currently used (either auto-calculated or manual)
  const finalCostPrice = autoCalcEnabled ? computedCost : manualCost;

  // Margin calculation
  const marginPercentage = unitPrice > 0 
    ? Math.max(-100, Math.min(99, Math.round(((unitPrice - finalCostPrice) / unitPrice) * 100)))
    : 0;

  // Synchronize dynamic CAPEX and Margin into Step 2 subfactors representation
  useEffect(() => {
    setSubfactorsData(prev => ({
      ...prev,
      k1: capexSum,
      k2: marginPercentage > 0 ? marginPercentage : 0
    }));
  }, [capexSum, marginPercentage]);

  // Handle Preset loading
  const handleLoadPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setBizType(preset.type);
    setStartupName(preset.name);
    setAuthorName(preset.author);
    setDescription(preset.desc);
    showToast(`📝 Шаблон идеи "${preset.name}" успешно загружен!`, 'success');
  };

  // Step 1 -> Step 2 (Heuristic Smart Analysis)
  const handleStartAnalysis = () => {
    if (!startupName.trim()) {
      showToast('⚠️ Введите название вашего стартапа', 'error');
      return;
    }
    if (!description.trim() || description.length < 20) {
      showToast('⚠️ Опишите идею более подробно (минимум 20 символов)', 'error');
      return;
    }

    setIsAnalyzing(true);
    setStep(2);

    // Dynamic heuristic scores based on description text
    setTimeout(() => {
      const text = description.toLowerCase();
      let estU1 = 30000;
      let estU2 = 8;
      let estE1 = 20;
      let estE2 = 0.5;
      let estR1 = 4;
      let estR2 = 4.0;
      let estT1 = 10;
      let estT2 = 18;
      let estS1 = 30;
      let estS2 = 60;

      let estTam = 800;
      let estSam = 180;
      let estSom = 12;
      let estTav = 4.0;

      // Adjust metrics depending on keywords
      if (text.includes('бпла') || text.includes('дрон') || text.includes('коптер')) {
        estU1 = 90000;
        estU2 = 6;
        estE1 = 25;
        estE2 = 0.45;
        estTam = 2400;
        estSam = 350;
        estSom = 25;
      }
      if (text.includes('химчистка') || text.includes('клининг') || text.includes('уборка')) {
        estU1 = 5000;
        estU2 = 12;
        estE1 = 15;
        estE2 = 0.8;
        estR1 = 6;
        estR2 = 5.2;
        estTam = 300;
        estSam = 40;
        estSom = 5;
        estTav = 1.2;
      }
      if (text.includes('эко') || text.includes('био') || text.includes('крахмал') || text.includes('пакет')) {
        estU1 = 15;
        estU2 = 48;
        estE1 = 10;
        estE2 = 0.9;
        estR1 = 12;
        estR2 = 6.0;
        estTam = 1500;
        estSam = 120;
        estSom = 15;
      }
      if (text.includes('мебель') || text.includes('производство') || text.includes('заказ')) {
        estU1 = 120000;
        estU2 = 2;
        estE1 = 35;
        estE2 = 0.7;
        estR1 = 1.5;
        estR2 = 3.5;
        estTam = 900;
        estSam = 150;
        estSom = 10;
      }

      // Business Type overrides
      if (bizType === 'saas') {
        estR1 = 12;
        estR2 = 5.5;
        setUnitPrice(990);
        setMonthlyOpex(50);
        setMonthlyRevenue(180);
      } else if (bizType === 'service') {
        estR1 = 4;
        estR2 = 3.5;
        setUnitPrice(2500);
        setMonthlyOpex(80);
        setMonthlyRevenue(200);
      } else if (bizType === 'product') {
        estR1 = 6;
        estR2 = 4.0;
        setUnitPrice(15);
        setMonthlyOpex(150);
        setMonthlyRevenue(450);
      } else if (bizType === 'work') {
        estR1 = 1.5;
        estR2 = 3.0;
        setUnitPrice(180000);
        setMonthlyOpex(300);
        setMonthlyRevenue(900);
      }

      setSubfactorsData({
        u1: estU1,
        u2: estU2,
        e1: estE1,
        e2: estE2,
        r1: estR1,
        r2: estR2,
        k1: capexSum,
        k2: marginPercentage > 0 ? marginPercentage : 0,
        t1: estT1,
        t2: estT2,
        s1: estS1,
        s2: estS2,
        tam: estTam,
        sam: estSam,
        som: estSom,
        tav: estTav
      });

      setIsAnalyzing(false);
      showToast('🔮 ИИ Агент успешно проанализировал описание идеи!', 'success');
    }, 1500);
  };

  // Convert state representation to global StartupData format
  const compileStartupData = (): StartupData => {
    return {
      name: startupName,
      author: authorName || 'Студент-предприниматель',
      expert: 'ИИ Агент SSI (TRUSEK-6)',
      u1: subfactorsData.u1,
      u2: subfactorsData.u2,
      e1: subfactorsData.e1,
      e2: subfactorsData.e2,
      r1: subfactorsData.r1,
      r2: subfactorsData.r2,
      k1: capexSum,
      k2: marginPercentage,
      t1: subfactorsData.t1,
      t2: subfactorsData.t2,
      s1: subfactorsData.s1,
      s2: subfactorsData.s2,
      tam: subfactorsData.tam,
      sam: subfactorsData.sam,
      som: subfactorsData.som,
      tav: subfactorsData.tav
    };
  };

  const startupData = compileStartupData();
  const results: CalculationResult = calculateResult(startupData);
  const factorInterpretations = getFactorInterpretations(results.subfactors);

  // Download compiled JSON file
  const handleDownloadJSON = () => {
    try {
      const formattedJson = {
        _comment: "Сгенерировано ИИ Агентом SSI стартапера (TRUSEK-6)",
        ...startupData,
        _metadata: {
          bizType,
          capexSum,
          finalCostPrice,
          marginPercentage,
          ssiScore: results.finalSsi.toFixed(2),
          verdict: results.interpretation
        }
      };
      const blob = new Blob([JSON.stringify(formattedJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${startupName.replace(/\s+/g, '_')}_SSI_Agent.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('⬇️ Анкетный файл JSON успешно скачан на ваш ПК/гаджет!', 'success');
    } catch {
      showToast('❌ Ошибка при генерации JSON', 'error');
    }
  };

  // Copy to clipboard
  const handleCopyJSON = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(startupData, null, 2));
      showToast('📋 Данные скопированы в буфер обмена в формате JSON!', 'success');
    } catch {
      showToast('❌ Не удалось скопировать данные', 'error');
    }
  };

  // Load into main application directly
  const handleApplyToMainApp = () => {
    onApplyData(startupData);
    showToast('🔌 Данные из ИИ Агента успешно интегрированы в рабочий калькулятор!', 'success');
  };

  // Reset all values to start anew
  const handleResetAll = () => {
    setStep(1);
    setStartupName('');
    setAuthorName('');
    setDescription('');
    setAutoCalcEnabled(true);
    setCapexDev(100);
    setCapexDesign(50);
    setCapexHost(30);
    setCapexMark(40);
    setCapexLic(10);
    setCapexTeam(120);
  };

  return (
    <div className="space-y-8" id="ai-agent-panel">
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-5">
        <h2 className="font-display font-black text-2xl md:text-3xl text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bot className="w-8 h-8 text-purple-600 animate-bounce shrink-0" />
          <span>ИИ Агент стартапера (TRUSEK-6)</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1.5 leading-relaxed max-w-4xl font-light">
          Это умный пошаговый мастер-агент. Опишите своими словами бизнес-идею — Агент автоматически построит финансовые сметы, произведет детализированный расчет себестоимости по типам бизнеса, оценит 12 подфакторов выживаемости и выдаст готовую анкету JSON для калькулятора.
        </p>
      </div>

      {/* Progress Wizard Steps Bar */}
      <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-4xl mx-auto">
        {[
          { num: 1, title: 'Идея' },
          { num: 2, title: 'ИИ-Анализ' },
          { num: 3, title: 'Смета' },
          { num: 4, title: 'Результат' }
        ].map(s => (
          <div 
            key={s.num}
            onClick={() => {
              if (s.num < step) setStep(s.num as any);
            }}
            className={`cursor-pointer group flex flex-col md:flex-row items-center gap-2.5 p-3 rounded-2xl border transition-all duration-300 ${
              step === s.num 
                ? 'bg-purple-50/80 border-purple-200 shadow-xs' 
                : step > s.num
                  ? 'bg-emerald-50/40 border-emerald-100 opacity-90 hover:bg-emerald-50/60'
                  : 'bg-slate-50 border-slate-100 opacity-60 pointer-events-none'
            }`}
          >
            <div className={`w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center shrink-0 shadow-xs transition-all ${
              step === s.num 
                ? 'bg-purple-600 text-white animate-pulse' 
                : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
            }`}>
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <div className="text-center md:text-left">
              <span className={`block text-[10px] uppercase font-bold tracking-wider ${
                step === s.num ? 'text-purple-600' : step > s.num ? 'text-emerald-600' : 'text-slate-400'
              }`}>Этап {s.num}</span>
              <span className={`block text-xs font-semibold ${
                step === s.num ? 'text-purple-950' : step > s.num ? 'text-slate-700' : 'text-slate-500'
              }`}>{s.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* STEP 1: ENTER IDEA */}
      {step === 1 && (
        <div className="space-y-6 max-w-4xl mx-auto bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
          <div className="border-b border-slate-200/50 pb-4 mb-4">
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              <span>Расскажите о вашей бизнес-идее</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Выберите вид деятельности и внесите базовые сведения.</p>
          </div>

          {/* Quick presets list */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Быстрые готовые шаблоны для теста:</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_IDEAS.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleLoadPreset(p)}
                  className="px-3 py-1.5 text-xs bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all shadow-3xs cursor-pointer"
                >
                  🚀 {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Business Type Selector Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Тип вашей бизнес-модели:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'saas', icon: '💻', title: 'ПО / SaaS', desc: 'Веб-приложения, мобильные сервисы, SaaS платформы' },
                { id: 'service', icon: '🤝', title: 'Услуги', desc: 'Консалтинг, образование, клининг, бьюти-сфера' },
                { id: 'product', icon: '📦', title: 'Товар / Продукция', desc: 'Физическое производство, розница, пошив одежды' },
                { id: 'work', icon: '🔧', title: 'Работы / Проекты', desc: 'Строительство, кастомный дизайн, ремонт под ключ' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    setBizType(opt.id);
                    // Adjust defaults for budget names depending on biz type
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
                    bizType === opt.id 
                      ? 'bg-purple-50/40 border-purple-500 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="text-3xl">{opt.icon}</div>
                  <div>
                    <span className="block font-bold text-xs text-slate-900 leading-none">{opt.title}</span>
                    <span className="block text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Basic Info Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Название стартапа <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                value={startupName}
                onChange={e => setStartupName(e.target.value)}
                placeholder="Введите название проекта..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-semibold text-sm outline-none focus:border-purple-500 transition-colors shadow-3xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ваше ФИО (Автор)</label>
              <input 
                type="text" 
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-semibold text-sm outline-none focus:border-purple-500 transition-colors shadow-3xs"
              />
            </div>
          </div>

          {/* Text Description Textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Детальное описание идеи <span className="text-rose-500">*</span></label>
              <span className="text-[10px] text-slate-400 font-mono">Минимум 20 символов</span>
            </div>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Опишите, в чем суть проекта, какую 'острую боль' клиента он решает, кто целевая аудитория, какова бизнес-модель (как вы зарабатываете), примерную стоимость, и как будете привлекать первых клиентов..."
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-light text-sm outline-none focus:border-purple-500 transition-colors shadow-3xs h-36 resize-y leading-relaxed"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleStartAnalysis}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:translate-y-[-1px] active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🔮 ИИ-Анализ бизнес-идеи</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SHOW ANALYZED SUBFACTORS */}
      {step === 2 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {isAnalyzing ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
                  <Bot className="w-8 h-8 text-purple-600 absolute top-4 left-4 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="font-display font-extrabold text-slate-900 text-lg">ИИ Агент SSI анализирует вашу идею...</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Агент разбирает ценностное предложение, целевые аудитории, частоту использования и привязанность для расчета 12 подфакторов TRUSEK-6.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                    <span>Предварительные оценки 12 подфакторов</span>
                  </h3>
                  <p className="text-xs text-slate-500">На основе семантического анализа описания вашей идеи, ИИ Агент выставил стартовые оценки. Проверьте и уточните значения при необходимости.</p>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Оценка ИИ</span>
              </div>

              {/* Slider list of factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* U - Утилитарность */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-emerald-500 text-white font-black flex items-center justify-center text-[10px]">U1</span>
                      <span>Стоимость альтернативы для клиента (руб.)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.u1.toLocaleString()} ₽</span>
                  </div>
                  <input 
                    type="range" min="0" max="300000" step="1000"
                    value={subfactorsData.u1}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, u1: parseInt(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Какую сумму клиент тратит на альтернативное решение проблемы прямо сейчас?</span>
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-emerald-500 text-white font-black flex items-center justify-center text-[10px]">U2</span>
                      <span>Эпизодов потребности в год (раз)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.u2} раз(а)</span>
                  </div>
                  <input 
                    type="range" min="1" max="52" step="1"
                    value={subfactorsData.u2}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, u2: parseInt(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Сколько раз в год у клиента возникает острая боль или потребность в этом продукте?</span>
                </div>

                {/* E - Эмоция */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-teal-500 text-white font-black flex items-center justify-center text-[10px]">E1</span>
                      <span>Минут контакта за сессию</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.e1} мин</span>
                  </div>
                  <input 
                    type="range" min="1" max="60" step="1"
                    value={subfactorsData.e1}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, e1: parseInt(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Средняя длительность одного сеанса взаимодействия с продуктом.</span>
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-teal-500 text-white font-black flex items-center justify-center text-[10px]">E2</span>
                      <span>Коэффициент соотношения цен (Ваша / Конкуренты)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.e2.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" min="0.05" max="2.0" step="0.05"
                    value={subfactorsData.e2}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, e2: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Во сколько раз ваша розничная цена отличается от ближайшего конкурента?</span>
                </div>

                {/* R - Повторяемость */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[10px]">R1</span>
                      <span>Повторных покупок в год</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.r1} покупок</span>
                  </div>
                  <input 
                    type="range" min="0" max="52" step="1"
                    value={subfactorsData.r1}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, r1: parseInt(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Сколько раз один и тот же лояльный клиент совершает транзакцию за 12 месяцев?</span>
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[10px]">R2</span>
                      <span>LTV / CAC отношение</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.r2.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="10.0" step="0.1"
                    value={subfactorsData.r2}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, r2: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Во сколько раз пожизненный доход с клиента превышает затраты на его рекламу?</span>
                </div>

                {/* T - Время */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-400 text-white font-black flex items-center justify-center text-[10px]">T1</span>
                      <span>Месяцев до EBITDA+</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.t1} мес.</span>
                  </div>
                  <input 
                    type="range" min="1" max="36" step="1"
                    value={subfactorsData.t1}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, t1: parseInt(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Через сколько месяцев проект выйдет в чистый операционный плюс по месяцу?</span>
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-400 text-white font-black flex items-center justify-center text-[10px]">T2</span>
                      <span>Месяцев до окупаемости</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.t2} мес.</span>
                  </div>
                  <input 
                    type="range" min="1" max="60" step="1"
                    value={subfactorsData.t2}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, t2: parseInt(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Срок возврата всех вложенных стартовых средств (CAPEX).</span>
                </div>

                {/* S - Социальный */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-700 text-white font-black flex items-center justify-center text-[10px]">S1</span>
                      <span>Доля клиентов по рекомендации (%)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.s1} %</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="5"
                    value={subfactorsData.s1}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, s1: parseInt(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Доля новых заказов, полученных через бесплатный сарафанный маркетинг.</span>
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-700 text-white font-black flex items-center justify-center text-[10px]">S2</span>
                      <span>Индекс потребительской лояльности NPS</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{subfactorsData.s2}</span>
                  </div>
                  <input 
                    type="range" min="-100" max="100" step="5"
                    value={subfactorsData.s2}
                    onChange={e => setSubfactorsData(prev => ({ ...prev, s2: parseInt(e.target.value) }))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="block text-[10px] text-slate-400 font-light">Индекс удовлетворенности клиентов от -100 (все ненавидят) до +100 (все рекомендуют).</span>
                </div>
              </div>

              {/* Market sizes */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">Объемы и емкость целевого рынка (млн рублей):</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">TAM (Весь рынок)</span>
                    <input 
                      type="number" 
                      value={subfactorsData.tam}
                      onChange={e => setSubfactorsData(prev => ({ ...prev, tam: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-transparent border-b border-transparent text-center font-mono font-bold text-slate-900 outline-none focus:border-purple-300 py-1"
                    />
                    <span className="block text-[9px] text-slate-400">Общая емкость в РФ</span>
                  </div>
                  <div className="space-y-1 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">SAM (Доступный)</span>
                    <input 
                      type="number" 
                      value={subfactorsData.sam}
                      onChange={e => setSubfactorsData(prev => ({ ...prev, sam: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-transparent border-b border-transparent text-center font-mono font-bold text-slate-900 outline-none focus:border-purple-300 py-1"
                    />
                    <span className="block text-[9px] text-slate-400">Рынок вашего сегмента</span>
                  </div>
                  <div className="space-y-1 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">SOM (Захватываемый)</span>
                    <input 
                      type="number" 
                      value={subfactorsData.som}
                      onChange={e => setSubfactorsData(prev => ({ ...prev, som: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-transparent border-b border-transparent text-center font-mono font-bold text-slate-900 outline-none focus:border-purple-300 py-1"
                    />
                    <span className="block text-[9px] text-slate-400">Реальный захват (3 года)</span>
                  </div>
                  <div className="space-y-1 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">TAV (Автономия)</span>
                    <input 
                      type="number" 
                      value={subfactorsData.tav}
                      onChange={e => setSubfactorsData(prev => ({ ...prev, tav: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-transparent border-b border-transparent text-center font-mono font-bold text-slate-900 outline-none focus:border-purple-300 py-1"
                    />
                    <span className="block text-[9px] text-slate-400">Выручка окупаемости</span>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  ← К описанию идеи
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💰 Настроить смету и расчет</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: FINANCIAL BUDGET & AUTO COST PRICE CALCULATION */}
      {step === 3 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-600" />
                <span>Смета CAPEX и Интеллектуальный расчет себестоимости</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Заполните структуру разовых капитальных расходов (CAPEX), а также детальные параметры вашей операционной модели для автоматического вычисления себестоимости.
              </p>
            </div>

            {/* Toggle switch for auto calculation */}
            <div className="flex items-center justify-between p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
              <div className="flex gap-2.5 items-start">
                <Bot className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">🤖 Автоматический экспертный расчет себестоимости единицы</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Калькулятор задействует персонализированные формулы себестоимости по типам: <strong className="text-purple-700">УСЛУГИ, ТОВАРЫ, РАБОТЫ и ПО/SaaS</strong> на основе фонда оплаты труда (ФОТ) сотрудников, аутсорсинга и накладных расходов.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={autoCalcEnabled}
                  onChange={e => setAutoCalcEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* CAPEX Initial Budget Grid */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider">1. Смета капитальных расходов (CAPEX), тыс. руб.</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {bizType === 'saas' && '💻 Разработка ПО'}
                    {bizType === 'product' && '🏭 Оборудование'}
                    {bizType === 'work' && '🔧 Инструмент'}
                    {bizType === 'service' && '🚗 Транспорт'}
                  </label>
                  <input 
                    type="number" 
                    value={capexDev}
                    onChange={e => setCapexDev(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {bizType === 'saas' && '🎨 Дизайн / UX-UI'}
                    {bizType === 'product' && '📐 Конструкция / Формы'}
                    {bizType === 'work' && '📐 Проектная дока'}
                    {bizType === 'service' && '🎨 Брендинг / Сайт'}
                  </label>
                  <input 
                    type="number" 
                    value={capexDesign}
                    onChange={e => setCapexDesign(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {bizType === 'saas' && '☁️ Хостинг / Серверы'}
                    {bizType === 'product' && '🏭 Аренда цеха'}
                    {bizType === 'work' && '🏗️ Аренда площадки'}
                    {bizType === 'service' && '🏢 Аренда офиса'}
                  </label>
                  <input 
                    type="number" 
                    value={capexHost}
                    onChange={e => setCapexHost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">📢 Маркетинг (Старт)</label>
                  <input 
                    type="number" 
                    value={capexMark}
                    onChange={e => setCapexMark(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">⚖️ Лицензии / Патенты</label>
                  <input 
                    type="number" 
                    value={capexLic}
                    onChange={e => setCapexLic(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {bizType === 'saas' && '👥 Команда (3 мес.)'}
                    {bizType === 'product' && '👥 Персонал (3 мес.)'}
                    {bizType === 'work' && '👥 Бригада (3 мес.)'}
                    {bizType === 'service' && '👥 Сотрудники (3 мес.)'}
                  </label>
                  <input 
                    type="number" 
                    value={capexTeam}
                    onChange={e => setCapexTeam(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* DETAILED OPERATIONAL INPUTS & FOT FOR AUTO COST PRICE */}
            {autoCalcEnabled && (
              <div className="border-t border-slate-150 pt-5 space-y-4">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>2. Детальные параметры для расчета себестоимости единицы ({bizType === 'saas' ? 'SaaS лицензия' : bizType === 'service' ? 'Оказанная услуга' : bizType === 'product' ? 'Единица товара' : 'Выполненный проект'})</span>
                </h4>

                {/* DYNAMIC DEPENDING ON BIZ TYPE */}
                {bizType === 'saas' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Хостинг и API на 1 пользователя (₽/мес.)</label>
                      <input 
                        type="number" 
                        value={saasHostingPerUser}
                        onChange={e => setSaasHostingPerUser(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Сотрудники поддержки (чел.)</label>
                      <input 
                        type="number" 
                        value={saasSupportCount}
                        onChange={e => setSaasSupportCount(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Месячная з/п специалиста поддержки (₽)</label>
                      <input 
                        type="number" 
                        value={saasSupportSalary}
                        onChange={e => setSaasSupportSalary(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Аутсорсинг поддержки/серверов (₽/мес.)</label>
                      <input 
                        type="number" 
                        value={saasOutsourceSupport}
                        onChange={e => setSaasOutsourceSupport(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Количество активных пользователей (в месяц)</label>
                      <input 
                        type="number" 
                        value={saasUserCount}
                        onChange={e => setSaasUserCount(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                )}

                {bizType === 'service' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Расходные материалы на 1 услугу (₽)</label>
                      <input 
                        type="number" 
                        value={serviceMaterialsCost}
                        onChange={e => setServiceMaterialsCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Работники на выполнение услуг (чел.)</label>
                      <input 
                        type="number" 
                        value={serviceWorkersCount}
                        onChange={e => setServiceWorkersCount(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Месячная з/п работника (₽)</label>
                      <input 
                        type="number" 
                        value={serviceWorkersSalary}
                        onChange={e => setServiceWorkersSalary(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Аутсорсинг услуг (подрядчики, ₽/мес.)</label>
                      <input 
                        type="number" 
                        value={serviceOutsource}
                        onChange={e => setServiceOutsource(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Прочие расходы на услуги (₽/мес.)</label>
                      <input 
                        type="number" 
                        value={serviceOtherMonthly}
                        onChange={e => setServiceOtherMonthly(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Количество услуг в месяц (шт)</label>
                      <input 
                        type="number" 
                        value={serviceCountPerMonth}
                        onChange={e => setServiceCountPerMonth(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                )}

                {bizType === 'product' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Сырье/материалы на ед. товара (₽)</label>
                      <input 
                        type="number" 
                        value={productRawCost}
                        onChange={e => setProductRawCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Производственные работники (чел.)</label>
                      <input 
                        type="number" 
                        value={productWorkersCount}
                        onChange={e => setProductWorkersCount(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Месячная з/п работника (₽)</label>
                      <input 
                        type="number" 
                        value={productWorkersSalary}
                        onChange={e => setProductWorkersSalary(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Аутсорсинг производства (фабрика, ₽/мес.)</label>
                      <input 
                        type="number" 
                        value={productOutsource}
                        onChange={e => setProductOutsource(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Амортизация и цеховые затраты (₽/мес.)</label>
                      <input 
                        type="number" 
                        value={productAmortization}
                        onChange={e => setProductAmortization(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Объем выпуска в месяц (шт)</label>
                      <input 
                        type="number" 
                        value={productCountPerMonth}
                        onChange={e => setProductCountPerMonth(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                )}

                {bizType === 'work' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Материалы/оборудование на 1 проект (₽)</label>
                      <input 
                        type="number" 
                        value={workMaterialsCost}
                        onChange={e => setWorkMaterialsCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Работники бригады в месяц (чел.)</label>
                      <input 
                        type="number" 
                        value={workWorkersCount}
                        onChange={e => setWorkWorkersCount(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Месячная з/п специалиста (₽)</label>
                      <input 
                        type="number" 
                        value={workWorkersSalary}
                        onChange={e => setWorkWorkersSalary(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Аутсорсинг / Субподряды в месяц (₽)</label>
                      <input 
                        type="number" 
                        value={workOutsource}
                        onChange={e => setWorkOutsource(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Прочие накладные расходы бригады (₽)</label>
                      <input 
                        type="number" 
                        value={workOtherMonthly}
                        onChange={e => setWorkOtherMonthly(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Количество проектов в месяц (шт)</label>
                      <input 
                        type="number" 
                        value={workCountPerMonth}
                        onChange={e => setWorkCountPerMonth(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Financial and Economic inputs */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider">3. Финансовые показатели (для оценки времени окупаемости T1/T2)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Цена продажи единицы (подписки), ₽</label>
                  <input 
                    type="number" 
                    value={unitPrice}
                    onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Прогноз выручки в месяц, тыс. руб.</label>
                  <input 
                    type="number" 
                    value={monthlyRevenue}
                    onChange={e => setMonthlyRevenue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Ежемесячные опер. расходы OPEX, тыс. руб.</label>
                  <input 
                    type="number" 
                    value={monthlyOpex}
                    onChange={e => setMonthlyOpex(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-sm font-bold"
                  />
                </div>
              </div>

              {!autoCalcEnabled && (
                <div className="space-y-1.5 p-4 bg-amber-50/40 border border-amber-200 rounded-2xl">
                  <label className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Ручной ввод себестоимости единицы продукта (₽)</label>
                  <input 
                    type="number" 
                    value={manualCost}
                    onChange={e => setManualCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-mono font-bold text-slate-900 outline-none"
                  />
                  <p className="text-[10px] text-amber-700/80 mt-1 font-light">В режиме ручного ввода формулы авторасчета игнорируются.</p>
                </div>
              )}
            </div>

            {/* AUTO-CALCULATED RESULTS CARD */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-indigo-50/90 p-5 md:p-6 rounded-3xl text-slate-900 border border-indigo-100/60 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              <h4 className="font-display font-extrabold text-sm text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>📊 Сводный расчет юнит-экономики и CAPEX</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-b border-indigo-100/50 pb-4 mb-4">
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wide">Итого CAPEX</span>
                  <span className="block font-mono font-black text-lg text-slate-900 mt-1">{capexSum.toLocaleString()} тыс. ₽</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wide">Маржинальность</span>
                  <span className={`block font-mono font-black text-lg mt-1 ${marginPercentage >= 50 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {marginPercentage} %
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wide">Месячный OPEX</span>
                  <span className="block font-mono font-black text-lg text-slate-900 mt-1">{monthlyOpex.toLocaleString()} тыс. ₽</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wide">Себестоимость ед.</span>
                  <span className="block font-mono font-black text-lg text-indigo-800 mt-1">{finalCostPrice.toLocaleString()} ₽</span>
                </div>
              </div>

              {/* Education helper formulas */}
              <div className="space-y-1.5 text-xs text-slate-700 font-normal leading-relaxed bg-white/60 p-3.5 rounded-2xl border border-indigo-100/30">
                <div>
                  <strong className="text-indigo-900">Логика вычислений:</strong>
                </div>
                {bizType === 'saas' && (
                  <p className="text-[11px]">
                    Себестоимость подписки = Хостинг на 1 пользователя ({saasHostingPerUser} ₽) + (ФОТ поддержки ({saasSupportCount * saasSupportSalary} ₽) + Аутсорсинг ({saasOutsourceSupport} ₽)) / Кол-во пользователей ({saasUserCount} чел.). 
                    <br />
                    Маржинальность рассчитывается как (Цена [{unitPrice} ₽] - Себестоимость [{finalCostPrice} ₽]) / Цена.
                  </p>
                )}
                {bizType === 'service' && (
                  <p className="text-[11px]">
                    Себестоимость услуги = Расходники ({serviceMaterialsCost} ₽) + (ФОТ исполнителей ({serviceWorkersCount * serviceWorkersSalary} ₽) + Аутсорсинг ({serviceOutsource} ₽) + Накладные расходы ({serviceOtherMonthly} ₽)) / Количество услуг в месяц ({serviceCountPerMonth} шт.).
                  </p>
                )}
                {bizType === 'product' && (
                  <p className="text-[11px]">
                    Себестоимость товара = Сырье ({productRawCost} ₽) + (ФОТ рабочих ({productWorkersCount * productWorkersSalary} ₽) + Аутсорсинг ({productOutsource} ₽) + Амортизация ({productAmortization} ₽)) / Объем выпуска в месяц ({productCountPerMonth} шт.).
                  </p>
                )}
                {bizType === 'work' && (
                  <p className="text-[11px]">
                    Себестоимость работы/проекта = Материалы ({workMaterialsCost} ₽) + (ФОТ бригады ({workWorkersCount * workWorkersSalary} ₽) + Аутсорсинг ({workOutsource} ₽) + Накладные расходы ({workOtherMonthly} ₽)) / Объем выполненных проектов в месяц ({workCountPerMonth} шт.).
                  </p>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                ← Назад к факторам
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>📊 Сгенерировать результат SSI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SSI FINAL REPORT */}
      {step === 4 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Main summary score card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Итоговый отчет ИИ Агента</span>
              <h3 className="font-display font-black text-2xl text-slate-900">{startupName}</h3>
              <p className="text-xs text-slate-500 font-light">Автор анкеты: <strong className="text-slate-700">{authorName || 'Студент-предприниматель'}</strong></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Score visualizer */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-4">
                <div>
                  <span className="block font-mono text-6xl md:text-7xl font-black tracking-tight" style={{ color: results.color }}>
                    {results.finalSsi.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Индекс выживаемости SSI (0-10)</span>
                </div>
                <div className="p-3.5 rounded-2xl text-xs font-semibold leading-relaxed border" style={{ backgroundColor: `${results.color}10`, borderColor: `${results.color}30`, color: results.color }}>
                  {results.interpretation}
                </div>
              </div>

              {/* 6 factors values representation */}
              <div className="space-y-3.5">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider">Профиль факторов TRUSEK-6:</h4>
                <div className="space-y-2.5">
                  {factorInterpretations.map(f => (
                    <div key={f.key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{f.key} — {f.name}</span>
                        <span className="font-mono font-bold text-slate-900">{f.score.toFixed(1)} / 10</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${f.score * 10}%`, 
                            backgroundColor: f.score >= 7.5 ? '#10b981' : f.score >= 5.0 ? '#f59e0b' : '#ef4444' 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct advice and feedback container */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-600" />
                <span>Рекомендации ИИ Агента по укреплению стартапа:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {factorInterpretations.map(f => (
                  <div key={`rec-${f.key}`} className="p-3.5 bg-white rounded-2xl border border-slate-200/60 shadow-3xs flex gap-3">
                    <span 
                      className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: f.score >= 7.5 ? '#10b981' : f.score >= 5.0 ? '#f59e0b' : '#ef4444' 
                      }}
                    >
                      {f.key}
                    </span>
                    <div className="space-y-1">
                      <span className="block font-bold text-xs text-slate-800 leading-none">{f.name} (оценка {f.score.toFixed(1)})</span>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-light mt-1">{f.advice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw JSON Code output box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Сгенерированный файл анкеты JSON:</label>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-[11px] text-slate-800 relative overflow-x-auto max-h-52 leading-relaxed">
                <pre>{JSON.stringify(startupData, null, 2)}</pre>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="w-full sm:w-auto px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Скачать файл анкеты на ваш компьютер или гаджет"
                >
                  <Download className="w-4 h-4" />
                  <span>Скачать JSON файл</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Копировать JSON</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5 w-full sm:w-auto justify-end">
                {/* Apply Directly into main calculator! */}
                <button
                  type="button"
                  onClick={handleApplyToMainApp}
                  className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  title="Загрузить полученные результаты напрямую в основную вкладку Калькулятора"
                >
                  <Play className="w-4 h-4 text-purple-100 fill-purple-100 animate-pulse" />
                  <span>🔌 Применить в калькуляторе!</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-500 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Новая идея</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
