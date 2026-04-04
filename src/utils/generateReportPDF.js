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
  const lineH = 4.2;
  const cellPadY = 3;

  // Header row
  const headerH = 10;
  doc.setFillColor(...PRIMARY);
  doc.rect(margin, y, contentW, headerH, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.text('Learning Area', colX[0] + 2, y + 4);
  doc.text('Marks', colX[1] + marksW / 2, y + 3.5, { align: 'center' });
  doc.text('(/100)', colX[1] + marksW / 2, y + 7.5, { align: 'center' });
  doc.text('Band', colX[2] + bandW / 2, y + 5.5, { align: 'center' });
  doc.text('Remarks', colX[3] + 2, y + 5.5);
  y += headerH;

  SUBJECTS.forEach((s, i) => {
    const mark = student[s.key];
    const band = student[`${s.key}_band`] || getBand(mark);
    const remark = getSubjectComment(s.key, band);

    // Measure remark lines
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    const remarkLines = doc.splitTextToSize(remark, remarkW - 4);
    const subjectLines = doc.splitTextToSize(s.label, subjectW - 4);
    const nLines = Math.max(remarkLines.length, subjectLines.length, 1);
    const rowH = Math.max(9, nLines * lineH + cellPadY * 2);

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
    doc.text(subjectLines, colX[0] + 2, textY);

    // Mark
    doc.text(
      mark !== null && mark !== undefined && mark !== '' ? String(mark) : '—',
      colX[1] + marksW / 2, textY, { align: 'center' }
    );

    // Band (coloured, bold)
    if (band) {
      doc.setTextColor(...bandRGB(band));
      doc.setFont('times', 'bold');
    } else {
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'normal');
    }
    doc.setFontSize(8);
    doc.text(band || '—', colX[2] + bandW / 2, textY, { align: 'center' });

    // Remark — normal (no italics)
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text(remarkLines, colX[3] + 2, textY);

    y += rowH;
  });

  // Total / Average rows
  [['TOTAL', String(total), '—'], ['AVERAGE', avg, '—']].forEach(([label, val, band]) => {
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
    doc.text(band, colX[2] + bandW / 2, y + 4.5, { align: 'center' });
    y += rowH;
  });

  y += 8;

  // ── CLASS TEACHER SECTION ──
  // Section header bar
  doc.setFillColor(232, 238, 246);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setFillColor(...PRIMARY);
  doc.rect(margin, y, 3, 7, 'F');
  doc.setTextColor(...PRIMARY);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('CLASS TEACHER', margin + 5, y + 4.8);
  y += 10;

  // Comments label
  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text("Class Teacher's Comments:", margin, y);
  y += 5;

  // Comment box — measure height based on content
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  const commentLines = comment ? doc.splitTextToSize(comment, contentW - 8) : [];
  const commentBoxH = Math.max(35, commentLines.length * 4.8 + 10);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentW, commentBoxH, 'FD');
  if (commentLines.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.text(commentLines, margin + 4, y + 6);
  }
  y += commentBoxH + 6;

  // Class Teacher signature rows
  const sigLineLen = 55;
  const drawSigRow = (x, label, value) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text(label, x, y);
    doc.setFont('times', 'normal');
    if (value) {
      doc.text(value, x + 22, y);
    } else {
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(x + 22, y + 1, x + 22 + sigLineLen, y + 1);
    }
    y += 8;
  };

  drawSigRow(margin, 'Name:', classTeacherName);
  drawSigRow(margin, 'Signature:', '');
  drawSigRow(margin, 'Date:', classTeacherDate || '');

  y += 4;

  // ── HEAD TEACHER SECTION ──
  doc.setFillColor(254, 243, 232);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setFillColor(194, 65, 12);
  doc.rect(margin, y, 3, 7, 'F');
  doc.setTextColor(194, 65, 12);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('HEAD TEACHER', margin + 5, y + 4.8);
  y += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text("Head Teacher's Comments:", margin, y);
  y += 5;

  const htLines = headteacherComment ? doc.splitTextToSize(headteacherComment, contentW - 8) : [];
  const htBoxH = Math.max(35, htLines.length * 4.8 + 10);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentW, htBoxH, 'FD');
  if (htLines.length > 0) {
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(htLines, margin + 4, y + 6);
  }
  y += htBoxH + 6;

  // Head Teacher sig rows — left side, stamp on right
  const stampCX = margin + contentW - 18;
  const stampCY = y + 10;

  drawSigRow(margin, 'Name:', headteacherName);
  drawSigRow(margin, 'Signature:', '');
  drawSigRow(margin, 'Date:', headteacherDate || '');

  // Stamp (dashed circle, right side)
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.6);
  // Draw dashed circle approximation using arc segments
  doc.circle(stampCX, stampCY, 14, 'S');
  doc.setFontSize(6.5);
  doc.setTextColor(170, 170, 170);
  doc.setFont('times', 'bold');
  doc.text('OFFICIAL', stampCX, stampCY - 2, { align: 'center' });
  doc.text('STAMP', stampCX, stampCY + 3, { align: 'center' });

  y += 12;

  // ── FOOTER ──
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('times', 'normal');
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