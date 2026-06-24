import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { StartupData } from '../types';
import { BarChart3, Percent, Info, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

interface MarketCompareChartProps {
  data: StartupData;
  resultsColor?: string;
}

interface Benchmark {
  id: string;
  name: string;
  color: string;
  tam: number;
  sam: number;
  som: number;
  sam_of_tam: number;
  som_of_sam: number;
  som_of_tam: number;
}

export function MarketCompareChart({ data, resultsColor = '#6366f1' }: MarketCompareChartProps) {
  const [viewMode, setViewMode] = useState<'absolute' | 'shares'>('shares');
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Define 3 robust, realistic industry benchmarks based on Russian market startup statistics (in mln rubles)
  const benchmarks: Benchmark[] = [
    {
      id: 'saas',
      name: 'IT / SaaS платформы',
      color: '#3b82f6', // blue
      tam: 12000,
      sam: 2400,
      som: 360,
      sam_of_tam: 20.0,
      som_of_sam: 15.0,
      som_of_tam: 3.0,
    },
    {
      id: 'deeptech',
      name: 'DeepTech & Hardware',
      color: '#f97316', // orange
      tam: 45000,
      sam: 6750,
      som: 472.5,
      sam_of_tam: 15.0,
      som_of_sam: 7.0,
      som_of_tam: 1.05,
    },
    {
      id: 'b2c',
      name: 'B2C услуги & E-com',
      color: '#14b8a6', // teal
      tam: 90000,
      sam: 10800,
      som: 540,
      sam_of_tam: 12.0,
      som_of_sam: 5.0,
      som_of_tam: 0.6,
    }
  ];

  // Calculate current startup market metrics
  const s_tam = data.tam || 0;
  const s_sam = data.sam || 0;
  const s_som = data.som || 0;

  const s_sam_of_tam = s_tam > 0 ? (s_sam / s_tam) * 100 : 0;
  const s_som_of_sam = s_sam > 0 ? (s_som / s_sam) * 100 : 0;
  const s_som_of_tam = s_tam > 0 ? (s_som / s_tam) * 100 : 0;

  const currentStartupMetrics = {
    id: 'current',
    name: 'Наш стартап',
    color: resultsColor,
    tam: s_tam,
    sam: s_sam,
    som: s_som,
    sam_of_tam: s_sam_of_tam,
    som_of_sam: s_som_of_sam,
    som_of_tam: s_som_of_tam,
  };

  const allSeries = [currentStartupMetrics, ...benchmarks];

  // Dynamic D3 logic
  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous drawing
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove();

    // Chart dimensions
    const width = 680;
    const height = 360;
    const margin = { top: 40, right: 30, bottom: 60, left: 65 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Prepare data based on selected view mode
    let groups: string[] = [];
    let groupLabels: string[] = [];
    let dataList: any[] = [];

    if (viewMode === 'absolute') {
      groups = ['TAM', 'SAM', 'SOM'];
      groupLabels = ['TAM (Весь рынок)', 'SAM (Доступный)', 'SOM (Достижимый)'];
      
      dataList = groups.flatMap(group => {
        const metricKey = group.toLowerCase() as 'tam' | 'sam' | 'som';
        return allSeries.map(series => ({
          group,
          series: series.name,
          color: series.color,
          value: series[metricKey],
          label: `${series[metricKey].toLocaleString('ru-RU')} млн ₽`
        }));
      });
    } else {
      groups = ['SAM/TAM', 'SOM/SAM', 'SOM/TAM'];
      groupLabels = ['Доля SAM от TAM', 'Доля SOM от SAM', 'Общая доля SOM от TAM'];

      dataList = groups.flatMap(group => {
        let metricKey: 'sam_of_tam' | 'som_of_sam' | 'som_of_tam';
        if (group === 'SAM/TAM') metricKey = 'sam_of_tam';
        else if (group === 'SOM/SAM') metricKey = 'som_of_sam';
        else metricKey = 'som_of_tam';

        return allSeries.map(series => ({
          group,
          series: series.name,
          color: series.color,
          value: series[metricKey],
          label: `${series[metricKey].toFixed(2)}%`
        }));
      });
    }

    // Set up Scales
    const x0 = d3.scaleBand()
      .domain(groups)
      .rangeRound([0, chartWidth])
      .paddingInner(0.25);

    const x1 = d3.scaleBand()
      .domain(allSeries.map(d => d.name))
      .rangeRound([0, x0.bandwidth()])
      .padding(0.12);

    // Calculate maximum value
    const maxValue = d3.max(dataList, d => d.value as number) || 10;

    let y: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number>;

    if (viewMode === 'absolute' && scaleType === 'log') {
      // For log scale, prevent 0 values by substituting a very small number (e.g. 0.1)
      const safeMin = 0.5;
      const safeMax = Math.max(maxValue, 10);
      
      y = d3.scaleLog()
        .domain([safeMin, safeMax])
        .range([chartHeight, 0])
        .nice();
    } else {
      y = d3.scaleLinear()
        .domain([0, maxValue * 1.1]) // Add 10% spacing at the top
        .range([chartHeight, 0])
        .nice();
    }

    // Render Canvas Group
    const g = svgElement
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    if (viewMode === 'absolute' && scaleType === 'log') {
      const yTicks = y.ticks(5);
      g.append('g')
        .attr('class', 'grid-lines stroke-slate-800/40')
        .selectAll('line')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', d => y(d))
        .attr('y2', d => y(d))
        .attr('stroke-dasharray', '3,3');
    } else {
      const yTicks = (y as d3.ScaleLinear<number, number>).ticks(6);
      g.append('g')
        .attr('class', 'grid-lines stroke-slate-800/40')
        .selectAll('line')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', d => y(d))
        .attr('y2', d => y(d))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
    }

    // Render Bars
    g.append('g')
      .selectAll('g')
      .data(groups)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${x0(d)},0)`)
      .selectAll('rect')
      .data(d => dataList.filter(item => item.group === d))
      .enter()
      .append('rect')
      .attr('x', d => x1(d.series) || 0)
      .attr('y', d => {
        const val = d.value;
        if (viewMode === 'absolute' && scaleType === 'log') {
          return y(Math.max(val, 0.5));
        }
        return y(val);
      })
      .attr('width', x1.bandwidth())
      .attr('height', d => {
        const val = d.value;
        if (viewMode === 'absolute' && scaleType === 'log') {
          const yVal = y(Math.max(val, 0.5));
          return Math.max(0, chartHeight - yVal);
        }
        return Math.max(0, chartHeight - y(val));
      })
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .attr('class', 'transition-all duration-300 hover:opacity-90 cursor-pointer')
      .append('title') // Basic SVG tooltip
      .text(d => `${d.series}: ${d.label}`);

    // Value Labels on Top of Bars (only if height is enough or for current startup to stand out)
    g.append('g')
      .selectAll('g')
      .data(groups)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${x0(d)},0)`)
      .selectAll('text')
      .data(d => dataList.filter(item => item.group === d))
      .enter()
      .append('text')
      .attr('x', d => (x1(d.series) || 0) + x1.bandwidth() / 2)
      .attr('y', d => {
        const val = d.value;
        const pos = viewMode === 'absolute' && scaleType === 'log' ? y(Math.max(val, 0.5)) : y(val);
        return pos - 6;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.series === 'Наш стартап' ? '#1e293b' : '#64748b')
      .attr('font-weight', d => d.series === 'Наш стартап' ? 'bold' : 'normal')
      .attr('font-size', '8px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .text(d => {
        if (d.value === 0) return '';
        // Format label nicely
        if (viewMode === 'absolute') {
          if (d.value >= 1000) return `${Math.round(d.value / 100) / 10}k`;
          return Math.round(d.value).toString();
        }
        return `${d.value.toFixed(1)}%`;
      });

    // X Axis Setup
    const xAxis = d3.axisBottom(x0)
      .tickFormat((d, i) => groupLabels[i]);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .attr('class', 'axis-x')
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('dy', '12px');

    g.select('.axis-x').select('.domain').attr('stroke', '#cbd5e1');
    g.select('.axis-x').selectAll('.tick line').attr('stroke', '#cbd5e1');

    // Y Axis Setup
    const yAxisFormatter = (d: any) => {
      if (viewMode === 'absolute') {
        if (d >= 1000) return `${d / 1000}k`;
        return d;
      }
      return `${d}%`;
    };

    const yAxis = d3.axisLeft(y)
      .ticks(5, viewMode === 'absolute' && scaleType === 'log' ? ',' : undefined)
      .tickFormat(viewMode === 'absolute' && scaleType === 'log' ? undefined : yAxisFormatter as any);

    g.append('g')
      .call(yAxis)
      .attr('class', 'axis-y')
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace');

    g.select('.axis-y').select('.domain').attr('stroke', '#cbd5e1');
    g.select('.axis-y').selectAll('.tick line').attr('stroke', '#cbd5e1');

    // Axis titles
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('font-family', 'system-ui, sans-serif')
      .text(viewMode === 'absolute' ? 'Объем рынка (млн рублей)' : 'Доля от базового рынка (%)');

  }, [viewMode, scaleType, data.tam, data.sam, data.som, resultsColor]);

  // Analyst commentary helper
  const getAnalystAdvice = () => {
    if (s_tam === 0) {
      return {
        title: 'Недостаточно данных для анализа',
        text: 'Пожалуйста, заполните параметры TAM, SAM и SOM во вкладке "Анкета" или через "ИИ Агент", чтобы система рассчитала реальные доли рынка и сформировала аналитическое заключение.',
        type: 'warning'
      };
    }

    if (s_som_of_sam > 35) {
      return {
        title: '⚠️ Слишком агрессивный план экспансии (SOM/SAM)',
        text: `Ваш план продаж предусматривает охват ${s_som_of_sam.toFixed(1)}% доступного рынка (SAM) за 3 года. По отраслевым меркам это сверхоптимистичный показатель (среднее по SaaS — 15%, в DeepTech — 7%). Рекомендуется повторно верифицировать ресурсы отдела продаж и рекламный бюджет.`,
        type: 'danger'
      };
    }

    if (s_sam_of_tam > 40) {
      return {
        title: '🔍 Широкое позиционирование сегмента (SAM/TAM)',
        text: `Доля вашего целевого сегмента составляет ${s_sam_of_tam.toFixed(1)}% от всего рынка. Обычно стартапы ранних стадий выбирают более узкую и защищенную нишу (до 15-20% от TAM). Сужение фокуса поможет снизить затраты на маркетинг и эффективнее обойти крупных конкурентов.`,
        type: 'info'
      };
    }

    if (s_som_of_sam < 2) {
      return {
        title: '💤 Консервативный захват рынка (SOM/SAM)',
        text: `Планируемая доля охвата целевой аудитории (${s_som_of_sam.toFixed(1)}%) ниже среднерыночной. Возможно, вы недооцениваете вирусный потенциал продукта или заложили слишком малые темпы масштабирования. Проверьте гипотезу кратного роста.`,
        type: 'warning'
      };
    }

    return {
      title: '✅ Сбалансированные пропорции долей рынка',
      text: `Показатели вашего стартапа (доступность SAM: ${s_sam_of_tam.toFixed(1)}%, экспансия SOM: ${s_som_of_sam.toFixed(1)}%) находятся в оптимальном золотом коридоре. Планы выглядят реалистично для инвесторов и соответствуют здоровой динамике рынка.`,
      type: 'success'
    };
  };

  const advice = getAnalystAdvice();

  return (
    <div id="market-compare-block" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="font-display font-bold text-slate-900 text-lg md:text-xl">
              Сравнение емкости и долей рынка с бенчмарками
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-normal leading-relaxed">
            Наглядная гистограмма долей и объемов рынка (TAM, SAM, SOM) в сравнении со средними показателями по трем ключевым технологическим сегментам РФ.
          </p>
        </div>

        {/* View Mode Switches */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setViewMode('shares')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'shares'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Доли рынка (%)</span>
          </button>
          <button
            onClick={() => setViewMode('absolute')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'absolute'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Объемы (млн ₽)</span>
          </button>

          {viewMode === 'absolute' && (
            <select
              value={scaleType}
              onChange={(e) => setScaleType(e.target.value as 'linear' | 'log')}
              className="px-2.5 py-1.5 bg-slate-100 border-none rounded-lg text-xs font-semibold text-slate-600 outline-none cursor-pointer"
            >
              <option value="linear">Линейная шкала</option>
              <option value="log">Логарифмическая</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Render Container */}
        <div className="lg:col-span-8 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-center relative overflow-hidden">
          {/* Legend absolute badges */}
          <div className="absolute top-2 left-4 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-600">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm block" style={{ backgroundColor: resultsColor }} />
              <span>Наш проект</span>
            </div>
            {benchmarks.map((b) => (
              <div key={b.id} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm block" style={{ backgroundColor: b.color }} />
                <span>{b.name}</span>
              </div>
            ))}
          </div>

          <div className="w-full h-[330px] flex items-center justify-center mt-3">
            {s_tam === 0 ? (
              <div className="text-center p-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-slate-350 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-slate-700">Заполните данные рынка стартапа</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Для построения интерактивной D3-гистограммы укажите TAM, SAM, SOM во вкладке параметров анкеты.
                </p>
              </div>
            ) : (
              <svg ref={svgRef} className="w-full h-full select-none" />
            )}
          </div>
        </div>

        {/* Informational Benchmarks Grid Table & Analyst commentary */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Detailed Indicator Comparison */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h4 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Сравнительная матрица долей</span>
            </h4>
            
            <div className="divide-y divide-slate-150 text-xs">
              <div className="py-2 flex justify-between font-semibold text-slate-500">
                <span>Проект / Метрика</span>
                <div className="flex gap-4">
                  <span className="w-14 text-right">SAM/TAM</span>
                  <span className="w-14 text-right">SOM/SAM</span>
                </div>
              </div>

              {allSeries.map((series) => (
                <div key={series.id} className="py-2.5 flex justify-between items-center">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: series.color }} />
                    <span className={series.id === 'current' ? 'font-bold text-slate-900' : ''}>
                      {series.name}
                    </span>
                  </span>
                  <div className="flex gap-4 font-mono font-bold">
                    <span className={`w-14 text-right ${series.id === 'current' ? 'text-indigo-600' : 'text-slate-600'}`}>
                      {series.sam_of_tam.toFixed(1)}%
                    </span>
                    <span className={`w-14 text-right ${series.id === 'current' ? 'text-amber-600' : 'text-slate-600'}`}>
                      {series.som_of_sam.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analyst Advice Card */}
          <div className={`p-4 rounded-2xl border flex gap-3 items-start ${
            advice.type === 'success' 
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
              : advice.type === 'danger'
              ? 'bg-rose-50/50 border-rose-100 text-rose-900'
              : advice.type === 'warning'
              ? 'bg-amber-50/50 border-amber-100 text-amber-900'
              : 'bg-indigo-50/50 border-indigo-100 text-indigo-900'
          }`}>
            <Info className={`w-5 h-5 mt-0.5 shrink-0 ${
              advice.type === 'success' ? 'text-emerald-500' :
              advice.type === 'danger' ? 'text-rose-500' :
              advice.type === 'warning' ? 'text-amber-500' :
              'text-indigo-500'
            }`} />
            <div>
              <h4 className="font-bold text-xs">{advice.title}</h4>
              <p className="text-[11px] leading-relaxed mt-1 font-normal opacity-90">
                {advice.text}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
