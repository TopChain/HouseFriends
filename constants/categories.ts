export type ServiceCategory = {
  id: string;
  order: number;
  name: string;
  icon: string;
  regulated: boolean;
};

const names = [
  ['handyman', 'Handyman', '🛠️'],
  ['house-cleaning', 'House Cleaning', '🧹'],
  ['plumber', 'Plumber', '🔧'],
  ['electrician', 'Electrician', '⚡'],
  ['hvac', 'HVAC / AC & Heating', '❄️'],
  ['appliance-repair', 'Appliance Repair', '🔌'],
  ['landscaping', 'Landscaping / Gardener', '🌿'],
  ['pest-control', 'Pest Control', '🐜'],
  ['locksmith', 'Locksmith', '🔐'],
  ['painter', 'Painter', '🖌️'],
  ['garage-door', 'Garage Door', '🚪'],
  ['pool-service', 'Pool Cleaning & Service', '💧'],
  ['drain-sewer', 'Drain / Sewer Cleaning', '🪠'],
  ['carpenter', 'Carpenter / Woodwork', '🪚'],
  ['drywall', 'Drywall / Plaster', '🧱'],
  ['general-contractor', 'General Contractor / Remodel', '🏗️'],
  ['roofing', 'Roofing', '🏠'],
  ['tree-service', 'Tree Service / Arborist', '🌳'],
  ['window-glass', 'Window / Glass / Screen', '🪟'],
  ['flooring', 'Flooring', '▦'],
  ['tile-grout', 'Tile / Grout', '◫'],
  ['irrigation', 'Irrigation / Sprinkler', '🚿'],
  ['fence-gate', 'Fence / Gate Repair', '🚧'],
  ['pressure-washing', 'Pressure Washing / Exterior Cleaning', '🫧'],
  ['gutter-drainage', 'Gutter / Drainage', '🌧️'],
  ['junk-removal', 'Junk Removal', '♻️'],
  ['moving-help', 'Moving / Heavy Item Help', '📦'],
  ['water-mold', 'Water Damage / Mold Remediation', '🧯'],
  ['home-security', 'Home Security / Cameras / Smart Home', '📹'],
  ['solar-ev', 'Solar / Battery / EV Charger', '☀️'],
  ['chimney', 'Chimney / Fireplace', '🔥'],
  ['insulation', 'Insulation / Weatherproofing', '🧤'],
  ['septic', 'Septic Service', '🚰'],
  ['well-pump', 'Well / Water Pump', '⛲'],
  ['other-specialty', 'Other / Specialty Service', '➕'],
] as const;

const regulated = new Set([
  'plumber',
  'electrician',
  'hvac',
  'locksmith',
  'general-contractor',
  'roofing',
  'water-mold',
  'home-security',
  'solar-ev',
  'septic',
  'well-pump',
]);

export const serviceCategories: readonly ServiceCategory[] = names.map(([id, name, icon], index) => ({
  id,
  name,
  icon,
  order: index + 1,
  regulated: regulated.has(id),
}));

export const categoryById = Object.fromEntries(serviceCategories.map((category) => [category.id, category]));
