import { db, files, email } from '../lib/db';

export type TattooColor = 'black-grey' | 'colour';

export interface TattooDesign {
  id: string;
  name: string;
  category: string;
  style: string;
  description: string;
  emoji: string;
  colors: TattooColor;
  featured: boolean;
  tags: string[];
  visualStyle: string;
  imageFileId?: string;
}

export const TATTOO_DESIGNS: TattooDesign[] = [
  { id: 'lion-portrait', name: 'Lion Portrait', category: 'Animals', style: 'Realism', description: 'A powerful lion portrait with layered shading and an expressive gaze.', emoji: '🦁', colors: 'black-grey', featured: true, tags: ['lion', 'realism', 'portrait', 'bold'], visualStyle: 'high-contrast black and grey realism' },
  { id: 'wolf-howling', name: 'Wolf Howling', category: 'Animals', style: 'Realism', description: 'A howling wolf framed by atmospheric moonlight and soft texture.', emoji: '🐺', colors: 'black-grey', featured: false, tags: ['wolf', 'moon', 'wildlife'], visualStyle: 'dramatic black and grey wildlife portrait' },
  { id: 'eagle-flight', name: 'Eagle in Flight', category: 'Animals', style: 'Realism', description: 'An eagle captured mid-flight with detailed feathers and movement.', emoji: '🦅', colors: 'black-grey', featured: false, tags: ['eagle', 'bird', 'freedom'], visualStyle: 'dynamic feathered blackwork realism' },
  { id: 'rose-bouquet', name: 'Rose Bouquet', category: 'Floral', style: 'Black & Grey', description: 'A timeless bouquet of roses built with delicate petals and soft shadows.', emoji: '🌹', colors: 'black-grey', featured: true, tags: ['rose', 'flowers', 'bouquet'], visualStyle: 'soft shaded botanical black and grey' },
  { id: 'butterfly-garden', name: 'Butterfly Garden', category: 'Floral', style: 'Colour', description: 'Bright butterflies winding through a detailed garden of flowers.', emoji: '🦋', colors: 'colour', featured: false, tags: ['butterfly', 'colour', 'flowers'], visualStyle: 'fine-line botanical work with jewel-tone colour' },
  { id: 'lotus-mandala', name: 'Lotus Mandala', category: 'Floral', style: 'Mandala', description: 'A balanced lotus mandala designed for calm, symmetry and flow.', emoji: '🪷', colors: 'black-grey', featured: false, tags: ['lotus', 'mandala', 'spiritual'], visualStyle: 'precise symmetrical blackwork' },
  { id: 'dragon-coiling', name: 'Dragon Coiling', category: 'Fantasy', style: 'Japanese', description: 'A serpentine dragon wrapping naturally around the body.', emoji: '🐉', colors: 'black-grey', featured: true, tags: ['dragon', 'fantasy', 'japanese'], visualStyle: 'ornate flowing black and grey fantasy' },
  { id: 'serpent-dagger', name: 'Serpent Wrapped Dagger', category: 'Fantasy', style: 'Blackwork', description: 'A coiled serpent and dagger composition with sharp graphic contrast.', emoji: '🐍', colors: 'black-grey', featured: false, tags: ['serpent', 'dagger', 'dark'], visualStyle: 'bold illustrative blackwork' },
  { id: 'phoenix-rising', name: 'Phoenix Rising', category: 'Fantasy', style: 'Colour', description: 'A fiery phoenix rising through layered feathers and flame.', emoji: '🔥', colors: 'colour', featured: true, tags: ['phoenix', 'flame', 'colour'], visualStyle: 'rich red and gold illustrative colour' },
  { id: 'sugar-skull', name: 'Sugar Skull', category: 'Skulls & Dark', style: 'Colour', description: 'A decorated sugar skull with floral details and ceremonial character.', emoji: '💀', colors: 'colour', featured: false, tags: ['skull', 'day of the dead', 'colour'], visualStyle: 'ornamental high-detail colour piece' },
  { id: 'angel-wings', name: 'Angel Wings Spread', category: 'Skulls & Dark', style: 'Realism', description: 'Textured angel wings shaped for a strong back or shoulder placement.', emoji: '🪽', colors: 'black-grey', featured: true, tags: ['wings', 'angel', 'back'], visualStyle: 'layered feather realism in black and grey' },
  { id: 'grim-reaper', name: 'Grim Reaper', category: 'Skulls & Dark', style: 'Dark Art', description: 'A dark reaper composition with flowing robes and a commanding silhouette.', emoji: '☠️', colors: 'black-grey', featured: false, tags: ['reaper', 'gothic', 'dark art'], visualStyle: 'moody illustrative blackwork' },
  { id: 'fine-line-rose', name: 'Fine-Line Rose', category: 'Fine-Line', style: 'Fine-Line', description: 'A refined single rose using elegant outlines and minimal shading.', emoji: '🥀', colors: 'black-grey', featured: false, tags: ['rose', 'minimal', 'fine line'], visualStyle: 'minimal fine-line botanical' },
  { id: 'mountain-scene', name: 'Fine-Line Mountain Scene', category: 'Fine-Line', style: 'Fine-Line', description: 'A quiet mountain landscape contained in a clean, delicate frame.', emoji: '🏔️', colors: 'black-grey', featured: false, tags: ['mountains', 'landscape', 'nature'], visualStyle: 'delicate landscape linework' },
  { id: 'minimal-wave', name: 'Minimalist Wave', category: 'Fine-Line', style: 'Minimalist', description: 'A clean ocean wave for a subtle, meaningful everyday piece.', emoji: '🌊', colors: 'black-grey', featured: false, tags: ['wave', 'ocean', 'minimal'], visualStyle: 'single-line minimalist mark' },
  { id: 'sacred-geometry', name: 'Sacred Geometry', category: 'Geometric', style: 'Geometric', description: 'Interlocking geometry arranged with precise proportion and balance.', emoji: '✦', colors: 'black-grey', featured: true, tags: ['geometry', 'sacred', 'symmetry'], visualStyle: 'precise dotwork geometry' },
  { id: 'mandala-flower', name: 'Mandala Flower', category: 'Geometric', style: 'Mandala', description: 'A floral mandala with concentric detail and a strong central rhythm.', emoji: '✺', colors: 'black-grey', featured: false, tags: ['mandala', 'flower', 'dotwork'], visualStyle: 'intricate symmetrical dotwork' },
  { id: 'geometric-wolf', name: 'Geometric Wolf', category: 'Geometric', style: 'Geometric', description: 'A wolf portrait rebuilt from sharp planes and structured linework.', emoji: '◈', colors: 'black-grey', featured: false, tags: ['wolf', 'geometry', 'portrait'], visualStyle: 'faceted geometric blackwork' },
  { id: 'polynesian-sleeve', name: 'Polynesian Tribal Sleeve', category: 'Tribal & Blackwork', style: 'Tribal', description: 'A bold sleeve composition inspired by flowing tribal rhythm.', emoji: '◒', colors: 'black-grey', featured: false, tags: ['tribal', 'sleeve', 'polynesian'], visualStyle: 'dense flowing blackwork bands' },
  { id: 'maori-koru', name: 'Maori Koru', category: 'Tribal & Blackwork', style: 'Tribal', description: 'A koru-inspired motif with strong curves and symbolic movement.', emoji: '◌', colors: 'black-grey', featured: false, tags: ['maori', 'koru', 'tribal'], visualStyle: 'bold curved tribal linework' },
  { id: 'blackwork-sunburst', name: 'Blackwork Sunburst', category: 'Tribal & Blackwork', style: 'Blackwork', description: 'A graphic sunburst built from saturated black rays and negative space.', emoji: '☀', colors: 'black-grey', featured: false, tags: ['sun', 'blackwork', 'graphic'], visualStyle: 'high-contrast solid blackwork' },
  { id: 'script-family', name: 'Script “Family”', category: 'Lettering', style: 'Script', description: 'A graceful custom script treatment for a word with personal meaning.', emoji: 'A', colors: 'black-grey', featured: true, tags: ['script', 'family', 'lettering'], visualStyle: 'flowing calligraphic lettering' },
  { id: 'old-english-name', name: 'Old English Name Plate', category: 'Lettering', style: 'Blackletter', description: 'A strong name plate rendered in dramatic Old English lettering.', emoji: '𝕬', colors: 'black-grey', featured: false, tags: ['name', 'old english', 'blackletter'], visualStyle: 'bold blackletter typography' },
  { id: 'arabic-calligraphy', name: 'Arabic Calligraphy', category: 'Lettering', style: 'Calligraphy', description: 'Elegant Arabic-inspired calligraphy arranged as a flowing visual mark.', emoji: 'ع', colors: 'black-grey', featured: false, tags: ['arabic', 'calligraphy', 'script'], visualStyle: 'fluid ornamental calligraphy' },
  { id: 'koi-japanese', name: 'Koi Fish Japanese', category: 'Japanese', style: 'Irezumi', description: 'A koi fish composition with movement, water and traditional energy.', emoji: '🐟', colors: 'colour', featured: true, tags: ['koi', 'japanese', 'water'], visualStyle: 'traditional Japanese colour composition' },
  { id: 'cherry-blossom', name: 'Cherry Blossom Branch', category: 'Japanese', style: 'Japanese', description: 'A branching cherry blossom design with graceful petals and motion.', emoji: '🌸', colors: 'colour', featured: false, tags: ['cherry blossom', 'sakura', 'japanese'], visualStyle: 'soft pink traditional botanical colour' },
  { id: 'oni-mask', name: 'Oni Mask', category: 'Japanese', style: 'Irezumi', description: 'A striking oni mask with expressive features and saturated accents.', emoji: '👹', colors: 'colour', featured: false, tags: ['oni', 'mask', 'japanese'], visualStyle: 'dramatic traditional Japanese colour' },
  { id: 'watercolour-splash', name: 'Watercolour Splash', category: 'Colour Pieces', style: 'Watercolour', description: 'An expressive colour splash layered around a custom central symbol.', emoji: '🎨', colors: 'colour', featured: true, tags: ['watercolour', 'abstract', 'colour'], visualStyle: 'loose translucent colour wash' },
  { id: 'realistic-portrait', name: 'Realistic Portrait', category: 'Animals', style: 'Portrait', description: 'A custom portrait study focused on likeness, light and expression.', emoji: '👤', colors: 'black-grey', featured: false, tags: ['portrait', 'realism', 'custom'], visualStyle: 'detailed portrait shading' },
  { id: 'palm-tree-silhouette', name: 'Palm Tree Silhouette Scene', category: 'Figurative', style: 'Blackwork', description: 'Silhouette figures under a palm tree arranged in a flowing sleeve style.', emoji: '🌴', colors: 'black-grey', featured: true, tags: ['palm tree', 'silhouette', 'sleeve'], visualStyle: 'figurative blackwork scene on skin' },
  { id: 'parent-child-silhouette', name: 'Parent & Child Silhouette', category: 'Figurative', style: 'Blackwork', description: 'A tender parent and child silhouette capturing connection and memory.', emoji: '♡', colors: 'black-grey', featured: true, tags: ['family', 'parent', 'child', 'silhouette'], visualStyle: 'emotive figurative silhouette work' },
  { id: 'sleeve-composition', name: 'Sleeve Composition', category: 'Full Sleeve', style: 'Custom', description: 'A connected sleeve concept designed to flow around the arm.', emoji: '◉', colors: 'black-grey', featured: true, tags: ['sleeve', 'custom', 'arm'], visualStyle: 'layered custom black and grey sleeve' },
  { id: 'snake-skull', name: 'Snake and Skull', category: 'Fantasy', style: 'Dark Art', description: 'A snake winding through a skull composition with dramatic contrast.', emoji: '🐍', colors: 'black-grey', featured: false, tags: ['snake', 'skull', 'dark'], visualStyle: 'dark illustrative realism' },
  { id: 'butterfly-fine-line', name: 'Butterfly Fine-Line', category: 'Fine-Line', style: 'Fine-Line', description: 'A delicate butterfly with clean wings and restrained detailing.', emoji: '🦋', colors: 'black-grey', featured: false, tags: ['butterfly', 'fine line', 'delicate'], visualStyle: 'airy fine-line insect study' },
  { id: 'compass-rose', name: 'Compass Rose', category: 'Geometric', style: 'Linework', description: 'A compass rose representing direction, travel and personal purpose.', emoji: '✥', colors: 'black-grey', featured: false, tags: ['compass', 'travel', 'direction'], visualStyle: 'clean geometric linework' },
  { id: 'tiger-face', name: 'Tiger Face', category: 'Animals', style: 'Colour Realism', description: 'A vivid tiger face with intense eyes and layered colour shading.', emoji: '🐯', colors: 'colour', featured: false, tags: ['tiger', 'realism', 'colour'], visualStyle: 'high-impact colour animal realism' },
  { id: 'scorpion', name: 'Scorpion', category: 'Animals', style: 'Blackwork', description: 'A detailed scorpion rendered with crisp texture and a strong silhouette.', emoji: '🦂', colors: 'black-grey', featured: false, tags: ['scorpion', 'insect', 'blackwork'], visualStyle: 'textured blackwork creature' },
  { id: 'feather-quill', name: 'Feather Quill', category: 'Fine-Line', style: 'Fine-Line', description: 'A feather and quill concept with elegant movement and light shading.', emoji: '🪶', colors: 'black-grey', featured: false, tags: ['feather', 'quill', 'writing'], visualStyle: 'delicate flowing linework' },
  { id: 'cross-wings', name: 'Cross with Wings', category: 'Skulls & Dark', style: 'Blackwork', description: 'A meaningful cross framed by layered wings and tonal depth.', emoji: '✝', colors: 'black-grey', featured: false, tags: ['cross', 'wings', 'faith'], visualStyle: 'bold devotional black and grey' },
  { id: 'crown-lettering', name: 'Crown Lettering', category: 'Lettering', style: 'Custom Lettering', description: 'Custom lettering crowned with a sharp, symbolic ornamental detail.', emoji: '♛', colors: 'black-grey', featured: false, tags: ['crown', 'lettering', 'custom'], visualStyle: 'ornamental bold lettering' }
];

export async function listTattooDesigns(): Promise<TattooDesign[]> {
  const rows = await db.listPublic('tattoo_designs');
  return rows as TattooDesign[];
}

export async function saveTattooDesign(design: Omit<TattooDesign, 'id'>): Promise<TattooDesign> {
  return db.addPublic('tattoo_designs', design) as Promise<TattooDesign>;
}

export async function uploadTattooReference(file: File) {
  return files.upload('tattoo-designs', file);
}

export async function notifyTattooDesignRecipient(to: string, designName: string) {
  await email.send({
    to,
    subject: `New tattoo design: ${designName}`,
    body: `A new tattoo design named ${designName} is ready for review in Callnest.`,
    heading: `New tattoo design: ${designName}`,
    preheader: 'A new design is ready for review.',
    items: [{ label: 'Design', value: designName }],
    brandColor: '#C9A84C',
    footerNote: 'This is a transactional Callnest notification.'
  });
}
