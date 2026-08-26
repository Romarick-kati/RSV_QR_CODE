export const CATEGORIES = [
  'Technology', 'Academic', 'Corporate', 'Workshop', 'Seminar', 'Career', 'Cultural',
];

export const EVENT_GRADIENTS = {
  Technology: 'from-[#1c2b6b] via-[#2c3e8f] to-[#22D3A6]',
  Academic: 'from-[#2c1f5e] via-[#4a2e8c] to-[#8B7CF6]',
  Corporate: 'from-[#1a2340] via-[#233158] to-[#F5A623]',
  Workshop: 'from-[#3a1730] via-[#5c1f3f] to-[#FF5C77]',
  Seminar: 'from-[#152a2e] via-[#1c3f42] to-[#22D3A6]',
  Career: 'from-[#2a1c3d] via-[#3d2757] to-[#8B7CF6]',
  Cultural: 'from-[#3d1c1c] via-[#5c2a1f] to-[#F5A623]',
};

// Real photography, one stable seed per category, from Lorem Picsum — a
// free, no-key, no-rate-limit photo service, so these links keep working
// wherever this project is deployed. Swap any of these for your own event
// photos later by just changing the URL; nothing else needs to change.
export const EVENT_PHOTOS = {
  Technology: 'https://picsum.photos/seed/presence-technology/900/600',
  Academic: 'https://picsum.photos/seed/presence-academic/900/600',
  Corporate: 'https://picsum.photos/seed/presence-corporate/900/600',
  Workshop: 'https://picsum.photos/seed/presence-workshop/900/600',
  Seminar: 'https://picsum.photos/seed/presence-seminar/900/600',
  Career: 'https://picsum.photos/seed/presence-career/900/600',
  Cultural: 'https://picsum.photos/seed/presence-cultural/900/600',
};

// Semi-transparent category tint painted over each photo so the category
// label and title stay readable regardless of the photo underneath.
export const EVENT_TINTS = {
  Technology: 'linear-gradient(160deg, rgba(28,43,107,0.75), rgba(34,211,166,0.55))',
  Academic: 'linear-gradient(160deg, rgba(44,31,94,0.75), rgba(139,124,246,0.55))',
  Corporate: 'linear-gradient(160deg, rgba(26,35,64,0.78), rgba(245,166,35,0.5))',
  Workshop: 'linear-gradient(160deg, rgba(58,23,48,0.78), rgba(255,92,119,0.5))',
  Seminar: 'linear-gradient(160deg, rgba(21,42,46,0.78), rgba(34,211,166,0.5))',
  Career: 'linear-gradient(160deg, rgba(42,28,61,0.78), rgba(139,124,246,0.5))',
  Cultural: 'linear-gradient(160deg, rgba(61,28,28,0.78), rgba(245,166,35,0.5))',
};

export const ICON_BY_CATEGORY = {
  Technology: 'Cpu', Academic: 'GraduationCap', Corporate: 'Briefcase',
  Workshop: 'Wrench', Seminar: 'Presentation', Career: 'Target', Cultural: 'Palette',
};
