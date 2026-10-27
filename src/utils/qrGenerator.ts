import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';

export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QROptions {
  /**
   * Error correction level:
   * - 'L': Low (~7% recovery)
   * - 'M': Medium (~15% recovery)
   * - 'Q': Quartile (~25% recovery)
   * - 'H': High (~30% recovery, recommended when embedding a logo)
   */
  errorCorrectionLevel?: QRErrorCorrectionLevel;

  /**
   * Quiet zone margin in modules (default: 4 per ISO/IEC 18004 standard)
   */
  margin?: number;

  /**
   * Output width / dimension in pixels (default: 1024)
   */
  width?: number;

  /**
   * Color for dark modules (hex or rgba, default: '#000000')
   */
  darkColor?: string;

  /**
   * Color for light background modules (hex or rgba, default: '#ffffff')
   */
  lightColor?: string;

  /**
   * Whether to embed the central brand logo (default: true)
   */
  includeLogo?: boolean;

  /**
   * Path or buffer of the logo image (transparent PNG recommended)
   */
  logo?: string | Buffer;

  /**
   * Ratio of the logo size relative to the QR size (default: 0.23, range: 0.15 - 0.28)
   */
  logoRatio?: number;
}

export interface QRValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates the input string/URL.
 */
export function validateQRCodeInput(input: string): QRValidationResult {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return { valid: false, error: 'Target URL/text cannot be empty.' };
  }

  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
    } catch {
      return { valid: false, error: `Invalid URL format: "${trimmed}".` };
    }
  }

  return { valid: true };
}

/**
 * Resolves the default brand logo buffer.
 */
export function resolveDefaultLogo(customLogo?: string | Buffer): Buffer | null {
  if (customLogo) {
    if (Buffer.isBuffer(customLogo)) return customLogo;
    if (typeof customLogo === 'string' && fs.existsSync(customLogo)) {
      return fs.readFileSync(customLogo);
    }
  }

  const candidatePaths = [
    path.resolve(process.cwd(), 'public/images/gtech-brand-logo-transparent.png'),
    path.resolve(process.cwd(), 'Website/public/images/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Website/public/images/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Multimedia/assets/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Multimedia/output/gtech-brand-logo-transparent.png')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p);
    }
  }

  return null;
}

/**
 * Normalizes options with deterministic defaults.
 */
function normalizeOptions(options: QROptions = {}) {
  const margin = typeof options.margin === 'number' && options.margin >= 0 ? options.margin : 4;
  const errorCorrectionLevel = options.errorCorrectionLevel || 'H';
  const width = typeof options.width === 'number' && options.width > 0 ? options.width : 1024;
  const darkColor = options.darkColor || '#000000';
  const lightColor = options.lightColor || '#ffffff';
  const includeLogo = options.includeLogo !== false;
  const logoRatio = typeof options.logoRatio === 'number' ? Math.max(0.15, Math.min(0.28, options.logoRatio)) : 0.23;

  return {
    margin,
    errorCorrectionLevel,
    width,
    color: {
      dark: darkColor,
      light: lightColor
    },
    includeLogo,
    logoRatio,
    logo: options.logo
  };
}

/**
 * Generates an SVG string representation of the QR code with optional crisp centered logo.
 */
export async function generateQRCodeSVG(text: string, options: QROptions = {}): Promise<string> {
  const validation = validateQRCodeInput(text);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const normalized = normalizeOptions(options);

  const baseSvg = await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: normalized.errorCorrectionLevel,
    margin: normalized.margin,
    width: normalized.width,
    color: normalized.color
  });

  if (!normalized.includeLogo) {
    return baseSvg;
  }

  const logoBuffer = resolveDefaultLogo(normalized.logo);
  if (!logoBuffer) {
    return baseSvg;
  }

  // Parse viewBox="0 0 N N"
  const match = baseSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!match) {
    return baseSvg;
  }

  const modules = parseInt(match[1], 10);
  const logoModules = modules * normalized.logoRatio;
  const cardModules = logoModules * 1.08;
  const cardPos = (modules - cardModules) / 2;
  const logoPos = (modules - logoModules) / 2;
  const rx = cardModules * 0.16;
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const logoGroup = `
  <g id="gtech-brand-logo-center">
    <rect x="${cardPos.toFixed(3)}" y="${cardPos.toFixed(3)}" width="${cardModules.toFixed(3)}" height="${cardModules.toFixed(3)}" rx="${rx.toFixed(3)}" fill="#ffffff" stroke="#e5e7eb" stroke-width="0.08" />
    <image href="${logoBase64}" x="${logoPos.toFixed(3)}" y="${logoPos.toFixed(3)}" width="${logoModules.toFixed(3)}" height="${logoModules.toFixed(3)}" preserveAspectRatio="xMidYMid meet" />
  </g>
</svg>`;

  return baseSvg.replace('</svg>', logoGroup);
}

/**
 * Generates a PNG Buffer representation of the QR code with optional crisp centered logo.
 */
export async function generateQRCodePNG(text: string, options: QROptions = {}): Promise<Buffer> {
  const validation = validateQRCodeInput(text);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const normalized = normalizeOptions(options);

  const qrBuffer = await QRCode.toBuffer(text, {
    type: 'png',
    errorCorrectionLevel: normalized.errorCorrectionLevel,
    margin: normalized.margin,
    width: normalized.width,
    color: normalized.color
  });

  if (!normalized.includeLogo) {
    return qrBuffer;
  }

  const logoBuffer = resolveDefaultLogo(normalized.logo);
  if (!logoBuffer) {
    return qrBuffer;
  }

  const qrDim = normalized.width;
  const logoDim = Math.round(qrDim * normalized.logoRatio);
  const cardDim = Math.round(logoDim * 1.08);
  const rx = Math.round(cardDim * 0.16);

  const cardSvg = Buffer.from(
    `<svg width="${cardDim}" height="${cardDim}"><rect width="${cardDim}" height="${cardDim}" rx="${rx}" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/></svg>`
  );

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoDim, logoDim, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp(qrBuffer)
    .composite([
      { input: cardSvg, gravity: 'center' },
      { input: resizedLogo, gravity: 'center' }
    ])
    .png()
    .toBuffer();
}

/**
 * Generates a Base64 Data URL for use in web frontends.
 */
export async function generateQRCodeDataURL(text: string, options: QROptions = {}): Promise<string> {
  const pngBuffer = await generateQRCodePNG(text, options);
  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}
