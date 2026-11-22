// Share cards are drawn on a plain <canvas>: no screenshot library, works offline, exports a PNG.
const W = 1080;
const H = 1350;
const INK = '#1a1410';
const FONT = "'Bricolage Grotesque','Arial Black','Segoe UI Black',Impact,system-ui,sans-serif";
const BODY = "'DM Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const MARKER = "'Caveat','Segoe Print','Bradley Hand','Comic Sans MS',cursive";

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draw a polaroid-style card. Returns a PNG Blob.
 * opts: { kicker, headline, big, bigLabel, bullets[], accent, footer }
 */
export async function makeShareImage(opts) {
  const { kicker = 'Love Guru', headline = '', big = '', bigLabel = '', bullets = [], accent = '#ffb067', footer = 'love guru · your dating coach' } = opts;
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load("800 48px 'Bricolage Grotesque'"),
        document.fonts.load("700 40px 'Caveat'"),
        document.fonts.load("500 38px 'DM Sans'"),
      ]);
    }
  } catch {
    /* fonts are a nice-to-have: the fallbacks still look fine */
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // paper + dots
  ctx.fillStyle = '#fff4dc';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(26,20,16,0.08)';
  for (let y = 20; y < H; y += 36) for (let x = 20; x < W; x += 36) ctx.fillRect(x, y, 3, 3);

  // card
  ctx.save();
  ctx.translate(W / 2, H / 2 + 10);
  ctx.rotate((-2.5 * Math.PI) / 180);
  ctx.fillStyle = INK;
  roundRect(ctx, -438, -560, 896, 1140, 36);
  ctx.fill(); // hard shadow
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  roundRect(ctx, -450, -575, 900, 1140, 36);
  ctx.fill();
  ctx.stroke();

  // accent header band
  ctx.fillStyle = accent;
  ctx.save();
  roundRect(ctx, -450, -575, 900, 170, 36);
  ctx.clip();
  ctx.fillRect(-450, -575, 900, 170);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(-450, -405);
  ctx.lineTo(450, -405);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText(String(kicker).toUpperCase().slice(0, 28), -410, -475);
  ctx.font = `700 40px ${MARKER}`;
  ctx.fillText('rizzpad ✦', -410, -428);

  // headline
  ctx.font = `800 58px ${FONT}`;
  let y = -320;
  for (const line of wrap(ctx, headline, 800).slice(0, 3)) {
    ctx.fillText(line, -410, y);
    y += 68;
  }

  // big number
  if (big !== '' && big !== null && big !== undefined) {
    y += 40;
    ctx.fillStyle = accent;
    ctx.font = `800 230px ${FONT}`;
    const bigText = String(big);
    ctx.fillText(bigText, -410, y + 150);
    ctx.fillStyle = INK;
    ctx.font = `700 48px ${MARKER}`;
    ctx.fillText(bigLabel, -400, y + 215);
    y += 310;
  }

  // bullets
  ctx.font = `500 42px ${BODY}`;
  ctx.fillStyle = INK;
  for (const b of bullets.slice(0, 4)) {
    const lines = wrap(ctx, b, 760).slice(0, 3);
    if (y + lines.length * 54 > 520) break;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(-402, y - 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    for (const line of lines) {
      ctx.fillText(line, -375, y);
      y += 54;
    }
    y += 22;
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `700 30px ${MARKER}`;
  ctx.fillText(footer, W / 2, H - 30);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not make the image.'))), 'image/png');
  });
}

/** Native share sheet on phones, PNG download everywhere else. Returns 'shared' | 'downloaded'. */
export async function shareOrDownload(blob, filename = 'rizzpad.png') {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Love Guru' });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'shared'; // user closed the sheet
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
