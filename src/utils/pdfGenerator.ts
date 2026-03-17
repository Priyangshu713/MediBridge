import { jsPDF, GState } from 'jspdf';
import { HealthData } from '@/store/healthStore';
import { Doctor } from '@/types/doctor';
import { WellnessEntryData } from '@/services/WellnessSyncService';

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
//  WELLNESS / MENTAL HEALTH DRAWING PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════


/** Summarise long AI analysis text into 1-2 lines */
const summariseAnalysis = (analysis: string, maxLen = 90): string => {
    if (!analysis) return 'No AI analysis available';
    // Strip markdown formatting
    let plain = analysis.replace(/[#*_`>\-\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    // Take first meaningful sentence(s)
    const sentences = plain.split(/(?<=[.!?])\s+/).filter(s => s.length > 10);
    let summary = sentences.slice(0, 2).join(' ');
    if (summary.length > maxLen) summary = summary.substring(0, maxLen - 3) + '...';
    return summary || plain.substring(0, maxLen);
};

/** Calculate mental stability assessment */
const getStabilityAssessment = (entries: WellnessEntryData[]): {
    label: string; color: [number, number, number]; lightBg: [number, number, number];
    avgMood: number; avgStress: number; moodVariability: number;
} => {
    if (entries.length === 0) return { label: 'Insufficient Data', color: C.light, lightBg: C.bgLight, avgMood: 0, avgStress: 0, moodVariability: 0 };
    const moods = entries.map(e => e.moodScore);
    const stresses = entries.map(e => e.stressLevel);
    const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
    const avgStress = stresses.reduce((a, b) => a + b, 0) / stresses.length;
    const variance = moods.reduce((sum, m) => sum + Math.pow(m - avgMood, 2), 0) / moods.length;
    const moodVariability = Math.sqrt(variance);

    if (avgMood >= 7 && moodVariability < 2) return { label: 'Stable', color: C.green, lightBg: C.greenLight, avgMood: Math.round(avgMood * 10) / 10, avgStress: Math.round(avgStress * 10) / 10, moodVariability: Math.round(moodVariability * 10) / 10 };
    if (avgMood >= 4) return { label: 'Moderate – Monitor', color: C.amber, lightBg: C.amberLight, avgMood: Math.round(avgMood * 10) / 10, avgStress: Math.round(avgStress * 10) / 10, moodVariability: Math.round(moodVariability * 10) / 10 };
    return { label: 'Attention Required', color: C.red, lightBg: C.redLight, avgMood: Math.round(avgMood * 10) / 10, avgStress: Math.round(avgStress * 10) / 10, moodVariability: Math.round(moodVariability * 10) / 10 };
};

/** Draw a mood trend line chart */
const drawMoodTrendChart = (
    doc: jsPDF,
    entries: WellnessEntryData[],
    x: number, y: number, chartW: number, chartH: number,
): number => {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length === 0) return y;

    // Chart area
    const leftPad = 12;
    const bottomPad = 14;
    const plotX = x + leftPad;
    const plotW = chartW - leftPad - 4;
    const plotH = chartH - bottomPad - 4;
    const plotY = y;

    // Color zones (background bands)
    const zoneH3 = (plotH * 3) / 10; // mood 8-10 (top)
    const zoneH2 = (plotH * 3) / 10; // mood 5-7 (middle)
    const zoneH1 = (plotH * 4) / 10; // mood 1-4 (bottom)

    doc.setFillColor(220, 252, 231); // green-100
    doc.rect(plotX, plotY, plotW, zoneH3, 'F');
    doc.setFillColor(254, 249, 195); // amber-100
    doc.rect(plotX, plotY + zoneH3, plotW, zoneH2, 'F');
    doc.setFillColor(254, 226, 226); // red-100
    doc.rect(plotX, plotY + zoneH3 + zoneH2, plotW, zoneH1, 'F');

    // Zone labels on right
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.green);
    doc.text('Good', plotX + plotW + 1, plotY + zoneH3 / 2 + 1);
    doc.setTextColor(...C.amber);
    doc.text('Fair', plotX + plotW + 1, plotY + zoneH3 + zoneH2 / 2 + 1);
    doc.setTextColor(...C.red);
    doc.text('Low', plotX + plotW + 1, plotY + zoneH3 + zoneH2 + zoneH1 / 2 + 1);

    // Y-axis labels
    doc.setFontSize(5);
    doc.setTextColor(...C.light);
    for (let v = 1; v <= 10; v += 3) {
        const posY = plotY + plotH - ((v - 1) / 9) * plotH;
        doc.text(`${v}`, x + 2, posY + 1);
        // Grid line
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        doc.line(plotX, posY, plotX + plotW, posY);
    }

    // Plot line
    const step = plotW / Math.max(sorted.length - 1, 1);
    doc.setDrawColor(...C.primary);
    doc.setLineWidth(0.8);

    for (let i = 0; i < sorted.length - 1; i++) {
        const x1 = plotX + i * step;
        const y1 = plotY + plotH - ((sorted[i].moodScore - 1) / 9) * plotH;
        const x2 = plotX + (i + 1) * step;
        const y2 = plotY + plotH - ((sorted[i + 1].moodScore - 1) / 9) * plotH;
        doc.line(x1, y1, x2, y2);
    }

    // Data points
    sorted.forEach((entry, i) => {
        const px = plotX + i * step;
        const py = plotY + plotH - ((entry.moodScore - 1) / 9) * plotH;
        const mColor = entry.moodScore >= 7 ? C.green : entry.moodScore >= 4 ? C.amber : C.red;
        doc.setFillColor(...mColor);
        doc.circle(px, py, 1.2, 'F');
    });

    // X-axis date labels (show up to 6)
    doc.setFontSize(4.5);
    doc.setTextColor(...C.light);
    const labelCount = Math.min(sorted.length, 6);
    const labelStep = Math.max(1, Math.floor(sorted.length / labelCount));
    for (let i = 0; i < sorted.length; i += labelStep) {
        const d = new Date(sorted[i].date);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const px = plotX + i * step;
        doc.text(label, px - 3, plotY + plotH + 5);
    }

    // Border
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(plotX, plotY, plotW, plotH);

    return y + chartH + 4;
};

/** Draw stress level horizontal bar */
const drawStressBar = (
    doc: jsPDF, avgStress: number,
    x: number, y: number, barW: number,
): number => {
    const barH = 6;
    const stressColor: [number, number, number] = avgStress <= 3 ? C.green : avgStress <= 6 ? C.amber : C.red;
    const stressLabel = avgStress <= 3 ? 'Low' : avgStress <= 6 ? 'Moderate' : 'High';

    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.text('Average Stress Level', x, y);

    // Track
    doc.setFillColor(...C.border);
    doc.roundedRect(x, y + 3, barW, barH, 3, 3, 'F');

    // Fill
    const fillW = Math.max(4, (avgStress / 10) * barW);
    doc.setFillColor(...stressColor);
    doc.roundedRect(x, y + 3, fillW, barH, 3, 3, 'F');

    // Value + label
    doc.setFontSize(9);
    doc.setTextColor(...stressColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${avgStress}/10`, x + barW + 4, y + 8);
    doc.setFontSize(7);
    doc.text(stressLabel.toUpperCase(), x + barW + 18, y + 8);
    doc.setFont('helvetica', 'normal');

    return y + 16;
};

/** Draw top emotions as pill badges */
const drawTopEmotions = (
    doc: jsPDF, entries: WellnessEntryData[],
    x: number, y: number, maxW: number,
): number => {
    // Count emotion frequencies
    const freq: Record<string, number> = {};
    entries.forEach(e => e.emotions?.forEach(em => { freq[em] = (freq[em] || 0) + 1; }));
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) return y;

    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.text('Top Detected Emotions', x, y);
    y += 5;

    let cx = x;
    sorted.forEach(([emotion, count]) => {
        const label = `${emotion} (${count})`;
        doc.setFontSize(7);
        const tw = doc.getTextWidth(label) + 8;
        if (cx + tw > x + maxW) { cx = x; y += 9; }

        doc.setFillColor(...C.primaryLight);
        doc.roundedRect(cx, y, tw, 7, 3.5, 3.5, 'F');
        doc.setTextColor(...C.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(label, cx + 4, y + 5);
        doc.setFont('helvetica', 'normal');
        cx += tw + 3;
    });

    return y + 12;
};

/** Draw Journal Keywords Bar Chart */
const drawKeywordBarChart = (
    doc: jsPDF, entries: WellnessEntryData[],
    x: number, y: number, chartW: number, chartH: number,
): number => {
    const stopWords = new Set([
        'the','and','a','to','of','in','i','is','that','it','on','you','this','for','but','with','are','have','be','at','or','as','was','so','if','out','not','my','they','from','we','about','me','am','feel','feeling','like','just','when','what','how','very','really','because','much','more','been','im','will','do','can','some',
        'today','its','ive','felt','bit','lot','day','time','get','got','going','make','think','know','see','want','would','could','should','things','thing','now','did','didnt','dont','doesnt','wasnt','isnt','cant','wouldnt','couldnt','shouldnt','ill','id','theyre','youre','weve','then','than','there','their','here','where','why','who','which',
        'also','even','only','too','by','an','has','had','up','down','right','left','back','after','before','over','under','through','these','those','our','your','him','her','his','hers','them','us','into','any','all','no','yes','one','two','new','old','always','never','sometimes','often','still','go','come','went','came','take','took','give','gave','say','said','tell','told','find','found','let','put','keep','kept','need','needed','use','used','work','worked','try','tried','start','started','stop','stopped','call','called','ask','asked','leave','show','feelings',
        'yesterday','tomorrow','tonight','morning','afternoon','evening','night','week','month','year','hour','minute','second','few','many','most','least','less','quite','rather','somewhat','almost','actually','yeah','nope','okay','ok','sure','maybe','probably','definitely'
    ]);
    const wordCounts: Record<string, number> = {};
    entries.forEach(e => {
        const words = (e.entry || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        words.forEach(w => {
            if (w.length > 2 && !stopWords.has(w)) {
                wordCounts[w] = (wordCounts[w] || 0) + 1;
            }
        });
    });
    
    const sorted = Object.entries(wordCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) {
        doc.setFontSize(8);
        doc.setTextColor(...C.light);
        doc.text('Not enough journal text.', x, y + 10);
        return y + chartH;
    }

    const maxCount = sorted[0][1] || 1;
    let cy = y;
    
    sorted.forEach(([word, count]) => {
        doc.setFontSize(7);
        doc.setTextColor(...C.dark);
        doc.text(word, x, cy + 4);
        
        const barX = x + 30;
        const maxBarW = chartW - 40;
        const barW = Math.max(5, (count / maxCount) * maxBarW);
        
        doc.setFillColor(...C.primary);
        doc.roundedRect(barX, cy, barW, 6, 2, 2, 'F');
        
        doc.setFontSize(6);
        doc.setTextColor(...C.white);
        doc.text(`${count}`, barX + barW - (count >= 10 ? 6 : 4), cy + 4);
        
        cy += 8;
    });

    return y + chartH;
};

/** Draw Stability Scatter Plot (Mood vs Stress) */
const drawStabilityScatterPlot = (
    doc: jsPDF, entries: WellnessEntryData[],
    x: number, y: number, chartW: number, chartH: number,
): number => {
    if (entries.length === 0) return y + chartH;

    const plotX = x + 15;
    const plotW = chartW - 20;
    const plotH = chartH - 15;
    const plotY = y + 5;

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.5);
    doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH); 
    doc.line(plotX, plotY, plotX, plotY + plotH); 
    
    doc.setFontSize(5);
    doc.setTextColor(...C.mid);
    doc.text('Stress Level (1-10) →', plotX + plotW - 35, plotY + plotH + 8);
    doc.text('Mood ↑', plotX - 8, plotY + Math.max(plotH/2, 10), { angle: 90 });
    
    doc.setDrawColor(245, 245, 245);
    doc.setLineWidth(0.2);
    for(let i=1; i<=10; i+=3) {
        const px = plotX + ((i-1)/9)*plotW;
        doc.text(`${i}`, px - 1, plotY + plotH + 3.5);
        doc.line(px, plotY, px, plotY + plotH);
        
        const py = plotY + plotH - ((i-1)/9)*plotH;
        doc.text(`${i}`, plotX - 4, py + 1.5);
        doc.line(plotX, py, plotX + plotW, py);
    }

    entries.forEach(e => {
        const px = plotX + ((e.stressLevel - 1) / 9) * plotW;
        const py = plotY + plotH - ((e.moodScore - 1) / 9) * plotH;
        const mColor = e.moodScore >= 7 ? C.green : e.moodScore >= 4 ? C.amber : C.red;
        
        doc.setFillColor(...mColor);
        doc.circle(px, py, 1.5, 'F');
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.3);
        doc.circle(px, py, 1.5, 'S');
    });

    return y + chartH + 5;
};

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PDF GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export const generatePDF = async (
    healthData: HealthData,
    doctor?: Doctor,
    wellnessEntries?: WellnessEntryData[],
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

    // ═══════════════════════════════════════════════════════════════════════
    //  MENTAL WELLNESS REPORT (new page)
    // ═══════════════════════════════════════════════════════════════════════
    if (wellnessEntries !== undefined) {
        doc.addPage();
        addWatermark(doc);
        y = 20;

        // Page Header
        doc.addImage(logoBase64, 'PNG', 15, 12, 14, 0);
        doc.setFontSize(14);
        doc.setTextColor(...C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('MENTAL WELLNESS REPORT', 34, 18);
        doc.setFontSize(8);
        doc.setTextColor(...C.mid);
        doc.setFont('helvetica', 'normal');
        doc.text(`${patientName}  •  ${dateStr}  •  ${wellnessEntries.length} journal entries`, 34, 23);

        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.3);
        doc.line(15, 28, pw - 15, 28);
        y = 36;

        if (wellnessEntries.length > 0) {
        // ─── MENTAL STABILITY ASSESSMENT ────────────────────────────────
        const assessment = getStabilityAssessment(wellnessEntries);

        doc.setFillColor(...assessment.lightBg);
        doc.setDrawColor(...assessment.color);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, y, pw - 30, 26, 3, 3, 'FD');

        // Status badge
        doc.setFillColor(...assessment.color);
        const badgeText = assessment.label.toUpperCase();
        doc.setFontSize(8);
        const badgeW = doc.getTextWidth(badgeText) + 12;
        doc.roundedRect(20, y + 4, badgeW, 8, 4, 4, 'F');
        doc.setTextColor(...C.white);
        doc.setFont('helvetica', 'bold');
        doc.text(badgeText, 26, y + 9.5);
        doc.setFont('helvetica', 'normal');

        // Title
        doc.setFontSize(11);
        doc.setTextColor(...C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('Mental Stability Assessment', 20 + badgeW + 4, y + 10);
        doc.setFont('helvetica', 'normal');

        // Metrics row
        doc.setFontSize(7);
        doc.setTextColor(...C.mid);
        const metricsY = y + 18;
        doc.text(`Avg Mood: ${assessment.avgMood}/10`, 20, metricsY);
        doc.text(`Avg Stress: ${assessment.avgStress}/10`, 60, metricsY);
        doc.text(`Mood Variability: ${assessment.moodVariability} (σ)`, 105, metricsY);
        doc.text(`Entries: ${wellnessEntries.length}`, 160, metricsY);

        y += 34;

        // ─── MOOD TREND CHART ──────────────────────────────────────────
        y = drawSectionHeader(doc, 'Mood Trend (Last 30 Days)', 15, y, pw);
        y += 2;
        y = drawMoodTrendChart(doc, wellnessEntries.slice(0, 30), 15, y, pw - 30, 50);
        y += 4;

        // ─── STRESS & EMOTION OVERVIEW ─────────────────────────────────
        y = ensureSpace(doc, y, 45);
        y = drawSectionHeader(doc, 'Stress & Emotion Overview', 15, y, pw);
        y += 2;
        y = drawStressBar(doc, assessment.avgStress, 15, y, (pw - 80) / 2);
        y = drawTopEmotions(doc, wellnessEntries, 15, y, pw - 30);
        y += 4;

        // ─── KEYWORDS & STABILITY PLOT ─────────────────────────────────
        y = ensureSpace(doc, y, 60);
        const colW = (pw - 40) / 2;
        
        doc.setFontSize(10);
        doc.setTextColor(...C.primary);
        doc.setFont('helvetica', 'bold');
        doc.text('JOURNAL KEYWORDS', 15, y);
        doc.text('MOOD VS STRESS STABILITY', 15 + colW + 10, y);
        doc.setFont('helvetica', 'normal');
        y += 6;
        
        const chartsY = y;
        drawKeywordBarChart(doc, wellnessEntries, 15, chartsY, colW, 40);
        drawStabilityScatterPlot(doc, wellnessEntries, 15 + colW + 10, chartsY, colW, 40);
        y += 45;

        // ─── JOURNAL SUMMARIES TABLE ───────────────────────────────────
        y = ensureSpace(doc, y, 30);
        y = drawSectionHeader(doc, 'Journal Entries (User Input)', 15, y, pw);
        y += 2;

        // Table header
        doc.setFontSize(6.5);
        doc.setTextColor(...C.light);
        doc.setFont('helvetica', 'bold');
        doc.text('DATE', 15, y + 4);
        doc.text('MOOD', 42, y + 4);
        doc.text('JOURNAL ENTRY', 62, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.3);
        doc.line(15, y + 6, pw - 15, y + 6);
        y += 9;

        // Rows (max 10 entries)
        const displayEntries = wellnessEntries.slice(0, 10);
        displayEntries.forEach((we, ri) => {
            const entryLines = doc.splitTextToSize(we.entry || 'No text entry provided.', pw - 15 - 62);
            const rowH = Math.max(10, entryLines.length * 4 + 4);
            
            y = ensureSpace(doc, y, rowH + 2);

            // Striping
            if (ri % 2 === 0) {
                doc.setFillColor(...C.bgLight);
                doc.rect(15, y - 3, pw - 30, rowH, 'F');
            }

            // Date
            const d = new Date(we.date);
            const dateLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            doc.setFontSize(7);
            doc.setTextColor(...C.dark);
            doc.text(dateLabel, 15, y + 3);

            // Mood
            const moodColor = we.moodScore >= 7 ? C.green : we.moodScore >= 4 ? C.amber : C.red;
            doc.setFontSize(8);
            doc.setTextColor(...moodColor);
            doc.setFont('helvetica', 'bold');
            doc.text(`${we.moodScore}/10`, 42, y + 3);
            doc.setFont('helvetica', 'normal');

            // Journal Entry
            doc.setFontSize(6.5);
            doc.setTextColor(...C.mid);
            let ly = y + 3;
            entryLines.forEach((line: string) => {
                doc.text(line, 62, ly);
                ly += 4;
            });

            y += rowH;
        });

        if (wellnessEntries.length > 10) {
            doc.setFontSize(6.5);
            doc.setTextColor(...C.light);
            doc.text(`+ ${wellnessEntries.length - 10} more entries not shown`, 15, y + 3);
            y += 8;
        }
        } else {
            // No wellness entries message
            y = ensureSpace(doc, y, 20);
            doc.setFillColor(...C.amberLight);
            doc.setDrawColor(...C.amber);
            doc.setLineWidth(0.3);
            doc.roundedRect(15, y, pw - 30, 20, 2, 2, 'FD');
            doc.setFontSize(9);
            doc.setTextColor(...C.amber);
            doc.setFont('helvetica', 'bold');
            doc.text('NO WELLNESS DATA', 20, y + 8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.dark);
            doc.text('The patient opted to share mental wellness data, but no journal entries exist on record.', 45, y + 8);
            y += 28;
        }
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
    wellnessEntries?: WellnessEntryData[],
): Promise<void> => {
    const pdfBlob = await generatePDF(healthData, doctor, wellnessEntries);
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
