import accessoriesData from './accessories.json';
import { addCartItem, addToCart, clearCart, getCart, removeFromCart, subscribe as subscribeCart } from './cart';
import { getLanguage, getLocalizedProduct, onLanguageChange, tSpecLabel } from './i18n';
import { getProductById, products } from './products';
import type { Product } from './types';
import { escapeHtml } from './utils/escape.ts';

const WHATSAPP_NUMBER = '14074273356';
const CONTACT_EMAIL = 'gtech.usfl@gmail.com';
const PANEL_CLASS = 'concierge-gpu-accel fixed bottom-24 right-4 z-50 hidden h-[min(600px,calc(100dvh-9rem))] w-[calc(100vw-2rem)] flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-md focus:outline-none sm:bottom-28 sm:right-6 sm:w-[400px]';
const ONLINE_STATUS = { en: 'Online · Tactical advisor', es: 'En línea · Asesor táctico' };
const TYPING_STATUS = { en: 'Typing…', es: 'Escribiendo…' };

interface Accessory {
  id: string;
  name: string;
  nameEs: string;
  badge: string;
  badgeEs: string;
  image: string;
  inStock: boolean;
  priceEstimate?: string;
  connector?: string;
  connectorEs?: string;
  compatibility?: string[];
  description?: string;
  descriptionEs?: string;
}

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  chips: string[];
}

interface Reply {
  text: string;
  chips?: string[];
}

interface ProductHit {
  product: Product;
  score: number;
}

const ACCESSORIES = accessoriesData as Accessory[];

const MODEL_ALIASES: Record<string, string[]> = {
  'Model-G-M2': ['g-m2', 'gm2', 'm2', 'clip', 'wearable'],
  'G-U6': ['g-u6', 'gu6', 'u6'],
  'G-510': ['g-510', 'g510', '510'],
  'G-280-2': ['g-280', 'g280', '280'],
  'G-H18': ['g-h18', 'gh18', 'h18'],
  'G-H28': ['g-h28', 'gh28', 'h28'],
  'G-F1': ['g-f1', 'gf1', 'f1', 'touchscreen', 'pantalla tactil'],
  'G-889': ['g-889', 'g889', '889'],
  'WA0069-Bodycam': ['bq-k8', 'bqk8', 'g-k8', 'k8', 'bodycam', 'body cam'],
  'G-8900-Pro': ['g-8900', '8900', 'base station', 'estacion base'],
  'WA0055-GlobalLTE': ['g0 plus', 'g0', 'global lite'],
  'WA0057-TacticalField': ['g-9 plus', 'g9 plus', 'g9'],
  'WA0060-Black': ['g6 plus black', 'g6 black', 'g6 negro'],
  'WA0060-Green': ['g6 plus green', 'g6 green', 'g6 verde'],
  'G-P0-Black': ['g-p0', 'p0 black', 'p0 negro'],
  'P0-Ex-Blue': ['p0 ex', 'ex blue', 'p0 azul', 'atex', 'explosion proof'],
  'G5-Plus': ['g5 plus', 'g5'],
  'WA0062-TriMode': ['g8 plus', 'g8'],
  'WA0064-LongRange': ['g-5288', '5288', 'long range', 'largo alcance'],
  'WA0058-Vehicle': ['v1 plus', 'v1', 'vehicle', 'vehiculo'],
  'WA0066-Alervites': ['alervites', 'at1', 'baofeng'],
  'M88-Dual-Mode': ['m88']
};

const ACCESSORY_ALIASES: Record<string, string[]> = {
  'acc-bqs5-mic': ['g-s5', 's5 mic', 'microfono tactico de hombro'],
  'acc-bqs4-typec-mic': ['g-s4', 's4 mic', 'microfono digital type-c'],
  'acc-shoulder-mic-typec-2pack': ['shoulder mic type-c', 'microfono de hombro type-c'],
  'acc-shoulder-mic-2pin-2pack': ['shoulder mic 2-pin', 'microfono de hombro 2 pines'],
  'acc-shoulder-mic-35mm-2pack': ['3.5mm mic', 'microfono 3.5mm'],
  'acc-acoustic-earpiece-typec-2pack': ['auricular', 'earpiece', 'tubo acustico', 'acoustic tube'],
  'acc-multi-charger-dock': ['cargador', 'charger', 'multicargador', 'base de carga', 'dock'],
  'acc-silicone-case-type-a': ['funda tipo a', 'case type a', 'funda de silicona'],
  'acc-silicone-case-type-b': ['funda tipo b', 'case type b']
};

const PRIORITY = [
  'G-U6', 'Model-G-M2', 'G-510', 'G-H18', 'G-889', 'WA0069-Bodycam', 'WA0055-GlobalLTE',
  'G-F1', 'WA0057-TacticalField', 'G-8900-Pro', 'P0-Ex-Blue', 'G-P0-Black', 'WA0064-LongRange',
  'M88-Dual-Mode', 'G-280-2', 'G-H28', 'G5-Plus', 'WA0062-TriMode', 'WA0058-Vehicle',
  'WA0060-Black', 'WA0060-Green', 'WA0066-Alervites'
];

interface UseCase {
  match: RegExp;
  productIds: string[];
  accessoryId?: string;
  pitch: { en: string; es: string };
}

const USE_CASES: UseCase[] = [
  {
    match: /(discoteca|nightclub|bar|antro|fiesta|evento|concierto|festival|hotel|hospitality|venue)/,
    productIds: ['G-889'],
    accessoryId: 'acc-bqs5-mic',
    pitch: {
      en: 'For clubs and loud events you need speaker output and noise rejection, not just range. The G-889 is our hybrid RF + 4G radio with dual antenna and a full keypad, built for noisy venues.',
      es: 'Para discotecas y eventos con ruido alto necesitas potencia de altavoz y rechazo de ruido, no solo alcance. El G-889 es nuestro radio híbrido RF + 4G con antena dual y teclado completo, hecho para venues ruidosos.'
    }
  },
  {
    match: /(seguridad|security|patrulla|guardia|vigilancia|retail|escolta|proteccion ejecutiva)/,
    productIds: ['G-889', 'G-H18'],
    accessoryId: 'acc-bqs5-mic',
    pitch: {
      en: 'For patrols and executive protection prioritize a rugged chassis and long-shift battery. The G-889 gives you dual antenna plus the Type-K accessory ecosystem; the G-H18 is the metal-frame option for hard daily use.',
      es: 'Para patrullaje y protección ejecutiva prioriza chasis resistente y batería de turno largo. El G-889 suma antena dual y ecosistema de accesorios Type-K; el G-H18 es la opción de marco metálico para uso diario duro.'
    }
  },
  {
    match: /(construccion|construction|obra|industria|industrial|bodega|planta|almacen)/,
    productIds: ['WA0064-LongRange', 'G-889'],
    accessoryId: 'acc-bqs5-mic',
    pitch: {
      en: 'On site, dust, drops and distance are the real problem. The G-5288 combines VHF/UHF with 4G fallback so you keep contact between floors and blocks; the G-889 is the lighter all-rounder.',
      es: 'En obra, el polvo, las caídas y la distancia son el problema real. El G-5288 combina VHF/UHF con respaldo 4G para no perder contacto entre pisos y bloques; el G-889 es el todoterreno más ligero.'
    }
  },
  {
    match: /(flota|fleet|transporte|transport|camion|truck|ambulancia|vehiculo|conductor|logistica)/,
    productIds: ['G-8900-Pro', 'WA0058-Vehicle'],
    pitch: {
      en: 'For fleets you want a fixed vehicle base with 12–24V power. The G-8900 Pro mounts in the cab with full dispatch controls; the V1 Plus adds GPS and SOS for ambulances and route patrols.',
      es: 'Para flotas conviene una base vehicular fija con alimentación 12–24V. El G-8900 Pro se monta en cabina con controles de despacho; el V1 Plus añade GPS y SOS para ambulancias y rutas.'
    }
  },
  {
    match: /(atex|petroleo|petrochemical|gas|mina|maritimo|mar\b|agua|water|rescate|rescue|flotante)/,
    productIds: ['P0-Ex-Blue', 'G-P0-Black'],
    accessoryId: 'acc-acoustic-earpiece-typec-2pack',
    pitch: {
      en: 'In explosive atmospheres you need intrinsically safe certification and flotation. The P0 Ex Blue is ATEX-rated and floats; the P0 Black is the same IP67 body without ATEX certification.',
      es: 'En atmósferas explosivas necesitas certificación intrínseca y flotación. El P0 Ex Blue es ATEX y flota; el P0 Black es el mismo cuerpo IP67 sin certificación ATEX.'
    }
  },
  {
    match: /(bodycam|body cam|camara corporal|camara de cuerpo|grabar|grabacion|streaming|evidencia|video vigilancia|videovigilancia)/,
    productIds: ['WA0069-Bodycam'],
    pitch: {
      en: 'The BQ-K8 is a 4K bodycam with night vision, GPS and live streaming over 4G, and it still works as a PoC radio. It is the right call when you need video evidence, not just voice.',
      es: 'La BQ-K8 es una bodycam 4K con visión nocturna, GPS y streaming sobre 4G, y además opera como radio PoC. Es la elección correcta cuando necesitas evidencia en video, no solo voz.'
    }
  },
  {
    match: /(pantalla|touch|smart|inteligente)/,
    productIds: ['G-F1'],
    pitch: {
      en: 'If you need on-screen dispatch, the G-F1 adds a smart interface over 4G PoC for supervisors and control desks.',
      es: 'Si necesitas despacho en pantalla, el G-F1 suma interfaz inteligente sobre PoC 4G para supervisores y mesas de control.'
    }
  },
  {
    match: /(largo alcance|long range|distancia|rural|remoto|montana)/,
    productIds: ['WA0064-LongRange'],
    pitch: {
      en: 'For extreme distance the G-5288 runs VHF/UHF line-of-sight with 4G fallback, so coverage does not depend on a single network.',
      es: 'Para distancia extrema, el G-5288 trabaja VHF/UHF en línea de vista con respaldo 4G, así la cobertura no depende de una sola red.'
    }
  },
  {
    match: /(compacto|pequeno|discreto|encubierto|covert|ligero)/,
    productIds: ['Model-G-M2', 'G-U6'],
    accessoryId: 'acc-bqs5-mic',
    pitch: {
      en: 'For discretion the G-M2 clips to the uniform and keeps PTT within reach; the G-U6 is the most balanced compact PoC for daily operation.',
      es: 'Para discreción, el G-M2 se clipa al uniforme y mantiene el PTT a mano; el G-U6 es el compacto PoC más equilibrado para operación diaria.'
    }
  },
  {
    match: /(barato|economico|economica|presupuesto bajo|precio bajo|cheap|budget)/,
    productIds: ['G-U6', 'WA0066-Alervites'],
    pitch: {
      en: 'On a tight budget the G-U6 is the best entry point; the Alervites AT1 drops further without losing 4G PoC.',
      es: 'Con presupuesto ajustado, el G-U6 es el mejor punto de entrada; el Alervites AT1 baja aún más sin perder PoC 4G.'
    }
  }
];

const siteCorpus: string[] = [];
let siteCorpusLoading = false;
let siteCorpusLoaded = false;

const t = (en: string, es: string): string => (getLanguage() === 'es' ? es : en);

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function money(value: number): string {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

function priceNumber(label: string | null | undefined): number | null {
  if (!label) return null;
  const match = label.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function productPrice(product: Product): number | null {
  return priceNumber(product.discountPrice || product.priceEstimate || null);
}

function priceLabel(product: Product): string | null {
  if ((window as any).siteShowPrices === false) return null;
  return product.discountPrice || product.priceEstimate || null;
}

function accessoryPrice(accessory: Accessory): number | null {
  return priceNumber(accessory.priceEstimate);
}

function accessoryName(accessory: Accessory): string {
  return getLanguage() === 'es' ? accessory.nameEs : accessory.name;
}

function accessoryBadge(accessory: Accessory): string {
  return getLanguage() === 'es' ? accessory.badgeEs : accessory.badge;
}

function accessoryConnector(accessory: Accessory): string {
  return getLanguage() === 'es' ? accessory.connectorEs || accessory.connector || '' : accessory.connector || '';
}

function findAccessory(id: string): Accessory | undefined {
  return ACCESSORIES.find(accessory => accessory.id === id);
}

function itemName(id: string, fallback: string): string {
  const product = getProductById(id);
  if (product) return getLocalizedProduct(product).name;
  const accessory = findAccessory(id);
  if (accessory) return accessoryName(accessory);
  return fallback;
}

function searchKeys(product: Product): string[] {
  const keys = new Set<string>();
  const sources = [product.id, product.name, ...(MODEL_ALIASES[product.id] ?? [])];

  for (const source of sources) {
    const clean = norm(source);
    for (const token of clean.split(/[^a-z0-9]+/)) {
      if (token.length >= 2 && /\d/.test(token)) keys.add(token);
    }
    for (const token of clean.match(/[a-z0-9]+(?:-[a-z0-9]+)+/g) ?? []) {
      if (/\d/.test(token)) keys.add(token);
    }
  }

  for (const alias of MODEL_ALIASES[product.id] ?? []) {
    const clean = norm(alias);
    if (clean.length >= 3) keys.add(clean);
  }

  return [...keys];
}

function modelKeys(product: Product): string[] {
  const keys = new Set<string>();
  const sources = [product.id, product.name, ...(MODEL_ALIASES[product.id] ?? [])];

  for (const source of sources) {
    const clean = norm(source);
    for (const token of clean.split(/[^a-z0-9]+/)) {
      if (token.length >= 2 && /\d/.test(token)) keys.add(token);
    }
    for (const token of clean.match(/[a-z0-9]+(?:-[a-z0-9]+)+/g) ?? []) {
      if (/\d/.test(token)) keys.add(token);
    }
  }

  return [...keys];
}

function containsKey(text: string, key: string): boolean {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(` ${text} `);
}

function findProductsIn(raw: string): ProductHit[] {
  const q = norm(raw);
  const hits: ProductHit[] = [];

  for (const product of products) {
    let score = 0;
    for (const key of searchKeys(product)) {
      if (containsKey(q, key)) score += key.length;
    }
    if (score > 0) hits.push({ product, score });
  }

  return hits.sort((a, b) => b.score - a.score);
}

function findAccessoryIn(raw: string): Accessory | undefined {
  const q = norm(raw);
  let best: { accessory: Accessory; score: number } | null = null;

  for (const accessory of ACCESSORIES) {
    let score = 0;
    for (const alias of ACCESSORY_ALIASES[accessory.id] ?? []) {
      if (containsKey(q, norm(alias))) score += norm(alias).length;
    }
    if (score > 0 && (!best || score > best.score)) best = { accessory, score };
  }

  return best?.accessory;
}

function compatibleAccessories(product: Product): Accessory[] {
  const keys = modelKeys(product);
  return ACCESSORIES.filter(accessory =>
    (accessory.compatibility ?? []).some(entry => {
      const cleanEntry = norm(entry);
      return keys.some(key => cleanEntry.includes(key));
    })
  );
}

function topSpecs(product: Product, limit: number): string[] {
  const preferred = product.specs.filter(spec =>
    /(battery|range|network|protection|water|display|weight|coverage|audio|power|encryption|channel|talk)/i.test(spec.label)
  );
  return (preferred.length > 0 ? preferred : product.specs)
    .slice(0, limit)
    .map(spec => `${tSpecLabel(spec.label)}: ${spec.value}`);
}

interface CartLine {
  id: string;
  name: string;
  quantity: number;
  total: number | null;
}

interface CartDetails {
  lines: CartLine[];
  total: number;
  missingPrice: boolean;
}

function cartDetails(): CartDetails {
  const lines: CartLine[] = getCart().map(item => {
    const product = getProductById(item.id);
    const accessory = findAccessory(item.id);
    const unit = product ? productPrice(product) : accessory ? accessoryPrice(accessory) : null;
    return {
      id: item.id,
      name: itemName(item.id, item.name),
      quantity: item.quantity,
      total: unit === null ? null : unit * item.quantity
    };
  });

  return {
    lines,
    total: lines.reduce((sum, line) => sum + (line.total ?? 0), 0),
    missingPrice: lines.some(line => line.total === null)
  };
}

function checkoutUrl(): string {
  const details = cartDetails();
  const body = details.lines.length > 0
    ? [
      t('🚨 G-TECH ORDER FROM THE TACTICAL ASSISTANT 🚨', '🚨 PEDIDO G-TECH DESDE EL ASISTENTE TÁCTICO 🚨'),
      ...details.lines.map(line => `• ${line.quantity}× ${line.name}${line.total === null ? '' : ` — ${money(line.total)}`}`),
      `${t('Estimated total', 'Total estimado')}: ${money(details.total)} USD`,
      '',
      t(
        'Hello G-TECH, please confirm availability and send a formal quote for this order.',
        'Hola G-TECH, confirmen disponibilidad y envíen cotización formal de este pedido.'
      )
    ]
    : [
      t(
        'Hello G-TECH, I need tactical advising to choose PoC radios and accessories.',
        'Hola G-TECH, necesito asesoría táctica para elegir radios PoC y accesorios.'
      )
    ];

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body.join('\n'))}`;
}

function addById(id: string): boolean {
  const product = getProductById(id);
  if (product) return addToCart(id).success;

  const accessory = findAccessory(id);
  if (!accessory) return false;

  const result = addCartItem({
    id: accessory.id,
    name: accessoryName(accessory),
    badge: accessoryBadge(accessory),
    image: accessory.image,
    quantity: 1,
    inStock: accessory.inStock
  });
  return result.success;
}

function parseBudget(q: string): number | null {
  const dollar = q.match(/\$\s*(\d{1,5})(?:[.,](\d{1,2}))?/);
  if (dollar) return Number(`${dollar[1]}.${dollar[2] ?? 0}`);

  const currency = q.match(/(\d{1,5})(?:[.,](\d{1,2}))?\s*(?:dolares|dolar|usd|verdes|bucks)/);
  if (currency) return Number(`${currency[1]}.${currency[2] ?? 0}`);

  const intent = q.match(/(?:presupuesto|tengo|dispongo|cuento con|hasta|maximo|max)\s+(?:de\s+|unos\s+|solo\s+|por\s+)?(\d{2,5})/);
  if (intent && !/\b(?:wa\d+|[gmpu]\s?-?\s?\d)/.test(q)) return Number(intent[1]);

  return null;
}

const DEFAULT_CHIPS = (): string[] => [
  t('Recommend', 'Recomiéndame'),
  t('G-M2 accessories', 'Accesorios G-M2'),
  t('My cart', 'Mi carrito'),
  t('I have $150', 'Tengo $150')
];

function greeting(): ChatMessage {
  return {
    role: 'bot',
    text: t(
      'I am **G-Operator**, your G-TECH tactical advisor. I know every PoC radio, bodycam, accessory and the full compatibility matrix. Tell me about your operation or ask about any model.',
      'Soy **G-Operator**, tu asesor táctico de G-TECH. Conozco cada radio PoC, bodycam, accesorio y la matriz de compatibilidad completa. Cuéntame tu operación o pregúntame por cualquier modelo.'
    ),
    chips: DEFAULT_CHIPS()
  };
}

function cartReply(): Reply {
  const details = cartDetails();
  if (details.lines.length === 0) {
    return {
      text: t(
        'Your cart is empty right now. If you tell me the operation, I can build the full kit in a minute.',
        'Tu carrito está vacío ahora mismo. Si me dices la operación, te armo el kit completo en un minuto.'
      ),
      chips: DEFAULT_CHIPS().slice(0, 3)
    };
  }

  return {
    text: `${t('This is what you are carrying right now:', 'Esto es lo que llevas ahora mismo:')}\n\n[ACTION:CART_SUMMARY]\n\n[ACTION:WHATSAPP_CHECKOUT]`,
    chips: [t('Empty cart', 'Vaciar carrito'), t('Add an accessory', 'Añadir un accesorio'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
  };
}

function clearCartReply(): Reply {
  clearCart();
  return {
    text: t(
      'Cart cleared. We start over whenever you want — radio, bodycam or accessories?',
      'Carrito vacío. Empezamos de nuevo cuando quieras: ¿radio, bodycam o accesorios?'
    ),
    chips: DEFAULT_CHIPS().slice(0, 3)
  };
}

function productInfoReply(product: Product): Reply {
  const localized = getLocalizedProduct(product);
  const price = priceLabel(product);
  const specs = topSpecs(product, 3);
  const stock = product.inStock
    ? ''
    : `\n\n${t('Right now this model is out of stock; I can quote the closest alternative.', 'Ahora mismo este modelo está agotado; puedo cotizarte la alternativa más cercana.')}`;

  return {
    text: [
      `**${localized.name}**${price ? ` — **${price}**` : ''}`,
      localized.description,
      specs.length > 0 ? specs.map(spec => `• ${spec}`).join('\n') : '',
      `[ACTION:PRODUCT_CARD:${product.id}]${stock}`
    ].filter(Boolean).join('\n\n'),
    chips: [
      t(`Accessories for ${localized.name.split(' ')[0]}`, `Accesorios para ${localized.name.split(' ')[0]}`),
      t('What is in my cart?', '¿Qué tengo en el carrito?'),
      t('Request on WhatsApp', 'Pedir por WhatsApp')
    ]
  };
}

function priceReply(product: Product): Reply {
  const localized = getLocalizedProduct(product);
  const price = priceLabel(product);

  if (!price) {
    return {
      text: t(
        `The **${localized.name}** is quoted directly: prices are confirmed on the formal quote via WhatsApp.`,
        `El **${localized.name}** se cotiza directo: el precio se confirma en la cotización formal por WhatsApp.`
      ),
      chips: [t('Request on WhatsApp', 'Pedir por WhatsApp'), t('What is in my cart?', '¿Qué tengo en el carrito?')]
    };
  }

  const specs = topSpecs(product, 2);
  return {
    text: [
      `**${localized.name}** ${t('costs', 'cuesta')} **${price}**.`,
      specs.length > 0 ? specs.map(spec => `• ${spec}`).join('\n') : '',
      `[ACTION:PRODUCT_CARD:${product.id}]`
    ].filter(Boolean).join('\n\n'),
    chips: [
      t(`Accessories for ${localized.name.split(' ')[0]}`, `Accesorios para ${localized.name.split(' ')[0]}`),
      t('Add it to my cart', 'Añádelo a mi carrito'),
      t('Request on WhatsApp', 'Pedir por WhatsApp')
    ]
  };
}

function accessoriesReply(product: Product): Reply {
  const localized = getLocalizedProduct(product);
  const compatible = compatibleAccessories(product);

  if (compatible.length === 0) {
    return {
      text: t(
        `The **${localized.name}** does not use the PTT microphones or acoustic earpieces in our catalog; those are built for handheld PoC radios. If you want an accessory ecosystem, the G-889 or the G-M2 are the models with the widest Type-K support.`,
        `El **${localized.name}** no usa los micrófonos PTT ni auriculares acústicos del catálogo; esos están pensados para radios PoC portátiles. Si quieres un ecosistema de accesorios, el G-889 o el G-M2 son los modelos con mayor soporte Type-K.`
      ),
      chips: [t('Accessories for G-M2', 'Accesorios para G-M2'), t('View radios', 'Ver radios')]
    };
  }

  const lines = compatible.map(accessory => {
    const price = accessory.priceEstimate ? ` — ${accessory.priceEstimate}` : '';
    const connector = accessoryConnector(accessory);
    return `• **${accessoryName(accessory)}**${connector ? ` (${connector})` : ''}${price}`;
  });

  return {
    text: [
      `${t('These accessories are compatible with the', 'Estos accesorios son compatibles con el')} **${localized.name}**:`,
      lines.join('\n'),
      compatible.slice(0, 2).map(accessory => `[ACTION:PRODUCT_CARD:${accessory.id}]`).join('\n')
    ].join('\n\n'),
    chips: [t('What is in my cart?', '¿Qué tengo en el carrito?'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
  };
}

function accessoryReply(accessory: Accessory): Reply {
  const connector = accessoryConnector(accessory);
  const compatibility = (accessory.compatibility ?? []).slice(0, 6).join(', ');
  const description = getLanguage() === 'es' ? accessory.descriptionEs || accessory.description || '' : accessory.description || '';

  return {
    text: [
      `**${accessoryName(accessory)}**${accessory.priceEstimate ? ` — **${accessory.priceEstimate}**` : ''}`,
      description,
      connector ? `${t('Connector', 'Conector')}: ${connector}` : '',
      compatibility ? `${t('Compatible with', 'Compatible con')}: ${compatibility}` : '',
      `[ACTION:PRODUCT_CARD:${accessory.id}]`
    ].filter(Boolean).join('\n\n'),
    chips: [t('What is in my cart?', '¿Qué tengo en el carrito?'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
  };
}

function accessoryCatalogReply(): Reply {
  return {
    text: t(
      'We carry PTT microphones in Type-K and Type-C, covert acoustic tube earpieces, 6-unit charging docks and rugged silicone cases. Tell me which radio you have and I filter the exact compatibility.',
      'Tenemos micrófonos PTT Type-K y Type-C, auriculares encubiertos de tubo acústico, bases de carga de 6 unidades y fundas de silicona de uso rudo. Dime qué radio tienes y filtro la compatibilidad exacta.'
    ),
    chips: [t('Accessories for G-889', 'Accesorios para G-889'), t('Accessories for G-M2', 'Accesorios para G-M2'), t('Accessories for V1 Plus', 'Accesorios para V1 Plus')]
  };
}

function budgetReply(budget: number): Reply {
  const available = products.filter(product => product.inStock && productPrice(product) !== null);
  const price = (product: Product): number => productPrice(product) ?? 0;
  const ranked = [...available].sort((a, b) => {
    if (price(b) !== price(a)) return price(b) - price(a);
    return PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id);
  });

  const withRoom = ranked.filter(product => price(product) <= budget && budget - price(product) >= 20);
  const best = withRoom[0] ?? ranked.find(product => price(product) <= budget);

  if (!best) {
    const cheapest = [...available].sort((a, b) => price(a) - price(b))[0];
    if (!cheapest) {
      return { text: t('I cannot load the catalog right now. Try again in a moment.', 'No puedo cargar el catálogo en este momento. Inténtalo otra vez en un momento.') };
    }
    const cheapestPrice = price(cheapest);
    return {
      text: t(
        `With **${money(budget)}** we do not reach the most accessible radio: the **${getLocalizedProduct(cheapest).name}** is **${money(cheapestPrice)}**, so you are **${money(cheapestPrice - budget)}** short. If the budget is fixed, I can build an accessory-only loadout.`,
        `Con **${money(budget)}** no llegamos al equipo más accesible: el **${getLocalizedProduct(cheapest).name}** está en **${money(cheapestPrice)}**, te faltan **${money(cheapestPrice - budget)}**. Si el presupuesto es cerrado, puedo armarte solo accesorios.`
      ),
      chips: [t('Show accessories', 'Ver accesorios'), t('I have $100', 'Tengo $100'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
    };
  }

  const bestPrice = price(best);
  const left = budget - bestPrice;
  const localized = getLocalizedProduct(best);
  const accessory = compatibleAccessories(best)
    .filter(item => (accessoryPrice(item) ?? Infinity) <= left)
    .sort((a, b) => (accessoryPrice(b) ?? 0) - (accessoryPrice(a) ?? 0))[0];

  const accessoryLine = accessory
    ? t(
      `The remaining **${money(left)}** covers the **${accessoryName(accessory)}** (${accessory.priceEstimate}), a direct match for its connector.`,
      `El margen de **${money(left)}** alcanza para el **${accessoryName(accessory)}** (${accessory.priceEstimate}), compatible con su conector.`
    )
    : t(
      `You keep **${money(left)}** of margin for a SIM plan or shipping.`,
      `Te quedan **${money(left)}** de margen para el plan SIM o el envío.`
    );

  const cards = [best.id, ...(accessory ? [accessory.id] : [])].map(id => `[ACTION:PRODUCT_CARD:${id}]`).join('\n');

  return {
    text: [
      t(
        `With **${money(budget)}** the best fit is the **${localized.name}** at **${money(bestPrice)}**.`,
        `Con **${money(budget)}** la mejor opción es el **${localized.name}** por **${money(bestPrice)}**.`
      ),
      accessoryLine,
      cards
    ].join('\n\n'),
    chips: [t(`Add the ${localized.name.split(' ')[0]} to my cart`, `Añadir el ${localized.name.split(' ')[0]} al carrito`), t('What is in my cart?', '¿Qué tengo en el carrito?'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
  };
}

function useCaseReply(useCase: UseCase): Reply {
  const primary = useCase.productIds.map(id => getProductById(id)).find((product): product is Product => Boolean(product));
  if (!primary) return fallbackReply();

  const localized = getLocalizedProduct(primary);
  const price = priceLabel(primary);
  const secondaryId = useCase.productIds[1];
  const secondary = secondaryId ? getProductById(secondaryId) : undefined;

  const preferredAccessory = useCase.accessoryId
    ? compatibleAccessories(primary).find(accessory => accessory.id === useCase.accessoryId)
    : undefined;
  const accessory = preferredAccessory ?? compatibleAccessories(primary)[0];

  const secondaryLine = secondary
    ? t(
      `If you want a lighter alternative, the **${getLocalizedProduct(secondary).name}** also fits this operation.`,
      `Si buscas una alternativa más ligera, el **${getLocalizedProduct(secondary).name}** también encaja en esta operación.`
    )
    : '';

  const accessoryLine = accessory
    ? t(
      `I would pair it with the **${accessoryName(accessory)}** (${accessory.priceEstimate}): it shares its connector and adds a direct PTT.`,
      `Lo acompañaría con el **${accessoryName(accessory)}** (${accessory.priceEstimate}): comparte su conector y suma PTT directo.`
    )
    : '';

  const cards = [primary.id, ...(accessory ? [accessory.id] : [])].map(id => `[ACTION:PRODUCT_CARD:${id}]`).join('\n');

  return {
    text: [
      t(useCase.pitch.en, useCase.pitch.es),
      `${t('My pick', 'Mi recomendación')}: **${localized.name}**${price ? ` — **${price}**` : ''}.`,
      accessoryLine,
      secondaryLine,
      cards
    ].filter(Boolean).join('\n\n'),
    chips: [
      t(`Add the ${localized.name.split(' ')[0]} to my cart`, `Añadir el ${localized.name.split(' ')[0]} al carrito`),
      t(`Accessories for ${localized.name.split(' ')[0]}`, `Accesorios para ${localized.name.split(' ')[0]}`),
      t('Request on WhatsApp', 'Pedir por WhatsApp')
    ]
  };
}

function catalogReply(): Reply {
  const available = products.filter(product => product.inStock).slice(0, 6);
  const lines = available.map(product => {
    const localized = getLocalizedProduct(product);
    return `• **${localized.name}**${priceLabel(product) ? ` — ${priceLabel(product)}` : ''}`;
  });

  return {
    text: [
      t('These are the main systems available today:', 'Estos son los sistemas principales disponibles hoy:'),
      lines.join('\n'),
      t('Tell me the operation and I narrow it down to one model.', 'Dime la operación y lo aterrizo en un solo modelo.')
    ].join('\n\n'),
    chips: [t('Recommend a radio', 'Recomiéndame un radio'), t('Accessories for G-M2', 'Accesorios para G-M2'), t('What is in my cart?', '¿Qué tengo en el carrito?')]
  };
}

function fallbackReply(): Reply {
  return {
    text: t(
      'I can help with equipment, prices, accessory compatibility, SIM coverage and your cart. Tell me the operation (security, events, fleets, construction, ATEX) or the model you are looking at.',
      'Puedo ayudarte con equipos, precios, compatibilidad de accesorios, cobertura SIM y tu carrito. Dime la operación (seguridad, eventos, flotas, construcción, ATEX) o el modelo que estás mirando.'
    ),
    chips: DEFAULT_CHIPS()
  };
}

function categoryQuestionReply(): Reply {
  return {
    text: t(
      'To avoid overselling, tell me the terrain: security patrols, loud events, vehicle fleets, construction or ATEX/maritime zones?',
      'Para no venderte de más, dime el terreno: ¿seguridad y patrullaje, eventos con mucho ruido, flotas vehiculares, construcción o zonas ATEX/marítimas?'
    ),
    chips: [
      t('Security & patrol', 'Seguridad y patrullaje'),
      t('Events & clubs', 'Eventos y discotecas'),
      t('Fleets & transport', 'Flotas y transporte'),
      t('Construction', 'Construcción'),
      t('ATEX & maritime', 'ATEX y marítimo')
    ]
  };
}

interface Faq {
  match: RegExp;
  reply: () => Reply;
}

const FAQS: Faq[] = [
  {
    match: /(sim\b|tarjeta sim|plan anual|planes anuales|sim card)/,
    reply: () => ({
      text: t(
        'Annual SIM plans per radio: **US / Canada / Mexico $30**, **Brazil $45**, **Latin America $45**, **Europe $50** and **Global Multi $50**. They are flat yearly rates with Tier-1 automatic network switching, no monthly contracts. You select the plan inside the cart quote.',
        'Planes SIM anuales por radio: **EE.UU. / Canadá / México $30**, **Brasil $45**, **Latinoamérica $45**, **Europa $50** y **Global Multi $50**. Son tarifas planas anuales con conmutación automática entre redes Tier-1, sin contratos mensuales. El plan se elige dentro de la cotización del carrito.'
      ),
      chips: [t('Coverage', 'Cobertura'), t('What is in my cart?', '¿Qué tengo en el carrito?'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
    })
  },
  {
    match: /(cobertura|coverage|red celular|network|4g|lte|senal|signal)/,
    reply: () => ({
      text: t(
        'PoC radios run on 4G LTE with nationwide US coverage: distance between teams does not matter, you only need cellular signal. They are not line-of-sight radios — the network handles the link, with automatic Tier-1 switching and no monthly contract.',
        'Los radios PoC trabajan sobre 4G LTE con cobertura nacional en EE.UU.: la distancia entre equipos no importa, solo necesitas señal celular. No son radios de línea de vista: la red maneja el enlace, con conmutación automática Tier-1 y sin contrato mensual.'
      ),
      chips: [t('SIM plans', 'Planes SIM'), t('View radios', 'Ver radios'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
    })
  },
  {
    match: /(aes|cifrad|encrypt|encriptacion|seguridad de la voz|privacidad de la llamada)/,
    reply: () => ({
      text: t(
        'Voice traffic is protected with **AES-256** on the PoC platform, so conversations stay inside your closed group. It is the same encryption standard we advertise on the storefront badges.',
        'El tráfico de voz se protege con **AES-256** en la plataforma PoC, así las conversaciones quedan dentro de tu grupo cerrado. Es el mismo estándar de cifrado que mostramos en las insignias del sitio.'
      ),
      chips: [t('View radios', 'Ver radios'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
    })
  },
  {
    match: /(envio|envios|shipping|entrega|delivery|despacho|florida)/,
    reply: () => ({
      text: t(
        'We dispatch from **Orlando, Florida**. Shipping cost and transit are confirmed on the quote, since it depends on destination and order size. Send the cart to WhatsApp and the team closes it with you.',
        'Despachamos desde **Orlando, Florida**. El costo y el tiempo de envío se confirman en la cotización, porque dependen del destino y del tamaño de la orden. Manda el carrito a WhatsApp y el equipo lo cierra contigo.'
      ),
      chips: [t('Request on WhatsApp', 'Pedir por WhatsApp'), t('Warranty', 'Garantía'), t('What is in my cart?', '¿Qué tengo en el carrito?')]
    })
  },
  {
    match: /(garantia|warranty|defecto|reparacion|devolucion|return)/,
    reply: () => ({
      text: t(
        'Limited factory warranty: **30 days from receipt**, only for a proven manufacturing defect. It does not cover impacts, misuse, unauthorized moisture, electrical overload or tampering. Outside that window the equipment is sold as-is.',
        'Garantía limitada de fábrica: **30 días desde la recepción**, solo por defecto de fabricación comprobado. No cubre golpes, mal uso, humedad no permitida, sobrecarga eléctrica ni manipulación. Fuera de ese plazo el equipo se entrega tal cual.'
      ),
      chips: [t('Request on WhatsApp', 'Pedir por WhatsApp'), t('Shipping', 'Envíos')]
    })
  },
  {
    match: /(alianza|alliance|fti|florida tactical|instituto tactico)/,
    reply: () => ({
      text: t(
        'We hold a strategic alliance with **Protective Services Florida Tactical Unit** and the **Florida Tactical Institute (FTI)**. Our PoC radios, 4K bodycams and multi-unit charging docks are deployed in preventive patrol, executive protection and tactical instructor training.',
        'Tenemos una alianza estratégica con **Protective Services Florida Tactical Unit** y el **Florida Tactical Institute (FTI)**. Nuestros radios PoC, bodycams 4K y bases de carga múltiple se despliegan en patrullaje preventivo, protección ejecutiva y entrenamiento de instructores tácticos.'
      ),
      chips: [t('View radios', 'Ver radios'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
    })
  },
  {
    match: /(whatsapp|contacto|contact|telefono|phone|correo|email|hablar con alguien|humano)/,
    reply: () => ({
      text: t(
        `Direct line: **WhatsApp +1 407 427 3356** · **${CONTACT_EMAIL}** · operations in Orlando, Florida. If you want a human to close the quote, I send your cart straight there.\n\n[ACTION:WHATSAPP_CHECKOUT]`,
        `Línea directa: **WhatsApp +1 407 427 3356** · **${CONTACT_EMAIL}** · operación en Orlando, Florida. Si quieres cerrar la cotización con una persona, mando tu carrito directo.\n\n[ACTION:WHATSAPP_CHECKOUT]`
      ),
      chips: [t('What is in my cart?', '¿Qué tengo en el carrito?'), t('View radios', 'Ver radios')]
    })
  },
  {
    match: /(factura|invoice|cotizacion|quote|pago|payment|comprar|checkout)/,
    reply: () => ({
      text: t(
        'A WhatsApp or email quote is not binding: the order is formalized once the official pro-forma invoice is approved and payment is confirmed. I can hand your current cart to the team right now.\n\n[ACTION:WHATSAPP_CHECKOUT]',
        'La cotización por WhatsApp o correo no es vinculante: la orden se formaliza cuando se aprueba la factura pro-forma oficial y se confirma el pago. Puedo pasar tu carrito actual al equipo ahora mismo.\n\n[ACTION:WHATSAPP_CHECKOUT]'
      ),
      chips: [t('What is in my cart?', '¿Qué tengo en el carrito?'), t('Shipping', 'Envíos')]
    })
  }
];

async function ingestSitePages(): Promise<void> {
  if (siteCorpusLoaded || siteCorpusLoading) return;
  siteCorpusLoading = true;

  for (const page of ['accessories.html', 'alliances.html']) {
    try {
      const response = await fetch(page, { credentials: 'same-origin' });
      if (!response.ok) continue;

      const documentPage = new DOMParser().parseFromString(await response.text(), 'text/html');
      documentPage.querySelectorAll('script,style,noscript,svg,iframe,nav,footer,header').forEach(element => element.remove());

      const root = documentPage.querySelector('main') ?? documentPage.body;
      const seen = new Set<string>();

      root.querySelectorAll('h1,h2,h3,h4,p,li').forEach(element => {
        const value = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (value.length < 40 || value.length > 600) return;
        const key = value.slice(0, 90);
        if (seen.has(key)) return;
        seen.add(key);
        siteCorpus.push(value);
      });
    } catch {
      // Offline or blocked fetch: the structured catalog still answers.
    }
  }

  siteCorpusLoaded = true;
  siteCorpusLoading = false;
}

function retrieveFromSite(q: string): string | null {
  const tokens = norm(q).split(/[^a-z0-9]+/).filter(token => token.length >= 4);
  if (tokens.length < 2) return null;

  let best: { score: number; text: string } | null = null;
  for (const entry of siteCorpus) {
    const clean = norm(entry);
    let score = 0;
    for (const token of tokens) if (clean.includes(token)) score += 1;
    if (score >= 2 && (!best || score > best.score)) best = { score, text: entry };
  }

  return best?.text ?? null;
}

function answer(raw: string): Reply {
  const q = norm(raw);
  if (!q) return fallbackReply();

  if (/^(hola|hello|hi|hey|buenas|buenos dias|buenas tardes|buenas noches|saludos|que tal)\b/.test(q) && q.length <= 34) {
    return { text: greeting().text, chips: greeting().chips };
  }

  if (/^(gracias|thanks|thank you|ok|vale|perfecto|genial)\b/.test(q) && q.length <= 26) {
    return {
      text: t(
        'Anytime. If you want to compare a model or close the quote, I am right here.',
        'A la orden. Si quieres comparar un modelo o cerrar la cotización, aquí sigo.'
      ),
      chips: DEFAULT_CHIPS().slice(0, 2)
    };
  }

  if (/(vaciar|vacia|limpiar|limpia|borrar|borra|eliminar|elimina|clear|empty)\b.*(carrito|bolsa|pedido|orden|cart|bag|order)/.test(q)) {
    return clearCartReply();
  }

  const productHits = findProductsIn(raw);
  const accessoryHit = findAccessoryIn(raw);
  const removable = /(quita|quitame|elimina|eliminame|borra|borrame|saca|sacame|remove|delete|take out)/.test(q);

  if (removable && (productHits[0] || accessoryHit)) {
    const target = productHits[0]?.product ?? null;
    const accessory = accessoryHit ?? null;
    const id = target ? target.id : accessory ? accessory.id : '';
    const name = target ? getLocalizedProduct(target).name : accessory ? accessoryName(accessory) : '';

    if (id) removeFromCart(id);
    return {
      text: t(`Done, **${name}** is out of the quote.`, `Listo, quité **${name}** de la cotización.`),
      chips: [t('What is in my cart?', '¿Qué tengo en el carrito?'), t('Add an accessory', 'Añadir un accesorio')]
    };
  }

  if (/(agrega|agregar|anade|anadir|mete|meter|pon|poner|suma|sumar|add)\b/.test(q) && (productHits[0] || accessoryHit)) {
    const id = productHits[0]?.product.id ?? accessoryHit?.id ?? '';
    const name = productHits[0]
      ? getLocalizedProduct(productHits[0].product).name
      : accessoryHit ? accessoryName(accessoryHit) : '';

    if (id && addById(id)) {
      return {
        text: t(`Added **${name}** to your quote.\n\n[ACTION:CART_SUMMARY]`, `Añadí **${name}** a tu cotización.\n\n[ACTION:CART_SUMMARY]`),
        chips: [t('What is in my cart?', '¿Qué tengo en el carrito?'), t('Request on WhatsApp', 'Pedir por WhatsApp')]
      };
    }
  }

  if (/(carrito|bolsa|pedido|orden|\bcart\b|\bbag\b|\border\b)/.test(q)
    && /(que|llevo|tengo|ver|revisar|mostrar|dime|resumen|total|cuanto|mi|my|what|show|check|summary|how much)/.test(q)) {
    return cartReply();
  }

  const budget = parseBudget(q);
  if (budget !== null && (productHits.length === 0 || /(presupuesto|tengo|dispongo|hasta|maximo|budget)/.test(q))) {
    return budgetReply(budget);
  }

  if (/(recomiend|recomend|aconseja|sugiere|que radio|que radios|which radio|best radio|me sirve|sirven|works for|work for)/.test(q)) {
    const useCase = USE_CASES.find(item => item.match.test(q));
    if (useCase) return useCaseReply(useCase);
  }

  if (productHits[0]) {
    const product = productHits[0].product;
    if (/(accesorio|accesorios|auricular|microfono|mic\b|compatible|conector|accessor|earpiece|work with)/.test(q)) {
      return accessoriesReply(product);
    }
    if (/(precio|cuanto|cuesta|cuesta|costo|vale|price|cost|how much)/.test(q)) {
      return priceReply(product);
    }
    return productInfoReply(product);
  }

  if (accessoryHit) return accessoryReply(accessoryHit);

  if (/(accesorio|accesorios|auricular|auriculares|microfono|microfonos|funda|fundas|cargador|cargadores|accessor|earpiece|charger|case)/.test(q)) {
    return accessoryCatalogReply();
  }

  for (const useCase of USE_CASES) {
    if (useCase.match.test(q)) return useCaseReply(useCase);
  }

  if (/(recomiend|recomend|aconseja|sugiere|asesora|recomiendas|recommend|suggest)/.test(q)) {
    return categoryQuestionReply();
  }

  if (/(catalogo|catalog|que radios|que equipos|modelos|lista de|list of|what radios|which radios)/.test(q)) {
    return catalogReply();
  }

  for (const faq of FAQS) {
    if (faq.match.test(q)) return faq.reply();
  }

  const siteAnswer = retrieveFromSite(q);
  if (siteAnswer) {
    return {
      text: `${t('From the official G-TECH site:', 'De la información oficial de G-TECH:')}\n\n${siteAnswer}`,
      chips: DEFAULT_CHIPS().slice(0, 3)
    };
  }

  return fallbackReply();
}

function renderAvatar(): string {
  return `
    <svg class="as-svg h-full w-full" viewBox="12 12 40 40" aria-hidden="true">
      <g class="as-body">
        <path d="M9 60c0-8.5 9.5-13 23-13s23 4.5 23 13z" fill="#1e293b" stroke="#475569" stroke-width="1.4"/>
        <path d="M24 49l4 11M40 49l-4 11" stroke="#22d3ee" stroke-opacity="0.35" stroke-width="1.8"/>
        <path d="M27 42h10v7H27z" fill="#94a3b8"/>
        <ellipse cx="32" cy="33" rx="14" ry="14.5" fill="#cbd5e1"/>
        <path d="M13.5 32.5c0-11.5 8.2-19.5 18.5-19.5s18.5 8 18.5 19.5V33h-37z" fill="#334155" stroke="#64748b" stroke-width="1.4"/>
        <path d="M13.5 32.5h37" stroke="#22d3ee" stroke-opacity="0.6" stroke-width="2"/>
        <rect x="29" y="10.5" width="6" height="5" rx="1.5" fill="#0f172a" stroke="#22d3ee" stroke-opacity="0.75"/>
        <rect x="16.5" y="30.5" width="31" height="10" rx="5" fill="#020617" stroke="#22d3ee" stroke-opacity="0.85" stroke-width="1.6"/>
        <g class="as-eye">
          <ellipse cx="25.8" cy="35.5" rx="4" ry="3.4" fill="#e0f2fe"/>
          <circle class="as-pupil" cx="25.8" cy="35.5" r="1.8" fill="#0f172a"/>
        </g>
        <g class="as-eye">
          <ellipse cx="38.2" cy="35.5" rx="4" ry="3.4" fill="#e0f2fe"/>
          <circle class="as-pupil" cx="38.2" cy="35.5" r="1.8" fill="#0f172a"/>
        </g>
        <path d="M28.5 46.5q3.5 2.4 7 0" stroke="#475569" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M50.5 35.5c4 1 5.5 4 4.5 7.5" stroke="#475569" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <circle cx="54.5" cy="43.5" r="2.1" fill="#22d3ee" fill-opacity="0.9"/>
      </g>
    </svg>`;
}

function renderLauncher(): string {
  return `
    <button id="tactical-concierge-launcher" type="button" aria-label="G-Operator tactical chat" aria-expanded="false" aria-controls="tactical-concierge-panel" class="as-launcher group concierge-gpu-accel tactical-beacon-active fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-slate-900 text-cyan-400 shadow-2xl shadow-cyan-500/20 transition-all duration-200 hover:scale-105 hover:border-cyan-400 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:bottom-24 sm:right-6">
      <span data-as-tooltip class="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950/95 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">G-OPERATOR</span>
      <span class="absolute -right-1 -top-1 flex h-3 w-3">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
      </span>
      <span class="h-10 w-10">${renderAvatar()}</span>
    </button>`;
}

function parseActions(raw: string): { text: string; cards: string[]; showCart: boolean; showWhatsApp: boolean } {
  const cards = [...raw.matchAll(/\[ACTION:PRODUCT_CARD:([a-zA-Z0-9_-]+)\]/g)].map(match => match[1]);
  let text = raw.replace(/\[ACTION:PRODUCT_CARD:[a-zA-Z0-9_-]+\]/g, '');
  const showCart = /\[ACTION:CART_SUMMARY\]/.test(text);
  text = text.replace(/\[ACTION:CART_SUMMARY\]/g, '');
  const showWhatsApp = /\[ACTION:WHATSAPP_CHECKOUT\]/.test(text);
  text = text.replace(/\[ACTION:WHATSAPP_CHECKOUT\]/g, '');
  return { text: text.replace(/\n{3,}/g, '\n\n').trim(), cards, showCart, showWhatsApp };
}

function formatText(raw: string): string {
  return escapeHtml(raw)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\n/g, '<br>');
}

function renderCard(id: string): string {
  const product = getProductById(id);
  const accessory = product ? undefined : findAccessory(id);
  if (!product && !accessory) return '';

  const name = product ? getLocalizedProduct(product).name : accessoryName(accessory as Accessory);
  const image = product ? product.image : (accessory as Accessory).image;
  const price = product ? priceLabel(product) : (accessory as Accessory).priceEstimate ?? null;
  const badge = product ? getLocalizedProduct(product).badge : accessoryBadge(accessory as Accessory);

  return `
    <div class="as-chat-card">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" class="as-card-thumb" loading="lazy">
      <div class="as-card-info">
        <p class="as-card-title">${escapeHtml(name)}</p>
        <p class="as-card-meta">${escapeHtml(badge)}</p>
        ${price ? `<p class="as-card-price">${escapeHtml(price)}</p>` : ''}
      </div>
      <button type="button" data-as-add="${escapeHtml(id)}" class="as-card-btn">${t('+ Add', '+ Añadir')}</button>
    </div>`;
}

function renderCartSummary(): string {
  const details = cartDetails();
  if (details.lines.length === 0) {
    return `<div class="as-cart-summary" data-as-cart-summary>${t('Your cart is empty.', 'Tu carrito está vacío.')}</div>`;
  }

  const lines = details.lines.map(line => `
    <li>
      <span>${line.quantity}× ${escapeHtml(line.name)}</span>
      <span>${line.total === null ? t('Quote', 'Cotizar') : money(line.total)}</span>
    </li>`).join('');

  return `
    <div class="as-cart-summary" data-as-cart-summary>
      <p class="as-cart-title">${t('Quote summary', 'Resumen de cotización')}</p>
      <ul>${lines}</ul>
      <p class="as-cart-total">${t('Estimated total', 'Total estimado')}: ${money(details.total)} USD${details.missingPrice ? ' +' : ''}</p>
    </div>`;
}

function renderWhatsAppButton(): string {
  return `
    <a href="${checkoutUrl()}" target="_blank" rel="noopener noreferrer" class="as-wa-btn">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 012.41 5.83c0 4.54-3.69 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.83-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>
      ${t('Request on WhatsApp', 'Pedir por WhatsApp')}
    </a>`;
}

function renderBotMessage(message: ChatMessage): string {
  const { text, cards, showCart, showWhatsApp } = parseActions(message.text);
  const cardsHtml = cards.map(renderCard).filter(Boolean).join('');
  const chips = message.chips.length > 0
    ? `<div class="mt-2 flex flex-wrap gap-1.5">${message.chips.map(chip =>
      `<button type="button" data-as-chip="${escapeHtml(chip)}" class="flex min-h-[44px] flex-shrink-0 items-center whitespace-nowrap rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-300 transition-colors hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">${escapeHtml(chip)}</button>`
    ).join('')}</div>`
    : '';

  return `
    <div class="as-msg-in max-w-[88%] rounded-2xl rounded-tl-md border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-[12px] leading-relaxed text-slate-200">
      <p class="as-msg-text">${formatText(text)}</p>
      ${cardsHtml ? `<div class="mt-2 space-y-2">${cardsHtml}</div>` : ''}
      ${showCart ? renderCartSummary() : ''}
      ${showWhatsApp ? renderWhatsAppButton() : ''}
      ${chips}
    </div>`;
}

function renderUserMessage(message: ChatMessage): string {
  return `
    <div class="as-msg-in max-w-[88%] rounded-2xl rounded-tr-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5 text-[12px] leading-relaxed text-cyan-50">
      ${formatText(message.text)}
    </div>`;
}

function renderMessage(message: ChatMessage): string {
  return `
    <div class="flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}">
      ${message.role === 'user' ? renderUserMessage(message) : renderBotMessage(message)}
    </div>`;
}

function renderPanelChrome(): string {
  return `
    <header class="as-header flex flex-shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900/60 px-3 py-2.5">
      <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-950">
        ${renderAvatar()}
      </span>
      <div class="min-w-0 flex-1">
        <p class="font-mono text-[11px] font-bold uppercase tracking-widest text-cyan-400">G-OPERATOR</p>
        <p class="mt-0.5 flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span class="relative flex h-1.5 w-1.5">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          </span>
          <span data-as-status>${t(ONLINE_STATUS.en, ONLINE_STATUS.es)}</span>
        </p>
      </div>
      <button type="button" data-as-close aria-label="${t('Close chat', 'Cerrar chat')}" class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>

    <div data-as-messages role="log" aria-live="polite" aria-relevant="additions" class="concierge-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"><div data-as-thread class="flex min-h-full flex-col justify-end gap-3"></div></div>

    <form data-as-form class="flex flex-shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-900/60 px-3 py-2.5">
      <input id="concierge-input" type="text" autocomplete="off" maxlength="500" aria-label="${t('Message', 'Mensaje')}" placeholder="${t('Ask me about any radio, accessory or compatibility…', 'Pregúntame sobre cualquier radio, accesorio o compatibilidad…')}" class="h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40">
      <button type="submit" aria-label="${t('Send message', 'Enviar mensaje')}" class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 transition-colors hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-40">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      </button>
    </form>`;
}

export function initTacticalConcierge(): void {
  if (document.getElementById('tactical-concierge-root')) return;

  const root = document.createElement('div');
  root.id = 'tactical-concierge-root';
  root.innerHTML = `${renderLauncher()}<div id="tactical-concierge-panel" role="dialog" aria-label="${t('G-Operator chat', 'Chat de G-Operator')}" aria-hidden="true" tabindex="-1" class="${PANEL_CLASS}"></div>`;
  document.body.appendChild(root);

  const launcher = root.querySelector<HTMLButtonElement>('#tactical-concierge-launcher');
  const panel = root.querySelector<HTMLElement>('#tactical-concierge-panel');
  if (!launcher || !panel) return;

  let messages: ChatMessage[] = [greeting()];
  let isOpen = false;
  let isTyping = false;

  const messagesEl = (): HTMLElement | null => panel.querySelector<HTMLElement>('[data-as-messages]');
  const threadEl = (): HTMLElement | null => panel.querySelector<HTMLElement>('[data-as-thread]');
  const inputEl = (): HTMLInputElement | null => panel.querySelector<HTMLInputElement>('#concierge-input');
  const statusEl = (): HTMLElement | null => panel.querySelector<HTMLElement>('[data-as-status]');

  const scrollToBottom = (): void => {
    const list = messagesEl();
    if (list) list.scrollTop = list.scrollHeight;
  };

  const setStatus = (text: string): void => {
    const status = statusEl();
    if (status) status.textContent = text;
  };

  const syncLauncher = (): void => {
    launcher.setAttribute('aria-label', t('Open G-Operator chat', 'Abrir chat de G-Operator'));
    const tooltip = launcher.querySelector<HTMLElement>('[data-as-tooltip]');
    if (tooltip) tooltip.textContent = t('G-OPERATOR | Tactical Advisor', 'G-OPERATOR | Asesor Táctico');
  };

  const renderMessages = (): void => {
    const thread = threadEl();
    if (!thread) return;
    thread.innerHTML = messages.map(renderMessage).join('');
    scrollToBottom();
  };

  const appendMessage = (message: ChatMessage): void => {
    const thread = threadEl();
    if (!thread) return;
    thread.insertAdjacentHTML('beforeend', renderMessage(message));
    scrollToBottom();
  };

  const showTyping = (): HTMLElement | null => {
    const thread = threadEl();
    if (!thread) return null;
    thread.insertAdjacentHTML('beforeend', `
      <div class="flex justify-start" data-as-typing>
        <div class="rounded-2xl rounded-tl-md border border-slate-800 bg-slate-900/90 px-3 py-3">
          <span class="as-typing"><span></span><span></span><span></span></span>
        </div>
      </div>`);
    scrollToBottom();
    return thread.querySelector<HTMLElement>('[data-as-typing]');
  };

  const hop = (): void => {
    const target = isOpen ? panel.querySelector<HTMLElement>('.as-header') : launcher;
    if (!target) return;
    target.classList.remove('hop');
    void target.offsetWidth;
    target.classList.add('hop');
    window.setTimeout(() => target.classList.remove('hop'), 760);
  };

  const flyToAssistant = (source: HTMLElement): void => {
    const target = isOpen ? panel.querySelector<SVGSVGElement>('.as-svg') : launcher;
    if (!target) return;

    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'as-flying-ghost';
    const image = source.querySelector<HTMLImageElement>('.as-card-thumb')?.src ?? '';
    ghost.innerHTML = image ? `<img src="${escapeHtml(image)}" alt="">` : '';
    ghost.style.left = `${from.left + from.width / 2 - 19}px`;
    ghost.style.top = `${from.top + from.height / 2 - 19}px`;
    document.body.appendChild(ghost);

    requestAnimationFrame(() => {
      const deltaX = to.left + to.width / 2 - (from.left + from.width / 2);
      const deltaY = to.top + to.height / 2 - (from.top + from.height / 2);
      ghost.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
      ghost.style.opacity = '0.15';
    });

    window.setTimeout(() => {
      ghost.remove();
      hop();
    }, 660);
  };

  const pushUser = (text: string): void => {
    const message: ChatMessage = { role: 'user', text, chips: [] };
    messages.push(message);
    appendMessage(message);
  };

  const handleUserText = (raw: string): void => {
    const text = raw.trim().slice(0, 500);
    if (!text || isTyping) return;

    void ingestSitePages();

    const input = inputEl();
    if (input) input.value = '';

    pushUser(text);

    const reply = answer(text);
    isTyping = true;
    setStatus(t(TYPING_STATUS.en, TYPING_STATUS.es));

    const typing = showTyping();
    const delay = Math.min(1200, Math.max(450, reply.text.length * 6));

    window.setTimeout(() => {
      typing?.remove();
      isTyping = false;
      setStatus(t(ONLINE_STATUS.en, ONLINE_STATUS.es));

      const message: ChatMessage = { role: 'bot', text: reply.text, chips: reply.chips ?? [] };
      messages.push(message);
      appendMessage(message);
      inputEl()?.focus();
    }, delay);
  };

  const renderChrome = (): void => {
    panel.innerHTML = renderPanelChrome();
    syncLauncher();
    renderMessages();
  };

  const open = (): void => {
    void ingestSitePages();
    isOpen = true;
    panel.classList.remove('hidden');
    panel.classList.add('animate-tactical-spring');
    panel.setAttribute('aria-hidden', 'false');
    launcher.classList.add('hidden');
    launcher.setAttribute('aria-expanded', 'true');
    inputEl()?.focus();
    scrollToBottom();
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

  renderChrome();

  launcher.addEventListener('click', () => {
    if (isOpen) close();
    else open();
  });

  root.addEventListener('submit', event => {
    if (!(event.target as HTMLElement).matches('[data-as-form]')) return;
    event.preventDefault();
    const input = inputEl();
    if (input) handleUserText(input.value);
  });

  root.addEventListener('click', event => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-as-close]')) {
      close();
      return;
    }

    const chip = target.closest<HTMLElement>('[data-as-chip]');
    if (chip?.dataset.asChip) {
      handleUserText(chip.dataset.asChip);
      return;
    }

    const addButton = target.closest<HTMLButtonElement>('[data-as-add]');
    if (addButton?.dataset.asAdd) {
      if (addById(addButton.dataset.asAdd)) {
        addButton.classList.add('added');
        addButton.textContent = t('✓ Added', '✓ Añadido');
        flyToAssistant(addButton);
      }
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen) close();
  });

  onLanguageChange(() => {
    if (!panel.isConnected) return;
    if (messages.length === 1 && messages[0].role === 'bot') {
      messages = [greeting()];
    }
    renderChrome();
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pointerFrame = 0;
    window.addEventListener('pointermove', event => {
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        root.querySelectorAll<SVGSVGElement>('.as-svg').forEach(svg => {
          const rect = svg.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height * 0.55;
          const dx = event.clientX - centerX;
          const dy = event.clientY - centerY;
          const distance = Math.hypot(dx, dy) || 1;
          const offset = Math.min(1, distance / 240) * 1.4;
          const x = (dx / distance) * offset;
          const y = (dy / distance) * offset;

          svg.querySelectorAll<SVGElement>('.as-pupil').forEach(pupil => {
            pupil.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
          });
        });
      });
    }, { passive: true });
  }

  subscribeCart(() => {
    root.querySelectorAll<HTMLElement>('[data-as-cart-summary]').forEach(element => {
      element.outerHTML = renderCartSummary();
    });
    root.querySelectorAll<HTMLAnchorElement>('.as-wa-btn').forEach(link => {
      link.href = checkoutUrl();
    });
  });



  (window as any).AssistantApi = {
    openChat: open,
    closeChat: close,
    addToCart: (id: string) => addById(id),
    send: (text: string) => handleUserText(text),
    debug: {
      testBudget: (amount: number) => handleUserText(t(`I have $${amount}`, `Tengo $${amount}`)),
      triggerHop: hop,
      clearSessionLimits: () => {
        sessionStorage.removeItem('as_idle_shown');
        sessionStorage.removeItem('as_upsell_shown');
      }
    }
  };
}
