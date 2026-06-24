import React, { useState, useEffect } from 'react';
import { StartupData } from '../types';
import { 
  TrendingUp, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  TrendingDown, 
  Info, 
  Bot,
  Zap,
  DollarSign,
  Users,
  Calendar,
  Shuffle,
  Activity,
  Link2,
  Link2Off
} from 'lucide-react';

interface SalesRealismValidatorProps {
  data: StartupData;
  setData?: React.Dispatch<React.SetStateAction<StartupData>>;
  resultsColor?: string;
}

type MeasurementUnit = 'шт.' | 'ед.' | 'кг' | 'м²' | 'тн' | 'л' | 'услуг';
type InputMode = 'annual' | 'daily';
type DemandProfile = 'flat' | 'weekend' | 'weekday' | 'spikes';

export function SalesRealismValidator({ data, setData, resultsColor = '#6366f1' }: SalesRealismValidatorProps) {
  // 1. Core State
  const [unit, setUnit] = useState<MeasurementUnit>('шт.');
  const [inputMode, setInputMode] = useState<InputMode>('daily'); // Start with daily to emphasize "every day is different"
  const [statedAnnualVolume, setStatedAnnualVolume] = useState<number>(10000);
  const [dailyAverage, setDailyAverage] = useState<number>(27.4);
  const [pricePerUnit, setPricePerUnit] = useState<number>(500);
  const [marketingBudget, setMarketingBudget] = useState<number>(300); // в тыс. руб. в год
  const [funnelConversion, setFunnelConversion] = useState<number>(1.5); // %
  const [siteTraffic, setSiteTraffic] = useState<number>(50000); // Посетителей в год
  const [isNewBrand, setIsNewBrand] = useState<boolean>(true); // Новая неизвестная фирма?

  // Competitor price to link dynamically with data.e2 (Our Price / Competitor Price)
  const [competitorPrice, setCompetitorPrice] = useState<number>(750);

  // Seasonality & Volatility state
  const [demandProfile, setDemandProfile] = useState<DemandProfile>('weekend');
  const [zeroDaysPercent, setZeroDaysPercent] = useState<number>(40); // 40% of days have no sales on startup

  // Connection control to overall SSI index and Factor Lily!
  const [autoSync, setAutoSync] = useState<boolean>(true);

  // Ref to track the last values successfully sent to parent to prevent feedback loops/infinite re-renders
  const lastSentToParentRef = React.useRef({ som: 0, e2: 0, r2: 0 });

  // Direct handlers for syncing Daily & Annual volumes to bypass dual useEffect cascading
  const handleDailyAverageChange = (newDaily: number) => {
    setDailyAverage(newDaily);
    const annual = Math.round(newDaily * 365);
    setStatedAnnualVolume(annual);
  };

  const handleAnnualVolumeChange = (newAnnual: number) => {
    setStatedAnnualVolume(newAnnual);
    const daily = Number((newAnnual / 365).toFixed(1));
    setDailyAverage(daily);
  };

  // Sync state with StartupData only when changed EXTERNALLY (i.e. not by our own updates)
  useEffect(() => {
    const wasSentByUs =
      Math.abs(data.som - lastSentToParentRef.current.som) < 0.05 &&
      Math.abs(data.e2 - lastSentToParentRef.current.e2) < 0.05;

    if (wasSentByUs) {
      return;
    }

    if (data.som > 0) {
      const estimatedRevenue = data.som * 1000000; // SOM in Rubles
      const defaultPrice = pricePerUnit > 0 ? pricePerUnit : 1000;
      const calculatedVolume = Math.round(estimatedRevenue / defaultPrice);
      
      if (calculatedVolume > 10 && calculatedVolume < 1000000) {
        setStatedAnnualVolume(calculatedVolume);
        setDailyAverage(Number((calculatedVolume / 365).toFixed(1)));
      } else {
        setStatedAnnualVolume(3650); // 10 per day
        setDailyAverage(10);
      }
    }

    if (data.e2 > 0) {
      setCompetitorPrice(Math.round(pricePerUnit / data.e2));
    }
  }, [data.som, data.e2]);

  // 2. Calculations for Realism and Funnel
  const calculatedStatedRevenue = (statedAnnualVolume * pricePerUnit) / 1000000; // в млн. руб
  const maxSalesFromTraffic = Math.round(siteTraffic * (funnelConversion / 100));
  const impliedCac = statedAnnualVolume > 0 ? (marketingBudget * 1000) / statedAnnualVolume : 0;

  const baseRealisticCac = pricePerUnit * 0.25;
  const brandMultiplier = isNewBrand ? 2.5 : 1.0;
  const viralBonus = 1 - (Math.min(data.s1, 100) / 100) * 0.25 - (Math.max(0, data.s2) / 100) * 0.15;
  const realisticCacLimit = Math.max(50, baseRealisticCac * brandMultiplier * viralBonus);

  const maxSalesFromBudget = Math.round((marketingBudget * 1000) / realisticCacLimit);
  const capacityLimit = Math.min(maxSalesFromBudget, maxSalesFromTraffic) || 10;
  const overestimationFactor = statedAnnualVolume / Math.max(1, capacityLimit);

  // Realism Score
  let realismScore = 100;
  if (overestimationFactor > 1) {
    realismScore = Math.max(10, Math.round(100 - Math.log2(overestimationFactor) * 20));
  }
  if (isNewBrand && marketingBudget < 150) {
    realismScore = Math.max(5, realismScore - 20);
  }
  if (maxSalesFromTraffic < statedAnnualVolume * 0.5) {
    realismScore = Math.max(5, realismScore - 15);
  }

  // Bidirectional state synchronization to automatically reshape the Factor Lily and SSI score!
  useEffect(() => {
    if (!setData || !autoSync) return;

    const calculatedSom = Number(((statedAnnualVolume * pricePerUnit) / 1000000).toFixed(2));
    const calculatedE2 = Number((pricePerUnit / Math.max(1, competitorPrice)).toFixed(2));
    
    // Scale the main LTV/CAC ratio (R2) proportional to realism score!
    const baseR2 = 5.0; // Moderate target
    const calculatedR2 = Number(Math.max(0.5, Math.min(15.0, baseR2 * (realismScore / 100))).toFixed(2));

    // Update parent only if values differ materially, avoiding loops
    if (
      Math.abs(data.som - calculatedSom) > 0.05 ||
      Math.abs(data.e2 - calculatedE2) > 0.05 ||
      Math.abs(data.r2 - calculatedR2) > 0.1
    ) {
      lastSentToParentRef.current = {
        som: calculatedSom,
        e2: calculatedE2,
        r2: calculatedR2
      };
      
      setData(prev => ({
        ...prev,
        som: calculatedSom,
        e2: calculatedE2,
        r2: calculatedR2,
      }));
    }
  }, [statedAnnualVolume, pricePerUnit, competitorPrice, realismScore, autoSync, setData]);

  // 3. Generate Monthly Forecast Curves (12 months)
  const generateMonthlyData = () => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => {
      const avgMonthlyTarget = statedAnnualVolume / 12;
      const studentVolume = avgMonthlyTarget * (0.6 + (m - 1) * 0.08);

      const sigmoid = 1 / (1 + Math.exp(-0.6 * (m - 5)));
      const aiMaxMonthly = Math.min(statedAnnualVolume, capacityLimit) / 12;
      let aiVolume = aiMaxMonthly * sigmoid * 1.3;
      
      if (isNewBrand && m <= 3) {
        aiVolume *= 0.35;
      }

      return {
        month: m,
        student: Math.round(studentVolume),
        ai: Math.round(aiVolume),
      };
    });
  };

  const monthlyForecast = generateMonthlyData();

  // 4. GENERATE DETAILED DAILY SIMULATION (30 days of typical month)
  // Explains "every day is different"
  const generateDailySales = () => {
    const days = Array.from({ length: 30 }, (_, idx) => idx + 1);
    
    return days.map(d => {
      const dayOfWeek = d % 7; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun (let's assume day 1 is Monday)
      let multiplier = 1.0;
      
      if (demandProfile === 'weekend') {
        if (dayOfWeek === 6 || dayOfWeek === 0) multiplier = 2.5; // Weekend peak
        else if (dayOfWeek === 5) multiplier = 1.3; // Fri build-up
        else multiplier = 0.4; // Low Mon-Thu
      } else if (demandProfile === 'weekday') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) multiplier = 1.3; // High Mon-Fri
        else multiplier = 0.15; // Low weekends
      } else if (demandProfile === 'spikes') {
        if (dayOfWeek === 3 || dayOfWeek === 6) multiplier = 4.0; // Specific high deal days
        else multiplier = 0.15;
      } else {
        multiplier = 1.0; // Flat base
      }

      // Add deterministic white noise based on Day ID to keep slider smooth but chaotic
      const noise = 0.75 + Math.abs(Math.sin(d * 143.256)) * 0.5; // Range [0.75, 1.25]
      let val = dailyAverage * multiplier * noise;

      // Zero-days check
      const zeroThreshold = zeroDaysPercent / 100;
      const randomTrigger = Math.abs(Math.sin(d * 991.543)); // deterministic hash
      if (randomTrigger < zeroThreshold) {
        val = 0;
      }

      return {
        day: d,
        dayOfWeek: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dayOfWeek],
        isWeekend: dayOfWeek === 6 || dayOfWeek === 0,
        value: Number(val.toFixed(1))
      };
    });
  };

  const dailySalesData = generateDailySales();
  const maxDailyValue = Math.max(...dailySalesData.map(d => d.value), 5);
  const totalSimulatedMonthSales = Math.round(dailySalesData.reduce((acc, cur) => acc + cur.value, 0));

  // Graph plotting coordinates helper
  const svgWidth = 500;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 55 };
  
  const plotW = svgWidth - padding.left - padding.right;
  const plotH = svgHeight - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...monthlyForecast.map(d => d.student),
    ...monthlyForecast.map(d => d.ai),
    100
  );

  const getX = (m: number) => padding.left + ((m - 1) / 11) * plotW;
  const getY = (val: number) => padding.top + plotH - (val / maxVal) * plotH;

  const studentPath = monthlyForecast.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.month)} ${getY(d.student)}`).join(' ');
  const aiPath = monthlyForecast.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.month)} ${getY(d.ai)}`).join(' ');

  // Verdict content based on score
  const getVerdict = () => {
    if (realismScore >= 80) {
      return {
        title: '✅ Прогноз реалистичен!',
        color: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20',
        textColor: 'text-emerald-200',
        desc: 'Студент заложил абсолютно адекватный план продаж. Объем сбыта полностью обеспечен рекламным бюджетом, достаточным объемом веб-трафика и разумным расчетом стоимости привлечения клиента (CAC). Такой стартап не прогорит на старте из-за отсутствия клиентов.',
        action: 'Защита: Можно смело использовать данные цифры в итоговой финансовой модели и презентации перед инвесторами.'
      };
    } else if (realismScore >= 50) {
      return {
        title: '⚠️ Умеренный оптимизм (Требует внимания)',
        color: 'text-amber-400 bg-amber-950/20 border-amber-500/20',
        textColor: 'text-amber-200',
        desc: `План продаж завышен примерно в ${overestimationFactor.toFixed(1)} раз относительно текущих лимитов маркетинга. Так как новую компанию никто не знает, вам потребуется либо увеличить годовой бюджет на рекламу до ${(realisticCacLimit * statedAnnualVolume / 1000).toFixed(0)} тыс. руб., либо значительно повысить конверсию сайта.`,
        action: 'Рекомендация: Попробуйте снизить плановый объем продаж на 20-30% или заложить дополнительный бюджет на продвижение.'
      };
    } else {
      return {
        title: '🔴 Критический отрыв от реальности!',
        color: 'text-rose-400 bg-rose-950/25 border-rose-500/30',
        textColor: 'text-rose-200',
        desc: `План продаж завышен в ${overestimationFactor.toFixed(0)} раз! Студент совершает классическую ошибку: планирует продать ${statedAnnualVolume.toLocaleString()} ${unit} при рекламном бюджете всего ${marketingBudget} тыс. руб. При таком бюджете реальный объем привлечения составит не более ${maxSalesFromBudget} покупателей. Ваша фирма абсолютно неизвестна на рынке, органического трафика без рекламы не будет.`,
        action: 'Решение: Безжалостно срезайте плановые показатели объема продаж (шт, кг, м²) до реалистичных лимитов воронки, либо ищите крупного инвестора на миллионные рекламные кампании.'
      };
    }
  };

  const verdict = getVerdict();

  // Dynamic step helper for better slide left range (wiggle room)
  const getAnnualStep = () => {
    if (statedAnnualVolume <= 50) return 1;
    if (statedAnnualVolume <= 500) return 5;
    if (statedAnnualVolume <= 2000) return 50;
    if (statedAnnualVolume <= 10000) return 100;
    return 500;
  };

  const getDailyStep = () => {
    if (dailyAverage <= 5) return 0.1;
    if (dailyAverage <= 30) return 0.5;
    return 1;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/70 to-slate-50 border border-indigo-100 text-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden mt-8">
      {/* Glow background decoration */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-100/60 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>Педагогический тренажер-верификатор</span>
          </div>
          <h3 className="font-display font-black text-slate-900 text-xl md:text-2xl mt-1 tracking-tight">
            Интерактивный валидатор реалистичности объема продаж
          </h3>
          <p className="text-xs text-slate-650 mt-1 max-w-2xl leading-relaxed">
            Большинство стартаперов заведомо преувеличивают плановый сбыт. Ткните пальцем в реальность: новая фирма неизвестна рынку, рекламный бюджет ограничен, а продажи распределяются неравномерно по дням.
          </p>
        </div>

        {/* Realism Score Badge */}
        <div className="flex items-center gap-3 bg-white border border-indigo-100 px-4 py-3 rounded-2xl shrink-0 shadow-sm">
          <div className="text-right">
            <span className="text-[10px] text-slate-550 block font-bold uppercase">Индекс Реалистичности</span>
            <span className="text-xs text-slate-500 font-mono">Sales Realism Index</span>
          </div>
          <div className="font-mono text-3xl font-black flex items-baseline gap-0.5" 
               style={{ color: realismScore > 75 ? '#047857' : realismScore > 45 ? '#d97706' : '#be123c' }}>
            <span>{realismScore}</span>
            <span className="text-sm opacity-60">%</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Sliders and fields (Left side - 5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between border-b border-indigo-150 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Параметры сбыта</span>
            </h4>
            
            {/* Input Mode Toggle */}
            <div className="flex gap-1 bg-slate-200/60 p-1 rounded-lg border border-slate-300/40">
              <button
                type="button"
                onClick={() => setInputMode('daily')}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                  inputMode === 'daily'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                В день
              </button>
              <button
                type="button"
                onClick={() => setInputMode('annual')}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                  inputMode === 'annual'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                В год
              </button>
            </div>
          </div>

          {/* TWO-WAY SSI SYNC TOGGLE */}
          <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${autoSync ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100 text-slate-500'}`}>
                {autoSync ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Связь с Лилией Факторов и SSI</span>
                <span className="text-[10px] text-slate-550 block">Изменения на лету меняют главный лепесток R и SOM</span>
              </div>
            </div>
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                autoSync 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {autoSync ? 'АКТИВНА' : 'ПЕСОЧНИЦА'}
            </button>
          </div>

          {/* Unit selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-550 block">Единица измерения продаж</label>
            <div className="flex flex-wrap gap-1.5">
              {(['шт.', 'ед.', 'кг', 'м²', 'тн', 'л', 'услуг'] as MeasurementUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    unit === u
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC SCALE WITH MASSIVE WIGGLE ROOM TO THE LEFT */}
          {inputMode === 'daily' ? (
            /* DAILY SALES INPUT (Min starting at 0.1 for very small startups) */
            <div className="space-y-1.5 bg-white/60 p-4 rounded-xl border border-indigo-100/20 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Средний сбыт в день (план)</span>
                  <span className="text-[10px] text-slate-500">Запас хода влево открыт полностью!</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1000"
                    value={dailyAverage}
                    onChange={(e) => handleDailyAverageChange(Math.max(0, Number(e.target.value)))}
                    className="w-20 bg-white border border-slate-200 rounded text-right py-0.5 px-2 text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">{unit}/день</span>
                </div>
              </div>
              <input
                type="range"
                min="0.1"
                max="150"
                step={getDailyStep()}
                value={dailyAverage}
                onChange={(e) => handleDailyAverageChange(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg cursor-ew-resize mt-2"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>0.1 (Малый бизнес)</span>
                <span>30</span>
                <span>75</span>
                <span>150+ {unit}</span>
              </div>
              <div className="text-[10px] text-indigo-700 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-indigo-100/30 mt-2 flex justify-between">
                <span>Экстраполяция в годовой объем:</span>
                <strong className="font-mono">{(dailyAverage * 365).toLocaleString(undefined, {maximumFractionDigits: 0})} {unit}/год</strong>
              </div>
            </div>
          ) : (
            /* ANNUAL SALES INPUT (Highly precise low scale) */
            <div className="space-y-1.5 bg-white/60 p-4 rounded-xl border border-indigo-100/20 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Плановый годовой объем продаж</span>
                  <span className="text-[10px] text-slate-500">Доступен ввод любого малого числа</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="500000"
                    value={statedAnnualVolume}
                    onChange={(e) => handleAnnualVolumeChange(Math.max(1, Number(e.target.value)))}
                    className="w-24 bg-white border border-slate-200 rounded text-right py-0.5 px-2 text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">{unit}</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="20000"
                step={getAnnualStep()}
                value={statedAnnualVolume}
                onChange={(e) => handleAnnualVolumeChange(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg cursor-ew-resize mt-2"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>1 {unit}</span>
                <span>500</span>
                <span>5 000</span>
                <span>20 000+</span>
              </div>
              <div className="text-[10px] text-indigo-700 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-indigo-100/30 mt-2 flex justify-between">
                <span>Рассчитанный сбыт в сутки:</span>
                <strong className="font-mono">{(statedAnnualVolume / 365).toFixed(1)} {unit}/день</strong>
              </div>
            </div>
          )}

          {/* TWO-WAY PRICE PAIRING: OUR PRICE AND COMPETITOR PRICE */}
          <div className="space-y-4 bg-white/50 p-4 rounded-xl border border-indigo-100/20 shadow-xs">
            {/* Our Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800">Наша средняя цена за 1 {unit}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="500000"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(Math.max(1, Number(e.target.value)))}
                    className="w-20 bg-white border border-slate-200 rounded py-0.5 px-1.5 text-xs text-right text-emerald-700 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">руб.</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="25000"
                step={pricePerUnit < 200 ? 5 : 50}
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg cursor-ew-resize"
              />
            </div>

            {/* Competitor Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800">Средняя цена главного конкурента</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="500000"
                    value={competitorPrice}
                    onChange={(e) => setCompetitorPrice(Math.max(1, Number(e.target.value)))}
                    className="w-20 bg-white border border-slate-200 rounded py-0.5 px-1.5 text-xs text-right text-rose-700 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">руб.</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="25000"
                step={competitorPrice < 200 ? 5 : 50}
                value={competitorPrice}
                onChange={(e) => setCompetitorPrice(Number(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg cursor-ew-resize"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
                <span>Пропорция (Цена Наша / Конкурент):</span>
                <strong className={pricePerUnit / competitorPrice > 1 ? 'text-rose-700' : 'text-emerald-700'}>
                  {(pricePerUnit / competitorPrice).toFixed(2)}x
                </strong>
              </div>
            </div>
          </div>

          {/* Marketing Budget */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">Годовой рекламный бюджет</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={marketingBudget}
                  onChange={(e) => setMarketingBudget(Math.max(0, Number(e.target.value)))}
                  className="w-20 bg-white border border-slate-200 rounded py-0.5 px-1.5 text-xs text-right text-amber-700 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">тыс. р.</span>
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="50"
              value={marketingBudget}
              onChange={(e) => setMarketingBudget(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-ew-resize"
            />
          </div>

          {/* Site Traffic & Conversion */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 bg-white/50 p-3 rounded-xl border border-indigo-100/20 shadow-xs">
              <span className="text-[10px] text-slate-550 font-bold block uppercase">Посетителей сайта / год</span>
              <input
                type="number"
                value={siteTraffic}
                onChange={(e) => setSiteTraffic(Math.max(10, Number(e.target.value)))}
                className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-800 font-mono mt-1"
              />
            </div>
            <div className="space-y-1 bg-white/50 p-3 rounded-xl border border-indigo-100/20 shadow-xs">
              <span className="text-[10px] text-slate-550 font-bold block uppercase">Конверсия воронки (%)</span>
              <input
                type="number"
                step="0.1"
                value={funnelConversion}
                onChange={(e) => setFunnelConversion(Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-800 font-mono mt-1"
              />
            </div>
          </div>

          {/* Trust awareness checkbox */}
          <div className="bg-indigo-50/50 border border-indigo-100/60 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-xs font-bold text-indigo-900 block">Новая неизвестная компания?</span>
              <span className="text-[10px] text-slate-550 block mt-0.5">Включает жесткий временной лаг доверия в первые 3 месяца</span>
            </div>
            <input
              type="checkbox"
              checked={isNewBrand}
              onChange={(e) => setIsNewBrand(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 bg-white cursor-pointer"
            />
          </div>

        </div>

        {/* Beautiful Live Chart & Verdict (Right side - 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* SVG D3-like Monthly Chart */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex-1 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>Разгон продаж по месяцам ({unit})</span>
              </span>
              <div className="flex items-center gap-3 text-[9px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
                  <span className="text-rose-700 font-semibold">План</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
                  <span className="text-emerald-700 font-semibold">AI-Реалистичный</span>
                </span>
              </div>
            </div>

            {/* SVG Plot */}
            <div className="w-full h-[150px] relative mt-1">
              <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                {/* Background Grid Lines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                  const yVal = padding.top + plotH * ratio;
                  return (
                    <line
                      key={idx}
                      x1={padding.left}
                      y1={yVal}
                      x2={padding.left + plotW}
                      y2={yVal}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  );
                })}

                {/* Y-axis Labels */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                  const yVal = padding.top + plotH - ratio * plotH;
                  const amt = Math.round(maxVal * ratio);
                  return (
                    <text
                      key={idx}
                      x={padding.left - 8}
                      y={yVal + 3}
                      fill="#475569"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {amt}
                    </text>
                  );
                })}

                {/* Paths */}
                <path
                  d={studentPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                />
                <path
                  d={aiPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                {/* X-axis labels */}
                {monthlyForecast.map((d) => (
                  <text
                    key={d.month}
                    x={getX(d.month)}
                    y={svgHeight - padding.bottom + 15}
                    fill="#475569"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    м{d.month}
                  </text>
                ))}
              </svg>
            </div>

            {/* Calculations recap bar */}
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200 text-center font-mono text-[9px]">
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                <span className="text-slate-500 block text-[7px] uppercase">Плановый годовой оборот</span>
                <span className="font-extrabold text-slate-800">{calculatedStatedRevenue.toFixed(2)} млн руб</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                <span className="text-slate-500 block text-[7px] uppercase">Заявленный CAC</span>
                <span className="font-extrabold text-slate-800">{impliedCac.toFixed(0)} руб (Реальный: {realisticCacLimit.toFixed(0)} руб)</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                <span className="text-slate-500 block text-[7px] uppercase">Реалистичный лимит объема</span>
                <span className="font-extrabold text-slate-800">{capacityLimit.toLocaleString()} {unit}</span>
              </div>
            </div>
          </div>

          {/* Verdict Box */}
          <div className={`p-5 rounded-2xl border ${verdict.color} flex flex-col justify-between space-y-4 shadow-sm`}>
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <span>{verdict.title}</span>
              </h4>
              <p className={`text-xs ${verdict.textColor} leading-relaxed mt-2`}>
                {verdict.desc}
              </p>
            </div>
            <div className="bg-white/40 p-3 rounded-xl border border-white/20 text-xs text-slate-800">
              <span className="font-bold block text-slate-900">Рекомендация по защите:</span>
              <span className="mt-1 block leading-normal">{verdict.action}</span>
            </div>
          </div>

        </div>
      </div>

      {/* NEW SECTION: EDUCATIONAL DAILY SALES SIMULATOR */}
      {/* Specifically answers: "может в ручную в день ввести , но каждый отличается от другого дня??? подумай" */}
      <div className="mt-8 border-t border-indigo-100/60 pt-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Микромоделирование сбытовой реальности</span>
            </span>
            <h4 className="font-display font-extrabold text-slate-900 text-base mt-1">
              Почему планировать «вручную каждый день» не имеет смысла?
            </h4>
            <p className="text-xs text-slate-650 mt-0.5 max-w-3xl leading-relaxed">
              В реальности продажи никогда не идут ровной нитью. Спрос хаотичен, зависит от будней/выходных, имеет пустые дни (Zero-Sales days) и случайные пики. Наш симулятор генерирует случайное распределение вашего плана на 30 дней, чтобы вы увидели нестыковку с реальностью.
            </p>
          </div>

          {/* Demand Profile selector */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="bg-slate-200/60 p-1.5 rounded-xl border border-slate-300/40 flex items-center gap-1">
              <span className="text-[10px] text-slate-600 font-bold px-1.5 uppercase">Колебания:</span>
              <select
                value={demandProfile}
                onChange={(e) => setDemandProfile(e.target.value as DemandProfile)}
                className="bg-white text-xs text-slate-800 font-bold rounded px-2 py-1 outline-none border border-slate-200 cursor-pointer"
              >
                <option value="flat">Flat (Равномерный с шумом)</option>
                <option value="weekend">Retail (Пик по выходным)</option>
                <option value="weekday">B2B (Пик по будням)</option>
                <option value="spikes">Spikes (Крупные разовые сделки)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Daily Control Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/60 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-800 block">Процент дней абсолютно БЕЗ продаж</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Для нового бренда в первые месяцы норма: 50% - 80% сухих дней!</span>
            </div>
            <div className="w-40 shrink-0 space-y-1">
              <div className="flex justify-between font-mono text-xs font-black text-indigo-700">
                <span>{zeroDaysPercent}%</span>
                <span className="text-[9px] text-slate-500">дней с 0 шт.</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={zeroDaysPercent}
                onChange={(e) => setZeroDaysPercent(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-200 rounded-lg cursor-ew-resize"
              />
            </div>
          </div>

          <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/60 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-800 block">Результат за типичный месяц</span>
              <span className="text-[10px] text-slate-550 mt-0.5 block">Реальный накопленный итог с учетом пустых дней и спадов:</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-550 block uppercase font-mono">Сумма за 30 дней:</span>
              <span className="font-mono text-2xl font-black text-emerald-700">
                {totalSimulatedMonthSales.toLocaleString()} {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Bar Grid representing the 30 simulated days */}
        <div className="bg-white/80 p-5 rounded-2xl border border-indigo-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-600 border-b border-indigo-100/60 pb-2">
            <span className="flex items-center gap-1.5 font-bold">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Календарный профиль продаж (30 дней реальной работы):</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Высота полосы = объем продаж в день
            </span>
          </div>

          {/* Bars representation */}
          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-30 gap-1.5 h-32 items-end pt-4 px-1">
            {dailySalesData.map((d) => {
              const pct = maxDailyValue > 0 ? (d.value / maxDailyValue) * 100 : 0;
              const isZero = d.value === 0;

              return (
                <div key={d.day} className="group relative flex flex-col items-center h-full cursor-help">
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 absolute bottom-full mb-1.5 bg-slate-900 text-white border border-slate-700 text-[10px] py-1 px-2 rounded-lg font-mono whitespace-nowrap z-30 transition-all shadow-xl">
                    <div className="font-bold">День {d.day} ({d.dayOfWeek})</div>
                    <div className="text-indigo-400">Сбыт: {d.value} {unit}</div>
                    <div className="text-[9px] text-slate-300">Оборот: {(d.value * pricePerUnit).toLocaleString()} руб.</div>
                  </div>

                  {/* The bar element */}
                  <div className="w-full h-full flex items-end bg-slate-100 rounded">
                    <div 
                      style={{ height: `${pct}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${
                        isZero 
                          ? 'bg-rose-100/40 border-b border-rose-500/30' 
                          : d.isWeekend 
                            ? 'bg-indigo-500 hover:bg-indigo-400' 
                            : 'bg-emerald-500 hover:bg-emerald-400'
                      }`}
                    />
                  </div>

                  {/* Day label */}
                  <span className={`text-[8px] font-mono mt-1 text-center scale-90 ${d.isWeekend ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                    д{d.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Micro-learning footnote */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-indigo-100/60 text-[11px] leading-relaxed text-slate-600">
            <div className="flex gap-2 items-start">
              <span className="text-indigo-600 text-lg">💡</span>
              <p>
                <strong>Неравномерность:</strong> Видите, как некоторые дни уходят «в небо», а другие пустуют? Потребительское поведение никогда не бывает плоским. Заводя годовой план, студент предполагает стабильность, которой не существует.
              </p>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-emerald-400 text-lg">🔍</span>
              <p>
                <strong>Опасность пустых дней:</strong> Новый бренд на старте имеет конверсию в 10 раз ниже расчетной. Если у вас 3 дня подряд нет продаж — это не катастрофа, это норма. Но студент впадает в панику, начинает панически жечь бюджет, и стартап закрывается.
              </p>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-amber-400 text-lg">🎓</span>
              <p>
                <strong>Педагогический вывод:</strong> На защите диплома всегда показывайте не только плоский годовой план, но и этот <strong>календарный профиль продаж</strong>. Это докажет комиссии, что вы понимаете реальность полевой работы!
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
