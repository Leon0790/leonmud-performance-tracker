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

function drawSingleReportCard(doc, student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment, classTeacherDate, headteacherDate, startY = 0) {
  const total = SUBJECTS.reduce((sum, s) => sum + (Number(student[s.key]) || 0), 0);
  const avg = (total / SUBJECTS.length).toFixed(1);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = startY + margin;

  // Border
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.rect(margin - 2, startY + margin - 2, contentW + 4, 275, 'S');

  // Header
  doc.setFillColor(...PRIMARY);
  doc.rect(margin - 2, y - 2, contentW + 4, 20, 'F');

  if (schoolLogoDataUrl) {
    try { doc.addImage(schoolLogoDataUrl, margin + 1, y, 14, 14); } catch (e) {}
  }

  doc.setTextColor(...WHITE);
  doc.setFontSize(13);
  doc.setFont('times', 'bold');
  doc.text('CBE PERFORMANCE REPORT CARD', pageW / 2, y + 8, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text(`Competency Based Education (CBE) · Year ${new Date().getFullYear()}`, pageW / 2, y + 14, { align: 'center' });

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
    ['Average:', avg],
  ];

  infoItems.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? col1 : col2;
    const rowY = y + Math.floor(i / 2) * 6;
    doc.setFont('times', 'bold');
    doc.text(label, x, rowY);
    doc.setFont('times', 'normal');
    doc.text(String(value), x + 22, rowY);
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

  // Table
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
  doc.text('Marks (/100)', colX[2] + colWidths[2] / 2, y + 4, { align: 'center' });
  doc.text('Band', colX[3] + colWidths[3] / 2, y + 4, { align: 'center' });

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
    doc.setFont('times', 'normal');
    doc.text(mark !== null && mark !== undefined && mark !== '' ? String(mark) : '—', colX[2] + colWidths[2] / 2, y + 4, { align: 'center' });

    if (band) {
      doc.setTextColor(...bandRGB(band));
      doc.setFont('times', 'bold');
    }
    doc.text(band || '—', colX[3] + colWidths[3] / 2, y + 4, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
    y += rowH;
  });

  // Total/Average rows
  [['TOTAL', String(total)], ['AVERAGE', avg]].forEach(([label, val]) => {
    doc.setFillColor(...LIGHT_BLUE);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentW, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text(label, colX[1] + 2, y + 4);
    doc.text(val, colX[3] + colWidths[3] / 2, y + 4, { align: 'center' });
    y += rowH;
  });

  y += 4;

  // Class Teacher Comment
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text("Class Teacher's Comments:", margin, y);
  y += 3;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, 12, 'S');
  if (comment) {
    doc.setFont('times', 'normal');
    doc.text(comment, margin + 2, y + 4, { maxWidth: contentW - 4 });
  }
  y += 16;

  // Head Teacher Comment
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text("Head Teacher's Comments:", margin, y);
  y += 3;
  doc.rect(margin, y, contentW, 12, 'S');
  if (headteacherComment) {
    doc.setFont('times', 'normal');
    doc.text(headteacherComment, margin + 2, y + 4, { maxWidth: contentW - 4 });
  }
  y += 16;

  // Signature section — proper layout
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentW, y);
  y += 5;

  const sigColW = (contentW - 20) / 2;
  const sig1X = margin;
  const sig2X = margin + contentW - sigColW;

  const drawSigBlock = (x, nameLabel, nameVal, dateVal) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text(`${nameLabel}:`, x, y);
    doc.setFont('times', 'normal');
    doc.text(nameVal || '_______________________', x + 25, y);

    doc.setFont('times', 'bold');
    doc.text('Signature:', x, y + 6);
    doc.setFont('times', 'normal');
    doc.text('___________________________', x + 18, y + 6);

    doc.setFont('times', 'bold');
    doc.text('Date:', x, y + 12);
    doc.setFont('times', 'normal');
    doc.text(dateVal || '________________', x + 12, y + 12);
  };

  drawSigBlock(sig1X, 'Class Teacher', classTeacherName, classTeacherDate);
  drawSigBlock(sig2X, 'Head Teacher', headteacherName, headteacherDate);

  // Stamp in middle
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + contentW / 2 - 12, y - 1, 24, 16, 2, 2, 'S');
  doc.setFontSize(6);
  doc.setTextColor(180, 180, 180);
  doc.text('SCHOOL', margin + contentW / 2, y + 5, { align: 'center' });
  doc.text('STAMP', margin + contentW / 2, y + 10, { align: 'center' });

  y += 20;

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('This report card is generated by LeonMud Performance Tracker', pageW / 2, y, { align: 'center' });
}

export function downloadSingleReportPDF(student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment, classTeacherDate, headteacherDate) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawSingleReportCard(doc, student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment || '', classTeacherDate || '', headteacherDate || '', 0);
  doc.save(`ReportCard_${student.name.replace(/\s+/g, '_')}.pdf`);
}

export function downloadAllReportsPDF(students, profile, openingDate, closingDate, schoolLogoDataUrl) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  students.forEach((student, i) => {
    if (i > 0) doc.addPage();
    drawSingleReportCard(doc, student, student.rank, students.length, profile, openingDate, closingDate, '', profile?.full_name || '', '', schoolLogoDataUrl, '', '', '', 0);
  });
  doc.save(`AllReportCards_${new Date().toISOString().slice(0, 10)}.pdf`);
}