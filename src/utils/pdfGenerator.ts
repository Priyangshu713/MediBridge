import { jsPDF, GState } from 'jspdf';
import { HealthData } from '@/store/healthStore';
import { Doctor } from '@/types/doctor';

// ═══════════════════════════════════════════════════════════════════════════
//  MODERN CLINICAL COLOUR PALETTE (Tailwind-inspired)
// ═══════════════════════════════════════════════════════════════════════════
const C = {
    primary:   [37, 99, 235] as [number, number, number],   // blue-600
    primaryLight: [239, 246, 255] as [number, number, number], // blue-50
    dark:      [31, 41, 55]  as [number, number, number],   // gray-800
    mid:       [75, 85, 99]  as [number, number, number],   // gray-600
    light:     [156, 163, 175] as [number, number, number], // gray-400
    border:    [229, 231, 235] as [number, number, number], // gray-200
    bgLight:   [249, 250, 251] as [number, number, number], // gray-50
    green:     [16, 185, 129]  as [number, number, number], // emerald-500
    greenLight:[209, 250, 229] as [number, number, number], // emerald-100
    amber:     [245, 158, 11]  as [number, number, number], // amber-500
    amberLight:[254, 243, 199] as [number, number, number], // amber-100
    red:       [239, 68, 68]   as [number, number, number], // red-500
    redLight:  [254, 226, 226] as [number, number, number], // red-100
    white:     [255, 255, 255] as [number, number, number],
};

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Confidential watermark on every page */
const addWatermark = (doc: jsPDF) => {
    doc.saveGraphicsState();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.setGState(new GState({ opacity: 0.04 }));
    doc.setFontSize(40);
    doc.setTextColor(100, 100, 100);
    
    // Watermark text in center, rotated 45 degrees
    // Shortened to just 'CONFIDENTIAL' so it does not exceed the page diagonal bounds
    doc.text('CONFIDENTIAL', pw / 2, ph / 2, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();
};

/** Fetch an image from public folder → Base64 */
const fetchImageAsBase64 = async (path: string): Promise<string> => {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Failed'));
        reader.onerror = () => reject(new Error('Error reading image'));
        reader.readAsDataURL(blob);
    });
};

/** Consistent page-break check */
const ensureSpace = (doc: jsPDF, yPos: number, needed: number): number => {
    const ph = doc.internal.pageSize.getHeight();
    if (yPos + needed > ph - 25) {
        doc.addPage();
        addWatermark(doc);
        return 20;
    }
    return yPos;
};

/** Format today's date */
const formatDate = (): string => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()} at ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getPatientName = (): string => {
    return localStorage.getItem('userName')
        || localStorage.getItem('userEmail')?.split('@')[0]
        || 'Patient';
};

const getPatientEmail = (): string => {
    return localStorage.getItem('userEmail') || 'Not on file';
};

const getBmiInfo = (bmi: number | null): { label: string; color: [number, number, number]; lightBg: [number, number, number] } => {
    if (!bmi) return { label: 'N/A', color: C.light, lightBg: C.bgLight };
    if (bmi < 18.5) return { label: 'Underweight', color: C.amber, lightBg: C.amberLight };
    if (bmi < 25)   return { label: 'Normal', color: C.green, lightBg: C.greenLight };
    if (bmi < 30)   return { label: 'Overweight', color: C.amber, lightBg: C.amberLight };
    return { label: 'Obese', color: C.red, lightBg: C.redLight };
};

const getGlucoseInfo = (glucose: number | null): { label: string; color: [number, number, number]; lightBg: [number, number, number] } => {
    if (!glucose) return { label: 'N/A', color: C.light, lightBg: C.bgLight };
    if (glucose < 70)  return { label: 'Low', color: C.amber, lightBg: C.amberLight };
    if (glucose <= 100) return { label: 'Normal', color: C.green, lightBg: C.greenLight };
    if (glucose <= 125) return { label: 'Pre-diabetic', color: C.amber, lightBg: C.amberLight };
    return { label: 'High', color: C.red, lightBg: C.redLight };
};

const scoreColor = (score: number): [number, number, number] => {
    if (score >= 80) return C.green;
    if (score >= 60) return C.amber;
    return C.red;
};

const scoreLabel = (score: number): string => {
    if (score >= 80) return 'Optimal';
    if (score >= 60) return 'Moderate';
    return 'Attention Required';
};

// ═══════════════════════════════════════════════════════════════════════════
//  DRAWING PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

/** Minimalist Section Header with subtle line */
const drawSectionHeader = (doc: jsPDF, title: string, x: number, y: number, pw: number): number => {
    doc.setFontSize(11);
    doc.setTextColor(...C.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), x, y);
    
    // Calculate width of text to start the line after it
    const textWidth = doc.getTextWidth(title.toUpperCase());
    
    // Draw a very subtle thin line taking up the rest of the space
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(x + textWidth + 4, y - 1.5, pw - 15, y - 1.5);
    
    doc.setFont('helvetica', 'normal');
    return y + 8;
};

/** Modern sleek progress bar */
const drawScoreBar = (
    doc: jsPDF,
    label: string,
    score: number,
    x: number, y: number,
    barWidth: number,
): number => {
    const barHeight = 4;
    const color = scoreColor(score);

    // Label
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.text(label, x, y);

    // Track
    doc.setFillColor(...C.border);
    doc.roundedRect(x, y + 2, barWidth, barHeight, 2, 2, 'F');

    // Fill
    const fillWidth = Math.max(2, (score / 100) * barWidth);
    doc.setFillColor(...color);
    doc.roundedRect(x, y + 2, fillWidth, barHeight, 2, 2, 'F');

    // Indicator dot
    doc.setFillColor(...C.white);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.8);
    doc.circle(x + fillWidth, y + 2 + (barHeight/2), 3, 'FD');

    // Score metric on the right
    doc.setFontSize(9);
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(`${score}`, x + barWidth + 6, y + 6);
    
    doc.setFontSize(7);
    doc.setTextColor(...C.mid);
    doc.setFont('helvetica', 'normal');
    doc.text(`/ 100  •  ${scoreLabel(score)}`, x + barWidth + 14, y + 5.5);

    return y + 16;
};

/** Clean metric card */
const drawMetricCard = (
    doc: jsPDF,
    label: string, value: string, unit: string,
    statusLabel: string, statusColor: [number, number, number], statusBg: [number, number, number],
    x: number, y: number, w: number,
): void => {
    const h = 26;
    
    // Card Base
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    // Accent line on left
    doc.setFillColor(...statusColor);
    doc.roundedRect(x, y, 2, h, 1, 1, 'F');

    // Label
    doc.setFontSize(7);
    doc.setTextColor(...C.mid);
    doc.text(label.toUpperCase(), x + 6, y + 7);

    // Value & Unit
    // Ensure sufficient gap, preventing clipping like "24.9kg/m2" -> "24.9 kg/m2"
    doc.setFontSize(14);
    doc.setTextColor(...C.dark);
    doc.setFont('helvetica', 'bold');
    
    // Explicit jsPDF width calculation to guarantee correct spacing
    const vw = doc.getStringUnitWidth(value) * 14 / doc.internal.scaleFactor;
    
    doc.text(value, x + 6, y + 15);
    doc.setFont('helvetica', 'normal');
    
    doc.setFontSize(8);
    doc.setTextColor(...C.light);
    doc.text(unit, x + 6 + vw + 2, y + 15); // exact gap

    // Modern colored pill badge
    if (statusLabel) {
        doc.setFillColor(...statusBg);
        const badgeW = doc.getTextWidth(statusLabel) + 6;
        doc.roundedRect(x + w - badgeW - 3, y + h - 10, badgeW, 6, 3, 3, 'F');
        doc.setFontSize(6);
        doc.setTextColor(...statusColor);
        doc.setFont('helvetica', 'bold');
        doc.text(statusLabel.toUpperCase(), x + w - badgeW, y + h - 6);
        doc.setFont('helvetica', 'normal');
    }
};

/** Clean minimalist table */
const drawModernTable = (
    doc: jsPDF,
    headers: string[],
    rows: string[][],
    x: number, y: number,
    colWidths: number[],
): number => {
    const rowH = 9;

    // Header row (Subtle border bottom, no heavy background)
    doc.setFontSize(7);
    doc.setTextColor(...C.light);
    doc.setFont('helvetica', 'bold');
    let cx = x;
    headers.forEach((h, i) => {
        doc.text(h.toUpperCase(), cx + 2, y + 6);
        cx += colWidths[i];
    });
    doc.setFont('helvetica', 'normal');
    
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(x, y + 8, x + colWidths.reduce((a, b) => a + b, 0), y + 8);
    y += rowH;

    // Data rows
    rows.forEach((row, ri) => {
        y = ensureSpace(doc, y, rowH + 2);
        
        // Striped background for readability
        if (ri % 2 === 0) {
            doc.setFillColor(...C.bgLight);
            doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowH, 'F');
        }

        doc.setFontSize(8);
        doc.setTextColor(...C.dark);
        cx = x;
        row.forEach((cell, i) => {
            // Check if cell is a status cell with a warning sign
            if (cell.includes('⚠')) {
                doc.setTextColor(...C.amber);
                doc.setFont('helvetica', 'bold');
            } else if (cell.includes('Normal') || cell.includes('Within')) {
                doc.setTextColor(...C.mid);
                doc.setFont('helvetica', 'normal');
            } else {
                doc.setTextColor(...C.dark);
                doc.setFont('helvetica', 'normal');
            }
            doc.text(cell, cx + 2, y + 6);
            cx += colWidths[i];
        });
        
        doc.setDrawColor(245, 245, 245);
        doc.line(x, y + rowH, x + colWidths.reduce((a, b) => a + b, 0), y + rowH);
        
        y += rowH;
    });

    return y + 6;
};


// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PDF GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export const generatePDF = async (
    healthData: HealthData,
    doctor?: Doctor,
): Promise<Blob> => {
    const logoBase64 = await fetchImageAsBase64('/logo.png');
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    addWatermark(doc);

    const patientName = getPatientName();
    const dateStr = formatDate();
    const bmi = healthData.bmi ?? (healthData.height && healthData.weight
        ? Math.round((healthData.weight / Math.pow(healthData.height / 100, 2)) * 10) / 10
        : null);
    const bmiInfo = getBmiInfo(bmi);
    const glucoseInfo = getGlucoseInfo(healthData.bloodGlucose);

    // ─── MINIMALIST HEADER ──────────────────────────────────────────────
    
    // Modern Logo
    doc.addImage(logoBase64, 'PNG', 15, 12, 18, 0);

    // Title Block
    doc.setFontSize(16);
    doc.setTextColor(...C.dark);
    doc.setFont('helvetica', 'bold');
    doc.text('ELECTRONIC HEALTH RECORD', 40, 18);
    
    doc.setFontSize(8);
    doc.setTextColor(...C.mid);
    doc.setFont('helvetica', 'normal');
    doc.text('Verified Patient Biometric & Assessment Export', 40, 23);

    // Right-aligned Document Meta
    const headerRightX = pw - 15;
    doc.setFontSize(7);
    doc.setTextColor(...C.light);
    doc.text('REPORT ID', headerRightX, 15, { align: 'right' });
    doc.setTextColor(...C.dark);
    doc.setFont('helvetica', 'bold');
    const docId = `MHC-${Math.floor(Date.now() / 1000).toString(16).toUpperCase()}`;
    doc.text(docId, headerRightX, 19, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.light);
    doc.text('GENERATED', headerRightX, 24, { align: 'right' });
    doc.setTextColor(...C.dark);
    doc.text(dateStr, headerRightX, 28, { align: 'right' });

    // Divider Line
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(15, 34, pw - 15, 34);

    // ─── PATIENT DETAILS SECTION ─────────────────────────────────────────
    let y = 42;

    doc.setFontSize(8);
    doc.setTextColor(...C.light);
    doc.text('PATIENT DEMOGRAPHICS', 15, y);
    doc.text('CLINICAL CONTEXT', pw / 2 + 10, y);
    
    y += 5;
    
    // Column 1: Patient
    doc.setFontSize(12);
    doc.setTextColor(...C.dark);
    doc.setFont('helvetica', 'bold');
    doc.text(patientName, 15, y);
    doc.setFont('helvetica', 'normal');
    
    doc.setFontSize(9);
    doc.setTextColor(...C.mid);
    
    const ageInfo = healthData.age ? `${healthData.age} Years Old` : 'Age Unspecified';
    const genderInfo = healthData.gender ? healthData.gender.charAt(0).toUpperCase() + healthData.gender.slice(1) : 'Gender Unspecified';
    doc.text(`${ageInfo} • ${genderInfo}`, 15, y + 6);

    // Column 2: Context
    if (doctor) {
        doc.setFontSize(10);
        doc.setTextColor(...C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text(`Referred to Dr. ${doctor.firstName} ${doctor.lastName}`, pw / 2 + 10, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...C.mid);
        doc.text(`Specialty: ${doctor.specialty}`, pw / 2 + 10, y + 6);
        doc.text('Data shared via MediBridge Portal', pw / 2 + 10, y + 12);
    } else {
        doc.setFontSize(9);
        doc.setTextColor(...C.mid);
        doc.text('Personal Record Export', pw / 2 + 10, y);
        doc.text('Not attached to a specific consultation.', pw / 2 + 10, y + 6);
    }

    y += 24;

    // ─── VITALS CARDS ───────────────────────────────────────────────────
    y = drawSectionHeader(doc, 'Vitals Overview', 15, y, pw);
    y += 4;

    const cardW = (pw - 39) / 4; // 4 cards with 3px gaps
    const cardGap = 3;

    drawMetricCard(doc, 'BMI', bmi ? bmi.toString() : '—', 'kg/m²',
        bmiInfo.label, bmiInfo.color, bmiInfo.lightBg, 15, y, cardW);

    drawMetricCard(doc, 'Weight', healthData.weight ? healthData.weight.toString() : '—', 'kg',
        '', C.mid, C.bgLight,
        15 + cardW + cardGap, y, cardW);

    drawMetricCard(doc, 'Height', healthData.height ? healthData.height.toString() : '—', 'cm',
        '', C.mid, C.bgLight,
        15 + 2 * (cardW + cardGap), y, cardW);

    drawMetricCard(doc, 'Fasting Glu.', healthData.bloodGlucose ? healthData.bloodGlucose.toString() : '—', 'mg/dL',
        glucoseInfo.label, glucoseInfo.color, glucoseInfo.lightBg,
        15 + 3 * (cardW + cardGap), y, cardW);

    y += 36;

    // ─── CLINICAL BIOMETRICS TABLE ──────────────────────────────────────
    y = drawSectionHeader(doc, 'Clinical Indicators', 15, y, pw);
    y += 4;

    const bioRows: string[][] = [];
    if (healthData.age) bioRows.push(['Age', `${healthData.age} yrs`, 'N/A']);
    if (healthData.gender) bioRows.push(['Sex at Birth', healthData.gender.charAt(0).toUpperCase() + healthData.gender.slice(1), 'N/A']);
    if (healthData.height) bioRows.push(['Stature', `${healthData.height} cm / ${(healthData.height / 2.54).toFixed(1)} in`, 'N/A']);
    if (healthData.weight) bioRows.push(['Body Mass', `${healthData.weight} kg / ${(healthData.weight * 2.205).toFixed(1)} lbs`, 'N/A']);
    if (bmi) bioRows.push(['Body Mass Index', `${bmi} kg/m²`, bmi >= 18.5 && bmi < 25 ? 'Within normal limits' : `⚠ ${bmiInfo.label}`]);
    if (healthData.bloodGlucose) bioRows.push(['Fasting Glucose', `${healthData.bloodGlucose} mg/dL`, healthData.bloodGlucose <= 100 ? 'Normal Range' : `⚠ ${glucoseInfo.label}`]);

    y = drawModernTable(doc, ['Metric', 'Recorded Value', 'Clinical Note'], bioRows, 15, y, [50, 60, 70]);
    y += 4;

    // ─── HEALTH SCORES (Sleek bars) ─────────────────────────────────────
    if (healthData.completedAdvancedAnalysis) {
        y = ensureSpace(doc, y, 70);
        y = drawSectionHeader(doc, 'AI-Assisted Health Assessment', 15, y, pw);
        y += 4;

        // Overall score in a sleek light blue summary box
        if (healthData.overallAdvancedScore) {
            const ov = healthData.overallAdvancedScore;
            doc.setFillColor(...C.primaryLight);
            doc.setDrawColor(...C.primary);
            doc.setLineWidth(0.3);
            doc.roundedRect(15, y, pw - 30, 16, 2, 2, 'FD');

            doc.setFontSize(9);
            doc.setTextColor(...C.primary);
            doc.setFont('helvetica', 'bold');
            doc.text('OVERALL WELLNESS INDEX', 20, y + 6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.dark);
            doc.text('Composite score derived from biometric and lifestyle markers.', 20, y + 11.5);

            const ovColor = scoreColor(ov);
            doc.setFontSize(16);
            doc.setTextColor(...ovColor);
            doc.setFont('helvetica', 'bold');
            doc.text(`${ov}/100`, pw - 20, y + 10.5, { align: 'right' });
            doc.setFontSize(7);
            doc.text(scoreLabel(ov).toUpperCase(), pw - 20, y + 14, { align: 'right' });
            doc.setFont('helvetica', 'normal');

            y += 22;
        }

        // Individual trackers in two column layout
        const trW = (pw - 40) / 2;
        const col1X = 15;
        const col2X = 15 + trW + 10;
        let trY = y;

        if (healthData.sleepScore) drawScoreBar(doc, 'Rest & Recovery', healthData.sleepScore, col1X, trY, trW - 45);
        if (healthData.hydrationScore) drawScoreBar(doc, 'Hydration Status', healthData.hydrationScore, col2X, trY, trW - 45);
        trY += 12;
        
        if (healthData.exerciseScore) drawScoreBar(doc, 'Physical Activity', healthData.exerciseScore, col1X, trY, trW - 45);
        if (healthData.stressScore) drawScoreBar(doc, 'Stress Management', healthData.stressScore, col2X, trY, trW - 45);
        trY += 16;
        
        y = trY;

        // ─── DETAILED ANALYSIS SECTIONS (CLINICAL STYLE) ────────────────
        if (healthData.savedAnalysis && healthData.savedAnalysis.length > 0) {
            y = ensureSpace(doc, y, 30);
            y = drawSectionHeader(doc, 'Clinical Findings & AI Recommendations', 15, y, pw);
            y += 4;

            healthData.savedAnalysis.forEach((section) => {
                y = ensureSpace(doc, y, 40);

                // Title Block Header for Observation
                // Light background box with colored left accent strip
                doc.setFillColor(...C.bgLight);
                doc.roundedRect(15, y, pw - 30, 10, 2, 2, 'F');
                
                const sColor = scoreColor(section.score);
                doc.setFillColor(...sColor);
                doc.roundedRect(15, y, 2.5, 10, 1, 1, 'F');
                
                doc.setFontSize(10);
                doc.setTextColor(...C.dark);
                doc.setFont('helvetica', 'bold');
                doc.text(`${section.title}`, 22, y + 6.5);
                doc.setFont('helvetica', 'normal');

                y += 14;

                // Analysis text (Medical observation icon/style)
                doc.setFontSize(8);
                doc.setTextColor(...C.mid);
                doc.setFont('helvetica', 'bold');
                doc.text('OBSERVATION:', 20, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...C.dark);
                
                // Adjust text width considering the dot offset. Left margin is 20, text starts at 45. pw - 45 - 15 (right margin)
                const splitAnalysis = doc.splitTextToSize(section.analysis, pw - 60);
                splitAnalysis.forEach((line: string) => {
                    doc.text(line, 45, y);
                    y += 4.5;
                });

                y += 2;

                // Recommendation (Rx style box)
                y = ensureSpace(doc, y, 20);
                
                // Remove the "Rx: " logic if any and add space for recommendation text box properly
                // Max width should account for x=50, right margin 15, so pw - 50 - 15 = pw - 65
                const recText = doc.splitTextToSize(section.recommendation, pw - 65);
                const recH = recText.length * 4.5 + 8;
                
                // Left border accent
                doc.setDrawColor(...C.green);
                doc.setLineWidth(1);
                doc.line(45, y, 45, y + recH);
                
                // Very subtle background
                doc.setFillColor(...C.bgLight);
                doc.rect(46, y, pw - 61, recH, 'F');

                doc.setFontSize(8);
                doc.setTextColor(...C.green);
                doc.setFont('helvetica', 'bold');
                doc.text('RECOMMENDED ACTION PLAN', 50, y + 5);
                doc.setFont('helvetica', 'normal');
                
                doc.setTextColor(...C.dark);
                let ry = y + 10;
                recText.forEach((line: string) => {
                    doc.text(line, 50, ry);
                    ry += 4.5;
                });

                y += recH + 10;
            });
        }
    } else {
        // ── No advanced analysis ─────────────────────────────────────────
        y = ensureSpace(doc, y, 20);
        doc.setFillColor(...C.amberLight);
        doc.setDrawColor(...C.amber);
        doc.setLineWidth(0.3);
        doc.roundedRect(15, y, pw - 30, 20, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setTextColor(...C.amber);
        doc.setFont('helvetica', 'bold');
        doc.text('CLINICAL NOTE', 20, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.dark);
        doc.text('Comprehensive AI health assessment has not been conducted.', 45, y + 8);
        doc.text('Only standard self-reported biometrics are included in this export.', 45, y + 14);
        y += 28;
    }

    // ─── MEDICAL DISCLAIMER ─────────────────────────────────────────────
    y = ensureSpace(doc, y, 24);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(15, y, pw - 15, y);
    y += 6;
    doc.setFontSize(6.5);
    doc.setTextColor(...C.light);
    const disclaimerLines = doc.splitTextToSize(
        'LEGAL & MEDICAL DISCLAIMER: This document is generated iteratively by the MediBridge Health Connect AI Platform and relies strictly on patient '
        + 'self-reported metrics. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. '
        + 'Physicians should corroborate clinical data independently. This document contains Protected Health Information (PHI).',
        pw - 30,
    );
    disclaimerLines.forEach((line: string) => {
        y = ensureSpace(doc, y, 4);
        doc.text(line, 15, y);
        y += 3.5;
    });

    // ─── FOOTER ON EVERY PAGE ───────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const ph = doc.internal.pageSize.getHeight();
        doc.setDrawColor(...C.border);
        doc.line(15, ph - 12, pw - 15, ph - 12);
        doc.setFontSize(6.5);
        doc.setTextColor(...C.light);
        
        // Left - App Name
        doc.setFont('helvetica', 'bold');
        doc.text('MEDIBRIDGE HEALTH CONNECT', 15, ph - 7);
        doc.setFont('helvetica', 'normal');
        
        // Right - Pagination
        doc.text(`Page ${i} of ${totalPages}`, pw - 15, ph - 7, { align: 'right' });
        
        // Center - Patient Name + Date
        doc.text(`Record for: ${patientName}  •  ${dateStr}`, pw / 2, ph - 7, { align: 'center' });
    }

    return doc.output('blob');
};

// ═══════════════════════════════════════════════════════════════════════════
//  DOWNLOAD HELPER
// ═══════════════════════════════════════════════════════════════════════════

export const downloadPDF = async (
    healthData: HealthData,
    doctor?: Doctor,
): Promise<void> => {
    const pdfBlob = await generatePDF(healthData, doctor);
    const url = URL.createObjectURL(pdfBlob);

    const patientName = getPatientName().replace(/\s+/g, '_').toLowerCase();
    const dateSlug = new Date().toISOString().split('T')[0];

    const link = document.createElement('a');
    link.href = url;
    link.download = `health_record_${patientName}_${dateSlug}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};
