import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { generateQR } from '../scripts/generate-qr.js';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const SVG_FILE = path.join(OUTPUT_DIR, 'qr-gtechs.svg');
const PNG_FILE = path.join(OUTPUT_DIR, 'qr-gtechs.png');
const EXPECTED_URL = 'https://gtechs.us/';

test('G-Tech QR Code Verification Suite', async (t) => {
  await t.test('1. Verificación de existencia de archivos generados en ./output', () => {
    assert.ok(fs.existsSync(SVG_FILE), `El archivo SVG no existe en ${SVG_FILE}`);
    assert.ok(fs.existsSync(PNG_FILE), `El archivo PNG no existe en ${PNG_FILE}`);

    const svgStats = fs.statSync(SVG_FILE);
    const pngStats = fs.statSync(PNG_FILE);

    assert.ok(svgStats.size > 0, 'El archivo SVG está vacío');
    assert.ok(pngStats.size > 0, 'El archivo PNG está vacío');
  });

  await t.test('2. Verificación de validez y presencia de logo en SVG', () => {
    const svgContent = fs.readFileSync(SVG_FILE, 'utf-8').trim();

    // Validación XML / SVG
    assert.match(svgContent, /^<svg[\s\S]*<\/svg>$/, 'El archivo SVG debe ser un documento XML SVG válido');
    assert.match(svgContent, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, 'El SVG debe declarar el namespace estándar');
    assert.match(svgContent, /viewBox="0 0 \d+ \d+"/, 'El SVG debe tener viewBox definido');
    
    // Verificación de renderizado nítido
    assert.match(svgContent, /shape-rendering="crispEdges"/, 'El SVG debe incluir shape-rendering="crispEdges"');
    
    // Verificación de integración del logo de la marca en el centro
    assert.match(svgContent, /id="gtech-brand-logo-center"/, 'El SVG debe incluir el contenedor del logo central');
    assert.match(svgContent, /<image href="data:image\/png;base64,/, 'El SVG debe incrustar el logo transparente en base64');
  });

  await t.test('3. Verificación de dimensiones, formato y canales del archivo PNG', async () => {
    const pngBuffer = fs.readFileSync(PNG_FILE);
    const metadata = await sharp(pngBuffer).metadata();

    assert.equal(metadata.format, 'png', 'El formato debe ser PNG');
    assert.ok(metadata.width >= 1024, `El ancho debe ser >= 1024 px. Recibido: ${metadata.width}`);
    assert.ok(metadata.height >= 1024, `El alto debe ser >= 1024 px. Recibido: ${metadata.height}`);
    assert.equal(metadata.width, metadata.height, 'El código QR debe ser cuadrado (1:1 aspect ratio)');
    assert.ok(metadata.channels >= 3, 'El PNG debe tener canales de color completos (RGB o RGBA)');
  });

  await t.test('4. Decodificación determinista del código PNG con logo (round-trip)', async () => {
    const pngBuffer = fs.readFileSync(PNG_FILE);
    const { data, info } = await sharp(pngBuffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    
    const qrResult = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    assert.ok(qrResult, 'El lector QR debe ser capaz de detectar y decodificar el código QR con logo');
    assert.equal(qrResult.data, EXPECTED_URL, `El contenido decodificado debe ser exactamente "${EXPECTED_URL}"`);
  });

  await t.test('5. Verificación de rasterizado y decodificación del archivo SVG', async () => {
    const svgContent = fs.readFileSync(SVG_FILE);
    const rasterized = await sharp(svgContent).resize(1024, 1024).png().toBuffer();
    const { data, info } = await sharp(rasterized).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

    const qrResult = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    assert.ok(qrResult, 'El SVG con logo rasterizado debe ser legible por lectores QR');
    assert.equal(qrResult.data, EXPECTED_URL);
  });

  await t.test('6. Verificación de la API modular generateQR con parámetros configurables y logo', async () => {
    const testDir = path.join(ROOT_DIR, 'output', 'test-run');
    const files = await generateQR({
      url: 'https://gtechs.us/test',
      format: 'both',
      outputDir: testDir,
      filename: 'custom-qr',
      margin: 4,
      size: 1200,
      ecc: 'H',
      includeLogo: true,
      logoRatio: 0.22,
      dark: '#111111',
      light: '#ffffff'
    });

    assert.equal(files.length, 2, 'Debe generar exactamente 2 archivos (SVG y PNG)');
    const testPngPath = path.join(testDir, 'custom-qr.png');
    const testSvgPath = path.join(testDir, 'custom-qr.svg');

    assert.ok(fs.existsSync(testPngPath), 'El PNG personalizado debe existir');
    assert.ok(fs.existsSync(testSvgPath), 'El SVG personalizado debe existir');

    const meta = await sharp(testPngPath).metadata();
    assert.equal(meta.width, 1200, 'El ancho debe ser exactamente 1200 px');
    assert.equal(meta.height, 1200, 'El alto debe ser exactamente 1200 px');

    // Decodificar custom
    const { data, info } = await sharp(testPngPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    assert.equal(decoded?.data, 'https://gtechs.us/test');

    // Limpieza de carpeta de test
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  await t.test('7. Verificación de opción --no-logo', async () => {
    const testDir = path.join(ROOT_DIR, 'output', 'test-no-logo');
    await generateQR({
      url: 'https://gtechs.us/',
      format: 'svg',
      outputDir: testDir,
      filename: 'plain-qr',
      includeLogo: false
    });

    const plainSvg = fs.readFileSync(path.join(testDir, 'plain-qr.svg'), 'utf-8');
    assert.ok(!plainSvg.includes('gtech-brand-logo-center'), 'No debe incluir logo cuando includeLogo es false');

    fs.rmSync(testDir, { recursive: true, force: true });
  });

  await t.test('8. Verificación de control de errores y validaciones de argumentos', () => {
    const scriptPath = path.join(ROOT_DIR, 'scripts', 'generate-qr.js');

    assert.throws(() => {
      execFileSync('node', [scriptPath, 'https://gtechs.us/', 'invalid-format'], { stdio: 'pipe' });
    }, /Formato no válido/);

    assert.throws(() => {
      execFileSync('node', [scriptPath, '--url', 'https://gtechs.us/', '--margin', '-5'], { stdio: 'pipe' });
    }, /margen/);

    assert.throws(() => {
      execFileSync('node', [scriptPath, '--url', 'https://gtechs.us/', '--ecc', 'Z'], { stdio: 'pipe' });
    }, /Nivel de corrección de error/);
  });
});
