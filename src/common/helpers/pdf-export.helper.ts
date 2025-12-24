import PDFDocument from 'pdfkit';

export class PdfExportHelper {
  static async generateCouponBatchesPdf(batch: any, coupons: any[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 30 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // --- Title ---
    doc.fontSize(18).text('Batch Details Report', 14, 20);

    // --- Batch Info Section ---
    doc.fontSize(11);
    doc.fillColor('black');
    let yPos = 40;
    const lineHeight = 16;
    doc.text(`Batch Name: ${batch.batch_name ?? '-'}`, 14, yPos);
    yPos += lineHeight;
    doc.text(`Batch ID: ${batch.id ?? '-'}`, 14, yPos);
    yPos += lineHeight;
    doc.text(`Type: ${batch.batch_type ?? '-'}`, 14, yPos);
    yPos += lineHeight;
    doc.text(`Status: ${batch.is_active === undefined ? '-' : batch.is_active ? 'Active' : 'Inactive'}`, 14, yPos);
    yPos += lineHeight;
    doc.text(`Validity: ${batch.start_date ? (new Date(batch.start_date)).toLocaleDateString() : '-'} to ${batch.end_date ? (new Date(batch.end_date)).toLocaleDateString() : '-'}`, 14, yPos);
    yPos += lineHeight;
    doc.text(`Utilization: ${batch.issued_quantity ?? '-'} / ${batch.total_quantity ?? '-'}`, 14, yPos);
    yPos += lineHeight + 8;

    // --- Coupons Table ---
    // Table header
    const tableColumn = ['Code', 'Status', 'Issued At', 'Redeemed At'];
    const colWidths = [100, 60, 100, 100];
    let x = 14;
    let tableY = yPos;
    doc.fontSize(10).fillColor('white').rect(x, tableY, colWidths.reduce((a, b) => a + b, 0), 20).fill('#16a34a');
    doc.fillColor('white');
    let colX = x;
    tableColumn.forEach((col, i) => {
      doc.text(col, colX + 2, tableY + 5, { width: colWidths[i] - 4, align: 'left' });
      colX += colWidths[i];
    });
    doc.fillColor('black');

    // Table rows
    let rowY = tableY + 20;
    // Helper for date formatting
    function formatDateTime(dt) {
      if (!dt) return '-';
      const d = new Date(dt);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    }
    coupons.forEach((c, idx) => {
      colX = x;
      const rowData = [
        c.coupon_code ?? '-',
        c.status ?? '-',
        formatDateTime(c.issued_at),
        formatDateTime(c.redeemed_at),
      ];
      rowData.forEach((cell, i) => {
        doc.fontSize(9).fillColor('black').text(cell, colX + 2, rowY + 4, { width: colWidths[i] - 4, align: 'left' });
        colX += colWidths[i];
      });
      // Row background
      if (idx % 2 === 0) {
        doc.rect(x, rowY, colWidths.reduce((a, b) => a + b, 0), 18).fillOpacity(0.07).fillAndStroke('#e5e7eb', '#e5e7eb').fillOpacity(1);
      }
      rowY += 18;
      if (rowY > doc.page.height - 40) {
        doc.addPage();
        rowY = 40;
      }
    });

    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}
