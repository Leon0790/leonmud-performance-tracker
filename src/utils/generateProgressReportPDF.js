import jsPDF from 'jspdf';
import { getBand, bandRGB } from '@/utils/bands';
import { ALL_SUBJECTS } from '@/utils/gradeSubjects';
import { getSubjectComment } from '@/utils/subjectComments';

const PRIMARY = [30, 58, 95];
const WHITE = [255, 255, 255];
const LIGHT_BLUE = [221, 232, 255];
const LIGHT_ROW = [245, 248, 255];
const BORDER = [180, 195, 215];
const GREEN = [22, 163, 74];
const RED = [220, 38, 38];
const AMBER = [217, 119, 6];

/**
 * Detect which subjects have any marks in a set of records.
 */
function detectSubjects(marksRecords) {
  return ALL_SUBJECTS.filter(s =>
    marksRecords.some(r => {
      const v = r[s.key];
      return v !== null && v !== undefined && v !== '' && Number(v) > 0;
    })
  );
}

function examLabel(rec) {
  const t = rec.term?.replace('Term ', 'T') || '';
  const e = rec.exam_type === 'Mid Term' ? 'Mid' : 'End';
  return `${t} ${e}`;
}

function attendanceSummary(attendanceRecords) {
  const total = attendanceRecords.length;
  if (!total) return null;
  const present = attendanceRecords.filter(r => r.status === 'Present').length;
  const absent = attendanceRecords.filter(r => r.status === 'Absent').length;
  const late = attendanceRecords.filter(r => r.status === 'Late').length;
  const rate = (((present + late) / total) * 100).toFixed(0);
  return { total, present, absent, late, rate };
}

export function generateProgressReportPDF({
  student,         // StudentRegister record
  marksRecords,    // Array of Student (marks) records
  attendanceRecords, // Array of Attendance records
  profile,         // Teacher profile
  schoolName,
  openingDate,
  closingDate,
  comment,
  classTeacherName,
  classTeacherDate,
  parentSignatureDate,
  headteacherName,
  headteacherComment,
  headteacherDate,
  schoolLogoDataUrl,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  const subjects = detectSubjects(marksRecords);

  // Sort marks by grade + term + exam
  const sorted = [...marksRecords].sort((a, b) =>
    (a.grade + a.term + a.exam_type).localeCompare(b.grade + b.term + b.exam_type)
  );

  const attendance = attendanceSummary(attendanceRecords);
  const studentName = student
    ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
    : (marksRecords[0]?.name || 'Student');

  // ─────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(margin - 2, y - 2, contentW + 4, 22, 'F');

  if (schoolLogoDataUrl) {
    try { doc.addImage(schoolLogoDataUrl, margin + 1, y, 16, 16); } catch (_) {}
  }

  doc.setTextColor(...WHITE);
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(schoolName || 'STUDENT PROGRESS REPORT', pageW / 2, y + 8, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text(`Competency Based Education (CBE) Progress Report · ${new Date().getFullYear()}`, pageW / 2, y + 15, { align: 'center' });
  y += 26;

  // ─────────────────────────────────────────────
  // STUDENT INFO GRID
  // ─────────────────────────────────────────────
  const col1 = margin;
  const col2 = margin + contentW / 2;

  const infoItems = [
    ['Student Name:', studentName],
    ['Adm No:', student?.admission_number || marksRecords[0]?.admission_number || '—'],
    ['Grade:', student?.grade || marksRecords[0]?.grade || '—'],
    ['Class:', student?.class_name || profile?.class_name || '—'],
    ['Gender:', student?.gender || '—'],
    ['Class Teacher:', classTeacherName || profile?.full_name || '—'],
  ];

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  infoItems.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? col1 : col2;
    const rowY = y + Math.floor(i / 2) * 6;
    doc.setFont('times', 'bold');
    doc.text(label, x, rowY);
    doc.setFont('times', 'normal');
    doc.text(String(value), x + 28, rowY);
  });
  y += Math.ceil(infoItems.length / 2) * 6 + 3;

  // Dates row
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 4;
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.text('Opening Date:', margin, y);
  doc.setFont('times', 'normal');
  doc.text(openingDate || '_________________________', margin + 27, y);
  doc.setFont('times', 'bold');
  doc.text('Closing Date:', col2, y);
  doc.setFont('times', 'normal');
  doc.text(closingDate || '_________________________', col2 + 25, y);
  y += 3;
  doc.line(margin, y, margin + contentW, y);
  y += 7;

  // ─────────────────────────────────────────────
  // ATTENDANCE SUMMARY
  // ─────────────────────────────────────────────
  if (attendance) {
    doc.setFillColor(232, 238, 246);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, 12, 'FD');
    doc.setFillColor(...PRIMARY);
    doc.rect(margin, y, 3, 12, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PRIMARY);
    doc.text('ATTENDANCE SUMMARY', margin + 6, y + 5);
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');

    const rateColor = Number(attendance.rate) >= 75 ? GREEN : RED;
    const attItems = [
      `Days Recorded: ${attendance.total}`,
      `Present: ${attendance.present}`,
      `Absent: ${attendance.absent}`,
      `Late: ${attendance.late}`,
    ];
    attItems.forEach((item, i) => {
      doc.text(item, margin + 6 + i * 42, y + 10);
    });

    // Rate badge
    doc.setFillColor(...rateColor);
    doc.roundedRect(margin + contentW - 28, y + 2, 26, 8, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text(`Rate: ${attendance.rate}%`, margin + contentW - 28 + 13, y + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    y += 17;
  }

  // ─────────────────────────────────────────────
  // MARKS TABLE — one section per exam period
  // ─────────────────────────────────────────────
  if (sorted.length > 0) {
    const marksW = 16;
    const bandW = 14;
    const subjectW = 50;
    const remarkW = contentW - subjectW - marksW - bandW;
    const colX = [margin, margin + subjectW, margin + subjectW + marksW, margin + subjectW + marksW + bandW];

    sorted.forEach((rec, ri) => {
      const recLabel = examLabel(rec);
      const recTotal = subjects.reduce((s, sub) => s + (Number(rec[sub.key]) || 0), 0);
      const recAvg = subjects.length ? (recTotal / subjects.length).toFixed(1) : '—';

      // Section header
      if (y > pageH - 50) { doc.addPage(); y = margin; }
      doc.setFillColor(216, 228, 248);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setFillColor(...PRIMARY);
      doc.rect(margin, y, 3, 7, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...PRIMARY);
      doc.text(`EXAM: ${recLabel}   (${rec.grade} — ${rec.term} — ${rec.exam_type})`, margin + 6, y + 5);
      y += 10;

      // Table header
      const headerH = 8;
      doc.setFillColor(...PRIMARY);
      doc.rect(margin, y, contentW, headerH, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('times', 'bold');
      doc.setFontSize(7.5);
      doc.text('Learning Area', colX[0] + 2, y + 5);
      doc.text('Marks', colX[1] + marksW / 2, y + 5, { align: 'center' });
      doc.text('Band', colX[2] + bandW / 2, y + 5, { align: 'center' });
      doc.text('Remarks', colX[3] + 2, y + 5);
      y += headerH;

      subjects.forEach((s, i) => {
        if (y > pageH - 15) { doc.addPage(); y = margin; }
        const mark = rec[s.key];
        const band = rec[`${s.key}_band`] || getBand(mark);
        const remark = getSubjectComment(s.key, band) || '';

        doc.setFontSize(8);
        doc.setFont('times', 'normal');
        const remarkLines = doc.splitTextToSize(remark, remarkW - 4);
        const subjectLines = doc.splitTextToSize(s.label, subjectW - 4);
        const nLines = Math.max(remarkLines.length, subjectLines.length, 1);
        const rowH = Math.max(8, nLines * 4 + 5);

        const bg = i % 2 === 0 ? WHITE : LIGHT_ROW;
        doc.setFillColor(...bg);
        doc.rect(margin, y, contentW, rowH, 'F');
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.1);
        doc.line(margin, y + rowH, margin + contentW, y + rowH);

        const textY = y + 4.5;
        doc.setTextColor(0, 0, 0);
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.text(subjectLines, colX[0] + 2, textY);
        doc.text(mark !== null && mark !== undefined && mark !== '' ? String(mark) : '—', colX[1] + marksW / 2, textY, { align: 'center' });

        if (band) {
          doc.setTextColor(...bandRGB(band));
          doc.setFont('times', 'bold');
        }
        doc.text(band || '—', colX[2] + bandW / 2, textY, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFont('times', 'normal');
        doc.text(remarkLines, colX[3] + 2, textY);

        y += rowH;
      });

      // Total / Average
      [['TOTAL', String(recTotal)], ['AVERAGE', recAvg]].forEach(([lbl, val]) => {
        const rowH = 6;
        if (y > pageH - 10) { doc.addPage(); y = margin; }
        doc.setFillColor(...LIGHT_BLUE);
        doc.rect(margin, y, contentW, rowH, 'F');
        doc.setDrawColor(...PRIMARY);
        doc.setLineWidth(0.4);
        doc.line(margin, y, margin + contentW, y);
        doc.setFont('times', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(lbl, colX[0] + 2, y + 4);
        doc.text(val, colX[1] + marksW / 2, y + 4, { align: 'center' });
        y += rowH;
      });

      y += 6;
    });
  }

  // ─────────────────────────────────────────────
  // SIGNATURE SECTIONS
  // ─────────────────────────────────────────────
  const drawSigSection = (title, accentRGB, bgRGB, commentText, sigName, sigDate, withStamp, isParent) => {
    if (y > pageH - 55) { doc.addPage(); y = margin; }

    // Section divider
    doc.setFillColor(...bgRGB);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFillColor(...accentRGB);
    doc.rect(margin, y, 3, 7, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...accentRGB);
    doc.text(title, margin + 5, y + 4.8);
    y += 11;

    if (commentText !== undefined) {
      // Comment label
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`${title.charAt(0)}${title.slice(1).toLowerCase()} Comments:`, margin, y);
      y += 4;

      // Comment box
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      const lines = commentText ? doc.splitTextToSize(commentText, contentW - 8) : [];
      const boxH = Math.max(18, lines.length * 5 + 8);
      if (y + boxH > pageH - 30) { doc.addPage(); y = margin; }
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.4);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentW, boxH, 'FD');
      if (lines.length) {
        doc.setTextColor(0, 0, 0);
        doc.text(lines, margin + 4, y + 6, { lineHeightFactor: 1.5 });
      }
      y += boxH + 5;
    }

    // Signature lines
    if (y > pageH - 35) { doc.addPage(); y = margin; }
    const sigStartY = y;
    const drawLine = (label, value) => {
      doc.setFont('times', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(label, margin, y);
      doc.setFont('times', 'normal');
      if (value) {
        doc.text(value, margin + 25, y);
      } else {
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.3);
        doc.line(margin + 25, y + 1, margin + 25 + 65, y + 1);
      }
      y += 8;
    };
    drawLine('Name:', isParent ? '' : sigName || '');
    drawLine('Signature:', '');
    drawLine('Date:', isParent ? (parentSignatureDate || '') : sigDate || '');

    if (withStamp) {
      const cx = margin + contentW - 18;
      const cy = sigStartY + 10;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.6);
      doc.circle(cx, cy, 14, 'S');
      doc.setFontSize(6.5);
      doc.setTextColor(170, 170, 170);
      doc.setFont('times', 'bold');
      doc.text('OFFICIAL', cx, cy - 2, { align: 'center' });
      doc.text('STAMP', cx, cy + 3, { align: 'center' });
    }

    y += 4;
  };

  drawSigSection('CLASS TEACHER', PRIMARY, [232, 238, 246], comment, classTeacherName || profile?.full_name, classTeacherDate, false, false);
  drawSigSection('HEAD TEACHER', [194, 65, 12], [254, 243, 232], headteacherComment || '', headteacherName, headteacherDate, true, false);
  drawSigSection('PARENT / GUARDIAN', [22, 101, 52], [240, 253, 244], undefined, '', '', false, true);

  // Footer
  if (y > pageH - 12) { doc.addPage(); y = margin; }
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('times', 'normal');
  doc.text('Generated by LeonMud Performance Tracker', pageW / 2, pageH - 8, { align: 'center' });

  doc.save(`ProgressReport_${studentName.replace(/\s+/g, '_')}.pdf`);
}