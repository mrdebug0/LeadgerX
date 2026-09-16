import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { Entry, UdhaarRecord, InventoryItem } from '../../src/types';

interface PDFReportMetadata {
  storeName: string;
  userName: string;
  email: string;
  plan: string;
}

/**
 * Professional report generation using PDFKit with branding matching LeadgerX.
 */
export function generatePDFReport(
  res: Response,
  type: 'sales' | 'udhaar' | 'inventory',
  data: {
    entries?: Entry[];
    udhaar?: UdhaarRecord[];
    inventory?: InventoryItem[];
  },
  meta: PDFReportMetadata
) {
  const doc = new PDFDocument({ margin: 50, bufferPages: true });

  const dateStr = new Date().toLocaleDateString('en-IN', {
    dateStyle: 'medium',
  });
  const filename = `LeadgerX_${type}_Report_${Date.now()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // --- BRANDING COLORS ---
  const PRIMARY_COLOR = '#000000'; // Dark Slate/Black
  const ACCENT_COLOR = '#10b981';  // Emerald Green Accent
  const SUBTITLE_COLOR = '#475569'; // Soft Slate
  const LIGHT_GRAY = '#f1f5f9';     // Zebra striping background
  const TEXT_COLOR = '#1e293b';     // Primary body text

  // --- REUSABLE HEADER & LOGO ---
  const drawHeader = (title: string, subtitle: string) => {
    // Elegant left colored stripe
    doc.rect(50, 45, 6, 50).fill(ACCENT_COLOR);

    // App Brand Title
    doc
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('LeadgerX AI', 68, 45, { characterSpacing: 1 });

    doc
      .fillColor(ACCENT_COLOR)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('BUSINESS OPERATING SYSTEM', 68, 70, { characterSpacing: 2 });

    // Document Metadata column (Right-aligned)
    doc
      .fillColor(SUBTITLE_COLOR)
      .font('Helvetica')
      .fontSize(9)
      .text(`Store: ${meta.storeName}`, 350, 45, { align: 'right', width: 210 })
      .text(`Owner: ${meta.userName} (${meta.email})`, 350, 58, { align: 'right', width: 210 })
      .text(`Date: ${dateStr} | Tier: ${meta.plan}`, 350, 71, { align: 'right', width: 210 });

    // Divider line
    doc.moveTo(50, 110).lineTo(562, 110).strokeColor('#cbd5e1').lineWidth(1).stroke();

    // Section Title
    doc
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(title, 50, 130);

    doc
      .fillColor(SUBTITLE_COLOR)
      .font('Helvetica')
      .fontSize(9.5)
      .text(subtitle, 50, 150)
      .text(' ', 50, 160); // Padding spacer
  };

  // --- REUSABLE FOOTER ---
  const drawFooter = () => {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Footer line divider
      doc.moveTo(50, 740).lineTo(562, 740).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // Footer content
      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .font('Helvetica')
        .text(
          'LeadgerX Intelligent Ledger Platform © 2026. This is an official digital asset report.',
          50,
          750,
          { align: 'left', width: 350 }
        )
        .text(
          `Page ${i + 1} of ${pages.count}`,
          350,
          750,
          { align: 'right', width: 212 }
        );
    }
  };

  if (type === 'sales') {
    const list = data.entries || [];
    const salesList = list.filter(e => e.type === 'sale');
    const totals = salesList.reduce((sum, e) => sum + (e.amount || 0), 0);

    drawHeader('SALES & REVENUE ACCOUNT JOURNAL', 'Review registered income logs, sales entries, and transaction statuses.');

    // KPI Blocks in table
    const startY = 175;
    doc.rect(50, startY, 155, 50).fill('#fafafa').stroke('#e2e8f0');
    doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').fontSize(8.5).text("REVENUE TOTALS", 60, startY + 10);
    doc.fillColor('#047857').font('Helvetica-Bold').fontSize(14).text(`INR ${totals.toLocaleString('en-IN')}`, 60, startY + 24);

    doc.rect(215, startY, 155, 50).fill('#fafafa').stroke('#e2e8f0');
    doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').fontSize(8.5).text("TRANSACTION COUNT", 225, startY + 10);
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(14).text(`${salesList.length} Sales`, 225, startY + 24);

    doc.rect(380, startY, 182, 50).fill('#fafafa').stroke('#e2e8f0');
    doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').fontSize(8.5).text("AVERAGE CART", 390, startY + 10);
    const avgBasket = salesList.length > 0 ? Math.round(totals / salesList.length) : 0;
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(14).text(`INR ${avgBasket.toLocaleString('en-IN')}`, 390, startY + 24);

    // Render Table Header
    let currentY = 245;
    doc.rect(50, currentY, 512, 22).fill(PRIMARY_COLOR);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('DATE', 60, currentY + 7, { width: 65 });
    doc.text('CUSTOMER', 130, currentY + 7, { width: 140 });
    doc.text('PRODUCT / SERVICE', 275, currentY + 7, { width: 130 });
    doc.text('QTY', 410, currentY + 7, { width: 40, align: 'right' });
    doc.text('RATE', 455, currentY + 7, { width: 50, align: 'right' });
    doc.text('TOTAL', 510, currentY + 7, { width: 45, align: 'right' });

    currentY += 22;

    // Render rows
    salesList.forEach((e, index) => {
      // Check for page overflow
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        // Re-draw small table header on new page
        doc.rect(50, currentY, 512, 18).fill(PRIMARY_COLOR);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
        doc.text('DATE', 60, currentY + 5);
        doc.text('CUSTOMER', 130, currentY + 5);
        doc.text('PRODUCT / SERVICE', 275, currentY + 5);
        doc.text('QTY', 410, currentY + 5, { align: 'right' });
        doc.text('RATE', 455, currentY + 5, { align: 'right' });
        doc.text('TOTAL', 510, currentY + 5, { align: 'right' });
        currentY += 18;
      }

      // Zebra striping
      if (index % 2 === 1) {
        doc.rect(50, currentY, 512, 22).fill(LIGHT_GRAY);
      }

      doc.fillColor(TEXT_COLOR).font('Helvetica').fontSize(8.5);
      
      const formattedDate = e.date ? new Date(e.date).toLocaleDateString('en-IN') : '-';
      doc.text(formattedDate, 60, currentY + 6, { width: 65, lineBreak: false });
      
      const custName = e.customerName || 'Self / Cash-and-Carry';
      doc.font('Helvetica-Bold').text(custName.toUpperCase(), 130, currentY + 6, { width: 140, lineBreak: false });
      
      doc.font('Helvetica').text(e.productName || 'General Kirana', 275, currentY + 6, { width: 130, lineBreak: false });
      doc.text(String(e.quantity || 1), 410, currentY + 6, { width: 40, align: 'right', lineBreak: false });
      
      const rate = e.price || 0;
      doc.text(`₹${rate}`, 455, currentY + 6, { width: 50, align: 'right', lineBreak: false });
      
      const amt = e.amount || 0;
      doc.font('Helvetica-Bold').text(`₹${amt}`, 510, currentY + 6, { width: 45, align: 'right', lineBreak: false });

      currentY += 22;
    });

    // Grand totals bottom card
    currentY += 10;
    doc.rect(350, currentY, 212, 26).fill('#fafafa').stroke('#cbd5e1');
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(9);
    doc.text('GRAND REVENUE:', 365, currentY + 9);
    doc.fillColor('#047857').fontSize(11).text(`INR ${totals.toLocaleString('en-IN')}`, 455, currentY + 8, { align: 'right', width: 95 });

  } else if (type === 'udhaar') {
    const list = data.udhaar || [];
    const activeUdhaar = list.filter(r => r.status === 'pending' || r.status === 'partially_paid');
    const totalPending = activeUdhaar.reduce((sum, r) => sum + (r.amount || 0), 0);

    drawHeader('ACTIVE CREDIT UDHAAR LEDGER', 'Comprehensive audit report tracing outstanding business credit liabilities.');

    // KPI Blocks
    const startY = 175;
    doc.rect(50, startY, 240, 50).fill('#fafafa').stroke('#e2e8f0');
    doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').fontSize(8.5).text("TOTAL OUTSTANDING RECEIVABLES", 60, startY + 10);
    doc.fillColor('#be123c').font('Helvetica-Bold').fontSize(14).text(`INR ${totalPending.toLocaleString('en-IN')}`, 60, startY + 24);

    doc.rect(305, startY, 257, 50).fill('#fafafa').stroke('#e2e8f0');
    doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').fontSize(8.5).text("ACTIVE UNPAID CLIENT FILES", 315, startY + 10);
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(14).text(`${activeUdhaar.length} Borrowers`, 315, startY + 24);

    // Render Table Header
    let currentY = 245;
    doc.rect(50, currentY, 512, 22).fill(PRIMARY_COLOR);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('BORROWER CUSTOMER', 60, currentY + 7, { width: 170 });
    doc.text('DATE BORROWED', 240, currentY + 7, { width: 100 });
    doc.text('SETTLE DUE DATE', 350, currentY + 7, { width: 100 });
    doc.text('PENDING DEBIT', 460, currentY + 7, { width: 90, align: 'right' });

    currentY += 22;

    // Render rows
    list.forEach((r, index) => {
      // Page overflow
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        doc.rect(50, currentY, 512, 18).fill(PRIMARY_COLOR);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
        doc.text('BORROWER CUSTOMER', 60, currentY + 5);
        doc.text('DATE BORROWED', 240, currentY + 5);
        doc.text('SETTLE DUE DATE', 350, currentY + 5);
        doc.text('PENDING DEBIT', 460, currentY + 5, { align: 'right' });
        currentY += 18;
      }

      // Zebra striping
      if (index % 2 === 1) {
        doc.rect(50, currentY, 512, 22).fill(LIGHT_GRAY);
      }

      doc.fillColor(TEXT_COLOR).font('Helvetica').fontSize(8.5);
      
      const custName = r.customerName || 'Amana Consumer';
      doc.font('Helvetica-Bold').text(custName.toUpperCase(), 60, currentY + 6, { width: 170 });
      
      const formattedDate = r.dateCreated ? new Date(r.dateCreated).toLocaleDateString('en-IN') : '-';
      doc.font('Helvetica').text(formattedDate, 240, currentY + 6, { width: 100 });
      
      const formattedDue = r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '-';
      doc.text(formattedDue, 350, currentY + 6, { width: 100 });
      
      const isSettled = r.status === 'settled';
      const balanceColor = isSettled ? '#047857' : '#be123c';
      const label = isSettled ? 'SETTLED' : `₹${r.amount}`;
      
      doc.fillColor(balanceColor).font('Helvetica-Bold')
         .text(label, 460, currentY + 6, { width: 90, align: 'right' });

      currentY += 22;
    });

    // Grand receivables card
    currentY += 10;
    doc.rect(340, currentY, 222, 26).fill('#fef2f2').stroke('#fca5a5');
    doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(9);
    doc.text('TOTAL DEBT PORTFOLIO:', 350, currentY + 9);
    doc.fillColor('#be123c').fontSize(11).text(`INR ${totalPending.toLocaleString('en-IN')}`, 470, currentY + 8, { align: 'right', width: 80 });

  } else if (type === 'inventory') {
    const list = data.inventory || [];
    const lowStock = list.filter(i => i.stock <= i.minStockAlert);
    const valuation = list.reduce((sum, i) => sum + ((i.purchasePrice || i.sellingPrice * 0.7) * i.stock), 0);

    drawHeader('INVENTORY STOCK & VALUATION', 'Catalog audit tracking shelf quantities, valuation assets, and refill markers.');

    // KPI Blocks
    const startY = 175;
    doc.rect(50, startY, 155, 50).fill('#fafafa').stroke('#e2e8f0');
    doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').fontSize(8.5).text("PORTFOLIO VALUATION", 60, startY + 10);
    doc.fillColor('#047857').font('Helvetica-Bold').fontSize(14).text(`INR ${Math.round(valuation).toLocaleString('en-IN')}`, 60, startY + 24);

    doc.rect(215, startY, 155, 50).fill('#fafafa').stroke('#e2e8f0');
    doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').fontSize(8.5).text("LOW STOCK WARNINGS", 225, startY + 10);
    doc.fillColor(lowStock.length > 0 ? '#d97706' : PRIMARY_COLOR).font('Helvetica-Bold').fontSize(14).text(`${lowStock.length} Refills`, 225, startY + 24);

    doc.rect(380, startY, 182, 50).fill('#fafafa').stroke('#e2e8f0');
    doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').fontSize(8.5).text("TOTAL ITEMS", 390, startY + 10);
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(14).text(`${list.length} SKUs`, 390, startY + 24);

    // Render Table Header
    let currentY = 245;
    doc.rect(50, currentY, 512, 22).fill(PRIMARY_COLOR);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('PRODUCT SKU NAME', 60, currentY + 7, { width: 170 });
    doc.text('CATEGORY', 240, currentY + 7, { width: 100 });
    doc.text('MIN LEVEL', 350, currentY + 7, { width: 70, align: 'right' });
    doc.text('IN-STOCK', 430, currentY + 7, { width: 60, align: 'right' });
    doc.text('SELLING RATE', 500, currentY + 7, { width: 55, align: 'right' });

    currentY += 22;

    // Render rows
    list.forEach((i, index) => {
      // Page overflow
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        doc.rect(50, currentY, 512, 18).fill(PRIMARY_COLOR);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
        doc.text('PRODUCT SKU NAME', 60, currentY + 5);
        doc.text('CATEGORY', 240, currentY + 5);
        doc.text('MIN LEVEL', 350, currentY + 5, { align: 'right' });
        doc.text('IN-STOCK', 430, currentY + 5, { align: 'right' });
        doc.text('SELLING RATE', 500, currentY + 5, { align: 'right' });
        currentY += 18;
      }

      // Zebra striping
      if (index % 2 === 1) {
        doc.rect(50, currentY, 512, 22).fill(LIGHT_GRAY);
      }

      doc.fillColor(TEXT_COLOR).font('Helvetica').fontSize(8.5);
      
      doc.font('Helvetica-Bold').text(i.name.toUpperCase(), 60, currentY + 6, { width: 170 });
      doc.font('Helvetica').text(i.category || 'General', 240, currentY + 6, { width: 100 });
      doc.text(String(i.minStockAlert || 5), 350, currentY + 6, { width: 70, align: 'right' });
      
      const isCritical = i.stock <= i.minStockAlert;
      const stockColor = isCritical ? '#be123c' : TEXT_COLOR;
      
      doc.fillColor(stockColor).font(isCritical ? 'Helvetica-Bold' : 'Helvetica')
         .text(String(i.stock), 430, currentY + 6, { width: 60, align: 'right' });
      
      doc.fillColor(TEXT_COLOR).font('Helvetica')
         .text(`₹${i.sellingPrice || 0}`, 500, currentY + 6, { width: 55, align: 'right' });

      currentY += 22;
    });

    currentY += 10;
    doc.rect(340, currentY, 222, 26).fill('#f0fdf4').stroke('#bbf7d0');
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(9);
    doc.text('TOTAL ASSETS VALUED:', 350, currentY + 9);
    doc.fillColor('#15803d').fontSize(11).text(`INR ${Math.round(valuation).toLocaleString('en-IN')}`, 470, currentY + 8, { align: 'right', width: 80 });
  }

  // Draw final headers page triggers
  drawFooter();
  doc.end();
}
