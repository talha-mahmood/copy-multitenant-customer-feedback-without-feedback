import PDFDocument from 'pdfkit';

export class PdfExportHelper {
  static async generateCouponBatchesPdf(batches: any[], coupons: any[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 30 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    doc.fontSize(18).text('Coupon Batches Report', { align: 'center' });
    doc.moveDown();

    batches.forEach((batch, idx) => {
      doc.fontSize(14).text(`Batch #${idx + 1}: ${batch.name || batch.id}`);
      doc.fontSize(12).text(`Type: ${batch.batch_type}`);
      doc.text(`Start Date: ${batch.start_date}`);
      doc.text(`End Date: ${batch.end_date}`);
      doc.text(`Total Quantity: ${batch.total_quantity}`);
      doc.moveDown(0.5);
      doc.fontSize(12).text('Coupons:', { underline: true });
      const batchCoupons = coupons.filter(c => c.batch_id === batch.id);
      batchCoupons.forEach((coupon, cidx) => {
        doc.text(`  ${cidx + 1}. Code: ${coupon.code} | Status: ${coupon.status}`);
      });
      doc.moveDown();
    });

    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}
