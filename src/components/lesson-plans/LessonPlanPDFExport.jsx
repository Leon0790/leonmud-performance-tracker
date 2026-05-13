import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Printer, FileText } from 'lucide-react';

const BASE_CSS = `
  @page { size: A4; margin: 15mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; background: #fff; color: #000; font-size: 11px; }
  .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 8px; margin-bottom: 10px; }
  .header h1 { font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #1e3a5f; margin: 0 0 2px; }
  .header p { font-size: 9px; color: #555; margin: 0; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .info-table td, .info-table th { border: 1.5px solid #1e3a5f; padding: 5px 7px; }
  .info-table th { background: #1e3a5f; color: #fff; font-size: 10px; font-weight: bold; text-transform: uppercase; }
  .section-label { font-weight: bold; font-size: 11px; text-decoration: underline; margin: 10px 0 3px; }
  .section-body { margin: 0 0 6px; line-height: 1.7; white-space: pre-wrap; word-wrap: break-word; }
  .time-content-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .time-content-table th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
  .time-content-table td { border: 1px solid #ccc; padding: 8px; vertical-align: top; line-height: 1.7; white-space: pre-wrap; word-wrap: break-word; }
  .time-col { width: 22%; font-weight: bold; font-size: 10px; }
  .reflection-lines p { border-bottom: 1px solid #888; height: 18px; margin: 0; }
  .footer { text-align: center; font-size: 8px; color: #888; margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px; }
`;

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getDurations(plan) {
  const total = Number(plan.duration) || 40;
  const intro = Math.round(total * 0.15);
  const dev = Math.round(total * 0.6);
  const conc = total - intro - dev;
  return { total, intro, dev, conc };
}

function getV2StepMins(plan) {
  const FRACTIONS = { v2_introduction: 0.125, v2_grapple: 0.125, v2_mini_lesson: 0.325, v2_guided_practice: 0.25, v2_work_time: 0.10, v2_debrief: 0.075 };
  const d = Number(plan.duration) || 40;
  const s = {};
  let used = 0;
  const keys = Object.keys(FRACTIONS);
  keys.forEach((k, i) => {
    if (i === keys.length - 1) { s[k] = d - used; }
    else { s[k] = Math.round(d * FRACTIONS[k]); used += s[k]; }
  });
  return s;
}

// ─── V1 HTML ───────────────────────────────────────────────────────────────
function buildV1HTML(plan) {
  const { total, intro, dev, conc } = getDurations(plan);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lesson Plan</title><style>${BASE_CSS}</style></head><body>
  <div class="header">
    <h1>${esc(plan.school_name || 'CBE LESSON PLAN')}</h1>
    <p>${esc(plan.grade)} · ${esc(plan.subject)} · ${esc(plan.term)} · Week ${plan.week} Lesson ${plan.lesson} · ${new Date().getFullYear()}</p>
  </div>
  <table class="info-table">
    <tr><th>SCHOOL</th><th>LEVEL</th><th>LEARNING AREA</th><th>DATE</th><th>TIME</th><th>ROLL</th></tr>
    <tr>
      <td>${esc(plan.school_name || '')}</td>
      <td><strong>${esc(plan.grade)}</strong></td>
      <td><strong>${esc(plan.subject)}</strong></td>
      <td></td><td>${total} min</td><td></td>
    </tr>
  </table>
  ${plan.teacher_name ? `<p class="section-label">Teacher: <span style="font-weight:normal;text-decoration:none">${esc(plan.teacher_name)}</span></p>` : ''}
  <p class="section-label">STRAND: ${esc(plan.strand)}</p>
  <p class="section-label" style="font-size:11px">Sub Strand: ${esc(plan.sub_strand)}</p>
  <p class="section-label">Specific Learning Outcomes:</p>
  <p class="section-body">${esc(plan.specific_outcomes)}</p>
  ${plan.core_competency ? `<p class="section-label">Core Competency:</p><p class="section-body">${esc(plan.core_competency)}</p>` : ''}
  <p class="section-label">Key Inquiry Question</p>
  <p class="section-body">${esc(plan.key_inquiry_question)}</p>
  <p class="section-label">Learning Resources:</p>
  <p class="section-body">${esc(plan.learning_resources)}</p>
  <p class="section-label">Organisation of Learning:</p>
  <p class="section-body">${esc(plan.organization_of_learning)}</p>
  <table class="time-content-table">
    <tr><th style="width:22%">TIME</th><th>CONTENT</th></tr>
    <tr>
      <td class="time-col">${intro} minutes</td>
      <td><strong>Introduction</strong><br/>${esc(plan.introduction)}</td>
    </tr>
    <tr>
      <td class="time-col">${dev} minutes</td>
      <td><strong>Lesson Development</strong><br/>${esc(plan.lesson_development)}${plan.extended_activities ? '\n\n<strong>Extended Activities</strong>\n' + esc(plan.extended_activities) : ''}</td>
    </tr>
    <tr>
      <td class="time-col">${conc} minutes</td>
      <td><strong>Conclusion</strong><br/>${esc(plan.conclusion)}</td>
    </tr>
  </table>
  ${plan.reflection ? `<p class="section-label">Teacher's Notes / Reflection:</p><p class="section-body">${esc(plan.reflection)}</p>` : ''}
  <p class="section-label">Reflection in the Lesson / Self-Remarks:</p>
  <div class="reflection-lines">${Array(6).fill('<p></p>').join('')}</div>
  <div class="footer">Generated by LeonMud Performance Tracker · CBE Lesson Plan</div>
</body></html>`;
}

// ─── V2 HTML ───────────────────────────────────────────────────────────────
function buildV2HTML(plan) {
  const total = Number(plan.duration) || 40;
  const mins = getV2StepMins(plan);
  const steps = [
    { key: 'v2_introduction', label: 'INTRODUCTION', mins: mins.v2_introduction },
    { key: 'v2_grapple', label: 'GRAPPLE', mins: mins.v2_grapple },
    { key: 'v2_mini_lesson', label: 'MINI-LESSON', mins: mins.v2_mini_lesson },
    { key: 'v2_guided_practice', label: 'GUIDED PRACTICE', mins: mins.v2_guided_practice },
    { key: 'v2_work_time', label: 'WORK-TIME', mins: mins.v2_work_time },
    { key: 'v2_debrief', label: 'DEBRIEF', mins: mins.v2_debrief },
  ];

  const stepRows = steps.map(s => `
    <tr>
      <td class="time-col"><strong>${s.label}</strong><br/>(${s.mins} MINS)</td>
      <td>${esc(plan[s.key] || '')}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lesson Plan V2</title><style>${BASE_CSS}</style></head><body>
  <div class="header">
    <h1>${esc(plan.school_name || 'CBE LESSON PLAN')}</h1>
    <p>${esc(plan.grade)} · ${esc(plan.subject)} · ${esc(plan.term)} · Week ${plan.week} Lesson ${plan.lesson} · ${new Date().getFullYear()}</p>
  </div>
  <table class="info-table">
    <tr><th>NAME</th><th>SUBJECT</th><th>DATE</th><th>TIME</th><th>ROLL</th></tr>
    <tr>
      <td><strong>${esc(plan.teacher_name || '')}</strong></td>
      <td><strong>${esc(plan.subject)}</strong></td>
      <td></td><td>${total} min</td><td></td>
    </tr>
  </table>
  <p class="section-label">BIG IDEA: <span style="font-weight:normal;text-decoration:none">${esc(plan.big_idea || plan.strand)}</span></p>
  <p class="section-label">STRAND: <span style="font-weight:normal;text-decoration:none">${esc(plan.strand)}</span></p>
  <p class="section-label">SUBSTRAND: <span style="font-weight:normal;text-decoration:none">${esc(plan.sub_strand)}</span></p>
  ${plan.mission_vision ? `<p class="section-label">MISSION/VISION: <span style="font-weight:normal;text-decoration:none">${esc(plan.mission_vision)}</span></p>` : ''}
  ${plan.lesson_target ? `<p class="section-label">Lesson Target: <span style="font-weight:normal;text-decoration:none;font-style:italic">${esc(plan.lesson_target)}</span></p>` : ''}
  ${plan.core_competency ? `<p class="section-label">Core Competency: <span style="font-weight:normal;text-decoration:none">${esc(plan.core_competency)}</span></p>` : ''}
  <p class="section-label">Learning Resources: <span style="font-weight:normal;text-decoration:none">${esc(plan.learning_resources)}</span></p>
  <table class="time-content-table">
    <tr><th style="width:22%">STEPS</th><th>LESSON PROGRESSION</th></tr>
    ${stepRows}
  </table>
  ${plan.reflection ? `<p class="section-label">REFLECTION:</p><p class="section-body">${esc(plan.reflection)}</p>` : `<p class="section-label">REFLECTION:</p><div class="reflection-lines">${Array(4).fill('<p></p>').join('')}</div>`}
  <div class="footer">Generated by LeonMud Performance Tracker · CBE Lesson Plan V2</div>
</body></html>`;
}

// ─── V1 Word XML ───────────────────────────────────────────────────────────
function buildV1Word(plan) {
  const w = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
  const { total, intro, dev, conc } = getDurations(plan);
  const row = (time, label, content, extra = '') => `
    <w:tr>
      <w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${w(time)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${w(label)}</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">${w(content)}</w:t></w:r></w:p>${extra}</w:tc>
    </w:tr>`;
  const ext = plan.extended_activities ? `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Extended Activities</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">${w(plan.extended_activities)}</w:t></w:r></w:p>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
<w:body>
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${w(plan.school_name || 'CBE LESSON PLAN')}</w:t></w:r></w:p>
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${w(plan.grade)} · ${w(plan.subject)} · ${w(plan.term)} · Week ${plan.week} Lesson ${plan.lesson}</w:t></w:r></w:p>
  ${plan.teacher_name ? `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Teacher: </w:t></w:r><w:r><w:t>${w(plan.teacher_name)}</w:t></w:r></w:p>` : ''}
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Duration: ${total} minutes</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>STRAND: </w:t></w:r><w:r><w:t>${w(plan.strand)}</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Sub Strand: </w:t></w:r><w:r><w:t>${w(plan.sub_strand)}</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>Specific Learning Outcomes:</w:t></w:r></w:p>
  <w:p><w:r><w:t xml:space="preserve">${w(plan.specific_outcomes)}</w:t></w:r></w:p>
  ${plan.core_competency ? `<w:p><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>Core Competency:</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">${w(plan.core_competency)}</w:t></w:r></w:p>` : ''}
  <w:p><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>Key Inquiry Question:</w:t></w:r></w:p>
  <w:p><w:r><w:t xml:space="preserve">${w(plan.key_inquiry_question)}</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>Learning Resources:</w:t></w:r></w:p>
  <w:p><w:r><w:t xml:space="preserve">${w(plan.learning_resources)}</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>Organisation of Learning:</w:t></w:r></w:p>
  <w:p><w:r><w:t xml:space="preserve">${w(plan.organization_of_learning)}</w:t></w:r></w:p>
  <w:tbl>
    <w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>
      <w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/>
    </w:tblBorders></w:tblPr>
    <w:tr>
      <w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>TIME</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>CONTENT</w:t></w:r></w:p></w:tc>
    </w:tr>
    ${row(`${intro} minutes`, 'Introduction', plan.introduction)}
    ${row(`${dev} minutes`, 'Lesson Development', plan.lesson_development, ext)}
    ${row(`${conc} minutes`, 'Conclusion', plan.conclusion)}
  </w:tbl>
  ${plan.reflection ? `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Reflection:</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">${w(plan.reflection)}</w:t></w:r></w:p>` : ''}
  <w:p><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>Reflection in the Lesson / Self-Remarks:</w:t></w:r></w:p>
  <w:p><w:r><w:t>&#160;</w:t></w:r></w:p><w:p><w:r><w:t>&#160;</w:t></w:r></w:p><w:p><w:r><w:t>&#160;</w:t></w:r></w:p>
</w:body></w:wordDocument>`;
}

// ─── V2 Word XML ───────────────────────────────────────────────────────────
function buildV2Word(plan) {
  const w = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
  const total = Number(plan.duration) || 40;
  const mins = getV2StepMins(plan);
  const steps = [
    { key: 'v2_introduction', label: 'INTRODUCTION', mins: mins.v2_introduction },
    { key: 'v2_grapple', label: 'GRAPPLE', mins: mins.v2_grapple },
    { key: 'v2_mini_lesson', label: 'MINI-LESSON', mins: mins.v2_mini_lesson },
    { key: 'v2_guided_practice', label: 'GUIDED PRACTICE', mins: mins.v2_guided_practice },
    { key: 'v2_work_time', label: 'WORK-TIME', mins: mins.v2_work_time },
    { key: 'v2_debrief', label: 'DEBRIEF', mins: mins.v2_debrief },
  ];
  const stepRows = steps.map(s => `
    <w:tr>
      <w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${s.label} (${s.mins} MINS)</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t xml:space="preserve">${w(plan[s.key] || '')}</w:t></w:r></w:p></w:tc>
    </w:tr>`).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
<w:body>
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${w(plan.school_name || 'CBE LESSON PLAN')}</w:t></w:r></w:p>
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${w(plan.grade)} · ${w(plan.subject)} · ${w(plan.term)} · Week ${plan.week} Lesson ${plan.lesson}</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Name: </w:t></w:r><w:r><w:t>${w(plan.teacher_name || '')}</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Duration: ${total} minutes</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>BIG IDEA: </w:t></w:r><w:r><w:t>${w(plan.big_idea || plan.strand)}</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>STRAND: </w:t></w:r><w:r><w:t>${w(plan.strand)}</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>SUBSTRAND: </w:t></w:r><w:r><w:t>${w(plan.sub_strand)}</w:t></w:r></w:p>
  ${plan.mission_vision ? `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>MISSION/VISION: </w:t></w:r><w:r><w:t xml:space="preserve">${w(plan.mission_vision)}</w:t></w:r></w:p>` : ''}
  ${plan.lesson_target ? `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Lesson Target: </w:t></w:r><w:r><w:t xml:space="preserve">${w(plan.lesson_target)}</w:t></w:r></w:p>` : ''}
  ${plan.core_competency ? `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Core Competency: </w:t></w:r><w:r><w:t xml:space="preserve">${w(plan.core_competency)}</w:t></w:r></w:p>` : ''}
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Learning Resources: </w:t></w:r><w:r><w:t xml:space="preserve">${w(plan.learning_resources)}</w:t></w:r></w:p>
  <w:tbl>
    <w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>
      <w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/>
    </w:tblBorders></w:tblPr>
    <w:tr>
      <w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>STEPS</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>LESSON PROGRESSION</w:t></w:r></w:p></w:tc>
    </w:tr>
    ${stepRows}
  </w:tbl>
  <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>REFLECTION:</w:t></w:r></w:p>
  <w:p><w:r><w:t xml:space="preserve">${w(plan.reflection || '')}</w:t></w:r></w:p>
  <w:p><w:r><w:t>&#160;</w:t></w:r></w:p><w:p><w:r><w:t>&#160;</w:t></w:r></w:p>
</w:body></w:wordDocument>`;
}

export default function LessonPlanPDFExport({ plan, onClose }) {
  const isV2 = plan.plan_version === 'v2';

  const handlePrint = () => {
    const html = isV2 ? buildV2HTML(plan) : buildV1HTML(plan);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    win.onload = () => { setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 400); };
  };

  const handleDownloadHTML = () => {
    const html = isV2 ? buildV2HTML(plan) : buildV1HTML(plan);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LessonPlan_${plan.grade}_${plan.subject}_Wk${plan.week}L${plan.lesson}.html`.replace(/\s+/g, '_');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    const xml = isV2 ? buildV2Word(plan) : buildV1Word(plan);
    const blob = new Blob([xml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LessonPlan_${plan.grade}_${plan.subject}_Wk${plan.week}L${plan.lesson}.doc`.replace(/\s+/g, '_');
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Export Lesson Plan</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {plan.grade} · {plan.subject} · {plan.term} · Wk {plan.week} L{plan.lesson} · {plan.duration || 40} min
          {isV2 && <span className="ml-1 text-primary font-semibold">· V2</span>}
        </p>
        <div className="space-y-2">
          <Button className="w-full gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </Button>
          <Button className="w-full gap-2" variant="outline" onClick={handleDownloadWord}>
            <FileText className="w-4 h-4" /> Download Word Document (.doc)
          </Button>
          <Button className="w-full gap-2" variant="ghost" onClick={handleDownloadHTML}>
            <Download className="w-4 h-4" /> Download HTML File
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Use "Print → Save as PDF" in your browser for best results.
        </p>
      </div>
    </div>
  );
}