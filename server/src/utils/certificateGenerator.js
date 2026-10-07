const PDFDocument = require('pdfkit');

const COLORS = {
  green: '#166534',
  greenLight: '#16a34a',
  greenPale: '#7fae82',
  gold: '#c9a227',
  goldLight: '#e8c766',
  cream: '#fdfaf3',
  textDark: '#111827',
  textGray: '#4b5563',
  textLight: '#9ca3af',
};

const generateCertificateId = (donation, prefix) => {
  const shortId = donation._id.toString().slice(-6).toUpperCase();
  return `FB-${prefix}-${shortId}`;
};

const drawBackground = (doc) => {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.cream);
};

const drawOuterBorder = (doc) => {
  const w = doc.page.width;
  const h = doc.page.height;

  doc.rect(16, 16, w - 32, h - 32).lineWidth(1.5).stroke(COLORS.gold);
  doc.rect(24, 24, w - 48, h - 48).lineWidth(2.5).stroke(COLORS.green);
  doc.rect(31, 31, w - 62, h - 62).lineWidth(0.5).stroke(COLORS.gold);

  const size = 34;
  const off = 16;
  const corners = [
    { x: off, y: off, dx: 1, dy: 1 },
    { x: w - off, y: off, dx: -1, dy: 1 },
    { x: off, y: h - off, dx: 1, dy: -1 },
    { x: w - off, y: h - off, dx: -1, dy: -1 },
  ];

  corners.forEach(({ x, y, dx, dy }) => {
    doc.moveTo(x, y + dy * size).lineTo(x, y).lineTo(x + dx * size, y)
      .lineWidth(4).stroke(COLORS.green);
    doc.moveTo(x + dx * 6, y).lineTo(x + dx * 12, y)
      .lineWidth(2).stroke(COLORS.gold);
    doc.moveTo(x, y + dy * 6).lineTo(x, y + dy * 12)
      .lineWidth(2).stroke(COLORS.gold);
  });
};

const drawBottomWave = (doc) => {
  const w = doc.page.width;
  const h = doc.page.height;

  doc.save();
  doc.path(`M 0 ${h - 70} C ${w * 0.22} ${h - 130}, ${w * 0.5} ${h - 30}, ${w} ${h - 90} L ${w} ${h - 34} L 0 ${h - 34} Z`)
    .fill(COLORS.goldLight);

  doc.path(`M 0 ${h - 50} C ${w * 0.3} ${h - 105}, ${w * 0.62} ${h - 10}, ${w} ${h - 60} L ${w} ${h - 34} L 0 ${h - 34} Z`)
    .fill(COLORS.green);
  doc.restore();
};

// Proper pointed leaf shape: base point -> tip point, symmetric bezier curves
const drawLeaf = (doc, baseX, baseY, length, width, angleDeg, color, opacity) => {
  doc.save();
  doc.opacity(opacity);
  doc.rotate(angleDeg, { origin: [baseX, baseY] });

  const tipY = baseY - length;

  doc.path(
    `M ${baseX} ${baseY} ` +
    `C ${baseX - width} ${baseY - length * 0.22}, ${baseX - width * 0.45} ${baseY - length * 0.82}, ${baseX} ${tipY} ` +
    `C ${baseX + width * 0.45} ${baseY - length * 0.82}, ${baseX + width} ${baseY - length * 0.22}, ${baseX} ${baseY} Z`
  ).fill(color);

  // center vein
  doc.moveTo(baseX, baseY).lineTo(baseX, tipY)
    .lineWidth(0.5).opacity(Math.min(opacity + 0.15, 1)).stroke('#ffffff');

  doc.restore();
  doc.opacity(1);
};

// A leafy sprig running along one side of the page
const drawSideBranch = (doc, x, baseY, direction, colorSet) => {
  const totalHeight = 270;

  doc.save();
  doc.opacity(0.55);
  doc.moveTo(x, baseY).bezierCurveTo(
    x + direction * 22, baseY - totalHeight * 0.35,
    x - direction * 12, baseY - totalHeight * 0.7,
    x + direction * 12, baseY - totalHeight
  ).lineWidth(1).stroke(colorSet.gold);
  doc.restore();

  const leafSpecs = [
    { t: 0.14, side: 1, len: 30, w: 11 },
    { t: 0.28, side: -1, len: 26, w: 10 },
    { t: 0.42, side: 1, len: 32, w: 12 },
    { t: 0.56, side: -1, len: 24, w: 9 },
    { t: 0.70, side: 1, len: 22, w: 8 },
    { t: 0.84, side: -1, len: 18, w: 7 },
  ];

  leafSpecs.forEach((spec, i) => {
    const py = baseY - spec.t * totalHeight;
    const wobble = Math.sin(spec.t * Math.PI * 2.2) * 14;
    const px = x + direction * (8 + wobble);
    const angle = direction * spec.side * (28 + i * 4);
    const color = i % 2 === 0 ? colorSet.green : colorSet.gold;
    drawLeaf(doc, px, py, spec.len, spec.w, angle, color, 0.55);
  });
};

const drawSideDecorations = (doc) => {
  const h = doc.page.height;
  drawSideBranch(doc, 58, h - 90, 1, { green: COLORS.greenPale, gold: COLORS.goldLight });
  drawSideBranch(doc, doc.page.width - 58, h - 90, -1, { green: COLORS.greenPale, gold: COLORS.goldLight });
};

const drawEmblem = (doc, y) => {
  const centerX = doc.page.width / 2;
  const radius = 26;

  // Leaves fan out beside the circle like wings, clear of the circle itself
  drawLeaf(doc, centerX - radius - 2, y + 6, 30, 11, -35, COLORS.greenLight, 0.9);
  drawLeaf(doc, centerX - radius - 2, y + 6, 22, 9, -65, COLORS.greenLight, 0.7);
  drawLeaf(doc, centerX + radius + 2, y + 6, 30, 11, 35, COLORS.greenLight, 0.9);
  drawLeaf(doc, centerX + radius + 2, y + 6, 22, 9, 65, COLORS.greenLight, 0.7);

  doc.circle(centerX, y, radius).lineWidth(2).stroke(COLORS.green);
  doc.circle(centerX, y, radius - 4).lineWidth(0.5).stroke(COLORS.gold);

  doc.fontSize(19).fillColor(COLORS.green).font('Helvetica-Bold')
    .text('FB', centerX - 16, y - 10, { width: 32, align: 'center' });
};

const drawBasketIcon = (doc, x, y, color) => {
  doc.save();
  doc.polygon([x, y], [x + 20, y], [x + 17, y + 14], [x + 3, y + 14]).lineWidth(1.3).stroke(color);
  doc.moveTo(x - 2, y).lineTo(x + 22, y).lineWidth(1.3).stroke(color);
  doc.moveTo(x + 4, y).bezierCurveTo(x + 6, y - 10, x + 14, y - 10, x + 16, y).lineWidth(1.3).stroke(color);
  doc.moveTo(x + 5, y + 4).lineTo(x + 15, y + 4).lineWidth(0.75).stroke(color);
  doc.moveTo(x + 4.5, y + 9).lineTo(x + 15.5, y + 9).lineWidth(0.75).stroke(color);
  doc.restore();
};

const drawCalendarIcon = (doc, x, y, color) => {
  doc.save();
  doc.roundedRect(x, y - 2, 20, 16, 2).lineWidth(1.3).stroke(color);
  doc.moveTo(x, y + 4).lineTo(x + 20, y + 4).lineWidth(1.3).stroke(color);
  doc.moveTo(x + 5, y - 5).lineTo(x + 5, y + 1).lineWidth(1.3).stroke(color);
  doc.moveTo(x + 15, y - 5).lineTo(x + 15, y + 1).lineWidth(1.3).stroke(color);
  doc.circle(x + 6, y + 8, 1).fill(color);
  doc.circle(x + 10, y + 8, 1).fill(color);
  doc.circle(x + 14, y + 8, 1).fill(color);
  doc.restore();
};

const drawDeliveryIcon = (doc, x, y, color) => {
  doc.save();
  doc.circle(x + 4, y + 12, 4).lineWidth(1.3).stroke(color);
  doc.circle(x + 18, y + 12, 4).lineWidth(1.3).stroke(color);
  doc.moveTo(x + 4, y + 12).lineTo(x + 10, y + 4).lineTo(x + 18, y + 12).lineWidth(1.3).stroke(color);
  doc.moveTo(x + 10, y + 4).lineTo(x + 13, y + 4).lineWidth(1.3).stroke(color);
  doc.restore();
};

const ICONS = {
  basket: drawBasketIcon,
  calendar: drawCalendarIcon,
  delivery: drawDeliveryIcon,
};

const drawInfoBox = (doc, x, y, width, label, value, iconKey, accentColor) => {
  const height = 48;
  doc.roundedRect(x, y, width, height, 6).lineWidth(1).stroke(COLORS.gold);

  const iconFn = ICONS[iconKey] || ICONS.basket;
  iconFn(doc, x + 14, y + 16, accentColor);

  doc.fontSize(9).fillColor(COLORS.textLight).font('Helvetica-Bold')
    .text(label.toUpperCase(), x + 44, y + 11, { width: width - 54, characterSpacing: 0.5 });

  doc.fontSize(14).fillColor(COLORS.textDark).font('Helvetica-Bold')
    .text(value, x + 44, y + 25, { width: width - 54 });
};

const drawCertificateBody = (doc, {
  accentColor,
  certId,
  issueDate,
  title,
  recipientName,
  bodyLine1,
  bodyLine2,
  infoBoxes,
  tagline,
}) => {
  const pageW = doc.page.width;

  drawBackground(doc);
  drawSideDecorations(doc);
  drawBottomWave(doc);
  drawOuterBorder(doc);

  doc.fontSize(9).fillColor(COLORS.textLight).font('Helvetica-Bold')
    .text('CERTIFICATE ID', 55, 46);
  doc.fontSize(12).fillColor(COLORS.textDark).font('Helvetica-Bold')
    .text(certId, 55, 59);
  doc.moveTo(55, 78).lineTo(185, 78).lineWidth(1).stroke(COLORS.gold);

  doc.fontSize(9).fillColor(COLORS.textLight).font('Helvetica-Bold')
    .text('ISSUE DATE', pageW - 205, 46, { width: 150, align: 'right' });
  doc.fontSize(12).fillColor(COLORS.textDark).font('Helvetica-Bold')
    .text(issueDate, pageW - 205, 59, { width: 150, align: 'right' });
  doc.moveTo(pageW - 185, 78).lineTo(pageW - 55, 78).lineWidth(1).stroke(COLORS.gold);

  drawEmblem(doc, 82);

  doc.fontSize(19).fillColor(COLORS.green).font('Helvetica-Bold')
    .text('F O O D B R I D G E', 0, 122, { align: 'center', characterSpacing: 2.5 });

  doc.fontSize(9.5).fillColor(COLORS.textGray).font('Helvetica')
    .text('B R I D G I N G   F O O D   S U R P L U S   A N D   H U N G E R', 0, 144, {
      align: 'center', characterSpacing: 0.6,
    });

  doc.fontSize(46).fillColor(COLORS.textDark).font('Times-Bold')
    .text(title, 0, 172, { align: 'center' });

  const midY = 232;
  doc.moveTo(pageW / 2 - 140, midY).lineTo(pageW / 2 - 15, midY).lineWidth(1).stroke(COLORS.gold);
  doc.moveTo(pageW / 2 + 15, midY).lineTo(pageW / 2 + 140, midY).lineWidth(1).stroke(COLORS.gold);
  doc.polygon(
    [pageW / 2, midY - 6], [pageW / 2 + 7, midY], [pageW / 2, midY + 6], [pageW / 2 - 7, midY]
  ).fill(COLORS.gold);

  doc.fontSize(15).fillColor(COLORS.textGray).font('Helvetica-Oblique')
    .text('This certificate is proudly presented to', 0, 248, { align: 'center' });

  doc.fontSize(40).fillColor(accentColor).font('Times-BoldItalic')
    .text(recipientName, 0, 275, { align: 'center' });

  const nameLineY = 330;
  doc.moveTo(pageW / 2 - 100, nameLineY).lineTo(pageW / 2 + 100, nameLineY)
    .lineWidth(1).stroke(COLORS.gold);

  doc.fontSize(13.5).fillColor(COLORS.textGray).font('Helvetica')
    .text(bodyLine1, 90, nameLineY + 16, { align: 'center', width: pageW - 180 });
  doc.text(bodyLine2, 90, nameLineY + 35, { align: 'center', width: pageW - 180 });

  const boxY = nameLineY + 75;
  const boxWidth = 230;
  const gap = 40;
  const totalWidth = boxWidth * infoBoxes.length + gap * (infoBoxes.length - 1);
  let startX = (pageW - totalWidth) / 2;

  infoBoxes.forEach((box) => {
    drawInfoBox(doc, startX, boxY, boxWidth, box.label, box.value, box.icon, accentColor);
    startX += boxWidth + gap;
  });

  doc.fontSize(12.5).fillColor(COLORS.textGray).font('Helvetica-Oblique')
    .text(tagline, 0, boxY + 74, { align: 'center' });
};

const generateDonorCertificate = (donation, donorName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const certId = generateCertificateId(donation, 'DNR');
    const issueDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const deliveredDate = new Date(donation.deliveredAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    drawCertificateBody(doc, {
      accentColor: COLORS.green,
      certId,
      issueDate,
      title: 'Certificate of Appreciation',
      recipientName: donorName,
      bodyLine1: `For generously contributing ${donation.foodItems.map((i) => `${i.name} (${i.quantity})`).join(', ')}`,
      bodyLine2: 'through FoodBridge, helping bridge the gap between food surplus and hunger in our community.',
      infoBoxes: [
        { label: 'Donation Items', value: `${donation.foodItems.length} items`, icon: 'basket' },
        { label: 'Delivered On', value: deliveredDate, icon: 'calendar' },
      ],
      tagline: 'Together for a Hunger-Free Tomorrow',
    });

    doc.end();
  });
};

const generateVolunteerCertificate = (donation, volunteerName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const certId = generateCertificateId(donation, 'VOL');
    const issueDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const deliveredDate = new Date(donation.deliveredAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const deliveryMinutes = donation.pickedUpAt && donation.deliveredAt
      ? Math.round((new Date(donation.deliveredAt) - new Date(donation.pickedUpAt)) / 60000)
      : null;

    drawCertificateBody(doc, {
      accentColor: '#2563eb',
      certId,
      issueDate,
      title: 'Volunteer Appreciation',
      recipientName: volunteerName,
      bodyLine1: `For successfully completing a food pickup and delivery of ${donation.foodItems.map((i) => i.name).join(', ')}`,
      bodyLine2: deliveryMinutes !== null
        ? `Delivered in just ${deliveryMinutes} minutes from pickup — a great effort!`
        : 'Your dedication helps make hunger relief possible.',
      infoBoxes: [
        { label: 'Items Delivered', value: `${donation.foodItems.length} items`, icon: 'delivery' },
        { label: 'Delivered On', value: deliveredDate, icon: 'calendar' },
      ],
      tagline: 'Together for a Hunger-Free Tomorrow',
    });

    doc.end();
  });
};

module.exports = { generateDonorCertificate, generateVolunteerCertificate };