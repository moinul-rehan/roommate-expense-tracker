export type InvoiceAdjustmentLine = { date: string; label: string; amount: number };
export type InvoiceDepositLine = { date: string; note: string | null; amount: number };

export type InvoiceData = {
  memberName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  monthLabel: string;
  adjustmentLines: InvoiceAdjustmentLine[];
  depositLines: InvoiceDepositLine[];
  assignedCost: number;
  paid: number;
  due: number;
};

const COLORS = {
  primary: "#DE7356",
  primaryTint: "#FBEAE5",
  foreground: "#17191E",
  muted: "#7A818D",
  border: "#E4E5E8",
  green: "#63B64E",
  greenTint: "rgba(99, 182, 78, 0.12)",
  red: "#FF4F4F",
  redTint: "rgba(255, 79, 79, 0.12)",
};

const FONT = "Arial, Helvetica, sans-serif";
const WIDTH = 720;
const PADDING = 48;
const CONTENT_WIDTH = WIDTH - PADDING * 2;
const SECTION_GAP = 16;
const HEADER_HEIGHT = 160;
const AVATAR_SIZE = 64;
const AVATAR_GAP = 14;
const STAT_CARD_HEIGHT = 76;
const STAT_CARD_GAP = 12;
const TITLE_OFFSET = 12; // section title baseline -> body start
const TABLE_HEADER_H = 34;
const TABLE_ROW_H = 34;
const TABLE_TOTAL_H = 36;
const CELL_PAD = 14;

/** Renders a personal utility statement as a shareable PNG using the Canvas API (client-only — must run in a browser). */
export async function generateInvoicePng(data: InvoiceData): Promise<Blob> {
  const dueLabel = data.due < 0 ? "Advance Balance" : "Remaining Due";
  const dueColor = data.due < 0 ? COLORS.green : COLORS.red;
  const dueTint = data.due < 0 ? COLORS.greenTint : COLORS.redTint;

  const infoLineCount = 1 + [data.email, data.phone, data.address].filter(Boolean).length;
  const preparedForHeight = 22 + Math.max(AVATAR_SIZE, infoLineCount * 20);

  const adjustmentsHeight = tableHeight(data.adjustmentLines.length);
  const depositsHeight = tableHeight(data.depositLines.length);

  const height =
    HEADER_HEIGHT +
    SECTION_GAP +
    preparedForHeight +
    SECTION_GAP +
    1 +
    SECTION_GAP +
    TITLE_OFFSET +
    STAT_CARD_HEIGHT +
    SECTION_GAP +
    TITLE_OFFSET +
    adjustmentsHeight +
    SECTION_GAP +
    TITLE_OFFSET +
    depositsHeight +
    SECTION_GAP +
    1 +
    SECTION_GAP +
    18 +
    18 +
    SECTION_GAP;

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);

  const logo = await loadImage("/logo.png").catch(() => null);
  drawHeader(ctx, data, logo);

  let y = HEADER_HEIGHT + SECTION_GAP;
  y = await drawPreparedFor(ctx, data, y);

  y += SECTION_GAP;
  drawHairline(ctx, y, COLORS.border);
  y += SECTION_GAP;

  y = drawSectionTitle(ctx, "Summary", y);
  drawSummaryCards(ctx, data, dueLabel, dueColor, dueTint, y);
  y += STAT_CARD_HEIGHT;
  y += SECTION_GAP;

  y = drawSectionTitle(ctx, "Assigned Utilities", y);
  y = drawStripedTable(
    ctx,
    ["DATE", "CATEGORY", "AMOUNT"],
    data.adjustmentLines.map((l) => [formatShortDate(l.date), l.label, formatSigned(l.amount)]),
    data.adjustmentLines.map((l) => (l.amount >= 0 ? COLORS.red : COLORS.green)),
    "No utility costs yet this month.",
    "Total",
    `${data.assignedCost.toFixed(2)} tk`,
    y
  );
  y += SECTION_GAP;

  y = drawSectionTitle(ctx, "Deposits", y);
  y = drawStripedTable(
    ctx,
    ["DATE", "NOTE", "AMOUNT"],
    data.depositLines.map((l) => [formatShortDate(l.date), l.note ?? "—", `${l.amount.toFixed(2)} tk`]),
    data.depositLines.map(() => COLORS.green),
    "No deposits recorded this month.",
    "Total",
    `${data.paid.toFixed(2)} tk`,
    y
  );
  y += SECTION_GAP;

  drawHairline(ctx, y, COLORS.border);
  y += SECTION_GAP;

  ctx.font = `400 11px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = "center";
  ctx.fillText(
    "This is a system-generated statement — verify with your cottage manager if something looks incorrect.",
    WIDTH / 2,
    y
  );
  y += 18;
  ctx.font = `400 10px ${FONT}`;
  ctx.fillText(`Generated via Cottage · ${new Date().toLocaleDateString()}`, WIDTH / 2, y);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not render the invoice image."))), "image/png");
  });
}

function tableHeight(rowCount: number) {
  const rows = rowCount || 1; // "no records" placeholder still takes one row
  return TABLE_HEADER_H + rows * TABLE_ROW_H + TABLE_TOTAL_H;
}

function drawHeader(ctx: CanvasRenderingContext2D, data: InvoiceData, logo: HTMLImageElement | null) {
  ctx.fillStyle = COLORS.primaryTint;
  ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT);

  const logoSize = 56;
  if (logo) {
    ctx.save();
    roundedRectPath(ctx, PADDING, 52, logoSize, logoSize, 14);
    ctx.clip();
    ctx.drawImage(logo, PADDING, 52, logoSize, logoSize);
    ctx.restore();
  }

  const textX = PADDING + (logo ? logoSize + 16 : 0);
  ctx.fillStyle = COLORS.primary;
  ctx.font = `700 26px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("Cottage", textX, 88);

  ctx.textAlign = "right";
  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText("Personal Utility Statement", WIDTH - PADDING, 62);

  ctx.font = `700 30px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(data.monthLabel, WIDTH - PADDING, 98);
  ctx.textAlign = "left";
}

async function drawPreparedFor(ctx: CanvasRenderingContext2D, data: InvoiceData, startY: number): Promise<number> {
  let y = startY;

  ctx.font = `700 11px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = "left";
  ctx.fillText("PREPARED FOR", PADDING, y);
  y += 22;

  const avatarY = y;
  const avatar = await loadImage(data.avatarUrl, true).catch(() => null);
  drawAvatar(ctx, avatar, data.memberName, PADDING, avatarY);

  let textY = avatarY + 16;
  const textX = PADDING + AVATAR_SIZE + AVATAR_GAP;

  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText(data.memberName, textX, textY);
  textY += 22;

  ctx.font = `400 13px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  const maxTextWidth = WIDTH - PADDING - textX;
  for (const line of [data.email, data.phone, data.address]) {
    if (!line) continue;
    ctx.fillText(truncateText(ctx, line, maxTextWidth), textX, textY);
    textY += 18;
  }

  const infoLineCount = 1 + [data.email, data.phone, data.address].filter(Boolean).length;
  return avatarY + Math.max(AVATAR_SIZE, infoLineCount * 20);
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  name: string,
  x: number,
  y: number
) {
  const r = AVATAR_SIZE / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  ctx.clip();

  if (img) {
    const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height);
    const sw = AVATAR_SIZE / scale;
    const sh = AVATAR_SIZE / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, AVATAR_SIZE, AVATAR_SIZE);
  } else {
    ctx.fillStyle = COLORS.primaryTint;
    ctx.fillRect(x, y, AVATAR_SIZE, AVATAR_SIZE);
    ctx.fillStyle = COLORS.primary;
    ctx.font = `700 26px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((name[0] ?? "?").toUpperCase(), x + r, y + r + 1);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
}

function drawSectionTitle(ctx: CanvasRenderingContext2D, title: string, y: number) {
  ctx.font = `700 13px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.textAlign = "left";
  ctx.fillText(title.toUpperCase(), PADDING, y);
  return y + TITLE_OFFSET;
}

function drawSummaryCards(
  ctx: CanvasRenderingContext2D,
  data: InvoiceData,
  dueLabel: string,
  dueColor: string,
  dueTint: string,
  y: number
) {
  const cardWidth = (CONTENT_WIDTH - STAT_CARD_GAP * 2) / 3;
  const cards: { label: string; value: string; tint: string; color: string }[] = [
    { label: "Assigned Cost", value: `${data.assignedCost.toFixed(2)} tk`, tint: COLORS.primaryTint, color: COLORS.foreground },
    { label: "Paid", value: `${data.paid.toFixed(2)} tk`, tint: COLORS.greenTint, color: COLORS.green },
    { label: dueLabel, value: `${Math.abs(data.due).toFixed(2)} tk`, tint: dueTint, color: dueColor },
  ];

  cards.forEach((card, i) => {
    const x = PADDING + i * (cardWidth + STAT_CARD_GAP);
    ctx.fillStyle = card.tint;
    roundedRectPath(ctx, x, y, cardWidth, STAT_CARD_HEIGHT, 12);
    ctx.fill();

    ctx.font = `600 11px ${FONT}`;
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "left";
    ctx.fillText(truncateText(ctx, card.label, cardWidth - 24), x + 16, y + 28);

    ctx.font = `700 19px ${FONT}`;
    ctx.fillStyle = card.color;
    ctx.fillText(card.value, x + 16, y + 56);
  });
}

/** A banded table: solid brand-color header bar, alternating white/tint row stripes, and a solid brand-color total bar. */
function drawStripedTable(
  ctx: CanvasRenderingContext2D,
  headers: [string, string, string],
  rows: string[][],
  amountColors: string[],
  emptyText: string,
  totalLabel: string,
  totalValue: string,
  startY: number
): number {
  const dateColX = PADDING + CELL_PAD;
  const midColX = PADDING + 80 + CELL_PAD;
  const amountColRight = WIDTH - PADDING - CELL_PAD;
  const midColMaxWidth = amountColRight - 100 - midColX;

  let y = startY;

  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(PADDING, y, CONTENT_WIDTH, TABLE_HEADER_H);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 12px ${FONT}`;
  ctx.textAlign = "left";
  const headerTextY = y + TABLE_HEADER_H / 2 + 4;
  ctx.fillText(headers[0], dateColX, headerTextY);
  ctx.fillText(headers[1], midColX, headerTextY);
  ctx.textAlign = "right";
  ctx.fillText(headers[2], amountColRight, headerTextY);
  ctx.textAlign = "left";
  y += TABLE_HEADER_H;

  if (!rows.length) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(PADDING, y, CONTENT_WIDTH, TABLE_ROW_H);
    ctx.font = `400 13px ${FONT}`;
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(emptyText, dateColX, y + TABLE_ROW_H / 2 + 4);
    y += TABLE_ROW_H;
  } else {
    rows.forEach((row, i) => {
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : COLORS.primaryTint;
      ctx.fillRect(PADDING, y, CONTENT_WIDTH, TABLE_ROW_H);

      const rowTextY = y + TABLE_ROW_H / 2 + 4;
      ctx.font = `400 12px ${FONT}`;
      ctx.fillStyle = COLORS.muted;
      ctx.textAlign = "left";
      ctx.fillText(row[0], dateColX, rowTextY);

      ctx.font = `500 13px ${FONT}`;
      ctx.fillStyle = COLORS.foreground;
      ctx.fillText(truncateText(ctx, row[1], midColMaxWidth), midColX, rowTextY);

      ctx.font = `600 13px ${FONT}`;
      ctx.fillStyle = amountColors[i] ?? COLORS.foreground;
      ctx.textAlign = "right";
      ctx.fillText(row[2], amountColRight, rowTextY);
      ctx.textAlign = "left";

      y += TABLE_ROW_H;
    });
  }

  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(PADDING, y, CONTENT_WIDTH, TABLE_TOTAL_H);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 14px ${FONT}`;
  const totalTextY = y + TABLE_TOTAL_H / 2 + 5;
  ctx.textAlign = "left";
  ctx.fillText(totalLabel, dateColX, totalTextY);
  ctx.textAlign = "right";
  ctx.fillText(totalValue, amountColRight, totalTextY);
  ctx.textAlign = "left";
  y += TABLE_TOTAL_H;

  return y;
}

function formatSigned(amount: number) {
  return `${amount >= 0 ? "+" : "−"}${Math.abs(amount).toFixed(2)} tk`;
}

function formatShortDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

function drawHairline(ctx: CanvasRenderingContext2D, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string | null, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("No image src."));
      return;
    }
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}
