export type InvoiceLine = { label: string; amount: number };

export type InvoiceData = {
  cottageName: string;
  memberName: string;
  email: string | null;
  phone: string | null;
  monthLabel: string;
  lines: InvoiceLine[];
  assignedCost: number;
  paid: number;
  due: number;
};

const COLORS = {
  primary: "#DE7356",
  foreground: "#17191E",
  muted: "#7A818D",
  border: "#E4E5E8",
  green: "#63B64E",
  red: "#FF4F4F",
};

const FONT = "Arial, Helvetica, sans-serif";
const WIDTH = 720;
const PADDING = 48;
const LINE_HEIGHT = 34;
const HEADER_HEIGHT = 170;

/** Renders a utility statement as a shareable PNG using the Canvas API (client-only — must run in a browser). */
export async function generateInvoicePng(data: InvoiceData): Promise<Blob> {
  const linesBlockHeight = (data.lines.length ? data.lines.length : 1) * LINE_HEIGHT + 40;
  const height = HEADER_HEIGHT + 110 + linesBlockHeight + 150 + 60;

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT);

  const logo = await loadImage("/logo.png").catch(() => null);
  const logoSize = 56;
  if (logo) {
    ctx.save();
    roundedRectPath(ctx, PADDING, 36, logoSize, logoSize, 14);
    ctx.clip();
    ctx.drawImage(logo, PADDING, 36, logoSize, logoSize);
    ctx.restore();
  }

  const textX = PADDING + (logo ? logoSize + 16 : 0);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 26px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("Cottage", textX, 66);

  ctx.font = `600 15px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(data.cottageName, textX, 88);

  ctx.textAlign = "right";
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Utility Statement", WIDTH - PADDING, 66);
  ctx.font = `500 14px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(data.monthLabel, WIDTH - PADDING, 88);
  ctx.textAlign = "left";

  let y = HEADER_HEIGHT + 40;
  ctx.fillStyle = COLORS.foreground;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText(data.memberName, PADDING, y);
  y += 26;

  ctx.font = `400 14px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  if (data.email) {
    ctx.fillText(data.email, PADDING, y);
    y += 20;
  }
  if (data.phone) {
    ctx.fillText(data.phone, PADDING, y);
    y += 20;
  }

  y += 16;
  drawHairline(ctx, y, COLORS.border);
  y += 30;

  ctx.font = `700 13px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText("CATEGORY", PADDING, y);
  ctx.textAlign = "right";
  ctx.fillText("AMOUNT", WIDTH - PADDING, y);
  ctx.textAlign = "left";
  y += 26;

  if (!data.lines.length) {
    ctx.font = `400 14px ${FONT}`;
    ctx.fillStyle = COLORS.muted;
    ctx.fillText("No utility costs yet this month.", PADDING, y);
    y += LINE_HEIGHT;
  } else {
    for (const line of data.lines) {
      ctx.font = `500 15px ${FONT}`;
      ctx.fillStyle = COLORS.foreground;
      ctx.fillText(line.label, PADDING, y);

      ctx.textAlign = "right";
      ctx.fillStyle = line.amount >= 0 ? COLORS.red : COLORS.green;
      ctx.fillText(`${line.amount >= 0 ? "+" : "−"}${Math.abs(line.amount).toFixed(2)} tk`, WIDTH - PADDING, y);
      ctx.textAlign = "left";
      y += LINE_HEIGHT;
    }
  }

  y += 8;
  drawHairline(ctx, y, COLORS.foreground);
  y += 34;

  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText("Assigned Cost", PADDING, y);
  ctx.textAlign = "right";
  ctx.fillText(`${data.assignedCost.toFixed(2)} tk`, WIDTH - PADDING, y);
  ctx.textAlign = "left";
  y += 30;

  ctx.font = `400 14px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText("Paid", PADDING, y);
  ctx.textAlign = "right";
  ctx.fillText(`${data.paid.toFixed(2)} tk`, WIDTH - PADDING, y);
  ctx.textAlign = "left";
  y += 34;

  const dueLabel = data.due < 0 ? "Advance Balance" : "Remaining Due";
  const dueColor = data.due < 0 ? COLORS.green : COLORS.red;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = dueColor;
  ctx.fillText(dueLabel, PADDING, y);
  ctx.textAlign = "right";
  ctx.fillText(`${Math.abs(data.due).toFixed(2)} tk`, WIDTH - PADDING, y);
  ctx.textAlign = "left";

  ctx.font = `400 12px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = "center";
  ctx.fillText(`Generated via Cottage · ${new Date().toLocaleDateString()}`, WIDTH / 2, height - 24);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not render the invoice image."))), "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
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
