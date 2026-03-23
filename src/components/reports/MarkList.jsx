import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { getBand } from '@/utils/bands';

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

function getTotal(student) {
  return SUBJECTS.reduce((sum, s) => sum + (Number(student[s.key]) || 0), 0);
}

export default function MarkList({ students, grade, term, examType, profile, openingDate, closingDate }) {
  const ranked = [...students]
    .sort((a, b) => getTotal(b) - getTotal(a))
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Mark List - ${grade}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 16px; font-size: 11px; color: #000; }
          .header { text-align: center; margin-bottom: 12px; }
          .header h1 { font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase; }
          .header h2 { font-size: 14px; font-weight: normal; margin: 4px 0 0; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e3a5f; color: #fff; padding: 5px 4px; text-align: center; font-size: 10px; white-space: nowrap; }
          th.left { text-align: left; }
          td { padding: 4px; border: 1px solid #ccc; text-align: center; font-size: 10px; }
          td.left { text-align: left; }
          tr:nth-child(even) td { background: #f0f4ff; }
          .total-col { background: #dbeafe; font-weight: bold; }
          .rank-col { background: #fef9c3; font-weight: bold; }
          .band-EE { color: #16a34a; font-weight: bold; }
          .band-ME { color: #2563eb; font-weight: bold; }
          .band-AE { color: #d97706; font-weight: bold; }
          .band-BE { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 11px; }
          .sig-line { border-top: 1px solid #000; margin-top: 25px; padding-top: 3px; text-align: center; width: 180px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CBC Mark List</h1>
          <h2>${grade} &nbsp;|&nbsp; ${term} &nbsp;|&nbsp; ${examType}</h2>
          <div style="font-size:12px; margin-top:4px;">Class Teacher: ${profile?.full_name || '—'} &nbsp;|&nbsp; Class: ${profile?.class_name || '—'}</div>
        </div>
        <div class="meta">
          <span><strong>Opening Date:</strong> ${openingDate || '_______________'}</span>
          <span><strong>Closing Date:</strong> ${closingDate || '_______________'}</span>
          <span><strong>Total Students:</strong> ${ranked.length}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="left">Rank</th>
              <th class="left">Name</th>
              <th>Adm No</th>
              ${SUBJECTS.map(s => `<th>${s.label.split(' ').map(w => w[0]).join('')}</th>`).join('')}
              <th>Total</th>
              <th>Avg</th>
            </tr>
            <tr>
              <th colspan="3"></th>
              ${SUBJECTS.map(s => `<th style="font-size:9px; color:#cfd8e8">${s.label}</th>`).join('')}
              <th></th><th></th>
            </tr>
          </thead>
          <tbody>
            ${ranked.map(s => {
              const total = getTotal(s);
              const avg = (total / SUBJECTS.length).toFixed(1);
              return `<tr>
                <td class="rank-col">${s.rank}</td>
                <td class="left">${s.name}</td>
                <td>${s.admission_number || '—'}</td>
                ${SUBJECTS.map(sub => {
                  const mark = s[sub.key];
                  const band = s[`${sub.key}_band`] || getBand(mark);
                  return `<td>${band ? `<span class="band-${band}">${band}</span><br/>` : ''}${mark !== null && mark !== undefined ? mark : '—'}</td>`;
                }).join('')}
                <td class="total-col">${total}</td>
                <td>${avg}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div class="sig-line">Class Teacher Signature</div>
          <div class="sig-line">Head Teacher Signature</div>
        </div>
        <div style="text-align:center; font-size:10px; margin-top:16px; color:#777;">Generated by LeonMud Performance Tracker</div>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Button onClick={handlePrint} variant="outline" className="gap-2">
      <Printer className="w-4 h-4" />
      Print Mark List ({grade})
    </Button>
  );
}