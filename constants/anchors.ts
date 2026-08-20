export const anchorClasses = [
  { id: 'school', label: 'School', icon: '🏫' },
  { id: 'police_station', label: 'Police Station', icon: '🛡️' },
  { id: 'fire_station', label: 'Fire Station', icon: '🚒' },
  { id: 'hospital_urgent_care', label: 'Hospital / Urgent Care', icon: '🏥' },
  { id: 'place_of_worship', label: 'Place of Worship', icon: '🤝' },
] as const;

export type AnchorClass = (typeof anchorClasses)[number]['id'];
export const MAX_ANCHOR_CHOICES = 5;
