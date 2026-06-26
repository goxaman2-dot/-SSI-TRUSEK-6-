import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { StartupData, CalculationResult } from './types';
import { getFactorInterpretations } from './utils';

export const generateDocx = async (data: StartupData, results: CalculationResult) => {
  const currentDate = new Date().toLocaleDateString('ru-RU');
  
  const factors = getFactorInterpretations(results.subfactors);

  // Capture the chart if it exists in the DOM
  let chartImageBytes: Uint8Array | null = null;
  let chartWidth = 0;
  let chartHeight = 0;
  
  try {
    const { toCanvas } = await import('html-to-image');
    const chartElement = document.getElementById('pdf-lily-chart');
    if (chartElement) {
      const canvas = await toCanvas(chartElement, {
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      chartImageBytes = bytes;
      
      // Calculate aspect ratio for word document (max width ~600px)
      chartWidth = 600;
      chartHeight = (canvas.height / canvas.width) * chartWidth;
    }
  } catch (e) {
    console.warn("Could not capture chart for DOCX", e);
  }

  const doc = new Document({
    creator: "SSI Navigator",
    title: `Отчет стартапа: ${data.name || 'Без названия'}`,
    description: "Академический отчет по ГОСТ",
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 28, // 14pt
          },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 360, // 1.5 line spacing
            },
            indent: {
              firstLine: 709, // 1.25 cm indent
            },
          },
        },
        heading1: {
          run: {
            font: "Times New Roman",
            size: 32,
            bold: true,
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
          },
        },
      },
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `Академический отчет: ${data.name || 'Без названия'}`,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          indent: { firstLine: 0 },
        }),
        new Paragraph({
          text: `Автор: ${data.author || 'Не указан'}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          indent: { firstLine: 0 },
        }),
        ...(data.expert ? [new Paragraph({
          text: `Научный руководитель: ${data.expert}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          indent: { firstLine: 0 },
        })] : [new Paragraph({
          text: `Научный руководитель: Не указан`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          indent: { firstLine: 0 },
        })]),

        new Paragraph({
          text: "1. Прогноз самодостаточности бизнес идеи стартапа на основе модели SSI",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Финальный индекс SSI: ", bold: true }),
            new TextRun(`${results.finalSsi.toFixed(2)} из 10.0 возможных`),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Интерпретация результатов: ", bold: true }),
            new TextRun(results.interpretation),
          ],
          spacing: { after: 400 },
        }),

        new Paragraph({
          text: "2. Оценка по факторам (Модель TRUSEK-6)",
          heading: HeadingLevel.HEADING_1,
        }),
        ...factors.map(f => (
          new Paragraph({
            children: [
              new TextRun({ text: `${f.name}: `, bold: true }),
              new TextRun({ text: `${f.score.toFixed(1)} / 10\n`, bold: true }),
              new TextRun(`Описание: ${f.desc}\n`),
              new TextRun(`Статус: ${f.statusLabel}\n`),
              new TextRun(`Рекомендация: ${f.advice}`),
            ],
            spacing: { after: 200 }
          })
        )),

        new Paragraph({
          text: "3. Рыночные показатели и порог автономии (TAV)",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: `TAM (Общий объем целевого рынка): ${data.tam} млн. руб.` }),
        new Paragraph({ text: `SAM (Доступный объем рынка): ${data.sam} млн. руб.` }),
        new Paragraph({ text: `SOM (Реально достижимый объем рынка): ${data.som} млн. руб.` }),
        new Paragraph({ 
          text: `TAV (Порог автономии): ${data.tav} млн. руб.`, 
          spacing: { after: 120 } 
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Анализ TAV: ", bold: true }),
            new TextRun(`Порог автономии представляет собой минимально необходимый объем годовой маржинальной прибыли для покрытия всех OPEX расходов бизнеса. При достижимом рынке (SOM) в размере ${data.som} млн. руб. и заявленном пороге автономии (TAV) в ${data.tav} млн. руб. оценивается реальная перспектива самоокупаемости и устойчивости стартапа.`),
          ],
          spacing: { after: 400 }
        }),
        
        new Paragraph({
          text: "4. Визуализация результатов (Графики и диаграммы)",
          heading: HeadingLevel.HEADING_1,
        }),
        ...(chartImageBytes ? [
          new Paragraph({
            children: [
              new ImageRun({
                data: chartImageBytes,
                transformation: {
                  width: chartWidth,
                  height: chartHeight,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            indent: { firstLine: 0 },
          })
        ] : [
          new Paragraph({
            text: "[График недоступен для экспорта]",
            alignment: AlignmentType.CENTER,
            indent: { firstLine: 0 },
          })
        ]),
        new Paragraph({
          text: "Рисунок 1 – Оценка стартапа по факторам TRUSEK-6",
          alignment: AlignmentType.CENTER,
          indent: { firstLine: 0 },
          spacing: { after: 400 },
          run: { italic: true }
        }),

        new Paragraph({
          text: "5. Выявленные резервы роста",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: `Количество рекомендаций: ${results.reservesCount}`, spacing: { after: 800 } }),

        new Paragraph({ text: "Отчет составлен:", bold: true, indent: { firstLine: 0 } }),
        new Paragraph({ text: `Дата: ${currentDate}`, indent: { firstLine: 0 } }),
        new Paragraph({ text: "Подпись эксперта технопарка: ___________________", indent: { firstLine: 0 }, spacing: { before: 200 } }),
        new Paragraph({ text: "Подпись научного руководителя: _________________", indent: { firstLine: 0 }, spacing: { before: 200 } }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const sanitizedName = (data.name || "startup_report")
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, "_")
    .substring(0, 50);
  saveAs(blob, `${sanitizedName}_SSI_Report.docx`);
};
