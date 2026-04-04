import React, { useState } from 'react';
import AICommentGenerator from './AICommentGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download } from 'lucide-react';
import { downloadSingleReportPDF } from '@/utils/generateReportPDF';
import { getBand, bandColor } from '@/utils/bands';
import { getSubjectComment } from '@/utils/subjectComments';
import PremiumLock from '@/components/PremiumLock';
import { usePremium } from '@/hooks/use-premium';

const SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'english', label: 'English' },
  { key: 'kiswahili', label: 'Kiswahili' },
  { key: 'integrated_science', label: 'Integrated Science' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'social_studies', label: 'Social Studies' },
  { key: 'pretechnical_studies', label: 'Pre-Technical Studies' },
  { key: 'religious_studies', label: 'Religious Studies' },
  { key: 'creative_art', label: 'Creative Art' },
];

export function buildReportCardHTML(student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, headteacherComment, schoolLogoDataUrl, classTeacherDate, headteacherDate) {
  const total = SUBJECTS.reduce((sum, s) => sum + (Number(student[s.key]) || 0), 0);
  const avg = (total / SUBJECTS.length).toFixed(1);

  const rows = SUBJECTS.map((s) => {
    const mark = student[s.key];
    const band = student[`${s.key}_band`] || getBand(mark);
    const autoComment = getSubjectComment(s.key, band);
    return `<tr>
      <td>${s.label}</td>
      <td style="text-align:center">${mark !== null && mark !== undefined && mark !== '' ? mark : '—'}</td>
      <td class="band-${(band || '').toLowerCase()}" style="text-align:center">${band || '—'}</td>
      <td style="color:#222">${autoComment}</td>
    </tr>`;
  }).join('');

  return `
    <div class="page">
      <div class="card">
        <!-- HEADER: Logo centered above title -->
        <div class="header">
          ${schoolLogoDataUrl ? `<img src="${schoolLogoDataUrl}" class="school-logo" alt="School Logo" />` : ''}
          <div class="school-name">CBE PERFORMANCE REPORT CARD</div>
          <div class="sub-header">Competency Based Education (CBE) · Year ${new Date().getFullYear()}</div>
        </div>

        <!-- STUDENT NAME — prominent full-width row -->
        <div class="student-name-block">
          <span class="name-label">STUDENT NAME:</span>
          <span class="name-value">${student.name}</span>
        </div>

        <!-- OTHER INFO GRID -->
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Adm No:</span><span class="info-value">${student.admission_number || '—'}</span></div>
          <div class="info-row"><span class="info-label">Grade:</span><span class="info-value">${student.grade}</span></div>
          <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${student.class_name || profile?.class_name || '—'}</span></div>
          <div class="info-row"><span class="info-label">Term:</span><span class="info-value">${student.term}</span></div>
          <div class="info-row"><span class="info-label">Exam:</span><span class="info-value">${student.exam_type}</span></div>
          <div class="info-row"><span class="info-label">Rank:</span><span class="info-value">${rank} / ${totalStudents}</span></div>
          <div class="info-row"><span class="info-label">Average:</span><span class="info-value">${avg}</span></div>
        </div>

        <div class="dates-row">
          <span><strong>Opening Date:</strong> ${openingDate || '___________________________'}</span>
          <span><strong>Closing Date:</strong> ${closingDate || '___________________________'}</span>
        </div>

        <table>
          <colgroup>
            <col class="col-subj" /><col class="col-marks" /><col class="col-band" /><col class="col-rem" />
          </colgroup>
          <thead>
            <tr><th>Learning Area</th><th style="text-align:center">Marks<br/>(/100)</th><th style="text-align:center">Band</th><th>Remarks</th></tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="total-row"><td>TOTAL</td><td style="text-align:center">${total}</td><td>—</td><td></td></tr>
            <tr class="total-row"><td>AVERAGE</td><td style="text-align:center">${avg}</td><td>—</td><td></td></tr>
          </tbody>
        </table>

        <!-- CLASS TEACHER SECTION -->
        <div class="section-divider">Class Teacher</div>
        <p style="font-size:11px;font-weight:bold;margin:4px 0 2px;">Class Teacher's Comments:</p>
        <div class="comment-box">${comment || '&nbsp;'}</div>
        <table class="sig-table">
          <tr><td class="sig-lbl">Name:</td><td class="sig-val">${classTeacherName || ''}</td></tr>
          <tr><td class="sig-lbl">Signature:</td><td class="sig-val">&nbsp;</td></tr>
          <tr><td class="sig-lbl">Date:</td><td class="sig-val">${classTeacherDate || ''}</td></tr>
        </table>

        <!-- HEAD TEACHER SECTION -->
        <div class="section-divider headteacher">Head Teacher</div>
        <p style="font-size:11px;font-weight:bold;margin:4px 0 2px;">Head Teacher's Comments:</p>
        <div class="comment-box">${headteacherComment || '&nbsp;'}</div>
        <div style="display:flex;align-items:flex-start;gap:16px;">
          <table class="sig-table" style="width:60%;flex:1">
            <tr><td class="sig-lbl">Name:</td><td class="sig-val">${headteacherName || ''}</td></tr>
            <tr><td class="sig-lbl">Signature:</td><td class="sig-val">&nbsp;</td></tr>
            <tr><td class="sig-lbl">Date:</td><td class="sig-val">${headteacherDate || ''}</td></tr>
          </table>
          <div class="stamp-area">OFFICIAL<br/>STAMP</div>
        </div>

        <div class="footer">This report card is generated by LeonMud Performance Tracker</div>
      </div>
    </div>
  `;
}

export const REPORT_CARD_STYLES = `
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; background: #fff; color: #000; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .card { width: 100%; border: 2px solid #1e3a5f; padding: 14px 18px; }

  /* ── HEADER ── */
  .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 8px; margin-bottom: 10px; display: flex; flex-direction: column; align-items: center; }
  .school-logo { display: block; height: 75px; width: 75px; object-fit: contain; margin: 0 auto 6px; }
  .school-name { font-size: 17px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #1e3a5f; }
  .sub-header { font-size: 10px; color: #555; margin-top: 2px; }

  /* ── STUDENT NAME ── */
  .student-name-block { background: #1e3a5f; color: #fff; padding: 6px 10px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
  .name-label { font-size: 10px; font-weight: bold; white-space: nowrap; letter-spacing: 1px; opacity: 0.85; }
  .name-value { font-size: 16px; font-weight: bold; letter-spacing: 0.5px; flex: 1; }

  /* ── INFO GRID ── */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 16px; margin-bottom: 8px; font-size: 12px; }
  .info-row { display: flex; border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
  .info-label { font-weight: bold; white-space: nowrap; width: 75px; flex-shrink: 0; }
  .info-value { flex: 1; }

  /* ── DATES ── */
  .dates-row { display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 4px 0; margin-bottom: 8px; }

  /* ── TABLE ── */
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 10px; table-layout: fixed; }
  col.col-subj  { width: 22%; }
  col.col-marks { width: 12%; }
  col.col-band  { width: 10%; }
  col.col-rem   { width: 56%; }
  th { background: #1e3a5f; color: #fff; padding: 6px 6px; text-align: left; }
  td { padding: 8px 6px; border-bottom: 1px solid #e0e0e0; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; vertical-align: top; line-height: 1.75; height: auto; overflow: visible; }
  tr:nth-child(even) td { background: #f5f8ff; }
  .total-row td { font-weight: bold; background: #dde8ff !important; border-top: 2px solid #1e3a5f; }
  .band-ee1, .band-ee2 { color: #16a34a; font-weight: bold; }
  .band-me1, .band-me2 { color: #2563eb; font-weight: bold; }
  .band-ae1, .band-ae2 { color: #d97706; font-weight: bold; }
  .band-be1, .band-be2 { color: #dc2626; font-weight: bold; }

  /* ── SECTION DIVIDERS ── */
  .section-divider { background: #e8eef6; border-left: 4px solid #1e3a5f; padding: 3px 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1e3a5f; margin-bottom: 5px; margin-top: 10px; }
  .section-divider.headteacher { background: #fef3e8; border-left-color: #c2410c; color: #c2410c; }

  /* ── COMMENTS ── */
  .comment-box { border: 1px solid #bbb; min-height: 100px; padding: 10px 12px; margin-bottom: 8px; font-size: 11px; background: #fafafa; line-height: 1.7; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; overflow: hidden; box-sizing: border-box; width: 100%; }

  /* ── SIGNATURES (table-based for reliable print) ── */
  .sig-table { border-collapse: collapse; margin: 6px 0; font-size: 11.5px; }
  .sig-lbl { font-weight: bold; white-space: nowrap; width: 80px; padding: 6px 8px 6px 0; vertical-align: bottom; border-bottom: 1px solid #aaa; }
  .sig-val { border-bottom: 1px solid #aaa; padding: 6px 4px; min-width: 200px; }

  /* ── STAMP ── */
  .stamp-area { border: 2px dashed #aaa; height: 80px; width: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; text-align: center; color: #bbb; font-size: 8px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; border-radius: 50%; line-height: 1.4; margin-top: 4px; }

  /* ── FOOTER ── */
  .footer { text-align: center; font-size: 9px; color: #888; margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px; }
`;

export default function ReportCard({ student, rank, totalStudents, profile, openingDate, closingDate, schoolLogoDataUrl }) {
  const [comment, setComment] = useState('');
  const [headteacherComment, setHeadteacherComment] = useState('');
  const [headteacherName, setHeadteacherName] = useState('');
  const [classTeacherName, setClassTeacherName] = useState(profile?.full_name || '');
  const [classTeacherDate, setClassTeacherDate] = useState('');
  const [headteacherDate, setHeadteacherDate] = useState('');
  const { isPremium, isLoading: isPremiumLoading } = usePremium();

  const total = SUBJECTS.reduce((sum, s) => sum + (Number(student[s.key]) || 0), 0);
  const avg = (total / SUBJECTS.length).toFixed(1);

  const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const handlePrint = () => {
    const html = buildReportCardHTML(student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, headteacherComment, schoolLogoDataUrl, fmtDate(classTeacherDate), fmtDate(headteacherDate));
    const fullHtml = `<!DOCTYPE html><html><head><title>Report Card - ${student.name}</title><style>${REPORT_CARD_STYLES}</style></head><body>${html}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    win.onload = () => { setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 300); };
  };

  return (
    <div className="border border-border rounded-xl p-5 bg-card shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-base">{student.name}</p>
          <p className="text-xs text-muted-foreground">Adm: {student.admission_number || '—'} · Total: <span className="font-semibold">{total}</span> · Avg: <span className="font-semibold">{avg}</span></p>
        </div>
        <div className="flex gap-2 shrink-0">
          <PremiumLock isPremium={isPremium} isLoading={isPremiumLoading} feature="Print Report Cards" mode="overlay">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </PremiumLock>
          <PremiumLock isPremium={isPremium} isLoading={isPremiumLoading} feature="PDF Download" mode="overlay">
            <Button size="sm" onClick={() => downloadSingleReportPDF(student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment, fmtDate(classTeacherDate), fmtDate(headteacherDate))}>
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
          </PremiumLock>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-2 py-1.5 text-left">Learning Area</th>
              <th className="px-2 py-1.5 text-center">Marks</th>
              <th className="px-2 py-1.5 text-center">Band</th>
              <th className="px-2 py-1.5 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((s) => {
              const mark = student[s.key];
              const band = student[`${s.key}_band`] || getBand(mark);
              const autoComment = getSubjectComment(s.key, band);
              return (
                <tr key={s.key} className="border-b border-border/50">
                  <td className="px-2 py-1 font-medium">{s.label}</td>
                  <td className="px-2 py-1 text-center">{mark !== null && mark !== undefined && mark !== '' ? mark : '—'}</td>
                  <td className="px-2 py-1 text-center font-bold" style={{ color: bandColor(band) }}>{band || '—'}</td>
                  <td className="px-2 py-1 text-muted-foreground italic">{band ? autoComment : '—'}</td>
                </tr>
              );
            })}
            <tr className="bg-primary/10 font-bold">
              <td className="px-2 py-1">Total / Average</td>
              <td className="px-2 py-1 text-center">{total}</td>
              <td className="px-2 py-1 text-center">{avg}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-medium text-muted-foreground">Class Teacher's Comments</Label>
              <AICommentGenerator student={student} onCommentGenerated={setComment} />
            </div>
            <textarea className="w-full text-sm border border-input rounded-md px-3 py-2 resize-y bg-background focus:outline-none focus:ring-1 focus:ring-ring" rows={5} placeholder="Type a comment or click AI Generate for a detailed CBC comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-medium text-muted-foreground">Head Teacher's Comments <span className="text-muted-foreground/60">(optional)</span></Label>
              <PremiumLock isPremium={isPremium} isLoading={isPremiumLoading} feature="Head Teacher AI Comment" mode="overlay">
                <AICommentGenerator student={student} onCommentGenerated={setHeadteacherComment} role="headteacher" />
              </PremiumLock>
            </div>
            <PremiumLock isPremium={isPremium} isLoading={isPremiumLoading} feature="Head Teacher Comments" mode="overlay">
              <textarea className="w-full text-sm border border-input rounded-md px-3 py-2 resize-y bg-background focus:outline-none focus:ring-1 focus:ring-ring" rows={3} placeholder="Optional — leave blank or use AI Generate..." value={headteacherComment} onChange={(e) => isPremium && setHeadteacherComment(e.target.value)} readOnly={!isPremium} />
            </PremiumLock>
          </div>
        </div>

        {/* Signatures */}
        <div className="border border-border/60 rounded-lg p-3 bg-muted/20 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Signatures</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium">Class Teacher</p>
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input value={classTeacherName} onChange={(e) => setClassTeacherName(e.target.value)} className="mt-1 text-sm h-8" placeholder="Full name" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date Signed</Label>
                <input type="date" value={classTeacherDate} onChange={e => setClassTeacherDate(e.target.value)} className="flex h-8 mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium">Head Teacher</p>
              <PremiumLock isPremium={isPremium} isLoading={isPremiumLoading} feature="Head Teacher Signature" mode="overlay">
                <div className="space-y-2 w-full">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input value={headteacherName} onChange={(e) => setHeadteacherName(e.target.value)} className="mt-1 text-sm h-8" placeholder="Full name" readOnly={!isPremium} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date Signed</Label>
                    <input type="date" value={headteacherDate} onChange={e => setHeadteacherDate(e.target.value)} className="flex h-8 mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" readOnly={!isPremium} />
                  </div>
                </div>
              </PremiumLock>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}