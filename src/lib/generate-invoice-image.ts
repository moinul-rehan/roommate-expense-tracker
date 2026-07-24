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
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 160;
const AVATAR_SIZE = 64;
const AVATAR_GAP = 14;
const STAT_CARD_HEIGHT = 76;
const STAT_CARD_GAP = 12;

/** Renders a personal utility statement as a shareable PNG using the Canvas API (client-only — must run in a browser). */
export async function generateInvoicePng(data: InvoiceData): Promise<Blob> {
  const dueLabel = data.due < 0 ? "Advance Balance" : "Remaining Due";
  const dueColor = data.due < 0 ? COLORS.green : COLORS.red;
  const dueTint = data.due < 0 ? COLORS.greenTint : COLORS.redTint;

  const infoLineCount = 1 + [data.email, data.phone, data.address].filter(Boolean).length;
  const infoBlockHeight = infoLineCount * 20;
  const preparedForHeight = 22 + Math.max(AVATAR_SIZE, infoBlockHeight) + 30;

  const adjustmentsHeight = tableHeight(data.adjustmentLines.length);
  const depositsHeight = tableHeight(data.depositLines.length);

  const height =
    HEADER_HEIGHT +
    36 + // "Prepared for" top margin
    preparedForHeight +
    24 + // divider + margin
    24 + // "Summary" title
    STAT_CARD_HEIGHT +
    30 +
    24 + // "Assigned Utilities" title
    adjustmentsHeight +
    30 +
    24 + // "Deposits" title
    depositsHeight +
    30 +
    70; // footer

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

  let y = HEADER_HEIGHT + 36;
  y = await drawPreparedFor(ctx, data, y);

  y += 4;
  drawHairline(ctx, y, COLORS.border);
  y += 30;

  y = drawSectionTitle(ctx, "Summary", y);
  drawSummaryCards(ctx, data, dueLabel, dueColor, dueTint, y);
  y += STAT_CARD_HEIGHT + 30;

  y = drawSectionTitle(ctx, "Assigned Utilities", y);
  y = drawThreeColTable(
    ctx,
    ["DATE", "CATEGORY", "AMOUNT"],
    data.adjustmentLines.map((l) => [formatShortDate(l.date), l.label, formatSigned(l.amount)]),
    data.adjustmentLines.map((l) => (l.amount >= 0 ? COLORS.red : COLORS.green)),
    "No utility costs yet this month.",
    "Total",
    `${data.assignedCost.toFixed(2)} tk`,
    y
  );
  y += 30;

  y = drawSectionTitle(ctx, "Deposits", y);
  y = drawThreeColTable(
    ctx,
    ["DATE", "NOTE", "AMOUNT"],
    data.depositLines.map((l) => [formatShortDate(l.date), l.note ?? "—", `${l.amount.toFixed(2)} tk`]),
    data.depositLines.map(() => COLORS.green),
    "No deposits recorded this month.",
    "Total",
    `${data.paid.toFixed(2)} tk`,
    y
  );
  y += 34;

  drawHairline(ctx, y, COLORS.border);
  y += 26;

  ctx.font = `400 11px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = "center";
  ctx.fillText(
    "This is a system-generated statement — verify with your cottage manager if something looks incorrect.",
    WIDTH / 2,
    y
  );
  y += 20;
  ctx.font = `400 10px ${FONT}`;
  ctx.fillText(`Generated via Cottage · ${new Date().toLocaleDateString()}`, WIDTH / 2, y);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not render the invoice image."))), "image/png");
  });
}

function tableHeight(rowCount: number) {
  const rows = rowCount || 1; // "no records" placeholder still takes one row
  return 26 + rows * ROW_HEIGHT + 8 + 1 + 34; // header + rows + gap + hairline + total row
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
  const infoBlockHeight = infoLineCount * 20;
  return avatarY + Math.max(AVATAR_SIZE, infoBlockHeight);
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
  return y + 24;
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

function drawThreeColTable(
  ctx: CanvasRenderingContext2D,
  headers: [string, string, string],
  rows: string[][],
  amountColors: string[],
  emptyText: string,
  totalLabel: string,
  totalValue: string,
  startY: number
): number {
  const dateColX = PADDING;
  const midColX = PADDING + 90;
  const amountColRight = WIDTH - PADDING;
  const midColMaxWidth = amountColRight - 130 - midColX;

  let y = startY;
  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.textAlign = "left";
  ctx.fillText(headers[0], dateColX, y);
  ctx.fillText(headers[1], midColX, y);
  ctx.textAlign = "right";
  ctx.fillText(headers[2], amountColRight, y);
  ctx.textAlign = "left";
  y += 26;

  if (!rows.length) {
    ctx.font = `400 14px ${FONT}`;
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(emptyText, dateColX, y);
    y += ROW_HEIGHT;
  } else {
    rows.forEach((row, i) => {
      ctx.font = `400 13px ${FONT}`;
      ctx.fillStyle = COLORS.muted;
      ctx.fillText(row[0], dateColX, y);

      ctx.font = `500 14px ${FONT}`;
      ctx.fillStyle = COLORS.foreground;
      ctx.fillText(truncateText(ctx, row[1], midColMaxWidth), midColX, y);

      ctx.font = `600 14px ${FONT}`;
      ctx.fillStyle = amountColors[i] ?? COLORS.foreground;
      ctx.textAlign = "right";
      ctx.fillText(row[2], amountColRight, y);
      ctx.textAlign = "left";

      y += ROW_HEIGHT;
    });
  }

  y += 8;
  drawHairline(ctx, y, COLORS.foreground);
  y += 26;

  ctx.font = `700 15px ${FONT}`;
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText(totalLabel, dateColX, y);
  ctx.textAlign = "right";
  ctx.fillText(totalValue, amountColRight, y);
  ctx.textAlign = "left";

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
