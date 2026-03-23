import jsPDF from 'jspdf';
import { getBand, bandRGB } from '@/utils/bands';

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


const PRIMARY = [30, 58, 95];
const WHITE = [255, 255, 255];
const LIGHT_BLUE = [221, 232, 255];
const LIGHT_ROW = [245, 248, 255];
const BORDER = [180, 195, 215];

function drawSingleReportCard(doc, student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, startY = 0) {
  const total = SUBJECTS.reduce((sum, s) => sum + (Number(student[s.key]) || 0), 0);
  const avg = (total / SUBJECTS.length).toFixed(1);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = startY + margin;

  // Border around the card
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.rect(margin - 2, startY + margin - 2, contentW + 4, 255, 'S');

  // Header background
  doc.setFillColor(...PRIMARY);
  doc.rect(margin - 2, y - 2, contentW + 4, 20, 'F');

  // Logo
  if (schoolLogoDataUrl) {
    try {
      doc.addImage(schoolLogoDataUrl, margin + 1, y, 14, 14);
    } catch (e) { /* ignore logo errors */ }
  }

  // School title
  doc.setTextColor(...WHITE);
  doc.setFontSize(13);
  doc.setFont('times', 'bold');
  doc.text('CBC PERFORMANCE REPORT CARD', pageW / 2, y + 8, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text(`Competency Based Curriculum (CBC) · Year ${new Date().getFullYear()}`, pageW / 2, y + 14, { align: 'center' });

  y += 24;

  // Info grid
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  const col1 = margin;
  const col2 = margin + contentW / 2;
  const infoItems = [
    ['Student Name:', student.name],
    ['Adm No:', student.admission_number || '—'],
    ['Grade:', student.grade],
    ['Class:', student.class_name || profile?.class_name || '—'],
    ['Term:', student.term],
    ['Exam:', student.exam_type],
    ['Rank:', `${rank} / ${totalStudents}`],
    ['Average:', avg],
  ];

  infoItems.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? col1 : col2;
    const rowY = y + Math.floor(i / 2) * 6;
    doc.setFont('times', 'bold');
    doc.text(label, x, rowY);
    doc.setFont('times', 'normal');
    if (label === 'Rank:') {
      // Draw rank badge
      doc.setFillColor(...PRIMARY);
      doc.roundedRect(x + 16, rowY - 4, 20, 5, 1, 1, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(8);
      doc.text(value, x + 26, rowY, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
    } else {
      doc.text(value, x + 16, rowY);
    }
  });

  y += Math.ceil(infoItems.length / 2) * 6 + 4;

  // Dates row
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 4;
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.text('Opening Date:', margin, y);
  doc.setFont('times', 'normal');
  doc.text(openingDate || '___________________________', margin + 24, y);
  doc.setFont('times', 'bold');
  doc.text('Closing Date:', col2, y);
  doc.setFont('times', 'normal');
  doc.text(closingDate || '___________________________', col2 + 22, y);
  y += 3;
  doc.line(margin, y, margin + contentW, y);
  y += 5;

  // Table header
  const colWidths = [8, contentW - 8 - 20 - 26, 20, 26];
  const colX = [margin, margin + 8, margin + 8 + colWidths[1], margin + 8 + colWidths[1] + 20];
  const rowH = 6;

  doc.setFillColor(...PRIMARY);
  doc.rect(margin, y, contentW, rowH, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.text('#', colX[0] + 2, y + 4);
  doc.text('Learning Area', colX[1] + 2, y + 4);
  doc.text('Band', colX[2] + colWidths[2] / 2, y + 4, { align: 'center' });
  doc.text('Marks (/100)', colX[3] + colWidths[3] / 2, y + 4, { align: 'center' });

  y += rowH;
  doc.setFont('times', 'normal');

  SUBJECTS.forEach((s, i) => {
    const mark = student[s.key];
    const band = student[`${s.key}_band`] || getBand(mark);
    const bg = i % 2 === 0 ? WHITE : LIGHT_ROW;
    doc.setFillColor(...bg);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.1);
    doc.line(margin, y + rowH, margin + contentW, y + rowH);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(String(i + 1), colX[0] + 2, y + 4);
    doc.text(s.label, colX[1] + 2, y + 4);

    if (band) {
      doc.setTextColor(...bandRGB(band));
      doc.setFont('times', 'bold');
    }
    doc.text(band || '—', colX[2] + colWidths[2] / 2, y + 4, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
    doc.text(mark !== null && mark !== undefined && mark !== '' ? String(mark) : '—', colX[3] + colWidths[3] / 2, y + 4, { align: 'center' });

    y += rowH;
  });

  // Total rows
  const totalRows = [['TOTAL', '—', String(total)], ['AVERAGE', '—', avg]];
  totalRows.forEach(([label, band, val]) => {
    doc.setFillColor(...LIGHT_BLUE);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentW, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text(label, colX[1] + 2, y + 4);
    doc.text(band, colX[2] + colWidths[2] / 2, y + 4, { align: 'center' });
    doc.text(val, colX[3] + colWidths[3] / 2, y + 4, { align: 'center' });
    y += rowH;
  });

  y += 4;

  // Comments
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Class Teacher's Comments:", margin, y);
  y += 3;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, 14, 'S');
  if (comment) {
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text(comment, margin + 2, y + 5, { maxWidth: contentW - 4 });
  }
  y += 18;

  // Signatures
  const sigW = contentW * 0.4;
  const sig1X = margin;
  const sig2X = margin + contentW - sigW;

  doc.setLineWidth(0.4);
  doc.setDrawColor(0, 0, 0);
  doc.line(sig1X, y, sig1X + sigW, y);
  doc.line(sig2X, y, sig2X + sigW, y);
  y += 4;
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text(`Class Teacher: ${classTeacherName || ''}`, sig1X + sigW / 2, y, { align: 'center' });
  doc.text(`Head Teacher: ${headteacherName || ''}`, sig2X + sigW / 2, y, { align: 'center' });

  y += 8;

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('This report card is generated by LeonMud Performance Tracker', pageW / 2, y, { align: 'center' });
}

export function downloadSingleReportPDF(student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawSingleReportCard(doc, student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, 0);
  doc.save(`ReportCard_${student.name.replace(/\s+/g, '_')}.pdf`);
}

export function downloadAllReportsPDF(students, profile, openingDate, closingDate, schoolLogoDataUrl) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  students.forEach((student, i) => {
    if (i > 0) doc.addPage();
    drawSingleReportCard(doc, student, student.rank, students.length, profile, openingDate, closingDate, '', profile?.full_name || '', '', schoolLogoDataUrl, 0);
  });
  doc.save(`AllReportCards_${new Date().toISOString().slice(0, 10)}.pdf`);
}