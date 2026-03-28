import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileDown, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

function getTotal(marks) {
  return SUBJECTS.reduce((sum, s) => sum + (Number(marks[s.key]) || 0), 0);
}

const STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; background: #fff; color: #000; }
  .page { display: flex; justify-content: center; align-items: flex-start; }
  .card { width: 100%; max-width: 700px; border: 2px solid #1e3a5f; padding: 18px 22px; }
  .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 14px; display: flex; flex-direction: column; align-items: center; }
  .school-logo { display: block; height: 90px; width: 90px; object-fit: contain; margin: 0 auto 8px; }
  .school-name { font-size: 20px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #1e3a5f; }
  .sub-header { font-size: 11px; color: #555; margin-top: 3px; }
  .student-name-block { background: #1e3a5f; color: #fff; padding: 8px 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
  .name-label { font-size: 11px; font-weight: bold; white-space: nowrap; letter-spacing: 1px; opacity: 0.85; }
  .name-value { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; flex: 1; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 10px; font-size: 13px; }
  .info-row { display: flex; border-bottom: 1px dotted #ccc; padding-bottom: 3px; }
  .info-label { font-weight: bold; white-space: nowrap; width: 110px; flex-shrink: 0; }
  .info-value { flex: 1; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
  th { background: #1e3a5f; color: #fff; padding: 7px 10px; text-align: left; }
  td { padding: 5px 10px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f5f8ff; }
  .total-row td { font-weight: bold; background: #dde8ff !important; border-top: 2px solid #1e3a5f; }
  .band-ee1, .band-ee2 { color: #16a34a; font-weight: bold; }
  .band-me1, .band-me2 { color: #2563eb; font-weight: bold; }
  .band-ae1, .band-ae2 { color: #d97706; font-weight: bold; }
  .band-be1, .band-be2 { color: #dc2626; font-weight: bold; }
  .section-divider { background: #e8eef6; border-left: 4px solid #1e3a5f; padding: 4px 10px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1e3a5f; margin-bottom: 6px; margin-top: 12px; }
  .comment-box { border: 1px solid #bbb; min-height: 44px; padding: 6px 8px; margin-top: 4px; font-size: 13px; background: #fafafa; }
  .sig-row { display: flex; gap: 4px; margin-bottom: 7px; align-items: baseline; border-bottom: 1px dotted #ccc; padding-bottom: 2px; font-size: 12px; }
  .sig-label { font-weight: bold; white-space: nowrap; min-width: 75px; }
  .footer { text-align: center; font-size: 10px; color: #888; margin-top: 14px; border-top: 1px solid #eee; padding-top: 6px; }
  .no-marks { text-align: center; padding: 18px; color: #888; font-style: italic; }
`;

function buildHTML(student, marksRecords, profile, schoolLogoDataUrl) {
  const year = new Date().getFullYear();
  const fullName = `${student.first_name} ${student.last_name}`;

  const marksRows = marksRecords.length === 0
    ? `<tr><td colspan="4" class="no-marks">No exam marks recorded for this student.</td></tr>`
    : marksRecords.map((rec) => {
        const total = getTotal(rec);
        const avg = (total / SUBJECTS.length).toFixed(1);
        return `
          <tr style="background:#e8eef6!important"><td colspan="4" style="font-weight:bold;padding:6px 10px;border-top:2px solid #1e3a5f;">
            ${rec.grade} · ${rec.term} · ${rec.exam_type}
          </td></tr>
          ${SUBJECTS.map((s, i) => {
            const mark = rec[s.key];
            const band = rec[`${s.key}_band`] || getBand(mark);
            return `<tr>
              <td>${i + 1}</td>
              <td>${s.label}</td>
              <td>${mark !== null && mark !== undefined && mark !== '' ? mark : '—'}</td>
              <td class="band-${(band || '').toLowerCase()}">${band || '—'}</td>
            </tr>`;
          }).join('')}
          <tr class="total-row">
            <td colspan="2">TOTAL / AVERAGE</td>
            <td>${total} / ${avg}</td>
            <td>—</td>
          </tr>
        `;
      }).join('');

  return `<!DOCTYPE html><html><head><title>Report Card - ${fullName}</title><style>${STYLES}</style></head>
  <body>
    <div class="page">
      <div class="card">
        <div class="header">
          ${schoolLogoDataUrl ? `<img src="${schoolLogoDataUrl}" class="school-logo" alt="School Logo" />` : ''}
          <div class="school-name">CBC STUDENT REPORT CARD</div>
          <div class="sub-header">Competency Based Curriculum · Year ${year}</div>
        </div>

        <div class="student-name-block">
          <span class="name-label">STUDENT NAME:</span>
          <span class="name-value">${fullName}</span>
        </div>

        <div class="info-grid">
          <div class="info-row"><span class="info-label">Adm Number:</span><span class="info-value">${student.admission_number || '—'}</span></div>
          <div class="info-row"><span class="info-label">Grade:</span><span class="info-value">${student.grade}</span></div>
          <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${student.class_name || '—'}</span></div>
          <div class="info-row"><span class="info-label">Stream:</span><span class="info-value">${student.stream || '—'}</span></div>
          <div class="info-row"><span class="info-label">Gender:</span><span class="info-value">${student.gender || '—'}</span></div>
          <div class="info-row"><span class="info-label">Date of Birth:</span><span class="info-value">${student.date_of_birth || '—'}</span></div>
          <div class="info-row"><span class="info-label">Class Teacher:</span><span class="info-value">${profile?.full_name || '—'}</span></div>
          <div class="info-row"><span class="info-label">Status:</span><span class="info-value">${student.status || 'Active'}</span></div>
        </div>

        <div class="section-divider">Academic Performance</div>
        <table>
          <thead>
            <tr><th>#</th><th>Learning Area</th><th>Marks (/100)</th><th>Band</th></tr>
          </thead>
          <tbody>${marksRows}</tbody>
        </table>

        <div class="section-divider">Class Teacher</div>
        <strong style="font-size:13px;">Comments:</strong>
        <div class="comment-box"></div>
        <div style="margin-top:10px;">
          <div class="sig-row"><span class="sig-label">Name:</span><span style="flex:1">${profile?.full_name || '___________________________________'}</span></div>
          <div class="sig-row"><span class="sig-label">Signature:</span><span style="flex:1">___________________________________</span></div>
          <div class="sig-row"><span class="sig-label">Date:</span><span style="flex:1">___________________________________</span></div>
        </div>

        <div class="section-divider" style="background:#fef3e8;border-left-color:#c2410c;color:#c2410c;">Head Teacher</div>
        <strong style="font-size:13px;">Comments:</strong>
        <div class="comment-box"></div>
        <div style="margin-top:10px;display:flex;align-items:flex-start;gap:20px;">
          <div style="flex:1;">
            <div class="sig-row"><span class="sig-label">Name:</span><span style="flex:1">___________________________________</span></div>
            <div class="sig-row"><span class="sig-label">Signature:</span><span style="flex:1">___________________________________</span></div>
            <div class="sig-row"><span class="sig-label">Date:</span><span style="flex:1">___________________________________</span></div>
          </div>
          <div style="border:2px dashed #aaa;height:90px;width:90px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:9px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;border-radius:50%;text-align:center;line-height:1.4;">OFFICIAL<br/>STAMP</div>
        </div>

        <div class="footer">Generated by LeonMud Performance Tracker</div>
      </div>
    </div>
  </body></html>`;
}

export default function StudentReportCardButton({ student, profile }) {
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const logoInputRef = useRef(null);

  const { data: marksRecords = [] } = useQuery({
    queryKey: ['student-marks', student.admission_number],
    queryFn: () => base44.entities.Student.filter({ admission_number: student.admission_number }),
    enabled: !!student.admission_number,
  });

  const handlePrint = (logo) => {
    const html = buildHTML(student, marksRecords, profile, logo ?? logoDataUrl);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    win.onload = () => { setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 300); };
  };

  const handleLogoThenPrint = () => {
    logoInputRef.current?.click();
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoDataUrl(reader.result);
      handlePrint(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <FileDown className="w-4 h-4" />
            Report Card
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handlePrint(logoDataUrl)}>
            Print without logo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogoThenPrint}>
            Print with school logo…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
    </div>
  );
}