import jsPDF from 'jspdf';
import { getBand, bandRGB } from '@/utils/bands';
import { getSubjectComment } from '@/utils/subjectComments';

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

// Measure how many lines a string will take at given font size & maxWidth
function getLineCount(doc, text, maxWidth, fontSize) {
  if (!text) return 1;
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  return lines.length;
}

function drawSingleReportCard(doc, student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment, classTeacherDate, headteacherDate) {
  const total = SUBJECTS.reduce((sum, s) => sum + (Number(student[s.key]) || 0), 0);
  const avg = (total / SUBJECTS.length).toFixed(1);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── HEADER ──
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

  // ── INFO GRID ──
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
    doc.text(String(value), x + 26, rowY);
  });

  y += Math.ceil(infoItems.length / 2) * 6 + 4;

  // ── DATES ──
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 4;
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.text('Opening Date:', margin, y);
  doc.setFont('times', 'normal');
  doc.text(openingDate || '_______________________', margin + 26, y);
  doc.setFont('times', 'bold');
  doc.text('Closing Date:', col2, y);
  doc.setFont('times', 'normal');
  doc.text(closingDate || '_______________________', col2 + 24, y);
  y += 3;
  doc.line(margin, y, margin + contentW, y);
  y += 5;

  // ── TABLE ──
  // Columns: Learning Area | Marks (/100) | Band | Remarks
  const marksW = 22;
  const bandW = 18;
  const remarkW = 78;
  const subjectW = contentW - marksW - bandW - remarkW;
  const colX = [
    margin,
    margin + subjectW,
    margin + subjectW + marksW,
    margin + subjectW + marksW + bandW,
  ];
  const lineH = 4.5; // mm per line of text at size 8
  const cellPadY = 3;

  // Header row
  const headerH = 9;
  doc.setFillColor(...PRIMARY);
  doc.rect(margin, y, contentW, headerH, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.text('Learning Area', colX[0] + 2, y + 5.5);
  doc.text('Marks\n(/100)', colX[1] + marksW / 2, y + 3.5, { align: 'center' });
  doc.text('Band', colX[2] + bandW / 2, y + 5.5, { align: 'center' });
  doc.text('Remarks', colX[3] + 2, y + 5.5);
  y += headerH;

  doc.setFont('times', 'normal');

  SUBJECTS.forEach((s, i) => {
    const mark = student[s.key];
    const band = student[`${s.key}_band`] || getBand(mark);
    const remark = getSubjectComment(s.key, band);

    // Measure remark lines to determine dynamic row height
    doc.setFontSize(7.5);
    const remarkLines = doc.splitTextToSize(remark, remarkW - 4);
    const rowH = Math.max(9, remarkLines.length * lineH + cellPadY * 2);

    const bg = i % 2 === 0 ? WHITE : LIGHT_ROW;
    doc.setFillColor(...bg);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.1);
    doc.line(margin, y + rowH, margin + contentW, y + rowH);

    const textY = y + cellPadY + 3;

    // Subject label
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text(s.label, colX[0] + 2, textY);

    // Mark
    doc.text(
      mark !== null && mark !== undefined && mark !== '' ? String(mark) : '—',
      colX[1] + marksW / 2, textY, { align: 'center' }
    );

    // Band (coloured)
    if (band) {
      doc.setTextColor(...bandRGB(band));
      doc.setFont('times', 'bold');
    } else {
      doc.setTextColor(0, 0, 0);
    }
    doc.setFontSize(8);
    doc.text(band || '—', colX[2] + bandW / 2, textY, { align: 'center' });

    // Remark (wrapped)
    doc.setTextColor(60, 60, 60);
    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.text(remarkLines, colX[3] + 2, textY);

    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    y += rowH;
  });

  // Total / Average rows
  [['TOTAL', String(total)], ['AVERAGE', avg]].forEach(([label, val]) => {
    const rowH = 7;
    doc.setFillColor(...LIGHT_BLUE);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text(label, colX[0] + 2, y + 4.5);
    doc.text(val, colX[1] + marksW / 2, y + 4.5, { align: 'center' });
    y += rowH;
  });

  y += 6;

  // ── CLASS TEACHER SECTION ──
  // Section divider
  doc.setFillColor(232, 238, 246);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.rect(margin, y, 3, 6, 'F'); // left accent bar
  doc.setTextColor(...PRIMARY);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('CLASS TEACHER', margin + 5, y + 4.2);
  y += 9;

  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text("Class Teacher's Comments:", margin, y);
  y += 4;

  // Measure comment height
  doc.setFontSize(8);
  const commentLines = comment ? doc.splitTextToSize(comment, contentW - 6) : [];
  const commentBoxH = Math.max(28, commentLines.length * 4.5 + 8);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentW, commentBoxH, 'FD');
  if (commentLines.length > 0) {
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(commentLines, margin + 3, y + 5);
  }
  y += commentBoxH + 4;

  // Class Teacher signature block
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text('Name:', margin, y);
  doc.setFont('times', 'normal');
  doc.text(classTeacherName || '_________________________________', margin + 14, y);
  y += 6;
  doc.setFont('times', 'bold');
  doc.text('Signature:', margin, y);
  doc.setFont('times', 'normal');
  doc.text('_________________________________', margin + 20, y);
  y += 6;
  doc.setFont('times', 'bold');
  doc.text('Date:', margin, y);
  doc.setFont('times', 'normal');
  doc.text(classTeacherDate || '_________________________________', margin + 14, y);
  y += 10;

  // ── HEAD TEACHER SECTION ──
  doc.setFillColor(254, 243, 232);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setFillColor(194, 65, 12);
  doc.rect(margin, y, 3, 6, 'F'); // left accent bar
  doc.setTextColor(194, 65, 12);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('HEAD TEACHER', margin + 5, y + 4.2);
  y += 9;

  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text("Head Teacher's Comments:", margin, y);
  y += 4;

  const htLines = headteacherComment ? doc.splitTextToSize(headteacherComment, contentW - 6) : [];
  const htBoxH = Math.max(28, htLines.length * 4.5 + 8);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentW, htBoxH, 'FD');
  if (htLines.length > 0) {
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(htLines, margin + 3, y + 5);
  }
  y += htBoxH + 4;

  // Head Teacher signature + stamp
  const htSigX = margin;
  const stampX = margin + contentW - 24;

  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text('Name:', htSigX, y);
  doc.setFont('times', 'normal');
  doc.text(headteacherName || '_________________________________', htSigX + 14, y);
  y += 6;
  doc.setFont('times', 'bold');
  doc.text('Signature:', htSigX, y);
  doc.setFont('times', 'normal');
  doc.text('_________________________________', htSigX + 20, y);
  y += 6;
  doc.setFont('times', 'bold');
  doc.text('Date:', htSigX, y);
  doc.setFont('times', 'normal');
  doc.text(headteacherDate || '_________________________________', htSigX + 14, y);

  // Stamp circle
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.6);
  doc.circle(stampX + 12, y - 6, 11, 'S');
  doc.setFontSize(6);
  doc.setTextColor(180, 180, 180);
  doc.text('OFFICIAL', stampX + 12, y - 8, { align: 'center' });
  doc.text('STAMP', stampX + 12, y - 4, { align: 'center' });

  y += 12;

  // ── FOOTER ──
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('This report card is generated by LeonMud Performance Tracker', pageW / 2, y, { align: 'center' });
}

export function downloadSingleReportPDF(student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment, classTeacherDate, headteacherDate) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawSingleReportCard(doc, student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment || '', classTeacherDate || '', headteacherDate || '');
  doc.save(`ReportCard_${student.name.replace(/\s+/g, '_')}.pdf`);
}

export function downloadAllReportsPDF(students, profile, openingDate, closingDate, schoolLogoDataUrl) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  students.forEach((student, i) => {
    if (i > 0) doc.addPage();
    drawSingleReportCard(doc, student, student.rank, students.length, profile, openingDate, closingDate, '', profile?.full_name || '', '', schoolLogoDataUrl, '', '', '');
  });
  doc.save(`AllReportCards_${new Date().toISOString().slice(0, 10)}.pdf`);
}