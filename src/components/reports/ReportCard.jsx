import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer } from 'lucide-react';

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

function getBand(score) {
  if (score === null || score === undefined || score === '') return '';
  const n = Number(score);
  if (n >= 75) return 'EE';
  if (n >= 50) return 'ME';
  if (n >= 25) return 'AE';
  return 'BE';
}

function bandColor(band) {
  if (band === 'EE') return '#16a34a';
  if (band === 'ME') return '#2563eb';
  if (band === 'AE') return '#d97706';
  if (band === 'BE') return '#dc2626';
  return '#000';
}

export default function ReportCard({ student, rank, totalStudents, profile, openingDate, closingDate }) {
  const [comment, setComment] = useState('');
  const [headteacherName, setHeadteacherName] = useState('');
  const [classTeacherName, setClassTeacherName] = useState(profile?.full_name || '');

  const total = SUBJECTS.reduce((sum, s) => sum + (Number(student[s.key]) || 0), 0);
  const avg = (total / SUBJECTS.length).toFixed(1);

  const handlePrint = () => {
    const printContent = document.getElementById(`report-card-${student.id}`);
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Report Card - ${student.name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; color: #000; }
          .card { max-width: 700px; margin: 0 auto; border: 2px solid #000; padding: 24px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { font-size: 20px; font-weight: bold; margin: 0; }
          .header h2 { font-size: 16px; font-weight: normal; margin: 4px 0 0; }
          .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
          th { background: #1e3a5f; color: #fff; padding: 7px 10px; text-align: left; }
          td { padding: 6px 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) td { background: #f5f8ff; }
          .band-ee { color: #16a34a; font-weight: bold; }
          .band-me { color: #2563eb; font-weight: bold; }
          .band-ae { color: #d97706; font-weight: bold; }
          .band-be { color: #dc2626; font-weight: bold; }
          .total-row td { font-weight: bold; background: #e8f0fe !important; }
          .comment-box { border: 1px solid #999; padding: 8px; min-height: 50px; margin: 8px 0; font-size: 13px; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px; }
          .sig-block { text-align: center; width: 45%; }
          .sig-line { border-top: 1px solid #000; margin-top: 30px; padding-top: 4px; }
          .dates-row { display: flex; justify-content: space-between; font-size: 12px; margin: 10px 0; }
          .rank-badge { display: inline-block; background: #1e3a5f; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="school-name">CBC Performance Report Card</div>
            <div style="font-size:13px; margin-top:4px;">Competency Based Curriculum (CBC)</div>
          </div>
          <div class="info-row"><span class="info-label">Student Name:</span> <span>${student.name}</span> <span class="info-label">Adm No:</span> <span>${student.admission_number || '—'}</span></div>
          <div class="info-row"><span class="info-label">Grade:</span> <span>${student.grade}</span> <span class="info-label">Class:</span> <span>${student.class_name || profile?.class_name || '—'}</span></div>
          <div class="info-row"><span class="info-label">Term:</span> <span>${student.term}</span> <span class="info-label">Exam:</span> <span>${student.exam_type}</span></div>
          <div class="info-row"><span class="info-label">Year:</span> <span>${new Date().getFullYear()}</span> <span class="info-label">Rank:</span> <span class="rank-badge">${rank} / ${totalStudents}</span></div>
          <div class="dates-row">
            <span><strong>Opening Date:</strong> ${openingDate || '_______________'}</span>
            <span><strong>Closing Date:</strong> ${closingDate || '_______________'}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Learning Area</th>
                <th>Band</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              ${SUBJECTS.map((s, i) => {
                const mark = student[s.key];
                const band = student[`${s.key}_band`] || getBand(mark);
                const bandClass = band ? `band-${band.toLowerCase()}` : '';
                return `<tr>
                  <td>${i + 1}</td>
                  <td>${s.label}</td>
                  <td class="${bandClass}">${band || '—'}</td>
                  <td>${mark !== null && mark !== undefined ? mark : '—'}</td>
                </tr>`;
              }).join('')}
              <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td>—</td>
                <td>${total}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2">AVERAGE</td>
                <td>—</td>
                <td>${avg}</td>
              </tr>
            </tbody>
          </table>
          <div style="font-size:13px; margin-top:10px;"><strong>Class Teacher's Comments:</strong></div>
          <div class="comment-box">${comment || ''}</div>
          <div class="sig-row">
            <div class="sig-block">
              <div class="sig-line">Class Teacher: ${classTeacherName || '_________________'}</div>
            </div>
            <div class="sig-block">
              <div class="sig-line">Head Teacher: ${headteacherName || '_________________'}</div>
            </div>
          </div>
          <div style="text-align:center; font-size:11px; margin-top:16px; color:#555;">This report card is computer-generated by LeonMud Performance Tracker</div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="border border-border rounded-xl p-5 bg-card shadow-sm space-y-4">
      {/* Preview header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-base">{student.name}</p>
          <p className="text-xs text-muted-foreground">Adm: {student.admission_number || '—'} · Rank: <span className="font-semibold text-primary">{rank}/{totalStudents}</span></p>
        </div>
        <Button size="sm" onClick={handlePrint} className="shrink-0">
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
      </div>

      {/* Marks preview */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-2 py-1.5 text-left">Learning Area</th>
              <th className="px-2 py-1.5">Band</th>
              <th className="px-2 py-1.5">Marks</th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((s) => {
              const mark = student[s.key];
              const band = student[`${s.key}_band`] || getBand(mark);
              return (
                <tr key={s.key} className="border-b border-border/50">
                  <td className="px-2 py-1">{s.label}</td>
                  <td className="px-2 py-1 text-center font-bold" style={{ color: bandColor(band) }}>{band || '—'}</td>
                  <td className="px-2 py-1 text-center">{mark !== null && mark !== undefined ? mark : '—'}</td>
                </tr>
              );
            })}
            <tr className="bg-primary/10 font-bold">
              <td className="px-2 py-1">Total</td>
              <td className="px-2 py-1 text-center">—</td>
              <td className="px-2 py-1 text-center">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comments & names */}
      <div className="space-y-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Class Teacher's Comments</label>
          <textarea
            className="w-full mt-1 text-sm border border-input rounded-md px-3 py-2 resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            rows={2}
            placeholder="Enter comments for this student..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Class Teacher Name</label>
            <Input value={classTeacherName} onChange={(e) => setClassTeacherName(e.target.value)} className="mt-1 text-sm h-8" placeholder="Name" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Head Teacher Name</label>
            <Input value={headteacherName} onChange={(e) => setHeadteacherName(e.target.value)} className="mt-1 text-sm h-8" placeholder="Name" />
          </div>
        </div>
      </div>
    </div>
  );
}