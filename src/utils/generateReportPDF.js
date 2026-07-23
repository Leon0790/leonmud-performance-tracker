import jsPDF from 'jspdf';
import { getBand, bandRGB } from '@/utils/bands';
import { getSubjectComment } from '@/utils/subjectComments';

const JSS_SUBJECTS = [
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

const GRADE_56_SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'english', label: 'English' },
  { key: 'kiswahili', label: 'Kiswahili' },
  { key: 'science_technology_agriculture', label: 'Science, Technology & Agriculture' },
  { key: 'social_studies', label: 'Social Studies' },
  { key: 'home_science', label: 'Home Science' },
  { key: 'psychomotor_creative_arts', label: 'Psychomotor & Creative Arts' },
  { key: 'business_studies', label: 'Business Studies' },
  { key: 'religious_studies', label: 'Religious Studies' },
];

function getSubjectsForGrade(grade) {
  if (grade === 'Grade 5' || grade === 'Grade 6') return GRADE_56_SUBJECTS;
  return JSS_SUBJECTS;
}

const PRIMARY = [30, 58, 95];
const WHITE = [255, 255, 255];
const LIGHT_BLUE = [221, 232, 255];
const LIGHT_ROW = [245, 248, 255];
const BORDER = [180, 195, 215];

function drawSingleReportCard(doc, student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment, classTeacherDate, headteacherDate, examName) {
  const SUBJECTS = getSubjectsForGrade(student.grade);
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
  const ordinal = (n) => { if (!n) return '—'; const s = ['th','st','nd','rd']; const v = n % 100; return n + (s[(v-20)%10] || s[v] || s[0]); };
  const infoItems = [
    ['Student Name:', student.name],
    ['Adm No:', student.admission_number || '—'],
    ['Grade:', student.grade],
    ['Class:', student.class_name || profile?.class_name || '—'],
    ['Term:', student.term],
    ['Assessment:', examName || student.exam_type],
    ['Position:', `${ordinal(rank)} / ${totalStudents}`],
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
  const marksW = 20;
  const bandW = 16;
  const remarkW = contentW - 48 - 20 - 16;
  const subjectW = 48;
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
    doc.setFontSize(11);
    const remarkLines = doc.splitTextToSize(remark, remarkW - 4);
    doc.setFontSize(8);
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
    doc.setFontSize(11);
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

  const pageH = doc.internal.pageSize.getHeight();
  const sigLineLen = 60;

  // Helper: draw a signature row (increments y)
  const drawSigRow = (x, label, value) => {
    if (y > pageH - 20) { doc.addPage(); y = margin; }
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(label, x, y);
    doc.setFont('times', 'normal');
    if (value) {
      doc.text(value, x + 24, y);
    } else {
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(x + 24, y + 1, x + 24 + sigLineLen, y + 1);
    }
    y += 9;
  };

  // Helper: draw a section (divider + label + comment box + sig rows)
  const drawSection = (title, accentRGB, bgRGB, commentText, sigName, sigDate, withStamp) => {
    doc.setFontSize(12);
    const lines = commentText ? doc.splitTextToSize(commentText, contentW - 8) : [];
    const lineH = 6.5;
    const boxH = Math.max(25, lines.length * lineH + 12);
    doc.setFontSize(9);
    const totalNeeded = 10 + 5 + boxH + 6 + 27 + (withStamp ? 0 : 0) + 10;
    if (y > pageH - totalNeeded) { doc.addPage(); y = margin; }

    // Section header bar
    doc.setFillColor(...bgRGB);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFillColor(...accentRGB);
    doc.rect(margin, y, 3, 7, 'F');
    doc.setTextColor(...accentRGB);
    doc.setFont('times', 'bold');
    doc.text(title, margin + 5, y + 4.8);
    y += 10;

    // Comment label
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.text(`${title.charAt(0) + title.slice(1).toLowerCase().replace('teacher', 'Teacher')} Comments:`, margin, y);
    y += 5;

    // Comment box — expands to fit all text, no clipping
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.4);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentW, boxH, 'FD');
    if (lines.length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.text(lines, margin + 4, y + 7, { lineHeightFactor: 1.45 });
    }
    doc.setFontSize(9);
    y += boxH + 6;

    // Signature rows
    if (y > pageH - 40) { doc.addPage(); y = margin; }
    const sigStartY = y;
    drawSigRow(margin, 'Name:', sigName || '');
    drawSigRow(margin, 'Signature:', '');
    drawSigRow(margin, 'Date:', sigDate || '');

    // Stamp circle (head teacher only)
    if (withStamp) {
      const stampCX = margin + contentW - 18;
      const stampCY = sigStartY + 12;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.6);
      doc.circle(stampCX, stampCY, 14, 'S');
      doc.setFontSize(6.5);
      doc.setTextColor(170, 170, 170);
      doc.setFont('times', 'bold');
      doc.text('OFFICIAL', stampCX, stampCY - 2, { align: 'center' });
      doc.text('STAMP', stampCX, stampCY + 3, { align: 'center' });
    }

    y += 6;
  };

  // ── CLASS TEACHER SECTION ──
  drawSection('CLASS TEACHER', PRIMARY, [232, 238, 246], comment, classTeacherName, classTeacherDate, false);

  // ── HEAD TEACHER SECTION ──
  drawSection('HEAD TEACHER', [194, 65, 12], [254, 243, 232], headteacherComment, headteacherName, headteacherDate, true);

  y += 10;

  // ── FOOTER ──
  if (y > pageH - 12) { doc.addPage(); y = margin; }
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('times', 'normal');
  doc.text('This report card is generated by LeonMud Performance Tracker', pageW / 2, y, { align: 'center' });
}

export function downloadSingleReportPDF(student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment, classTeacherDate, headteacherDate, examName) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawSingleReportCard(doc, student, rank, totalStudents, profile, openingDate, closingDate, comment, classTeacherName, headteacherName, schoolLogoDataUrl, headteacherComment || '', classTeacherDate || '', headteacherDate || '', examName || '');
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