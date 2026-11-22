import { getReasonText } from '../engine/messageEngine';
import type { CheckResult, Language } from '../engine/types';
import { t } from '../i18n';

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

/**
 * Generates a 1080x1350 PNG warning share card on an offscreen canvas.
 * Explicitly awaits document.fonts.load for Mandali, Hind Guntur, Source Serif 4,
 * and IBM Plex Mono before drawing so Telugu script renders crisp (Section 8).
 */
export async function generateWarningCardPng(
  result: CheckResult,
  lang: Language,
): Promise<{ dataUrl: string; blob: Blob }> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await Promise.allSettled([
      document.fonts.load('400 44px "Mandali"'),
      document.fonts.load('400 32px "Hind Guntur"'),
      document.fonts.load('700 32px "Hind Guntur"'),
      document.fonts.load('700 44px "Source Serif 4"'),
      document.fonts.load('500 32px "IBM Plex Mono"'),
    ]);
  }

  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE');

  // Paper outer margin
  ctx.fillStyle = '#F2F4EF';
  ctx.fillRect(0, 0, width, height);

  // Inner printed sheet with 1.5px (scaled 3px) ink border
  const pad = 44;
  ctx.fillStyle = '#FBFBF8';
  ctx.fillRect(pad, pad, width - pad * 2, height - pad * 2);
  ctx.strokeStyle = '#16202A';
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  const left = 96;
  const contentWidth = width - left * 2;
  let y = 130;

  // Masthead wordmark
  ctx.fillStyle = '#16202A';
  ctx.font = lang === 'te' ? '400 54px "Mandali", sans-serif' : '700 54px "Source Serif 4", serif';
  ctx.fillText(t(lang, 'appName'), left, y);

  // Hand-drawn-style double ink underline
  ctx.strokeStyle = '#16202A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(left, y + 18);
  ctx.lineTo(left + 440, y + 14);
  ctx.stroke();

  y += 62;
  ctx.fillStyle = '#4A5560';
  ctx.font = '500 28px "Hind Guntur", sans-serif';
  ctx.fillText(t(lang, 'tagline'), left, y);

  // Hairline rule
  y += 34;
  ctx.strokeStyle = '#C9CEC4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(width - left, y);
  ctx.stroke();

  // Rubber-stamp verdict block (angled -3deg)
  y += 42;
  const isGreen =
    result.verdict === 'OFFICIAL' || result.verdict === 'RECOGNIZED_COMPANY';
  const stampColor = isGreen
    ? '#1F6B3B'
    : result.verdict === 'LIKELY_FAKE'
      ? '#B3261E'
      : '#8A5300';
  const stampBg = isGreen
    ? '#E1EEE3'
    : result.verdict === 'LIKELY_FAKE'
      ? '#F8DEDA'
      : '#FBEBC8';
  const stampLabel =
    result.verdict === 'OFFICIAL'
      ? t(lang, 'verdictOfficial')
      : result.verdict === 'RECOGNIZED_COMPANY'
        ? t(lang, 'verdictRecognizedCompany')
        : result.verdict === 'LIKELY_FAKE'
          ? t(lang, 'verdictLikelyFake')
          : t(lang, 'verdictNotVerified');

  ctx.save();
  ctx.translate(width / 2, y + 72);
  ctx.rotate((-3 * Math.PI) / 180);
  const boxW = contentWidth - 40;
  const boxH = 130;
  ctx.fillStyle = stampBg;
  ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 5;
  ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);
  ctx.strokeRect(-boxW / 2 + 8, -boxH / 2 + 8, boxW - 16, boxH - 16);

  ctx.fillStyle = stampColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font =
    lang === 'te'
      ? '400 44px "Mandali", sans-serif'
      : '700 40px "Source Serif 4", serif';
  ctx.fillText(stampLabel, 0, 2, boxW - 48);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  y += 196;

  // Destination hostname with marker yellow highlight on registrable domain
  if (result.destination?.hostname) {
    ctx.fillStyle = '#4A5560';
    ctx.font = '500 26px "Hind Guntur", sans-serif';
    ctx.fillText(t(lang, 'destinationHeading'), left, y);
    y += 48;

    const subPrefix = result.destination.subdomain
      ? `${result.destination.subdomain}.`
      : '';
    const regDom = result.destination.registrableDomain;

    ctx.font = '500 34px "IBM Plex Mono", monospace';
    let curX = left;
    if (subPrefix) {
      ctx.fillStyle = '#4A5560';
      ctx.fillText(subPrefix, curX, y);
      curX += ctx.measureText(subPrefix).width;
    }

    const regW = ctx.measureText(regDom).width;
    ctx.fillStyle = '#FFD84D';
    ctx.fillRect(curX - 6, y - 34, regW + 12, 46);
    ctx.fillStyle = '#16202A';
    ctx.fillText(regDom, curX, y);
    y += 48;
  }

  // Hairline divider
  ctx.strokeStyle = '#C9CEC4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(width - left, y);
  ctx.stroke();
  y += 48;

  // Top 3 reasons
  ctx.fillStyle = '#16202A';
  ctx.font = lang === 'te' ? '400 34px "Mandali", sans-serif' : '700 32px "Source Serif 4", serif';
  ctx.fillText(t(lang, 'reasonsHeading'), left, y);
  y += 48;

  const bodyFont =
    '"Hind Guntur", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Malayalam", "Noto Sans Kannada", sans-serif';
  ctx.font = `400 28px ${bodyFont}`;
  const topReasons = result.reasons.slice(0, 3);
  for (let i = 0; i < topReasons.length; i++) {
    const r = topReasons[i];
    const lineText = `${i + 1}. ${getReasonText(r, lang)}`;
    const wrapped = wrapLines(ctx, lineText, contentWidth, 3);
    ctx.fillStyle = '#16202A';
    for (const line of wrapped) {
      ctx.fillText(line, left, y);
      y += 44;
    }
    y += 14;
  }

  // Bottom helpline strip
  const footerY = height - 185;
  ctx.strokeStyle = '#16202A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, footerY - 28);
  ctx.lineTo(width - left, footerY - 28);
  ctx.stroke();

  ctx.fillStyle = '#16202A';
  ctx.font = `700 28px ${bodyFont}`;
  ctx.fillText(t(lang, 'rescueStep1930'), left, footerY + 20, contentWidth);

  ctx.fillStyle = '#4A5560';
  ctx.font = '400 22px "Hind Guntur", sans-serif';
  ctx.fillText(t(lang, 'footerDisclaimer'), left, footerY + 72, contentWidth);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('PNG_EXPORT_FAILED'));
    }, 'image/png');
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    blob,
  };
}
