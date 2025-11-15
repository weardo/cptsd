// Pet Library - Calming, supportive pets with messages

export type PetType = 'cat' | 'dog' | 'bird' | 'rabbit' | 'butterfly' | 'leaf';

export interface PetConfig {
  name: string;
  svg: string;
  styles: React.CSSProperties;
  messages: string[]; // Fallback messages if DB is empty
}

const petConfigs: Record<PetType, PetConfig> = {
  cat: {
    name: 'Calm Cat',
    svg: `
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="25" fill="#d4a5c7" opacity="0.8"/>
        <circle cx="22" cy="25" r="3" fill="#2d3436"/>
        <circle cx="38" cy="25" r="3" fill="#2d3436"/>
        <path d="M 25 35 Q 30 40 35 35" stroke="#2d3436" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 15 20 L 10 15 M 45 20 L 50 15" stroke="#d4a5c7" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `,
    styles: {
      animation: 'float 6s ease-in-out infinite',
    },
    messages: [
      'You are not broken.',
      'Your feelings are valid.',
      'Healing is not linear.',
      'You deserve kindness.',
      'Your trauma is not your fault.',
      'It\'s okay to not be okay.',
      'You survived. That matters.',
    ],
  },
  dog: {
    name: 'Gentle Dog',
    svg: `
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="25" fill="#a8d5ba" opacity="0.8"/>
        <circle cx="22" cy="25" r="3" fill="#2d3436"/>
        <circle cx="38" cy="25" r="3" fill="#2d3436"/>
        <ellipse cx="30" cy="35" rx="8" ry="6" fill="#2d3436"/>
        <path d="M 20 20 Q 15 15 10 20 M 40 20 Q 45 15 50 20" stroke="#a8d5ba" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `,
    styles: {
      animation: 'float 7s ease-in-out infinite',
    },
    messages: [
      'You are enough, just as you are.',
      'It\'s okay to rest.',
      'Your trauma is not your fault.',
      'Small steps still count.',
      'You don\'t have to earn your right to exist.',
      'Your pain is real, even if others don\'t see it.',
      'Recovery is possible.',
    ],
  },
  bird: {
    name: 'Peaceful Bird',
    svg: `
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="25" cy="30" rx="15" ry="12" fill="#b8c5d6" opacity="0.8"/>
        <circle cx="20" cy="28" r="3" fill="#2d3436"/>
        <path d="M 35 30 L 45 25 L 50 30 L 45 35 Z" fill="#b8c5d6" opacity="0.8"/>
        <path d="M 15 25 Q 10 20 5 25" stroke="#b8c5d6" stroke-width="2" fill="none"/>
      </svg>
    `,
    styles: {
      animation: 'float 5s ease-in-out infinite',
    },
    messages: [
      'You survived. That matters.',
      'Your story is valid.',
      'Healing takes time.',
      'You are not alone.',
      'What happened to you was not your choice.',
      'You are more than your trauma.',
      'Your existence is resistance.',
    ],
  },
  rabbit: {
    name: 'Soft Rabbit',
    svg: `
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="35" rx="18" ry="20" fill="#e8d4c1" opacity="0.8"/>
        <ellipse cx="30" cy="20" rx="12" ry="15" fill="#e8d4c1" opacity="0.8"/>
        <circle cx="25" cy="22" r="2" fill="#2d3436"/>
        <circle cx="35" cy="22" r="2" fill="#2d3436"/>
        <ellipse cx="30" cy="28" rx="4" ry="3" fill="#2d3436"/>
        <path d="M 25 15 L 22 8 M 35 15 L 38 8" stroke="#e8d4c1" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `,
    styles: {
      animation: 'float 8s ease-in-out infinite',
    },
    messages: [
      'You don\'t have to be perfect.',
      'Rest is productive.',
      'Your needs matter.',
      'It\'s okay to ask for help.',
      'You are allowed to set boundaries.',
      'Your body kept you safe. Thank it.',
      'You are worthy of love and care.',
    ],
  },
  butterfly: {
    name: 'Gentle Butterfly',
    svg: `
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="30" rx="8" ry="15" fill="#d4c5e8" opacity="0.7" transform="rotate(-20 20 30)"/>
        <ellipse cx="40" cy="30" rx="8" ry="15" fill="#d4c5e8" opacity="0.7" transform="rotate(20 40 30)"/>
        <ellipse cx="20" cy="30" rx="6" ry="12" fill="#c5b5d8" opacity="0.8" transform="rotate(-20 20 30)"/>
        <ellipse cx="40" cy="30" rx="6" ry="12" fill="#c5b5d8" opacity="0.8" transform="rotate(20 40 30)"/>
        <ellipse cx="30" cy="30" rx="3" ry="8" fill="#b8a5c7"/>
        <circle cx="30" cy="25" r="2" fill="#2d3436"/>
      </svg>
    `,
    styles: {
      animation: 'float 4s ease-in-out infinite',
    },
    messages: [
      'Transformation is possible.',
      'You are stronger than you know.',
      'Growth happens in small moments.',
      'You are worthy of peace.',
      'You can learn to trust again.',
      'Your future is not determined by your past.',
      'You are becoming who you were meant to be.',
    ],
  },
  leaf: {
    name: 'Calming Leaf',
    svg: `
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M 30 10 Q 15 20 20 35 Q 25 45 30 50 Q 35 45 40 35 Q 45 20 30 10 Z" fill="#a8c5a5" opacity="0.7"/>
        <path d="M 30 10 L 30 50" stroke="#8fb38d" stroke-width="2" stroke-linecap="round"/>
        <path d="M 30 20 Q 25 25 25 30 M 30 20 Q 35 25 35 30" stroke="#8fb38d" stroke-width="1.5" fill="none"/>
      </svg>
    `,
    styles: {
      animation: 'float 6s ease-in-out infinite',
    },
    messages: [
      'Nature heals. You are part of nature.',
      'Breathe. This moment will pass.',
      'You are allowed to take up space.',
      'Your presence matters.',
      'You are not too much. You are enough.',
      'Your voice deserves to be heard.',
      'You belong here, exactly as you are.',
    ],
  },
};

export function getPetConfig(petType: PetType): PetConfig {
  return petConfigs[petType];
}

export function getAllPetTypes(): PetType[] {
  return Object.keys(petConfigs) as PetType[];
}

export function getRandomPetType(): PetType {
  const types = getAllPetTypes();
  return types[Math.floor(Math.random() * types.length)];
}

