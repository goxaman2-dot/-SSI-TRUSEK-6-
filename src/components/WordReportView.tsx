import React, { useState, useRef } from 'react';
import { FileText, Lock, CheckCircle2, XCircle, Download, FileArchive, Upload } from 'lucide-react';
import { StartupData } from '../types';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export function WordReportView({ data, ssiScore }: { data: StartupData; ssiScore: number }) {
  const isApproved = data.supervisorApproved === true;
  const isScoreHighEnough = ssiScore > 5.50;
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isApproved || !isScoreHighEnough) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Отчет по стартапу (Word)
            </h1>
            <p className="text-sm text-slate-500 mt-1">Генерация и выгрузка отчета по стартапу</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <Lock className="w-16 h-16 text-rose-500 mb-2" />
          <h2 className="text-xl font-bold text-slate-800">Доступ к генерации отчета закрыт</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            Для формирования Word-отчета необходимо выполнить следующие условия:
          </p>
          <ul className="text-left text-sm text-slate-700 space-y-3 mt-4 bg-white p-6 rounded-xl border border-rose-100 w-full max-w-md shadow-sm">
            <li className="flex items-center gap-3">
              {isApproved ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              <span className={isApproved ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
                Одобрение научного руководителя
              </span>
            </li>
            <li className="flex items-center gap-3">
              {isScoreHighEnough ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              <span className={isScoreHighEnough ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
                Индекс SSI выше 5.50 (текущий: {ssiScore.toFixed(2)})
              </span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTemplateFile(e.target.files[0]);
    }
  };

  const generateReport = async () => {
    if (!templateFile) {
      alert('Пожалуйста, сначала загрузите ваш шаблон отчета в формате DOCX.');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      const uScore = data.u1 + data.u2;
      const eScore = data.e1 + data.e2;
      const rScore = data.r1 + data.r2;
      const kScore = data.k1 + data.k2;
      const tScore = data.t1 + data.t2;
      const sScore = data.s1 + data.s2;

      const ssiLevel = ssiScore > 8 ? 'высокий' : ssiScore > 5 ? 'средний' : 'низкий';
      const ssiVerdict = ssiScore > 8 ? 'высокой потенциальной успешности' : 'необходимости доработки';

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = (e) => reject(new Error('Ошибка чтения файла'));
        reader.readAsArrayBuffer(templateFile);
      });

      const zip = new PizZip(arrayBuffer);
      
      const contentXml = zip.file("word/document.xml")?.asText() || "";
      const isDoubleBrace = contentXml.includes("{{");

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        ...(isDoubleBrace ? { delimiters: { start: '{{', end: '}}' } } : {}),
        nullGetter: function(part: any) {
          if (!part.module) {
            return "";
          }
          if (part.module === "rawxml") {
            return "";
          }
          return "";
        },
      });

      const microNames = {
        U1: "Цена отказа", U2: "Частота критичности",
        E1: "Dopamine Index", E2: "Премиальность",
        R1: "Коэф. повторения", R2: "LTV/CAC",
        K1: "Порог входа (CAPEX⁻¹)", K2: "OPEX-интенсивн.⁻¹",
        T1: "До EBITDA+⁻¹", T2: "Самоокупаемость⁻¹",
        S1: "K-factor", S2: "NPS Score"
      };
      
      const appxData: Record<string, any> = {};
      Object.entries(microNames).forEach(([code, name]) => {
        appxData[`appx_${code}_name`] = name;
        appxData[`appx_${code}_fact`] = "Оценка на основе ответов";
        appxData[`appx_${code}_score`] = data[code.toLowerCase() as keyof StartupData] || "0";
        appxData[`appx_${code}_source`] = "Анкетирование / ИИ-анализ";
      });

      doc.render({
        ...appxData,
        row: {
          u_score: uScore.toFixed(1),
          e_score: eScore.toFixed(1),
          r_score: rScore.toFixed(1),
          k_score: kScore.toFixed(1),
          t_score: tScore.toFixed(1),
          s_score: sScore.toFixed(1),
        },
        row_u_score: uScore.toFixed(1),
        row_e_score: eScore.toFixed(1),
        row_r_score: rScore.toFixed(1),
        row_k_score: kScore.toFixed(1),
        row_t_score: tScore.toFixed(1),
        row_s_score: sScore.toFixed(1),
        radar_chart: "Радарная диаграмма",
        idea_name: data.name || 'Название проекта не указано',
        idea_short_description: 'создание инновационного продукта/сервиса',
        value_proposition: 'решение острой проблемы целевой аудитории',
        monetization_model: 'B2B/B2C',
        capex_value: 'N/A',
        breakeven_months: 'N/A',
        target_market: 'Целевой рынок',
        tam_value: 'N/A',
        sam_value: 'N/A',
        som_value: 'N/A',
        consumer_segment: 'Потребители',
        consumer_pain: 'Проблема',
        competitors_weakness: 'Слабости конкурентов',
        fio: data.author || 'ФИО Студента',
        gruppa: 'Группа',
        nauchnik: data.expert || 'Научный руководитель',
        nauchnik_title: 'должность',
        ssi_total: ssiScore.toFixed(2),
        row_u_score: uScore.toFixed(1),
        row_e_score: eScore.toFixed(1),
        row_r_score: rScore.toFixed(1),
        row_k_score: kScore.toFixed(1),
        row_t_score: tScore.toFixed(1),
        row_s_score: sScore.toFixed(1),
        city_name: 'Ставрополь',
        god: new Date().getFullYear(),
        university_name: 'Северо-Кавказский федеральный университет',
        faculty_name: 'Факультет',
        department_name: 'Кафедра',
        direction_code: 'XX.XX.XX',
        direction_name: 'Направление',
        sector_name: 'Сектор',
        market_segment: 'Сегмент',
        data_sources: 'Аналитика и расчеты калькулятора SSI',
        ssi_level: ssiLevel,
        ssi_verdict: ssiVerdict,
        dominant_axis_name: 'Ось SSI',
        dominant_axis_value: 'X',
        weak_axis_name: 'Ось SSI',
        weak_axis_value: 'Y',
        ssi_delta: 'Z',
        best_investor_type: 'Бизнес-ангел / Венчурный фонд',
        best_investor_reason: 'соответствие профилю риска',
        recommendations: 'Развивать проект и готовиться к питчингу',
        angel_match: 'Соответствует / Не соответствует',
        vc_match: 'Соответствует / Не соответствует',
        strat_match: 'Соответствует / Не соответствует'
      });

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `Отчет_${data.name ? data.name.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '_') : 'Startup'}_SSI.docx`);
    } catch (error: any) {
      console.error("Docxtemplater Error:", error);
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors.map((e: any) => e.properties.explanation).join("\n");
        alert(`Ошибка в шаблоне:\n${errorMessages}`);
      } else {
        alert(`Ошибка при генерации отчета: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Отчет по стартапу (Word)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Генерация и выгрузка отчета по стартапу</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
          <FileArchive className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Загрузите ваш шаблон отчета</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Ваш проект одобрен научным руководителем, а индекс SSI ({ssiScore.toFixed(2)}) позволяет сформировать итоговый отчет.
        </p>
        
        <input 
          type="file" 
          accept=".docx" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        {!templateFile ? (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl shadow-sm border border-indigo-200 transition-all flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Выбрать файл шаблона (.docx)
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {templateFile.name}
              <button onClick={() => setTemplateFile(null)} className="ml-2 p-1 hover:bg-indigo-200 rounded-full text-indigo-500 hover:text-indigo-800">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={generateReport}
              disabled={isGenerating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Заполнить шаблон и скачать
            </button>
          </div>
        )}
        
        <p className="text-xs text-slate-400 mt-4 max-w-md">
          Система автоматически подставит данные вашего стартапа, оценки осей и значения индекса SSI в выбранный вами шаблон.
        </p>
      </div>
    </div>
  );
}
