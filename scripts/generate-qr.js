#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';

// Defaults
const DEFAULT_URL = 'https://gtechs.us/';
const DEFAULT_MARGIN = 4; // Quiet zone in modules
const DEFAULT_SIZE = 1024; // Min 1024x1024 px
const DEFAULT_ECC = 'H'; // High redundancy (30% error correction, essential for logo embedding)
const DEFAULT_FILENAME = 'qr-gtechs';
const DEFAULT_LOGO_RATIO = 0.23; // 23% of total QR dimension

function printHelp() {
  console.log(`
Determinista y Autónomo Generador de Códigos QR Estáticos con Logo - G-Tech

Uso:
  ./generate-qr [URL] [FORMATO] [OPCIONES]

Argumentos posicionales:
  URL                 URL o contenido a codificar (por defecto: ${DEFAULT_URL})
  FORMATO             Formato de salida: svg, png o both (por defecto: both)

Opciones de diseño y marca:
  -l, --logo <ruta>          Ruta al archivo del logo (defecto: logo oficial transparente)
      --no-logo              Genera el QR clásico sin el logo en el centro
      --logo-ratio <ratio>   Proporción del logo (0.15 a 0.28, por defecto: ${DEFAULT_LOGO_RATIO})

Opciones generales:
  -u, --url <url>            URL o contenido a codificar
  -f, --format <formato>     Formato de salida: svg, png, both (defecto: both)
  -o, --output <directorio>  Directorio de destino (por defecto: ./output)
  -n, --name <nombre>        Nombre base del archivo sin extensión (por defecto: ${DEFAULT_FILENAME})
  -m, --margin <módulos>     Margen / Quiet zone en módulos (por defecto: ${DEFAULT_MARGIN})
  -s, --size <píxeles>       Resolución en píxeles para PNG (mínimo: 1024, por defecto: ${DEFAULT_SIZE})
  -e, --ecc <nivel>          Nivel de corrección de error: L, M, Q, H (defecto: ${DEFAULT_ECC})
      --dark <color>         Color de módulos oscuros (defecto: #000000)
      --light <color>        Color de fondo claro (defecto: #ffffff)
  -h, --help                 Muestra esta ayuda

Ejemplos:
  ./generate-qr
  ./generate-qr https://gtechs.us/ svg
  ./generate-qr https://gtechs.us/ png
  ./generate-qr https://gtechs.us/ both --size 2048
  ./generate-qr --no-logo
`);
}

function resolveDefaultLogo(customPath) {
  if (customPath) {
    const resolved = path.resolve(process.cwd(), customPath);
    if (fs.existsSync(resolved)) return resolved;
    console.warn(`\x1b[33m[ADVERTENCIA]\x1b[0m Logo especificado no encontrado en ${resolved}, buscando en rutas predeterminadas.`);
  }

  const candidatePaths = [
    path.resolve(process.cwd(), 'public/images/gtech-brand-logo-transparent.png'),
    path.resolve(process.cwd(), 'Website/public/images/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Website/public/images/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Multimedia/assets/gtech-brand-logo-transparent.png'),
    path.resolve('/home/joel/Proyectos/G-Tech/Multimedia/output/gtech-brand-logo-transparent.png')
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function parseArgs(args) {
  const options = {
    url: '',
    format: '',
    outputDir: './output',
    filename: DEFAULT_FILENAME,
    margin: DEFAULT_MARGIN,
    size: DEFAULT_SIZE,
    ecc: DEFAULT_ECC,
    dark: '#000000',
    light: '#ffffff',
    includeLogo: true,
    logoPath: '',
    logoRatio: DEFAULT_LOGO_RATIO
  };

  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-u' || arg === '--url') {
      options.url = args[++i];
    } else if (arg === '-f' || arg === '--format') {
      options.format = args[++i];
    } else if (arg === '-o' || arg === '--output') {
      options.outputDir = args[++i];
    } else if (arg === '-n' || arg === '--name') {
      options.filename = args[++i];
    } else if (arg === '-m' || arg === '--margin') {
      options.margin = parseInt(args[++i], 10);
    } else if (arg === '-s' || arg === '--size') {
      options.size = parseInt(args[++i], 10);
    } else if (arg === '-e' || arg === '--ecc') {
      options.ecc = args[++i].toUpperCase();
    } else if (arg === '-l' || arg === '--logo') {
      options.logoPath = args[++i];
    } else if (arg === '--no-logo') {
      options.includeLogo = false;
    } else if (arg === '--logo-ratio') {
      options.logoRatio = parseFloat(args[++i]);
    } else if (arg === '--dark') {
      options.dark = args[++i];
    } else if (arg === '--light') {
      options.light = args[++i];
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    } else {
      console.error(`\x1b[31m[ERROR]\x1b[0m Opción desconocida: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  // Handle positionals
  if (!options.url && positional.length > 0) {
    options.url = positional[0];
  }
  if (!options.format && positional.length > 1) {
    options.format = positional[1];
  }

  // Apply defaults if empty
  if (!options.url) {
    options.url = DEFAULT_URL;
  }
  if (!options.format) {
    options.format = 'both';
  }

  options.format = options.format.toLowerCase();
  if (options.format === 'all') {
    options.format = 'both';
  }

  return options;
}

function validateOptions(options) {
  if (!options.url || typeof options.url !== 'string' || options.url.trim().length === 0) {
    throw new Error('La URL no puede estar vacía.');
  }

  if (!['svg', 'png', 'both'].includes(options.format)) {
    throw new Error(`Formato no válido: "${options.format}". Los formatos soportados son: svg, png, both.`);
  }

  if (isNaN(options.margin) || options.margin < 0) {
    throw new Error(`El margen (quiet zone) debe ser un entero mayor o igual a 0. Recibido: ${options.margin}`);
  }

  if (isNaN(options.size) || options.size < 128) {
    throw new Error(`El tamaño (resolución) debe ser un número entero >= 128 px. Recibido: ${options.size}`);
  }

  if (!['L', 'M', 'Q', 'H'].includes(options.ecc)) {
    throw new Error(`Nivel de corrección de error inválido: "${options.ecc}". Opciones válidas: L, M, Q, H.`);
  }

  if (options.includeLogo && (isNaN(options.logoRatio) || options.logoRatio < 0.1 || options.logoRatio > 0.35)) {
    throw new Error(`El ratio del logo debe estar entre 0.10 y 0.35. Recibido: ${options.logoRatio}`);
  }
}

export async function generateQR(rawOptions = {}) {
  const options = {
    url: rawOptions.url || DEFAULT_URL,
    format: (rawOptions.format || 'both').toLowerCase(),
    outputDir: rawOptions.outputDir || './output',
    filename: rawOptions.filename || DEFAULT_FILENAME,
    margin: typeof rawOptions.margin === 'number' ? rawOptions.margin : DEFAULT_MARGIN,
    size: typeof rawOptions.size === 'number' ? rawOptions.size : DEFAULT_SIZE,
    ecc: (rawOptions.ecc || DEFAULT_ECC).toUpperCase(),
    dark: rawOptions.dark || '#000000',
    light: rawOptions.light || '#ffffff',
    includeLogo: rawOptions.includeLogo !== false,
    logoPath: rawOptions.logoPath || '',
    logoRatio: typeof rawOptions.logoRatio === 'number' ? rawOptions.logoRatio : DEFAULT_LOGO_RATIO
  };

  validateOptions(options);

  const resolvedOutputDir = path.resolve(process.cwd(), options.outputDir);
  if (!fs.existsSync(resolvedOutputDir)) {
    fs.mkdirSync(resolvedOutputDir, { recursive: true });
  }

  const generatedFiles = [];

  const commonQROptions = {
    errorCorrectionLevel: options.ecc,
    margin: options.margin,
    color: {
      dark: options.dark,
      light: options.light
    }
  };

  let logoFilePath = null;
  let logoBuffer = null;
  if (options.includeLogo) {
    logoFilePath = resolveDefaultLogo(options.logoPath);
    if (logoFilePath) {
      logoBuffer = fs.readFileSync(logoFilePath);
    } else {
      console.warn(`\x1b[33m[ADVERTENCIA]\x1b[0m No se encontró archivo de logo. Generando QR estándar.`);
    }
  }

  // 1. Generate SVG
  if (options.format === 'svg' || options.format === 'both') {
    const svgPath = path.join(resolvedOutputDir, `${options.filename}.svg`);
    let svgContent = await QRCode.toString(options.url, {
      ...commonQROptions,
      type: 'svg',
      width: options.size
    });

    if (logoBuffer) {
      const match = svgContent.match(/viewBox="0 0 (\d+) (\d+)"/);
      if (match) {
        const modules = parseInt(match[1], 10);
        const logoModules = modules * options.logoRatio;
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
        svgContent = svgContent.replace('</svg>', logoElement);
      }
    }

    fs.writeFileSync(svgPath, svgContent, 'utf-8');
    const stats = fs.statSync(svgPath);
    generatedFiles.push({
      format: 'SVG',
      filePath: svgPath,
      sizeBytes: stats.size,
      details: logoBuffer ? 'Vector nítido con logo central incrustado' : 'Vector nítido estándar'
    });
  }

  // 2. Generate PNG
  if (options.format === 'png' || options.format === 'both') {
    const pngPath = path.join(resolvedOutputDir, `${options.filename}.png`);
    const baseQrBuffer = await QRCode.toBuffer(options.url, {
      ...commonQROptions,
      type: 'png',
      width: options.size
    });

    let finalPngBuffer = baseQrBuffer;
    if (logoBuffer) {
      const qrDim = options.size;
      const logoDim = Math.round(qrDim * options.logoRatio);
      const cardDim = Math.round(logoDim * 1.08);
      const rx = Math.round(cardDim * 0.16);

      const cardSvg = Buffer.from(
        `<svg width="${cardDim}" height="${cardDim}"><rect width="${cardDim}" height="${cardDim}" rx="${rx}" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/></svg>`
      );

      const resizedLogo = await sharp(logoBuffer)
        .resize(logoDim, logoDim, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

      finalPngBuffer = await sharp(baseQrBuffer)
        .composite([
          { input: cardSvg, gravity: 'center' },
          { input: resizedLogo, gravity: 'center' }
        ])
        .png()
        .toBuffer();
    }

    fs.writeFileSync(pngPath, finalPngBuffer);
    const stats = fs.statSync(pngPath);
    generatedFiles.push({
      format: 'PNG',
      filePath: pngPath,
      sizeBytes: stats.size,
      details: `${options.size}x${options.size} px (32-bit RGBA) con logo central`
    });
  }

  // Also ensure Multimedia/output has identical files if running inside Website
  const multimediaOutputDir = path.resolve('/home/joel/Proyectos/G-Tech/Multimedia/output');
  if (path.basename(resolvedOutputDir) === 'output' && resolvedOutputDir !== multimediaOutputDir) {
    try {
      if (!fs.existsSync(multimediaOutputDir)) {
        fs.mkdirSync(multimediaOutputDir, { recursive: true });
      }
      for (const file of generatedFiles) {
        const destFile = path.join(multimediaOutputDir, path.basename(file.filePath));
        fs.copyFileSync(file.filePath, destFile);
      }
    } catch {
      // Ignore sync errors if non-critical
    }
  }

  return generatedFiles;
}

// CLI entry point
if (process.argv[1] && (process.argv[1].endsWith('generate-qr.js') || process.argv[1].endsWith('generate-qr'))) {
  try {
    const options = parseArgs(process.argv.slice(2));
    console.log(`\x1b[36m⚡ [G-Tech QR Generator]\x1b[0m Generando QR con marca G-Tech...`);
    console.log(`  • URL de destino: \x1b[32m${options.url}\x1b[0m`);
    console.log(`  • Formato(s): \x1b[33m${options.format}\x1b[0m`);
    console.log(`  • Logo en el centro: \x1b[35m${options.includeLogo ? 'Sí (Logo oficial transparente)' : 'No'}\x1b[0m`);
    console.log(`  • Corrección de errores (ECC): \x1b[35mNivel ${options.ecc}\x1b[0m`);
    console.log(`  • Quiet zone (margen): \x1b[35m${options.margin} módulos\x1b[0m`);
    console.log(`  • Resolución base (PNG): \x1b[35m${options.size}x${options.size} px\x1b[0m`);

    const results = await generateQR(options);

    console.log(`\n\x1b[32m✔ Códigos QR con logo generados con éxito:\x1b[0m`);
    for (const res of results) {
      console.log(`  [${res.format}] ${res.filePath} (${(res.sizeBytes / 1024).toFixed(2)} KB) - ${res.details}`);
    }
  } catch (err) {
    console.error(`\x1b[31m✖ Error en la generación:\x1b[0m ${err.message}`);
    process.exit(1);
  }
}
