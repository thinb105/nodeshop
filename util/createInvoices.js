const fs = require("fs");
const path = require('path');
const PDFDocument = require("pdfkit");

let Ototal = 0;

let imagePath = path.join(process.cwd(),'images','logo.png');

function createInvoice(doc, order) {
  // let doc = new PDFDocument({ size: "A4", margin: 50 });
  order.products.forEach(p => {
      Ototal += p.product.price * p.quantity;
  })

  generateHeader(doc);
  generateCustomerInformation(doc, order);
  generateInvoiceTable(doc, order);
  // generateFooter(doc);

  doc.end();
  return doc;
}

function generateHeader(doc) {
  doc
    .image(imagePath, 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(20)
    .text("Node-Shop Inc.", 110, 57)
    .fontSize(10)
    .text("Node-Shop Inc.", 200, 50, { align: "right" })
    .text("285 Co Nhue ", 200, 65, { align: "right" })
    .text("Co Nhue 2, Bac Tu Liem, Ha Noi", 200, 80, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, order) {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("OrderId:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(order._id, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text("Balance Due:", 50, customerInformationTop + 30)
    .text(
    `${Ototal}`,
      150,
      customerInformationTop + 30
    )

    .font("Times-Bold")
    .text(order.user.firstName +' ' +order.user.lastName, 300, customerInformationTop)
    .font(path.join(process.cwd(),'fonts','times.ttf'))
    .text(order.user.address, 300, customerInformationTop + 15)
    .moveDown();

  generateHr(doc, 252);
}

function generateInvoiceTable(doc, order) {
  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Description",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < order.products.length; i++) {
    const p = order.products[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      p.product.title,
      p.product.description,
      p.product.price,
      p.quantity,
      p.product.price * p.quantity
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  doc.font("Helvetica-Bold")
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    Ototal
  );

//   const paidToDatePosition = subtotalPosition + 20;
//   generateTableRow(
//     doc,
//     paidToDatePosition,
//     "",
//     "",
//     "Paid To Date",
//     "",
//     formatCurrency(invoice.paid)
//   );

//   const duePosition = subtotalPosition + 25;
//   doc.font("Helvetica-Bold");
//   generateTableRow(
//     doc,
//     duePosition,
//     "",
//     "",
//     "Balance Due",
//     "",
//     formatCurrency(invoice.subtotal - invoice.paid)
//   );
//   doc.font("Helvetica");
 }

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Node-Shop Thank you for your business.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}
module.exports = {
  createInvoice : createInvoice
};
