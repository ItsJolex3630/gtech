import accessoriesData from './accessories.json';
import { addCartItem, addToCart, openCartDrawer } from './cart';
import { getLanguage, getLocalizedProduct, onLanguageChange } from './i18n';
import { getProductById } from './products';
import type { Product } from './types';

const WHATSAPP_NUMBER = '14074273356';
const BODYCAM_ID = 'WA0069-Bodycam';
const PANEL_CLASS = 'concierge-gpu-accel fixed bottom-24 right-4 z-50 hidden max-h-[calc(100dvh-8rem)] w-[calc(100vw-2rem)] flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-md focus:outline-none sm:bottom-28 sm:right-6 sm:max-h-[640px] sm:w-96';

interface LocalizedText {
  en: string;
  es: string;
}

interface ConciergeOption {
  id: string;
  label: LocalizedText;
  hint: LocalizedText;
  icon: string;
}

interface Accessory {
  id: string;
  name: string;
  nameEs: string;
  badge: string;
  badgeEs: string;
  image: string;
  inStock: boolean;
  priceEstimate?: string;
}

type View = 'sector' | 'equipment' | 'recommendation';

interface ConciergeState {
  view: View;
  sectorId: string | null;
  equipmentId: string | null;
}

const SECTORS: ConciergeOption[] = [
  {
    id: 'security',
    label: { en: 'Private Security', es: 'Seguridad Privada' },
    hint: { en: 'Patrols, retail and executive protection', es: 'Patrullaje, retail y protección ejecutiva' },
    icon: '<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>'
  },
  {
    id: 'hospitality',
    label: { en: 'Events & Hospitality', es: 'Eventos y Hotelería' },
    hint: { en: 'Venues, staff and floor coordination', es: 'Venue, staff y coordinación de pisos' },
    icon: '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>'
  },
  {
    id: 'transport',
    label: { en: 'Transport & Fleets', es: 'Transporte y Flotas' },
    hint: { en: 'Ambulances, trucks and logistics', es: 'Ambulancias, camiones y logística' },
    icon: '<path d="M3 7h10v9H3z"/><path d="M13 10h3.5l3.5 3.5V16h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'
  },
  {
    id: 'construction',
    label: { en: 'Construction & Industry', es: 'Construcción e Industria' },
    hint: { en: 'Heavy sites, plants and warehouses', es: 'Obra pesada, plantas y bodegas' },
    icon: '<path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z"/><path d="M10 10V5a2 2 0 114 0v5"/><path d="M4 15v-3a6 6 0 016-6"/><path d="M14 6a6 6 0 016 6v3"/>'
  },
  {
    id: 'hazard',
    label: { en: 'Hazard Zones / ATEX', es: 'Zonas de Riesgo / ATEX' },
    hint: { en: 'Petrochemical, mining and maritime', es: 'Petroquímica, minería y marítimo' },
    icon: '<path d="M12 9v2m0 4h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>'
  }
];

const EQUIPMENT: ConciergeOption[] = [
  {
    id: 'radios',
    label: { en: 'Long-Range PoC Radios', es: 'Radios PoC Largo Alcance' },
    hint: { en: 'Push-to-talk over nationwide 4G LTE', es: 'Push-to-talk sobre 4G LTE nacional' },
    icon: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>'
  },
  {
    id: 'bodycam',
    label: { en: 'BQ-K8 Bodycam with Streaming', es: 'Bodycam BQ-K8 con Streaming' },
    hint: { en: '4K video, GPS and night vision', es: 'Video 4K, GPS y visión nocturna' },
    icon: '<path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="15" cy="13" r="3"/>'
  },
  {
    id: 'kit',
    label: { en: 'Full Kit Radio + Accessories', es: 'Kit Completo Radio + Accesorios' },
    hint: { en: 'Radio, earpiece and PTT microphone', es: 'Equipo, auricular y micrófono PTT' },
    icon: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'
  },
  {
    id: 'accessories',
    label: { en: 'Accessories Only', es: 'Solo Accesorios' },
    hint: { en: 'Spare parts, chargers and cases', es: 'Repuestos, cargadores y fundas' },
    icon: '<path d="M12 15a4 4 0 004-4V7a4 4 0 10-8 0v4a4 4 0 004 4z"/><path d="M19 11a7 7 0 01-14 0"/><path d="M12 18v3"/>'
  }
];

const SECTOR_RADIOS: Record<string, [string, string]> = {
  security: ['G-H18', 'G-U6'],
  hospitality: ['Model-G-M2', 'G-510'],
  transport: ['G-8900-Pro', 'WA0058-Vehicle'],
  construction: ['G-889', 'WA0064-LongRange'],
  hazard: ['P0-Ex-Blue', 'G-P0-Black']
};

const SECTOR_ACCESSORIES: Record<string, string[]> = {
  security: ['acc-acoustic-earpiece-typec-2pack', 'acc-bqs5-mic'],
  hospitality: ['acc-acoustic-earpiece-typec-2pack', 'acc-bqs5-mic'],
  transport: ['acc-shoulder-mic-typec-2pack'],
  construction: ['acc-silicone-case-type-a', 'acc-multi-charger-dock'],
  hazard: ['acc-silicone-case-type-b', 'acc-multi-charger-dock']
};

const UI = {
  stepSector: { en: 'Step 01 / 02 · Sector', es: 'Paso 01 / 02 · Sector' },
  sectorTitle: { en: 'Where does your team operate?', es: '¿Dónde opera tu equipo?' },
  sectorHint: { en: 'Pick the terrain to calibrate the tactical advisor.', es: 'Selecciona el terreno para calibrar el asesor táctico.' },
  stepEquipment: { en: 'Step 02 / 02 · Equipment', es: 'Paso 02 / 02 · Equipamiento' },
  equipmentTitle: { en: 'What gear do you need to deploy?', es: '¿Qué equipo necesitas desplegar?' },
  equipmentHint: { en: 'We define the technical package for your operation.', es: 'Definimos el paquete técnico de tu operación.' },
  back: { en: 'Change sector', es: 'Cambiar sector' },
  recommendation: { en: 'Tactical recommendation', es: 'Recomendación táctica' },
  sectorLabel: { en: 'Sector', es: 'Sector' },
  equipmentLabel: { en: 'Equipment', es: 'Equipo' },
  matchBadge: { en: 'Sector match', es: 'Compatible' },
  addToCart: { en: 'Add to cart', es: 'Agregar al carrito' },
  viewSpecs: { en: 'View specs', es: 'Ver ficha' },
  alternative: { en: 'Alternative', es: 'Alternativa' },
  accessories: { en: 'Recommended accessories', es: 'Accesorios recomendados' },
  accessoriesOnly: { en: 'Accessories only', es: 'Solo accesorios' },
  reset: { en: 'Reset advisor', es: 'Reiniciar asesor' },
  launcher: { en: 'Open G-TECH tactical advisor', es: 'Abrir asesor táctico G-TECH' },
  close: { en: 'Close tactical advisor', es: 'Cerrar asesor táctico' },
  tooltip: { en: 'G-TECH CONCIERGE | Tactical Advisor', es: 'G-TECH CONCIERGE | Asesor Táctico' },
  quoteWhatsApp: { en: 'Quote on WhatsApp', es: 'Cotizar por WhatsApp' },
  defaultWa: { en: 'Hello G-TECH, I need tactical advising for my operation.', es: 'Hola G-TECH, solicito asesoría táctica para mi operación.' },
  waHeader: { en: '🚨 G-TECH TACTICAL CONCIERGE INQUIRY 🚨', es: '🚨 CONSULTA CONCIERGE TÁCTICO G-TECH 🚨' },
  waSector: { en: 'Operating Sector', es: 'Sector Operativo' },
  waEquipment: { en: 'Recommended Equipment', es: 'Equipo Recomendado' },
  waAccessories: { en: 'Suggested Accessories', es: 'Accesorios Sugeridos' },
  waClosing: {
    en: 'Hello G-TECH, I request a formal quote and availability for this equipment for my operation.',
    es: 'Hola G-TECH, solicito cotización formal y disponibilidad de este equipo para mi operación.'
  }
};

const ACCESSORIES = accessoriesData as Accessory[];

function L(text: LocalizedText): string {
  return getLanguage() === 'es' ? text.es : text.en;
}

function findAccessory(id: string): Accessory | undefined {
  return ACCESSORIES.find(accessory => accessory.id === id);
}

function accessoryName(accessory: Accessory): string {
  return getLanguage() === 'es' ? accessory.nameEs : accessory.name;
}

function accessoryBadge(accessory: Accessory): string {
  return getLanguage() === 'es' ? accessory.badgeEs : accessory.badge;
}

function productPrice(product: Product): string | null {
  if ((window as any).siteShowPrices === false) return null;
  return product.discountPrice || product.priceEstimate || null;
}

function getRecommendation(state: ConciergeState): {
  primary: Product | null;
  alternative: Product | null;
  accessories: Accessory[];
} {
  const radioIds = state.sectorId ? SECTOR_RADIOS[state.sectorId] ?? [] : [];
  const accessoryIds = state.sectorId ? SECTOR_ACCESSORIES[state.sectorId] ?? [] : [];

  const primaryId = state.equipmentId === 'bodycam'
    ? BODYCAM_ID
    : state.equipmentId === 'accessories'
      ? null
      : radioIds[0];

  const primaryProduct = primaryId ? getProductById(primaryId) : undefined;
  const alternativeProduct = state.equipmentId === 'radios' && radioIds[1]
    ? getProductById(radioIds[1])
    : undefined;

  return {
    primary: primaryProduct ? getLocalizedProduct(primaryProduct) : null,
    alternative: alternativeProduct ? getLocalizedProduct(alternativeProduct) : null,
    accessories: state.equipmentId === 'bodycam'
      ? []
      : accessoryIds.map(findAccessory).filter((accessory): accessory is Accessory => Boolean(accessory))
  };
}

function whatsappUrl(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function whatsappMessage(state: ConciergeState): string {
  const sector = SECTORS.find(option => option.id === state.sectorId);
  const equipment = EQUIPMENT.find(option => option.id === state.equipmentId);
  if (!sector || !equipment) return L(UI.defaultWa);

  const { primary, accessories } = getRecommendation(state);
  const price = primary ? productPrice(primary) : null;
  const equipmentText = primary
    ? `${primary.name}${price ? ` (${price})` : ''}`
    : L(UI.accessoriesOnly);
  const accessoryText = accessories.map(accessoryName).join(', ') || '—';

  return [
    L(UI.waHeader),
    `${L(UI.waSector)}: ${L(sector.label)}`,
    `${L(UI.waEquipment)}: ${equipmentText}`,
    `${L(UI.waAccessories)}: ${accessoryText}`,
    L(UI.waClosing)
  ].join('\n');
}

function renderLauncher(): string {
  return `
    <button id="tactical-concierge-launcher" type="button" aria-label="G-TECH tactical advisor" aria-expanded="false" aria-controls="tactical-concierge-panel" class="group concierge-gpu-accel tactical-beacon-active fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-slate-900 text-cyan-400 shadow-2xl shadow-cyan-500/20 transition-all duration-200 hover:scale-105 hover:border-cyan-400 hover:text-cyan-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:bottom-24 sm:right-6">
      <span data-concierge-tooltip class="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950/95 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">G-TECH CONCIERGE</span>
      <span class="absolute -right-1 -top-1 flex h-3 w-3">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
      </span>
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 13v-1a8 8 0 0116 0v1"/>
        <path d="M4 13h1.5A1.5 1.5 0 017 14.5v3A1.5 1.5 0 015.5 19H5a1 1 0 01-1-1v-5z"/>
        <path d="M20 13h-1.5A1.5 1.5 0 0017 14.5v3A1.5 1.5 0 0018.5 19h.5a1 1 0 001-1v-5z"/>
        <circle cx="12" cy="9" r="1.6"/>
        <path d="M12 6.1v.9M12 11v.9M9.1 9h.9M13.9 9h.9"/>
      </svg>
    </button>`;
}

function renderOption(option: ConciergeOption, attribute: 'sector' | 'equipment'): string {
  return `
    <button type="button" data-concierge-${attribute}="${option.id}" class="group flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-left transition-all duration-200 hover:border-cyan-500/50 hover:bg-slate-800/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
      <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-cyan-400 transition-colors group-hover:text-cyan-300">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${option.icon}</svg>
      </span>
      <span class="min-w-0">
        <span class="block text-xs font-semibold text-slate-100">${L(option.label)}</span>
        <span class="block text-[11px] text-slate-500">${L(option.hint)}</span>
      </span>
    </button>`;
}

function renderHeader(): string {
  return `
      <header class="flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-3">
        <div class="min-w-0">
          <p id="tactical-concierge-title" class="font-mono text-[11px] font-bold uppercase leading-tight tracking-[0.18em] text-cyan-400 sm:text-[13px] sm:tracking-widest">TAC-ASSIST <span class="text-slate-600">//</span> <span class="whitespace-nowrap">G-TECH CONCIERGE</span></p>
          <p class="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            <span class="relative flex h-1.5 w-1.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            </span>
            SECURE CH-01 • ONLINE
          </p>
        </div>
        <button type="button" data-concierge-close aria-label="${L(UI.close)}" class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </header>`;
}

function renderSectorView(): string {
  return `
        <section data-concierge-view="sector" class="space-y-3">
          <div class="space-y-1">
            <p class="font-mono text-[10px] uppercase tracking-widest text-slate-500">${L(UI.stepSector)}</p>
            <h2 class="text-sm font-bold text-white">${L(UI.sectorTitle)}</h2>
            <p class="text-[11px] text-slate-400">${L(UI.sectorHint)}</p>
          </div>
          <div class="space-y-2">${SECTORS.map(sector => renderOption(sector, 'sector')).join('')}</div>
        </section>`;
}

function renderEquipmentView(): string {
  return `
        <section data-concierge-view="equipment" class="space-y-3">
          <button type="button" data-concierge-back class="inline-flex min-h-[44px] items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 19l-7-7 7-7"/></svg>
            ${L(UI.back)}
          </button>
          <div class="space-y-1">
            <p class="font-mono text-[10px] uppercase tracking-widest text-slate-500">${L(UI.stepEquipment)}</p>
            <h2 class="text-sm font-bold text-white">${L(UI.equipmentTitle)}</h2>
            <p class="text-[11px] text-slate-400">${L(UI.equipmentHint)}</p>
          </div>
          <div class="space-y-2">${EQUIPMENT.map(equipment => renderOption(equipment, 'equipment')).join('')}</div>
        </section>`;
}

function renderRecommendation(state: ConciergeState, waHref: string): string {
  const sector = SECTORS.find(option => option.id === state.sectorId);
  const equipment = EQUIPMENT.find(option => option.id === state.equipmentId);
  if (!sector || !equipment) return renderSectorView();

  const { primary, alternative, accessories } = getRecommendation(state);
  const primaryPrice = primary ? productPrice(primary) : null;
  const alternativePrice = alternative ? productPrice(alternative) : null;

  const primaryCard = primary ? `
          <article class="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <div class="flex items-start gap-3">
              <img src="${primary.image}" alt="${primary.name}" class="h-16 w-16 flex-shrink-0 rounded-lg border border-slate-800 bg-slate-950 object-contain p-1" loading="lazy">
              <div class="min-w-0 flex-1">
                <span class="inline-block rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">${L(UI.matchBadge)}</span>
                <h3 class="mt-1 text-xs font-bold leading-snug text-slate-100">${primary.name}</h3>
                <p class="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">${primary.badge}</p>
              </div>
              ${primaryPrice ? `<span class="flex-shrink-0 font-mono text-sm font-bold text-cyan-300">${primaryPrice}</span>` : ''}
            </div>
            <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button type="button" data-concierge-add-radio="${primary.id}" class="flex min-h-[44px] items-center justify-center rounded-xl bg-crimson-600 px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-crimson-600/30 transition-all hover:bg-crimson-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400">${L(UI.addToCart)}</button>
              <button type="button" data-concierge-details-radio="${primary.id}" class="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-cyan-500/50 hover:text-cyan-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">${L(UI.viewSpecs)}</button>
            </div>
          </article>` : '';

  const alternativeRow = alternative ? `
          <button type="button" data-concierge-details-radio="${alternative.id}" class="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-left transition-colors hover:border-cyan-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
            <span class="font-mono text-[10px] uppercase tracking-widest text-slate-500">${L(UI.alternative)}</span>
            <span class="min-w-0 truncate text-[11px] font-semibold text-slate-300">${alternative.name}${alternativePrice ? ` · ${alternativePrice}` : ''}</span>
          </button>` : '';

  const accessoryRows = accessories.map(accessory => `
            <div class="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
              <img src="${accessory.image}" alt="${accessoryName(accessory)}" class="h-12 w-12 flex-shrink-0 rounded-lg border border-slate-800 bg-slate-950 object-contain p-0.5" loading="lazy">
              <div class="min-w-0 flex-1">
                <p class="line-clamp-3 text-[11px] font-semibold leading-snug text-slate-200">${accessoryName(accessory)}</p>
                <p class="text-[10px] uppercase tracking-wider text-slate-500">${accessory.priceEstimate || accessoryBadge(accessory)}</p>
              </div>
              <button type="button" data-concierge-details-accessory="${accessory.id}" aria-label="${L(UI.viewSpecs)}: ${accessoryName(accessory)}" class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
              </button>
              <button type="button" data-concierge-add-accessory="${accessory.id}" aria-label="${L(UI.addToCart)}: ${accessoryName(accessory)}" class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-cyan-300 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>`).join('');

  const accessoryBlock = accessories.length > 0 ? `
          <div class="space-y-2">
            <p class="font-mono text-[10px] uppercase tracking-widest text-slate-500">${L(UI.accessories)}</p>
            ${accessoryRows}
          </div>` : '';

  return `
        <section data-concierge-view="recommendation" class="space-y-3">
          <p class="font-mono text-[10px] uppercase tracking-widest text-cyan-400">${L(UI.recommendation)}</p>
          <dl class="space-y-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px]">
            <div class="flex items-start justify-between gap-3">
              <dt class="font-mono text-[10px] uppercase tracking-widest text-slate-500">${L(UI.sectorLabel)}</dt>
              <dd class="text-right font-semibold text-slate-200">${L(sector.label)}</dd>
            </div>
            <div class="flex items-start justify-between gap-3">
              <dt class="font-mono text-[10px] uppercase tracking-widest text-slate-500">${L(UI.equipmentLabel)}</dt>
              <dd class="text-right font-semibold text-slate-200">${L(equipment.label)}</dd>
            </div>
          </dl>
          ${primaryCard}
          ${alternativeRow}
          ${accessoryBlock}
          <a data-concierge-wa href="${waHref}" target="_blank" rel="noopener noreferrer" class="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-emerald-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">${L(UI.quoteWhatsApp)}</a>
        </section>`;
}

function renderFooter(waHref: string): string {
  return `
      <footer class="flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/60 px-4 py-3">
        <button type="button" data-concierge-reset class="inline-flex min-h-[44px] items-center text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">${L(UI.reset)}</button>
        <a data-concierge-wa href="${waHref}" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 012.41 5.83c0 4.54-3.69 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.83-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>
          WhatsApp
        </a>
      </footer>`;
}

function renderPanel(state: ConciergeState): string {
  const waHref = whatsappUrl(whatsappMessage(state));
  const view = state.view === 'recommendation' && state.sectorId && state.equipmentId
    ? renderRecommendation(state, waHref)
    : state.view === 'equipment'
      ? renderEquipmentView()
      : renderSectorView();

  return `${renderHeader()}
      <div data-concierge-body class="concierge-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">${view}</div>
      ${renderFooter(waHref)}`;
}

export function initTacticalConcierge(): void {
  if (document.getElementById('tactical-concierge-root')) return;

  const root = document.createElement('div');
  root.id = 'tactical-concierge-root';
  root.innerHTML = `${renderLauncher()}<div id="tactical-concierge-panel" role="dialog" aria-labelledby="tactical-concierge-title" aria-hidden="true" tabindex="-1" class="${PANEL_CLASS}"></div>`;
  document.body.appendChild(root);

  const launcher = root.querySelector<HTMLButtonElement>('#tactical-concierge-launcher');
  const panel = root.querySelector<HTMLElement>('#tactical-concierge-panel');
  if (!launcher || !panel) return;

  const state: ConciergeState = { view: 'sector', sectorId: null, equipmentId: null };
  let isOpen = false;

  const tooltip = launcher.querySelector<HTMLElement>('[data-concierge-tooltip]');

  const render = (): void => {
    panel.innerHTML = renderPanel(state);
    launcher.setAttribute('aria-label', L(UI.launcher));
    if (tooltip) tooltip.textContent = L(UI.tooltip);
  };

  const showView = (view: View): void => {
    state.view = view;
    render();
    const body = panel.querySelector<HTMLElement>('[data-concierge-body]');
    if (body) body.scrollTop = 0;
    panel.focus();
  };

  const open = (): void => {
    isOpen = true;
    panel.classList.remove('hidden');
    panel.classList.add('animate-tactical-spring');
    panel.setAttribute('aria-hidden', 'false');
    launcher.classList.add('hidden');
    launcher.setAttribute('aria-expanded', 'true');
    panel.focus();
  };

  const close = (): void => {
    isOpen = false;
    panel.classList.add('hidden');
    panel.classList.remove('animate-tactical-spring');
    panel.setAttribute('aria-hidden', 'true');
    launcher.classList.remove('hidden');
    launcher.setAttribute('aria-expanded', 'false');
    if (panel.contains(document.activeElement)) launcher.focus();
  };

  const reset = (): void => {
    state.sectorId = null;
    state.equipmentId = null;
    state.view = 'sector';
    render();
  };

  const addRadio = (id: string): void => {
    addToCart(id);
    openCartDrawer();
  };

  const addAccessory = (id: string): void => {
    const accessory = findAccessory(id);
    if (!accessory) return;

    addCartItem({
      id: accessory.id,
      name: accessoryName(accessory),
      badge: accessoryBadge(accessory),
      image: accessory.image,
      quantity: 1,
      inStock: accessory.inStock
    });
    openCartDrawer();
  };

  const openRadioDetails = (id: string): void => {
    const openModal = (window as any).openModal;
    if (typeof openModal === 'function') {
      openModal(id);
      return;
    }
    window.location.href = `index.html#catalog-card-${id}`;
  };

  const openAccessoryDetails = (id: string): void => {
    const card = document.querySelector<HTMLElement>(`[data-accessory-specs="${id}"]`);
    if (card) {
      card.click();
      return;
    }
    window.location.href = `accessories.html#accessory-card-${id}`;
  };

  render();

  launcher.addEventListener('click', () => {
    if (isOpen) close();
    else open();
  });

  root.addEventListener('click', event => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-concierge-close]')) {
      close();
      return;
    }

    if (target.closest('[data-concierge-reset]')) {
      reset();
      return;
    }

    if (target.closest('[data-concierge-back]')) {
      showView('sector');
      return;
    }

    const sectorButton = target.closest<HTMLElement>('[data-concierge-sector]');
    if (sectorButton) {
      state.sectorId = sectorButton.dataset.conciergeSector ?? null;
      state.equipmentId = null;
      showView('equipment');
      return;
    }

    const equipmentButton = target.closest<HTMLElement>('[data-concierge-equipment]');
    if (equipmentButton) {
      state.equipmentId = equipmentButton.dataset.conciergeEquipment ?? null;
      showView('recommendation');
      return;
    }

    const addRadioButton = target.closest<HTMLElement>('[data-concierge-add-radio]');
    if (addRadioButton?.dataset.conciergeAddRadio) {
      addRadio(addRadioButton.dataset.conciergeAddRadio);
      return;
    }

    const detailsRadioButton = target.closest<HTMLElement>('[data-concierge-details-radio]');
    if (detailsRadioButton?.dataset.conciergeDetailsRadio) {
      openRadioDetails(detailsRadioButton.dataset.conciergeDetailsRadio);
      return;
    }

    const addAccessoryButton = target.closest<HTMLElement>('[data-concierge-add-accessory]');
    if (addAccessoryButton?.dataset.conciergeAddAccessory) {
      addAccessory(addAccessoryButton.dataset.conciergeAddAccessory);
      return;
    }

    const detailsAccessoryButton = target.closest<HTMLElement>('[data-concierge-details-accessory]');
    if (detailsAccessoryButton?.dataset.conciergeDetailsAccessory) {
      openAccessoryDetails(detailsAccessoryButton.dataset.conciergeDetailsAccessory);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen) close();
  });

  onLanguageChange(() => {
    if (panel.isConnected) render();
  });
}
