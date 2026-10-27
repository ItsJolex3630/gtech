import fs from 'node:fs';
import path from 'node:path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { applyCors } from './_lib/cors.js';

function getLogoBuffer(): Buffer | null {
  const candidatePaths = [
    path.resolve(process.cwd(), 'public/images/gtech-brand-logo-transparent.png'),
    path.resolve(process.cwd(), 'Website/public/images/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Website/public/images/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Multimedia/assets/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Multimedia/output/gtech-brand-logo-transparent.png')
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate);
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const rawUrl = (req.query.url as string) || 'https://gtechs.us/';
    const format = ((req.query.format as string) || 'svg').toLowerCase();
    const rawMargin = req.query.margin ? parseInt(req.query.margin as string, 10) : 4;
    const rawSize = req.query.size ? parseInt(req.query.size as string, 10) : 1024;
    const rawEcc = ((req.query.ecc as string) || 'H').toUpperCase();
    const includeLogo = req.query.logo !== 'false' && req.query.logo !== '0';
    const download = req.query.download === 'true' || req.query.download === '1';

    if (!['svg', 'png'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Supported formats: svg, png' });
    }

    if (!['L', 'M', 'Q', 'H'].includes(rawEcc)) {
      return res.status(400).json({ error: 'Invalid error correction level. Supported: L, M, Q, H' });
    }

    const margin = Number.isInteger(rawMargin) && rawMargin >= 0 ? rawMargin : 4;
    const width = Number.isInteger(rawSize) && rawSize >= 128 && rawSize <= 4096 ? rawSize : 1024;
    const ecc = rawEcc as 'L' | 'M' | 'Q' | 'H';

    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    const logoBuffer = includeLogo ? getLogoBuffer() : null;

    if (format === 'svg') {
      let svg = await QRCode.toString(rawUrl, {
        type: 'svg',
        errorCorrectionLevel: ecc,
        margin,
        width,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      if (logoBuffer) {
        const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
        if (match) {
          const modules = parseInt(match[1], 10);
          const logoModules = modules * 0.23;
          const cardModules = logoModules * 1.08;
          const cardPos = (modules - cardModules) / 2;
          const logoPos = (modules - logoModules) / 2;
          const rx = cardModules * 0.16;
          const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

          const logoElement = `
  <g id="gtech-brand-logo-center">
    <rect x="${cardPos.toFixed(3)}" y="${cardPos.toFixed(3)}" width="${cardModules.toFixed(3)}" height="${cardModules.toFixed(3)}" rx="${rx.toFixed(3)}" fill="#ffffff" stroke="#e5e7eb" stroke-width="0.08" />
    <image href="${logoBase64}" x="${logoPos.toFixed(3)}" y="${logoPos.toFixed(3)}" width="${logoModules.toFixed(3)}" height="${logoModules.toFixed(3)}" preserveAspectRatio="xMidYMid meet" />
  </g>
</svg>`;
          svg = svg.replace('</svg>', logoElement);
        }
      }

      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      if (download) {
        res.setHeader('Content-Disposition', 'attachment; filename="qr-gtechs.svg"');
      }
      return res.status(200).send(svg);
    } else {
      const baseBuffer = await QRCode.toBuffer(rawUrl, {
        type: 'png',
        errorCorrectionLevel: ecc,
        margin,
        width,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      let finalBuffer = baseBuffer;
      if (logoBuffer) {
        const logoDim = Math.round(width * 0.23);
        const cardDim = Math.round(logoDim * 1.08);
        const rx = Math.round(cardDim * 0.16);

        const cardSvg = Buffer.from(
          `<svg width="${cardDim}" height="${cardDim}"><rect width="${cardDim}" height="${cardDim}" rx="${rx}" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/></svg>`
        );

        const resizedLogo = await sharp(logoBuffer)
          .resize(logoDim, logoDim, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer();

        finalBuffer = await sharp(baseBuffer)
          .composite([
            { input: cardSvg, gravity: 'center' },
            { input: resizedLogo, gravity: 'center' }
          ])
          .png()
          .toBuffer();
      }

      res.setHeader('Content-Type', 'image/png');
      if (download) {
        res.setHeader('Content-Disposition', 'attachment; filename="qr-gtechs.png"');
      }
      return res.status(200).send(finalBuffer);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error generating QR code';
    return res.status(500).json({ error: message });
  }
}
