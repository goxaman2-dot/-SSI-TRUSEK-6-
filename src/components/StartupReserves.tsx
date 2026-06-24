import React, { useState, useEffect } from 'react';
import { StartupData } from '../types';
import { calculateSubfactors } from '../utils';
import { 
  TrendingUp, 
  Sparkles, 
  Settings2, 
  PiggyBank, 
  DollarSign, 
  ShieldCheck, 
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react';

interface StartupReservesProps {
  data: StartupData;
  resultsColor?: string;
}

type StrategyPreset = 'minimal' | 'optimum' | 'maximum' | 'custom';

export function StartupReserves({ data, resultsColor = '#6366f1' }: StartupReservesProps) {
  const baselineRevenue = data.som || 0;
  const isDemoMode = baselineRevenue === 0;
  const activeRevenue = isDemoMode ? 100 : baselineRevenue; // Fallback to 100M if 0

  // State for strategy preset
  const [strategy, setStrategy] = useState<StrategyPreset>('optimum');

  // Sliders for user interactive optimization depth
  const [cogsOptim, setCogsOptim] = useState<number>(15); // %
  const [cacOptim, setCacOptim] = useState<number>(20);   // %
  const [opexOptim, setOpexOptim] = useState<number>(12); // %
  const [pricePremium, setPricePremium] = useState<number>(12); // %

  // Update sliders based on chosen preset
  useEffect(() => {
    if (strategy === 'minimal') {
      setCogsOptim(5);
      setCacOptim(10);
      setOpexOptim(5);
      setPricePremium(5);
    } else if (strategy === 'optimum') {
      setCogsOptim(15);
      setCacOptim(20);
      setOpexOptim(12);
      setPricePremium(12);
    } else if (strategy === 'maximum') {
      setCogsOptim(35);
      setCacOptim(40);
      setOpexOptim(25);
      setPricePremium(20);
    }
  }, [strategy]);

  // If user modifies slider directly, switch strategy to 'custom'
  const handleSliderChange = (type: 'cogs' | 'cac' | 'opex' | 'ltv', val: number) => {
    setStrategy('custom');
    if (type === 'cogs') setCogsOptim(val);
    if (type === 'cac') setCacOptim(val);
    if (type === 'opex') setOpexOptim(val);
    if (type === 'ltv') setPricePremium(val);
  };

  // Base scores of the startup
  const sub = calculateSubfactors(data);
  const baseT = sub.T;
  const baseU = sub.U;
  const baseR = sub.R;
  const baseS = sub.S;
  const baseE = sub.E;
  const baseK = sub.K;

  // Optimized scores after using reserves
  const optimT = Math.min(10, baseT + (opexOptim / 30) * (10 - baseT) * 0.45);
  const optimU = Math.min(10, baseU + (pricePremium / 25) * (10 - baseU) * 0.5);
  const optimR = Math.min(10, baseR + (cogsOptim / 40) * (10 - baseR) * 0.35 + (pricePremium / 25) * (10 - baseR) * 0.25);
  const optimS = Math.min(10, baseS + (cacOptim / 50) * (10 - baseS) * 0.4);
  const optimE = Math.min(10, baseE + (pricePremium / 25) * (10 - baseE) * 0.2);
  const optimK = Math.min(10, baseK + (cogsOptim / 40) * (10 - baseK) * 0.35 + (cacOptim / 50) * (10 - baseK) * 0.2 + (opexOptim / 30) * (10 - baseK) * 0.25);

  // Compute base budgets (as fractions of revenue SOM)
  const baseCogsRatio = 0.45 - (baseR / 10) * 0.25;
  const baseCogsValue = activeRevenue * baseCogsRatio;

  const baseCacRatio = 0.35 - (baseK / 10) * 0.20;
  const baseCacValue = activeRevenue * baseCacRatio;

  const baseOpexRatio = 0.25 - (baseS / 10) * 0.15;
  const baseOpexValue = activeRevenue * baseOpexRatio;

  const basePremiumRatio = 0.25 - (baseU / 10) * 0.15;
  const basePremiumValue = activeRevenue * basePremiumRatio;

  // Reserves calculation in Million Rubles
  const cogsSaved = baseCogsValue * (cogsOptim / 100);
  const cacSaved = baseCacValue * (cacOptim / 100);
  const opexSaved = baseOpexValue * (opexOptim / 100);
  const premiumAdded = basePremiumValue * (pricePremium / 100);

  const totalReservesReleased = cogsSaved + cacSaved + opexSaved + premiumAdded;
  const currentProfitabilityIncrease = (totalReservesReleased / activeRevenue) * 100;

  // Base LTV based on retention/loyalty score R (higher baseR means higher base LTV) and price premium slider
  const dynamicLtv = 1.8 * (1 + (baseR / 10) * 1.5) * (1 + pricePremium / 100);
  
  // Base CAC based on marketing score K (higher baseK means lower base CAC)
  const dynamicCacBase = 3.0 - (baseK / 10) * 1.5;
  
  // Current optimized CAC after applying the user's selected CAC reduction (minimizing CAC)
  const dynamicCacCurrent = Math.max(0.4, dynamicCacBase * (1 - cacOptim / 100));
  
  // Current LTV/CAC ratio
  const currentLtvCacRatio = dynamicLtv / dynamicCacCurrent;

  // Let's generate points for the curve showing LTV/CAC vs. CAC reduction percentage (from 0% to 60%)
  const curvePoints = [0, 10, 20, 30, 40, 50, 60].map(x => {
    const cacAtX = Math.max(0.4, dynamicCacBase * (1 - x / 100));
    const ratioAtX = dynamicLtv / cacAtX;
    return { x, ratio: ratioAtX };
  });

  // SVG dimensions for the chart
  const chartWidth = 240;
  const chartHeight = 160;
  const chartPadding = { left: 35, right: 15, top: 15, bottom: 25 };

  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Maximum Y ratio to plot (let's cap at 6.0 for clean visual scale)
  const maxY = 6.0;

  const getCanvasX = (percentX: number) => {
    return chartPadding.left + (percentX / 60) * plotWidth;
  };

  const getCanvasY = (ratioY: number) => {
    const clampedY = Math.max(0, Math.min(maxY, ratioY));
    return chartPadding.top + plotHeight - (clampedY / maxY) * plotHeight;
  };

  const pathD = curvePoints.reduce((acc, pt, idx) => {
    const cx_val = getCanvasX(pt.x);
    const cy_val = getCanvasY(pt.ratio);
    return idx === 0 ? `M ${cx_val} ${cy_val}` : `${acc} L ${cx_val} ${cy_val}`;
  }, '');

  const areaD = `${pathD} L ${getCanvasX(60)} ${getCanvasY(0)} L ${getCanvasX(0)} ${getCanvasY(0)} Z`;

  const yMax = getCanvasY(maxY);
  const yLine3 = getCanvasY(3.0);
  const yLine1_5 = getCanvasY(1.5);
  const yZero = getCanvasY(0);

  const currentPtX = getCanvasX(cacOptim);
  const currentPtY = getCanvasY(currentLtvCacRatio);

  // --- FINANCIAL ENGINE (NPV, IRR, BEP, ROA, ROE) ---
  const baseInvestment = Math.max(5, activeRevenue * (0.8 - (baseT / 20))); // Capital investment required
  const wacc = 0.15 + (10 - baseE) * 0.015; // Discount rate (WACC) ranges 15% to 30% based on emotional affection safety
  const growthRate = 0.12 + (baseS / 10) * 0.15 + (baseU / 10) * 0.13; // 12% to 40% growth based on virality and value proposition

  function calculateFinancials(isOptim: boolean) {
    const cogsRate = isOptim ? baseCogsRatio * (1 - cogsOptim / 100) : baseCogsRatio;
    const cacRate = isOptim ? baseCacRatio * (1 - cacOptim / 100) : baseCacRatio;
    const opexRate = isOptim ? baseOpexRatio * (1 - opexOptim / 100) : baseOpexRatio;
    const revPremium = isOptim ? (1 + pricePremium / 100) : 1.0;

    const years = [];
    let cumCashFlow = -baseInvestment;
    let cumDiscountedCashFlow = -baseInvestment;

    // Year 0
    years.push({
      year: 0,
      revenue: 0,
      cogs: 0,
      opex: 0,
      cac: 0,
      netProfit: 0,
      cashFlow: -baseInvestment,
      cumCashFlow: -baseInvestment,
      dcf: -baseInvestment,
      npv: -baseInvestment,
      margin: 0,
    });

    for (let y = 1; y <= 5; y++) {
      const r = activeRevenue * revPremium * Math.pow(1 + growthRate, y - 1);
      const cogs = r * cogsRate;
      const opex = baseOpexValue * (1 - (isOptim ? opexOptim / 100 : 0)) * Math.pow(1.04, y - 1);
      const cac = baseCacValue * (1 - (isOptim ? cacOptim / 100 : 0)) * Math.pow(1 + growthRate * 0.4, y - 1);
      
      const netProfit = r - cogs - opex - cac;
      const cashFlow = netProfit;
      cumCashFlow += cashFlow;
      
      const dcf = cashFlow / Math.pow(1 + wacc, y);
      cumDiscountedCashFlow += dcf;

      years.push({
        year: y,
        revenue: r,
        cogs,
        opex,
        cac,
        netProfit,
        cashFlow,
        cumCashFlow,
        dcf,
        npv: cumDiscountedCashFlow,
        margin: r > 0 ? (netProfit / r) * 100 : 0,
      });
    }
    return years;
  }

  const financialsBaseline = calculateFinancials(false);
  const financialsOptimized = calculateFinancials(true);

  // IRR solver helper
  function calculateIRR(cashFlows: number[]): number {
    let low = -0.99;
    let high = 4.0; // Max 400%
    
    const npvAtRate = (rate: number) => {
      return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
    };

    const npvLow = npvAtRate(low);
    const npvHigh = npvAtRate(high);
    if (npvLow * npvHigh > 0) {
      return npvLow > 0 ? 4.0 : -0.99;
    }

    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      const npvMid = npvAtRate(mid);
      if (Math.abs(npvMid) < 0.0001) {
        return mid;
      }
      if (npvMid * npvAtRate(low) < 0) {
        high = mid;
      } else {
        low = mid;
      }
    }
    return (low + high) / 2;
  }

  const irrBaseline = calculateIRR(financialsBaseline.map(y => y.cashFlow));
  const irrOptimized = calculateIRR(financialsOptimized.map(y => y.cashFlow));

  // Payback Periods
  function calculatePayback(yearsData: any[]): number {
    if (yearsData[0].npv >= 0) return 0;
    for (let i = 0; i < yearsData.length - 1; i++) {
      const y1 = yearsData[i];
      const y2 = yearsData[i+1];
      if (y1.npv < 0 && y2.npv >= 0) {
        const fraction = -y1.npv / (y2.npv - y1.npv);
        return y1.year + fraction;
      }
    }
    return 9.9; // Over 5 years
  }

  const paybackBaseline = calculatePayback(financialsBaseline);
  const paybackOptimized = calculatePayback(financialsOptimized);

  // Profitability Index (PI)
  const piBaseline = 1 + (financialsBaseline[5].npv / baseInvestment);
  const piOptimized = 1 + (financialsOptimized[5].npv / baseInvestment);

  // ROA and ROE based on Year 3 (standard mid-horizon of a startup)
  // Assets: investment + 25% growth base
  const assetBase = baseInvestment * 1.25;
  const roaBaseline = (financialsBaseline[3].netProfit / assetBase) * 100;
  const roaOptimized = (financialsOptimized[3].netProfit / assetBase) * 100;

  // Equity = 60% of Assets (40% liabilities)
  const roeBaseline = (financialsBaseline[3].netProfit / (assetBase * 0.6)) * 100;
  const roeOptimized = (financialsOptimized[3].netProfit / (assetBase * 0.6)) * 100;

  // Break-Even Point logic (for Year 1 as representative baseline)
  function getBreakEven(isOptim: boolean) {
    const cogsRate = isOptim ? baseCogsRatio * (1 - cogsOptim / 100) : baseCogsRatio;
    const cacRate = isOptim ? baseCacRatio * (1 - cacOptim / 100) : baseCacRatio;
    const opexRate = isOptim ? baseOpexRatio * (1 - opexOptim / 100) : baseOpexRatio;
    const revPremium = isOptim ? (1 + pricePremium / 100) : 1.0;

    const fc = baseOpexValue * (1 - (isOptim ? opexOptim / 100 : 0)) + baseCacValue * (1 - (isOptim ? cacOptim / 100 : 0)) * 0.3;
    const vc = activeRevenue * revPremium * cogsRate + baseCacValue * (1 - (isOptim ? cacOptim / 100 : 0)) * 0.7;
    const vcr = vc / (activeRevenue * revPremium);
    const cmr = 1 - vcr;
    const bep = cmr > 0.05 ? fc / cmr : activeRevenue * 2;
    return { bep, fc, vcr, cmr };
  }

  const bepBaseline = getBreakEven(false);
  const bepOptimized = getBreakEven(true);

  // --- GRAPH PARAMETERS AND SCALES ---
  
  // 1. NPV Chart Scales
  const npvPadding = { left: 45, right: 15, top: 20, bottom: 25 };
  const npvPlotW = 340 - npvPadding.left - npvPadding.right;
  const npvPlotH = 180 - npvPadding.top - npvPadding.bottom;
  const npvMinY = -baseInvestment;
  const npvMaxY = Math.max(10, financialsBaseline[5].npv, financialsOptimized[5].npv) * 1.15;

  const getNpvX = (yr: number) => npvPadding.left + (yr / 5) * npvPlotW;
  const getNpvY = (val: number) => {
    const scale = (val - npvMinY) / (npvMaxY - npvMinY);
    return npvPadding.top + npvPlotH - scale * npvPlotH;
  };

  const npvBaseD = financialsBaseline.reduce((acc, pt, i) => {
    const x = getNpvX(pt.year);
    const y = getNpvY(pt.npv);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const npvOptimD = financialsOptimized.reduce((acc, pt, i) => {
    const x = getNpvX(pt.year);
    const y = getNpvY(pt.npv);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const npvOptimAreaD = `${npvOptimD} L ${getNpvX(5)} ${getNpvY(npvMinY)} L ${getNpvX(0)} ${getNpvY(npvMinY)} Z`;
  const yZeroNpv = getNpvY(0);

  // 2. Break-Even Chart Scales
  const bepPadding = { left: 45, right: 15, top: 20, bottom: 25 };
  const bepPlotW = 340 - bepPadding.left - bepPadding.right;
  const bepPlotH = 180 - bepPadding.top - bepPadding.bottom;
  const bepMaxX = activeRevenue * 1.5;

  const getBepX = (val: number) => bepPadding.left + (val / bepMaxX) * bepPlotW;
  const getBepY = (val: number) => {
    const clamped = Math.max(0, Math.min(bepMaxX, val));
    return bepPadding.top + bepPlotH - (clamped / bepMaxX) * bepPlotH;
  };

  // 3. Profit & Profitability Chart Scales
  const profPadding = { left: 45, right: 40, top: 20, bottom: 25 };
  const profPlotW = 340 - profPadding.left - profPadding.right;
  const profPlotH = 180 - profPadding.top - profPadding.bottom;

  const profMinY = Math.min(0, financialsBaseline[1].netProfit, financialsOptimized[1].netProfit) * 1.2;
  const profMaxY = Math.max(10, financialsBaseline[5].netProfit, financialsOptimized[5].netProfit) * 1.15;

  const getProfX = (year: number) => profPadding.left + ((year - 1) / 4) * profPlotW;
  const getProfY = (val: number) => {
    const scale = (val - profMinY) / (profMaxY - profMinY);
    return profPadding.top + profPlotH - scale * profPlotH;
  };

  // Profitability % scale (e.g. from -20% to +60%)
  const marginMinY = -20;
  const marginMaxY = 60;
  const getMarginY = (val: number) => {
    const clamped = Math.max(marginMinY, Math.min(marginMaxY, val));
    const scale = (clamped - marginMinY) / (marginMaxY - marginMinY);
    return profPadding.top + profPlotH - scale * profPlotH;
  };

  // Path for margin percentage line (for year 1 to 5)
  const marginLineD = financialsOptimized.filter(p => p.year > 0).reduce((acc, pt, i) => {
    const x = getProfX(pt.year);
    const y = getMarginY(pt.margin);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // SVG parameters for standard 6-petal Lily
  const cx = 150;
  const cy = 150;
  
  const getLogarithmicRadius = (score: number) => {
    const minRadius = 18;
    const maxRadius = 110;
    const logVal = Math.log2(1 + score) / Math.log2(11);
    return minRadius + (maxRadius - minRadius) * logVal;
  };

  const factorKeys = ['T', 'U', 'R', 'S', 'E', 'K'] as const;
  const angles: Record<typeof factorKeys[number], number> = {
    T: -90,
    U: -30,
    R: 30,
    S: 90,
    E: 150,
    K: 210
  };

  const factorColors: Record<typeof factorKeys[number], string> = {
    T: '#a855f7', // purple
    U: '#6366f1', // indigo
    R: '#f43f5e', // rose
    S: '#14b8a6', // teal
    E: '#f59e0b', // amber
    K: '#10b981'  // emerald
  };

  const factorLabels: Record<typeof factorKeys[number], string> = {
    T: 'T Окупаемость',
    U: 'U Ценность',
    R: 'R LTV/Лояльность',
    S: 'S Виральность',
    E: 'E Привязанность',
    K: 'K Маржа'
  };

  // Build beautiful bezier curves for SVG petals
  const makePetalPath = (deg: number, len: number) => {
    const angleRad = (deg * Math.PI) / 180;
    const xTip = cx + Math.cos(angleRad) * len;
    const yTip = cy + Math.sin(angleRad) * len;

    const leftWingRad = ((deg - 22) * Math.PI) / 180;
    const rightWingRad = ((deg + 22) * Math.PI) / 180;

    const xControlLeft = cx + Math.cos(leftWingRad) * len * 0.75;
    const yControlLeft = cy + Math.sin(leftWingRad) * len * 0.75;

    const xControlRight = cx + Math.cos(rightWingRad) * len * 0.75;
    const yControlRight = cy + Math.sin(rightWingRad) * len * 0.75;

    return `M ${cx} ${cy} C ${xControlLeft} ${yControlLeft}, ${xTip} ${yTip}, ${xTip} ${yTip} C ${xTip} ${yTip}, ${xControlRight} ${yControlRight}, ${cx} ${cy} Z`;
  };

  return (
    <div id="startup-reserves-block" className="bg-gradient-to-br from-indigo-50/70 via-purple-50/75 to-slate-50 border border-indigo-100 text-slate-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="font-display font-black text-slate-900 text-lg md:text-2xl tracking-tight">
              Возможные резервы стартапа от АИ Агента
            </h3>
          </div>
          <p className="text-xs text-slate-650 mt-1.5 max-w-3xl font-normal leading-relaxed">
            Симуляционная модель бережливого стартапа. Интерактивная <strong>«Лилия резервов»</strong> отображает исходную формулу индекса SSI и её динамическое расширение за счёт применения резервов. Выберите стратегию и изучите компенсирующие мероприятия.
          </p>
        </div>

        {isDemoMode && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-850 rounded-xl text-[10px] font-bold shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Демо-режим: укажите SOM в анкете</span>
          </div>
        )}
      </div>

      {/* STRATEGY PRESETS GRID WITH FORMULA AND ACTIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-xs text-slate-650 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-700" />
            <span>Выберите стратегию оптимизации:</span>
          </h4>
          <span className="text-[10px] text-slate-500 italic">Нажмите на кнопку, чтобы применить готовый сценарий</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* STRATEGY 1: MINIMAL */}
          <button
            type="button"
            onClick={() => setStrategy('minimal')}
            className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between h-full ${
              strategy === 'minimal'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                  <span>Минимальные риски</span>
                </span>
                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Легко</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                <strong>Формула расчета:</strong> COGS -5%, CAC -10%, OPEX -5%, LTV +5%. Акцент на базовой экономии без изменения внутренних процессов.
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-600">
              <strong className="text-slate-800 block text-[9px] uppercase tracking-wider mb-1">🛡️ Мероприятия (без ухудшения):</strong>
              Согласование оптовых скидок; запуск реферальных программ (K1); перевод мелкого софта на бесплатные лимиты.
            </div>
          </button>

          {/* STRATEGY 2: OPTIMUM */}
          <button
            type="button"
            onClick={() => setStrategy('optimum')}
            className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between h-full ${
              strategy === 'optimum'
                ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-purple-800 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block" />
                  <span>Оптимум (Рекомендуется)</span>
                </span>
                <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Средне</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                <strong>Формула расчета:</strong> COGS -15%, CAC -20%, OPEX -12%, LTV +12%. Сбалансированная интеграция лучших практик автоматизации.
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-600">
              <strong className="text-slate-800 block text-[9px] uppercase tracking-wider mb-1">🛡️ Мероприятия (без ухудшения):</strong>
              Оптимизация деталей по ТРИЗ; Lookalike реклама; интеграция CRM для ОП; расширение гарантии для увеличения цены.
            </div>
          </button>

          {/* STRATEGY 3: MAXIMUM */}
          <button
            type="button"
            onClick={() => setStrategy('maximum')}
            className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between h-full ${
              strategy === 'maximum'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-rose-800 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
                  <span>Максимум (Глубокий реинжиниринг)</span>
                </span>
                <span className="text-[9px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">Трудно</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                <strong>Формула расчета:</strong> COGS -35%, CAC -40%, OPEX -25%, LTV +20%. Полная трансформация юнит-экономики и УТП.
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-600">
              <strong className="text-slate-800 block text-[9px] uppercase tracking-wider mb-1">🛡️ Мероприятия (без ухудшения):</strong>
              Перенос на контрактный завод (OEM); переход на CPA (партнерские продажи); удаленный бэк-офис; смена модели на SaaS.
            </div>
          </button>

        </div>
      </div>

      {/* COMBINED INTERACTIVE ZONE: SLIDERS & DUAL LILY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
        
        {/* Sliders Control Panel (Combined Block Part 1) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-indigo-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h4 className="font-display font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-indigo-700" />
              <span>Тонкая ручная регулировка</span>
            </h4>

            <div className="space-y-3.5 text-xs">
              {/* Slider 1: COGS */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Оптимизация COGS</span>
                  <span className="font-mono font-bold text-rose-700">{cogsOptim}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="40" 
                  value={cogsOptim} 
                  onChange={e => handleSliderChange('cogs', parseInt(e.target.value) || 0)}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* Slider 2: CAC */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Снижение CAC</span>
                  <span className="font-mono font-bold text-amber-700">{cacOptim}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={cacOptim} 
                  onChange={e => handleSliderChange('cac', parseInt(e.target.value) || 0)}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Slider 3: OPEX */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Административный OPEX</span>
                  <span className="font-mono font-bold text-indigo-700">{opexOptim}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  value={opexOptim} 
                  onChange={e => handleSliderChange('opex', parseInt(e.target.value) || 0)}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Slider 4: Price Premium */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Рост ценности LTV</span>
                  <span className="font-mono font-bold text-emerald-700">{pricePremium}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="25" 
                  value={pricePremium} 
                  onChange={e => handleSliderChange('ltv', parseInt(e.target.value) || 0)}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2 items-start text-[10px] text-slate-650 leading-snug">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span className="italic">
              Базовый объем рассчитывается от вашего целевого рынка <strong>SOM ({activeRevenue} млн ₽)</strong>. Если вы хотите применить более агрессивную тактику, переведите ручки вправо.
            </span>
          </div>
        </div>

        {/* RECREATED MAGNIFICENT 6-PETAL LILY OF THE INDEX (Combined Block Part 2) */}
        <div className="lg:col-span-3 bg-white border border-indigo-100 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
          <span className="absolute top-3 left-3 text-[10px] font-bold text-slate-550 uppercase tracking-widest">
            Лилия индекса SSI
          </span>

          {/* Native High-Performance SVG Lily of the Index with 2 states overlay */}
          <div className="w-full h-[220px] flex items-center justify-center mt-3 relative">
            <svg 
              viewBox="0 0 300 300" 
              className="w-full h-full select-none"
            >
              <defs>
                {/* Radial gradient background aura */}
                <radialGradient id="aura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#090d16" stopOpacity={0} />
                </radialGradient>
              </defs>

              {/* Glowing background circle */}
              <circle cx={cx} cy={cy} r={120} fill="url(#aura)" />

              {/* Concentric rings guidelines */}
              {[2.5, 5.0, 7.5, 10.0].map((level, i) => {
                const r = getLogarithmicRadius(level);
                return (
                  <g key={level}>
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={r} 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth={level === 5.0 ? 1.5 : 0.75} 
                      strokeDasharray={level === 5.0 ? "none" : "3,3"} 
                      opacity={level === 5.0 ? 0.75 : 0.4} 
                    />
                    {level === 5.0 && (
                      <text 
                        x={cx + r + 4} 
                        y={cy + 3} 
                        fill="#3b82f6" 
                        fontSize="6px" 
                        fontWeight="bold" 
                        opacity="0.8"
                        textAnchor="start"
                      >
                        SOM Барьер (5.0)
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Axis lines */}
              {factorKeys.map(key => {
                const angleRad = (angles[key] * Math.PI) / 180;
                return (
                  <line
                    key={key}
                    x1={cx}
                    y1={cy}
                    x2={cx + Math.cos(angleRad) * 115}
                    y2={cy + Math.sin(angleRad) * 115}
                    stroke="#1e293b"
                    strokeWidth="0.75"
                    opacity="0.5"
                  />
                );
              })}

              {/* 1. DRAW BASE PETALS (Faint dotted outlines) */}
              {factorKeys.map(key => {
                const score = sub[key];
                const len = getLogarithmicRadius(score);
                const path = makePetalPath(angles[key], len);
                return (
                  <path
                    key={`base-${key}`}
                    d={path}
                    fill="none"
                    stroke={factorColors[key]}
                    strokeWidth="1.2"
                    strokeDasharray="2,3"
                    opacity="0.45"
                  />
                );
              })}

              {/* 2. DRAW OPTIMIZED PETALS (Rich glowing solid fills and outlines) */}
              {factorKeys.map(key => {
                const score = key === 'T' ? optimT 
                            : key === 'U' ? optimU 
                            : key === 'R' ? optimR 
                            : key === 'S' ? optimS 
                            : key === 'E' ? optimE 
                            : optimK;
                const len = getLogarithmicRadius(score);
                const path = makePetalPath(angles[key], len);
                const angleRad = (angles[key] * Math.PI) / 180;
                
                return (
                  <g key={`optim-${key}`}>
                    {/* Glowing colored petal shape */}
                    <path
                      d={path}
                      fill={factorColors[key]}
                      fillOpacity="0.28"
                      stroke={factorColors[key]}
                      strokeWidth="2"
                      className="transition-all duration-500 cursor-pointer"
                    >
                      <title>{`${factorLabels[key]}: Было ${sub[key].toFixed(1)} → Станет ${score.toFixed(1)}`}</title>
                    </path>

                    {/* Glowing tip indicators */}
                    <circle
                      cx={cx + Math.cos(angleRad) * len}
                      cy={cy + Math.sin(angleRad) * len}
                      r="4.5"
                      fill={factorColors[key]}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* Center Core Stamen */}
              <circle cx={cx} cy={cy} r="9" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="4" fill="#ffffff" />
            </svg>
          </div>

          {/* Mini Legend for student clarity */}
          <div className="mt-2 text-[9px] text-slate-650 space-y-1 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-normal">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 border-t-2 border-dashed border-indigo-500 block" />
              <span>Пунктир — Ваш текущий профиль</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded-sm bg-indigo-100 border border-indigo-400 block" />
              <span>Сплошной — Оптимальный профиль</span>
            </div>
          </div>
        </div>

        {/* LTV/CAC VIABILITY DYNAMICS CHART (Combined Block Part 3) */}
        <div className="lg:col-span-3 bg-white border border-indigo-100 rounded-2xl p-5 flex flex-col items-center justify-between relative overflow-hidden shadow-xs">
          <span className="absolute top-3 left-3 text-[10px] font-bold text-slate-550 uppercase tracking-widest">
            Динамика LTV/CAC & Жизнь
          </span>

          <div className="w-full mt-6 space-y-3">
            {/* Real-time Indicator */}
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-600 font-sans">Отношение LTV/CAC:</span>
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                currentLtvCacRatio >= 3.0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                currentLtvCacRatio >= 1.5 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {currentLtvCacRatio.toFixed(2)}x
              </span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="w-full h-[150px] flex items-center justify-center relative bg-slate-50 rounded-xl border border-slate-200 p-1">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full select-none overflow-visible"
              >
                <defs>
                  {/* Grid lines pattern or gradients */}
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {/* Shaded Background Viability Zones */}
                <rect x={chartPadding.left} y={yMax} width={plotWidth} height={yLine3 - yMax} fill="#10b981" fillOpacity="0.04" />
                <rect x={chartPadding.left} y={yLine3} width={plotWidth} height={yLine1_5 - yLine3} fill="#f59e0b" fillOpacity="0.04" />
                <rect x={chartPadding.left} y={yLine1_5} width={plotWidth} height={yZero - yLine1_5} fill="#ef4444" fillOpacity="0.04" />

                {/* Y Axis Gridlines & Labels */}
                {[0, 1.5, 3.0, 4.5, 6.0].map((val) => {
                  const y = getCanvasY(val);
                  return (
                    <g key={val} opacity="0.6">
                      <line 
                        x1={chartPadding.left} 
                        y1={y} 
                        x2={chartWidth - chartPadding.right} 
                        y2={y} 
                        stroke="#e2e8f0" 
                        strokeWidth="0.75" 
                        strokeDasharray={val === 1.5 || val === 3.0 ? "none" : "2,2"}
                      />
                      <text 
                        x={chartPadding.left - 6} 
                        y={y + 3} 
                        fill="#64748b" 
                        fontSize="7px" 
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {val.toFixed(1)}x
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Gridlines & Labels */}
                {[0, 20, 40, 60].map((val) => {
                  const x = getCanvasX(val);
                  return (
                    <g key={val} opacity="0.6">
                      <line 
                        x1={x} 
                        y1={chartPadding.top} 
                        x2={x} 
                        y2={chartHeight - chartPadding.bottom} 
                        stroke="#e2e8f0" 
                        strokeWidth="0.5" 
                      />
                      <text 
                        x={x} 
                        y={chartHeight - chartPadding.bottom + 11} 
                        fill="#64748b" 
                        fontSize="7px" 
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        -{val}%
                      </text>
                    </g>
                  );
                })}

                {/* Viability Limit Labels */}
                <line x1={chartPadding.left} y1={yLine3} x2={chartWidth - chartPadding.right} y2={yLine3} stroke="#10b981" strokeWidth="0.75" strokeDasharray="3,3" opacity="0.4" />
                <text x={chartWidth - chartPadding.right - 2} y={yLine3 - 3} fill="#10b981" fontSize="6px" textAnchor="end" opacity="0.6" fontWeight="bold">3.0x Норма</text>
                
                <line x1={chartPadding.left} y1={yLine1_5} x2={chartWidth - chartPadding.right} y2={yLine1_5} stroke="#ef4444" strokeWidth="0.75" strokeDasharray="3,3" opacity="0.4" />
                <text x={chartWidth - chartPadding.right - 2} y={yLine1_5 - 3} fill="#ef4444" fontSize="6px" textAnchor="end" opacity="0.6" fontWeight="bold">1.5x Риск</text>

                {/* Area under the line */}
                <path d={areaD} fill="url(#chartGrad)" />

                {/* Main line path */}
                <path d={pathD} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />

                {/* Vertical projection to current point */}
                <line x1={currentPtX} y1={currentPtY} x2={currentPtX} y2={yZero} stroke="#818cf8" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
                {/* Horizontal projection to current point */}
                <line x1={chartPadding.left} y1={currentPtY} x2={currentPtX} y2={currentPtY} stroke="#818cf8" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />

                {/* Glowing current point dot */}
                <circle cx={currentPtX} cy={currentPtY} r="7" fill="#818cf8" fillOpacity="0.3" />
                <circle cx={currentPtX} cy={currentPtY} r="4.5" fill="#818cf8" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Educational Legend */}
          <div className="mt-2 text-[8px] text-slate-650 space-y-0.5 w-full bg-slate-50 p-2 rounded-xl border border-slate-200 leading-normal">
            <span className="font-bold text-slate-800 block mb-0.5">🎓 Жизнеспособность:</span>
            <div className="flex items-start gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
              <span><strong>&gt; 3.0x (Зеленая зона)</strong> — Бизнес-модель устойчива.</span>
            </div>
            <div className="flex items-start gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-0.5" />
              <span><strong>&lt; 1.5x (Красная зона)</strong> — Сжигание капитала.</span>
            </div>
          </div>
        </div>

        {/* RESERVES INDICATORS & ACTIONS MATRIX (Combined Block Part 4) */}
        <div className="lg:col-span-3 bg-white border border-indigo-100 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
          
          <div className="space-y-4">
            <h4 className="font-display font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-700" />
              <span>Показатели резервов</span>
            </h4>

            {/* STUDENT EXPLANATION NOTE ON SIGNS (+/-) */}
            <div className="bg-purple-50/55 border border-purple-100 rounded-xl p-3 text-[10px] text-slate-700 leading-normal">
              <span className="font-bold text-amber-900 block mb-1">💡 Как понимать знаки для студентов:</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Знак <span className="font-bold text-rose-700 font-mono">-</span> означает <strong>сокращение (экономию)</strong> расходов.</li>
                <li>Знак <span className="font-bold text-emerald-700 font-mono">+</span> означает <strong>дополнительный заработок</strong> благодаря LTV.</li>
              </ul>
            </div>

            {/* LARGE INDICATORS GRID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center shadow-xs">
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Эффект</span>
                <span className="block text-lg md:text-xl font-black text-amber-700 font-mono tracking-tight">
                  +{totalReservesReleased.toFixed(1)}M
                </span>
                <span className="block text-[9px] text-slate-550 mt-0.5">млн ₽ в год к марже</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center shadow-xs">
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Рентабельность</span>
                <span className="block text-lg md:text-xl font-black text-emerald-700 font-mono tracking-tight">
                  +{currentProfitabilityIncrease.toFixed(1)}%
                </span>
                <span className="block text-[9px] text-emerald-700 font-bold mt-0.5">прирост маржи</span>
              </div>
            </div>

            {/* BREAKDOWN LIST WITH STUDENT EXPLANATIONS */}
            <div className="space-y-3 text-xs font-mono">
              {/* COGS Item */}
              <div className="border-b border-slate-200 pb-1.5">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-bold text-slate-700">Сберегли COGS:</span>
                  </span>
                  <span className="font-bold text-slate-800">-{cogsSaved.toFixed(1)} млн ₽</span>
                </div>
                <p className="text-[9px] text-slate-650 font-sans leading-relaxed mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <strong>COGS:</strong> Прямые расходы на облака/производство. Оптимизируется по ТРИЗ.
                </p>
              </div>

              {/* CAC Item */}
              <div className="border-b border-slate-200 pb-1.5">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold text-slate-700">Сберегли CAC:</span>
                  </span>
                  <span className="font-bold text-slate-800">-{cacSaved.toFixed(1)} млн ₽</span>
                </div>
                <p className="text-[9px] text-slate-650 font-sans leading-relaxed mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <strong>CAC:</strong> Затраты на получение 1 клиента. Снижается ростом конверсий.
                </p>
              </div>

              {/* OPEX Item */}
              <div className="border-b border-slate-200 pb-1.5">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-bold text-slate-700">Сберегли OPEX:</span>
                  </span>
                  <span className="font-bold text-slate-800">-{opexSaved.toFixed(1)} млн ₽</span>
                </div>
                <p className="text-[9px] text-slate-650 font-sans leading-relaxed mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <strong>OPEX:</strong> Постоянные опер. затраты. Оптимизируется ИИ-ассистентами.
                </p>
              </div>

              {/* LTV Item */}
              <div className="pb-0.5">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-700">Получили от LTV:</span>
                  </span>
                  <span className="font-bold text-slate-800">+{premiumAdded.toFixed(1)} млн ₽</span>
                </div>
                <p className="text-[9px] text-slate-650 font-sans leading-relaxed mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <strong>LTV / Прайс-премиум:</strong> Ценность клиента за все время жизни.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 flex gap-2 items-start mt-2 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div className="text-[9px] leading-relaxed text-slate-700">
              <strong className="text-purple-900 block">Важное предупреждение:</strong>
              За созданием каждого резерва должны строго следовать компенсирующие мероприятия. Это исключит падение качества.
            </div>
          </div>

        </div>

      </div>

      {/* 📊 INVESTMENT & FINANCIAL ANALYSIS SECTION */}
      <div className="border-t border-indigo-100/60 pt-6 mt-8 space-y-6">
        <div>
          <h3 className="font-display font-black text-slate-900 text-lg md:text-xl tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span>Инвестиционный и финансовый анализ жизнеспособности</span>
          </h3>
          <p className="text-xs text-slate-650 mt-1 max-w-3xl">
            Динамический прогноз ключевых финансовых показателей стартапа на горизонте 5 лет. Сравнение базового сценария и оптимизированного (с учетом высвобожденных резервов).
          </p>
        </div>

        {/* Financial Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Card 1: NPV Chart */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Расчет NPV проекта</h5>
                  <span className="text-[9px] text-indigo-700">Чистый дисконтированный доход</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  financialsOptimized[5].npv >= 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  NPV Yr5: {financialsOptimized[5].npv.toFixed(1)}M
                </span>
              </div>
              <p className="text-[10px] text-slate-650 leading-normal mb-3">
                Сравнивает дисконтированные денежные потоки при ставке WACC <strong>{(wacc * 100).toFixed(1)}%</strong>. 
                Точка пересечения с нулем — срок окупаемости.
              </p>
            </div>

            <div className="h-[140px] w-full relative">
              <svg viewBox={`0 0 340 180`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="npvAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 1, 2, 3, 4, 5].map(yr => (
                  <line 
                     key={yr}
                    x1={getNpvX(yr)} 
                    y1={npvPadding.top} 
                    x2={getNpvX(yr)} 
                    y2={180 - npvPadding.bottom} 
                    stroke="#e2e8f0" 
                    strokeWidth="0.5" 
                  />
                ))}

                {/* Horizontal Zero line */}
                <line 
                  x1={npvPadding.left} 
                  y1={yZeroNpv} 
                  x2={340 - npvPadding.right} 
                  y2={yZeroNpv} 
                  stroke="#ef4444" 
                  strokeWidth="1" 
                  strokeDasharray="3,3" 
                  opacity="0.5"
                />
                <text 
                  x={340 - npvPadding.right - 2} 
                  y={yZeroNpv - 3} 
                  fill="#ef4444" 
                  fontSize="6px" 
                  textAnchor="end"
                  opacity="0.7"
                >
                  Порог окупаемости
                </text>

                {/* Y-axis values */}
                {[-baseInvestment, 0, npvMaxY / 2, npvMaxY].map((val, i) => {
                  const y = getNpvY(val);
                  return (
                    <text 
                      key={i} 
                      x={npvPadding.left - 6} 
                      y={y + 2.5} 
                      fill="#64748b" 
                      fontSize="7px" 
                      fontFamily="monospace" 
                      textAnchor="end"
                    >
                      {val.toFixed(0)}M
                    </text>
                  );
                })}

                {/* X-axis year labels */}
                {[0, 1, 2, 3, 4, 5].map(yr => (
                  <text 
                    key={yr} 
                    x={getNpvX(yr)} 
                    y={180 - npvPadding.bottom + 11} 
                    fill="#64748b" 
                    fontSize="7px" 
                    fontFamily="monospace" 
                    textAnchor="middle"
                  >
                    Г{yr}
                  </text>
                ))}

                {/* Area for optimized NPV */}
                {financialsOptimized[5].npv > -baseInvestment && (
                  <path d={npvOptimAreaD} fill="url(#npvAreaGrad)" />
                )}

                {/* Baseline line */}
                <path d={npvBaseD} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />

                {/* Optimized line */}
                <path d={npvOptimD} fill="none" stroke="#818cf8" strokeWidth="2.5" />

                {/* Current Dot on Optimized */}
                <circle cx={getNpvX(5)} cy={getNpvY(financialsOptimized[5].npv)} r="3.5" fill="#818cf8" stroke="#ffffff" strokeWidth="1" />
              </svg>
            </div>

            <div className="flex gap-4 items-center mt-2 text-[9px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t-2 border-dashed border-slate-400 block" />
                <span>Базовый NPV: <strong>{financialsBaseline[5].npv.toFixed(1)}M ₽</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t bg-indigo-500 block" />
                <span>Опт. NPV: <strong className="text-indigo-700">{financialsOptimized[5].npv.toFixed(1)}M ₽</strong></span>
              </div>
            </div>
          </div>

          {/* Card 2: Break-Even Chart */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Точка безубыточности (BEP)</h5>
                  <span className="text-[9px] text-amber-700">Порог рентабельности по выручке</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                  BEP: {bepOptimized.bep.toFixed(1)}M ₽
                </span>
              </div>
              <p className="text-[10px] text-slate-650 leading-normal mb-3">
                Пересечение линии выручки (Y=X) и полных затрат (Fixed + Variable). 
                Оптимизация снизила порог безубыточности на <strong>{Math.max(0, bepBaseline.bep - bepOptimized.bep).toFixed(1)}M ₽</strong>.
              </p>
            </div>

            <div className="h-[140px] w-full relative">
              <svg viewBox={`0 0 340 180`} className="w-full h-full overflow-visible">
                {/* Zones */}
                <polygon 
                  points={`${getBepX(0)},${getBepY(0)} ${getBepX(0)},${getBepY(bepOptimized.fc)} ${getBepX(bepOptimized.bep)},${getBepY(bepOptimized.bep)}`} 
                  fill="#ef4444" 
                  fillOpacity="0.08" 
                />
                <polygon 
                  points={`${getBepX(bepOptimized.bep)},${getBepY(bepOptimized.bep)} ${getBepX(activeRevenue * 1.5)},${getBepY(bepOptimized.fc + bepOptimized.vcr * activeRevenue * 1.5)} ${getBepX(activeRevenue * 1.5)},${getBepY(activeRevenue * 1.5)}`} 
                  fill="#10b981" 
                  fillOpacity="0.08" 
                />

                {/* Faint Fixed Costs Line */}
                <line 
                  x1={getBepX(0)} 
                  y1={getBepY(bepOptimized.fc)} 
                  x2={getBepX(activeRevenue * 1.5)} 
                  y2={getBepY(bepOptimized.fc)} 
                  stroke="#cbd5e1" 
                  strokeWidth="1" 
                  strokeDasharray="2,2" 
                  opacity="0.6"
                />
                <text 
                  x={340 - bepPadding.right - 2} 
                  y={getBepY(bepOptimized.fc) - 3} 
                  fill="#64748b" 
                  fontSize="6px" 
                  textAnchor="end"
                >
                  Пост. затраты (FC): {bepOptimized.fc.toFixed(1)}M
                </text>

                {/* Diagonal Revenue Line Y = X */}
                <line 
                  x1={getBepX(0)} 
                  y1={getBepY(0)} 
                  x2={getBepX(activeRevenue * 1.5)} 
                  y2={getBepY(activeRevenue * 1.5)} 
                  stroke="#10b981" 
                  strokeWidth="2" 
                />
                <text 
                  x={getBepX(activeRevenue * 1.5) - 2} 
                  y={getBepY(activeRevenue * 1.5) - 5} 
                  fill="#10b981" 
                  fontSize="6px" 
                  textAnchor="end" 
                  fontWeight="bold"
                >
                  Выручка
                </text>

                {/* Total Cost Line Y = FC + VCR * X */}
                <line 
                  x1={getBepX(0)} 
                  y1={getBepY(bepOptimized.fc)} 
                  x2={getBepX(activeRevenue * 1.5)} 
                  y2={getBepY(bepOptimized.fc + bepOptimized.vcr * activeRevenue * 1.5)} 
                  stroke="#f43f5e" 
                  strokeWidth="2" 
                />
                <text 
                  x={getBepX(activeRevenue * 1.5) - 2} 
                  y={getBepY(bepOptimized.fc + bepOptimized.vcr * activeRevenue * 1.5) + 8} 
                  fill="#f43f5e" 
                  fontSize="6px" 
                  textAnchor="end" 
                  fontWeight="bold"
                >
                  TC (Расходы)
                </text>

                {/* Projections to BEP */}
                <line 
                  x1={getBepX(bepOptimized.bep)} 
                  y1={getBepY(bepOptimized.bep)} 
                  x2={getBepX(bepOptimized.bep)} 
                  y2={180 - bepPadding.bottom} 
                  stroke="#64748b" 
                  strokeWidth="0.75" 
                  strokeDasharray="2,2" 
                />
                <line 
                  x1={getBepX(0)} 
                  y1={getBepY(bepOptimized.bep)} 
                  x2={getBepX(bepOptimized.bep)} 
                  y2={getBepY(bepOptimized.bep)} 
                  stroke="#64748b" 
                  strokeWidth="0.75" 
                  strokeDasharray="2,2" 
                />

                {/* Highlight Point BEP */}
                <circle cx={getBepX(bepOptimized.bep)} cy={getBepY(bepOptimized.bep)} r="5" fill="#f59e0b" />
                <circle cx={getBepX(bepOptimized.bep)} cy={getBepY(bepOptimized.bep)} r="2" fill="#ffffff" />

                {/* X-axis labels */}
                {[0, activeRevenue * 0.5, activeRevenue, activeRevenue * 1.5].map((val, i) => {
                  const x = getBepX(val);
                  return (
                    <text 
                      key={i} 
                      x={x} 
                      y={180 - bepPadding.bottom + 11} 
                      fill="#64748b" 
                      fontSize="7px" 
                      fontFamily="monospace" 
                      textAnchor="middle"
                    >
                      {val.toFixed(0)}M
                    </text>
                  );
                })}

                {/* Y-axis labels */}
                {[0, activeRevenue * 0.75, activeRevenue * 1.5].map((val, i) => {
                  const y = getBepY(val);
                  return (
                    <text 
                      key={i} 
                      x={bepPadding.left - 6} 
                      y={y + 2.5} 
                      fill="#64748b" 
                      fontSize="7px" 
                      fontFamily="monospace" 
                      textAnchor="end"
                    >
                      {val.toFixed(0)}M
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Explanatory zone badges */}
            <div className="flex gap-4 items-center mt-2 text-[9px] text-slate-650 bg-slate-50 p-2 rounded-xl border border-slate-200 justify-between shadow-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-rose-50 border border-rose-200 block" />
                <span>Зона убытков</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-emerald-50 border border-emerald-200 block" />
                <span>Зона прибыли</span>
              </span>
              <span className="text-slate-550 italic">Марж. доход: <strong>{(bepOptimized.cmr * 100).toFixed(0)}%</strong></span>
            </div>
          </div>

          {/* Card 3: Profit and Profitability Chart */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Прибыль и Рентабельность</h5>
                  <span className="text-[9px] text-emerald-800">Чистая прибыль (млн ₽) и маржа (%)</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Margin Yr5: {financialsOptimized[5].margin.toFixed(0)}%
                </span>
              </div>
              <p className="text-[10px] text-slate-650 leading-normal mb-3">
                Столбцы — чистая прибыль по годам (базовая vs оптимизированная). 
                Линия — рентабельность по чистой прибыли оптимизированного сценария.
              </p>
            </div>

            <div className="h-[140px] w-full relative">
              <svg viewBox={`0 0 340 180`} className="w-full h-full overflow-visible">
                {/* Horizontal line at profit = 0 */}
                <line 
                  x1={profPadding.left} 
                  y1={getProfY(0)} 
                  x2={340 - profPadding.right} 
                  y2={getProfY(0)} 
                  stroke="#cbd5e1" 
                  strokeWidth="1" 
                />

                {/* Left Y-Axis labels (Profit) */}
                {[profMinY, 0, profMaxY / 2, profMaxY].map((val, i) => {
                  const y = getProfY(val);
                  return (
                    <text 
                      key={i} 
                      x={profPadding.left - 6} 
                      y={y + 2.5} 
                      fill="#64748b" 
                      fontSize="7px" 
                      fontFamily="monospace" 
                      textAnchor="end"
                    >
                      {val.toFixed(0)}M
                    </text>
                  );
                })}

                {/* Right Y-Axis labels (Margin %) */}
                {[-20, 0, 30, 60].map((val, i) => {
                  const y = getMarginY(val);
                  return (
                    <text 
                      key={i} 
                      x={340 - profPadding.right + 6} 
                      y={y + 2.5} 
                      fill="#34d399" 
                      fontSize="7px" 
                      fontFamily="monospace" 
                      textAnchor="start"
                    >
                      {val}%
                    </text>
                  );
                })}

                {/* X-axis Year labels */}
                {[1, 2, 3, 4, 5].map(yr => (
                  <text 
                    key={yr} 
                    x={getProfX(yr)} 
                    y={180 - profPadding.bottom + 11} 
                    fill="#64748b" 
                    fontSize="7px" 
                    fontFamily="monospace" 
                    textAnchor="middle"
                  >
                    Год {yr}
                  </text>
                ))}

                {/* Render Profit Bars for Year 1 to 5 */}
                {financialsBaseline.filter(p => p.year > 0).map((pt) => {
                  const x = getProfX(pt.year);
                  const yZero = getProfY(0);
                  
                  // Baseline bar
                  const hBase = Math.abs(getProfY(pt.netProfit) - yZero);
                  const yBase = pt.netProfit >= 0 ? getProfY(pt.netProfit) : yZero;

                  // Optimized bar
                  const optPt = financialsOptimized.find(o => o.year === pt.year)!;
                  const hOptim = Math.abs(getProfY(optPt.netProfit) - yZero);
                  const yOptim = optPt.netProfit >= 0 ? getProfY(optPt.netProfit) : yZero;

                  return (
                    <g key={pt.year}>
                      {/* Baseline bar (gray, outline) */}
                      <rect 
                        x={x - 9} 
                        y={yBase} 
                        width="7" 
                        height={Math.max(1, hBase)} 
                        fill="#cbd5e1" 
                        rx="1" 
                        opacity="0.8"
                      />
                      
                      {/* Optimized bar (glowing color) */}
                      <rect 
                        x={x + 1} 
                        y={yOptim} 
                        width="7" 
                        height={Math.max(1, hOptim)} 
                        fill="#818cf8" 
                        rx="1" 
                      />
                    </g>
                  );
                })}

                {/* Profitability Line Overlay (Optimized Margin %) */}
                <path 
                  d={marginLineD} 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                />

                {/* Margin Dots */}
                {financialsOptimized.filter(p => p.year > 0).map(pt => (
                  <circle 
                    key={pt.year}
                    cx={getProfX(pt.year)} 
                    cy={getMarginY(pt.margin)} 
                    r="3" 
                    fill="#10b981" 
                    stroke="#ffffff" 
                    strokeWidth="1" 
                  />
                ))}
              </svg>
            </div>

            <div className="flex gap-4 items-center mt-2 text-[9px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 justify-between shadow-xs">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2 rounded bg-slate-350 block" />
                <span>Баз. прибыль</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2 rounded bg-indigo-500 block" />
                <span>Опт. прибыль</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-500 block" />
                <span className="text-emerald-700 font-bold">Рентабельность %</span>
              </div>
            </div>
          </div>

        </div>

        {/* Investment Performance & Efficiency Table */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="font-display font-bold text-xs text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>Сводная таблица инвестиционных и финансовых показателей</span>
              </h4>
              <p className="text-[11px] text-slate-650 mt-0.5">
                Сравнение ключевых финансовых коэффициентов базовой бизнес-модели и оптимизированной с использованием резервов.
              </p>
            </div>
            <div className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-800 px-2 py-1 rounded-lg font-mono shadow-xs">
              Ставка дисконтирования (WACC): <strong>{(wacc * 100).toFixed(1)}%</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-indigo-100 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Финансовый показатель / Коэффициент</th>
                  <th className="py-2.5 px-3 text-center bg-slate-50">Базовый вариант</th>
                  <th className="py-2.5 px-3 text-center bg-indigo-50/55 text-indigo-900 font-extrabold">Оптимизированный</th>
                  <th className="py-2.5 px-3 text-right">Эффект / Прирост</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100/50 font-mono">
                
                {/* IRR Row */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-800">
                    <strong className="block text-slate-900">Внутренняя норма доходности (IRR)</strong>
                    <span className="text-[10px] text-slate-500 block font-normal">Экономический предел ставки WACC. Чем выше IRR относительно WACC, тем безопаснее проект.</span>
                  </td>
                  <td className="py-3 px-3 text-center bg-slate-50 text-slate-600">
                    {irrBaseline <= -0.99 ? '—' : `${(irrBaseline * 100).toFixed(1)}%`}
                  </td>
                  <td className="py-3 px-3 text-center bg-indigo-50/55 font-black text-indigo-700">
                    {irrOptimized <= -0.99 ? '—' : `${(irrOptimized * 100).toFixed(1)}%`}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                    {irrBaseline > -0.99 && irrOptimized > -0.99 ? (
                      <span>↑ +{(irrOptimized * 100 - irrBaseline * 100).toFixed(1)}%</span>
                    ) : 'Существенный'}
                  </td>
                </tr>

                {/* ROA Row */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-800">
                    <strong className="block text-slate-900">Рентабельность активов (ROA, Год 3)</strong>
                    <span className="text-[10px] text-slate-500 block font-normal">Эффективность использования совокупного капитала (активов) компании.</span>
                  </td>
                  <td className="py-3 px-3 text-center bg-slate-50 text-slate-600">
                    {roaBaseline.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-center bg-indigo-50/55 font-bold text-indigo-700">
                    {roaOptimized.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                    ↑ +{(roaOptimized - roaBaseline).toFixed(1)}%
                  </td>
                </tr>

                {/* ROE Row */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-800">
                    <strong className="block text-slate-900">Рентабельность собственного капитала (ROE, Год 3)</strong>
                    <span className="text-[10px] text-slate-500 block font-normal">Эффективность отдачи на вложенные учредителями (инвесторами) средства.</span>
                  </td>
                  <td className="py-3 px-3 text-center bg-slate-50 text-slate-600">
                    {roeBaseline.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-center bg-indigo-50/55 font-bold text-indigo-700">
                    {roeOptimized.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                    ↑ +{(roeOptimized - roeBaseline).toFixed(1)}%
                  </td>
                </tr>

                {/* Payback Period Row */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-800">
                    <strong className="block text-slate-900">Дисконтированный срок окупаемости (DPP)</strong>
                    <span className="text-[10px] text-slate-500 block font-normal">Время, необходимое для покрытия первоначальных вложений с учетом фактора дисконтирования.</span>
                  </td>
                  <td className="py-3 px-3 text-center bg-slate-50 text-slate-600">
                    {paybackBaseline > 5 ? 'более 5 лет' : `${paybackBaseline.toFixed(1)} лет`}
                  </td>
                  <td className="py-3 px-3 text-center bg-indigo-50/55 font-bold text-indigo-700">
                    {paybackOptimized > 5 ? 'более 5 лет' : `${paybackOptimized.toFixed(1)} лет`}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                    {paybackBaseline > paybackOptimized ? (
                      <span>↓ -{(paybackBaseline - paybackOptimized).toFixed(1)} лет</span>
                    ) : 'Без изм.'}
                  </td>
                </tr>

                {/* PI Row */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-800">
                    <strong className="block text-slate-900">Индекс доходности (Profitability Index - PI)</strong>
                    <span className="text-[10px] text-slate-500 block font-normal">Отношение дисконтированных выгод к затратам. Если PI &gt; 1, проект выгоден.</span>
                  </td>
                  <td className="py-3 px-3 text-center bg-slate-50 text-slate-600">
                    {piBaseline.toFixed(2)}x
                  </td>
                  <td className="py-3 px-3 text-center bg-indigo-50/55 font-bold text-indigo-700">
                    {piOptimized.toFixed(2)}x
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                    ↑ +{(piOptimized - piBaseline).toFixed(2)}x
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
