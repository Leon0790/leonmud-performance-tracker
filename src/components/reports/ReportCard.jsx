import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download } from 'lucide-react';
import { downloadSingleReportPDF } from '@/utils/generateReportPDF';
import { getBand, bandColor } from '@/utils/bands';

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

  const rows = SUBJECTS.map((s, i) => {
    const mark = student[s.key];
    const band = student[`${s.key}_band`] || getBand(mark);
    return `<tr>
      <td>${i + 1}</td>
      <td>${s.label}</td>
      <td>${mark !== null && mark !== undefined && mark !== '' ? mark : '—'}</td>
      <td class="band-${(band || '').toLowerCase()}">${band || '—'}</td>
    </tr>`;
  }).join('');

  return `
    <div class="page">
      <div class="card">
        <!-- HEADER: Logo centered above title -->
        <div class="header">
          ${schoolLogoDataUrl ? `<img src="${schoolLogoDataUrl}" class="school-logo" alt="School Logo" />` : ''}
          <div class="school-name">CBC PERFORMANCE REPORT CARD</div>
          <div class="sub-header">Competency Based Curriculum (CBC) · Year ${new Date().getFullYear()}</div>
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
          <thead>
            <tr><th>#</th><th>Learning Area</th><th>Marks (/100)</th><th>Band</th></tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="total-row"><td colspan="2">TOTAL</td><td>${total}</td><td>—</td></tr>
            <tr class="total-row"><td colspan="2">AVERAGE</td><td>${avg}</td><td>—</td></tr>
          </tbody>
        </table>

        <!-- CLASS TEACHER SECTION -->
        <div class="section-divider">Class Teacher</div>
        <div class="comments-section">
          <strong>Class Teacher's Comments:</strong>
          <div class="comment-box">${comment || ''}</div>
        </div>
        <div class="sig-row-standalone">
          <div class="sig-row-line"><span class="sig-field-label">Name:</span><span class="sig-field-value">${classTeacherName || '___________________________________'}</span></div>
          <div class="sig-row-line"><span class="sig-field-label">Signature:</span><span class="sig-field-value">___________________________________</span></div>
          <div class="sig-row-line"><span class="sig-field-label">Date:</span><span class="sig-field-value">${classTeacherDate || '___________________________________'}</span></div>
        </div>

        <!-- HEAD TEACHER SECTION — clearly separated -->
        <div class="section-divider headteacher">Head Teacher</div>
        <div class="comments-section">
          <strong>Head Teacher's Comments:</strong>
          <div class="comment-box">${headteacherComment || ''}</div>
        </div>
        <div class="ht-sig-stamp-row">
          <div class="sig-row-standalone flex-sig">
            <div class="sig-row-line"><span class="sig-field-label">Name:</span><span class="sig-field-value">${headteacherName || '___________________________________'}</span></div>
            <div class="sig-row-line"><span class="sig-field-label">Signature:</span><span class="sig-field-value">___________________________________</span></div>
            <div class="sig-row-line"><span class="sig-field-label">Date:</span><span class="sig-field-value">${headteacherDate || '___________________________________'}</span></div>
          </div>
          <div class="stamp-block-center">
            <div class="stamp-area">OFFICIAL<br/>STAMP</div>
          </div>
        </div>

        <div class="footer">This report card is generated by LeonMud Performance Tracker</div>
      </div>
    </div>
  `;
}

export const REPORT_CARD_STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; background: #fff; color: #000; }
  .page { page-break-after: always; display: flex; justify-content: center; align-items: flex-start; padding: 0; }
  .page:last-child { page-break-after: auto; }
  .card { width: 100%; max-width: 700px; border: 2px solid #1e3a5f; padding: 18px 22px; }

  /* ── HEADER ── */
  .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 14px; display: flex; flex-direction: column; align-items: center; }
  .school-logo { display: block; height: 90px; width: 90px; object-fit: contain; margin: 0 auto 8px; }
  .school-name { font-size: 20px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #1e3a5f; }
  .sub-header { font-size: 11px; color: #555; margin-top: 3px; }

  /* ── STUDENT NAME — big & bold ── */
  .student-name-block { background: #1e3a5f; color: #fff; padding: 8px 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
  .name-label { font-size: 11px; font-weight: bold; white-space: nowrap; letter-spacing: 1px; opacity: 0.85; }
  .name-value { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; flex: 1; }

  /* ── INFO GRID ── */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 10px; font-size: 13px; }
  .info-row { display: flex; border-bottom: 1px dotted #ccc; padding-bottom: 3px; }
  .info-label { font-weight: bold; white-space: nowrap; width: 80px; flex-shrink: 0; }
  .info-value { flex: 1; }

  /* ── DATES ── */
  .dates-row { display: flex; justify-content: space-between; font-size: 12px; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 5px 0; margin-bottom: 10px; }

  /* ── TABLE ── */
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
  th { background: #1e3a5f; color: #fff; padding: 7px 10px; text-align: left; }
  td { padding: 5px 10px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f5f8ff; }
  .total-row td { font-weight: bold; background: #dde8ff !important; border-top: 2px solid #1e3a5f; }
  .band-ee1, .band-ee2 { color: #16a34a; font-weight: bold; }
  .band-me1, .band-me2 { color: #2563eb; font-weight: bold; }
  .band-ae1, .band-ae2 { color: #d97706; font-weight: bold; }
  .band-be1, .band-be2 { color: #dc2626; font-weight: bold; }

  /* ── SECTION DIVIDERS ── */
  .section-divider { background: #e8eef6; border-left: 4px solid #1e3a5f; padding: 4px 10px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1e3a5f; margin-bottom: 6px; margin-top: 12px; }
  .section-divider.headteacher { background: #fef3e8; border-left-color: #c2410c; color: #c2410c; }

  /* ── COMMENTS ── */
  .comments-section { font-size: 13px; margin-bottom: 8px; }
  .comment-box { border: 1px solid #bbb; min-height: 48px; padding: 6px 8px; margin-top: 4px; font-size: 13px; background: #fafafa; }

  /* ── SIGNATURES ── */
  .sig-row-standalone { font-size: 12px; margin-bottom: 6px; }
  .sig-row-line { display: flex; gap: 4px; margin-bottom: 7px; align-items: baseline; border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
  .sig-field-label { font-weight: bold; white-space: nowrap; min-width: 75px; }
  .sig-field-value { flex: 1; }

  /* ── HEAD TEACHER ROW (sigs + stamp side by side) ── */
  .ht-sig-stamp-row { display: flex; align-items: flex-start; gap: 20px; }
  .flex-sig { flex: 1; }
  .stamp-block-center { width: 110px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 4px; }
  .stamp-area { border: 2px dashed #aaa; height: 90px; width: 90px; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 9px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; border-radius: 50%; text-align: center; line-height: 1.4; }

  /* ── FOOTER ── */
  .footer { text-align: center; font-size: 10px; color: #888; margin-top: 14px; border-top: 1px solid #eee; padding-top: 6px; }
`;

export default function ReportCard({ student, rank, totalStudents, profile, openingDate, closingDate, schoolLogoDataUrl }) {
  const [comment, setComment] = useState('');
  const [headteacherComment, setHeadteacherComment] = useState('');
  const [headteacherName, setHeadteacherName] = useState('');
  const [classTeacherName, setClassTeacherName] = useState(profile?.full_name || '');
  const [classTeacherDate, setClassTeacherDate] = useState('');
  const [headteacherDate, setHeadteacherDate] = useState('');

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
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button size="sm" onClick={() => downloadSingleReportPDF(student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment, fmtDate(classTeacherDate), fmtDate(headteacherDate))}>
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-2 py-1.5 text-left">Learning Area</th>
              <th className="px-2 py-1.5">Marks</th>
              <th className="px-2 py-1.5">Band</th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((s) => {
              const mark = student[s.key];
              const band = student[`${s.key}_band`] || getBand(mark);
              return (
                <tr key={s.key} className="border-b border-border/50">
                  <td className="px-2 py-1">{s.label}</td>
                  <td className="px-2 py-1 text-center">{mark !== null && mark !== undefined && mark !== '' ? mark : '—'}</td>
                  <td className="px-2 py-1 text-center font-bold" style={{ color: bandColor(band) }}>{band || '—'}</td>
                </tr>
              );
            })}
            <tr className="bg-primary/10 font-bold">
              <td className="px-2 py-1">Total / Average</td>
              <td className="px-2 py-1 text-center">{total}</td>
              <td className="px-2 py-1 text-center">{avg}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Class Teacher's Comments</Label>
            <textarea className="w-full mt-1 text-sm border border-input rounded-md px-3 py-2 resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="Enter class teacher comments..." value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Head Teacher's Comments</Label>
            <textarea className="w-full mt-1 text-sm border border-input rounded-md px-3 py-2 resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="Enter head teacher comments..." value={headteacherComment} onChange={(e) => setHeadteacherComment(e.target.value)} />
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
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input value={headteacherName} onChange={(e) => setHeadteacherName(e.target.value)} className="mt-1 text-sm h-8" placeholder="Full name" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date Signed</Label>
                <input type="date" value={headteacherDate} onChange={e => setHeadteacherDate(e.target.value)} className="flex h-8 mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}