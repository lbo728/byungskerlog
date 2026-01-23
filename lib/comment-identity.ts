const ADJECTIVES = [
  "활기찬",
  "다정한",
  "씩씩한",
  "신나는",
  "재치있는",
  "용감한",
  "따뜻한",
  "멋진",
  "귀여운",
  "똑똑한",
  "유쾌한",
  "상냥한",
  "든든한",
  "빛나는",
  "깜찍한",
  "느긋한",
  "당당한",
  "호기심많은",
  "자유로운",
  "순수한",
];

const ANIMALS = [
  "펭귄",
  "알파카",
  "코뿔소",
  "바다사자",
  "늑대",
  "고래",
  "기린",
  "햄스터",
  "사자",
  "판다",
  "코알라",
  "여우",
  "토끼",
  "강아지",
  "고양이",
  "다람쥐",
  "수달",
  "부엉이",
  "돌고래",
  "라쿤",
];

const AVATARS = [
  "🐧",
  "🦙",
  "🦏",
  "🦭",
  "🐺",
  "🐋",
  "🦒",
  "🐹",
  "🦁",
  "🐼",
  "🐨",
  "🦊",
  "🐰",
  "🐶",
  "🐱",
  "🐿️",
  "🦦",
  "🦉",
  "🐬",
  "🦝",
  "🌸",
  "🌷",
  "🌻",
  "🍀",
  "🌵",
  "🎀",
  "⭐",
  "🌙",
  "🔥",
  "💎",
];

export function getRandomNickname(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective}${animal}`;
}

export function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function getRandomIdentity(): { nickname: string; avatar: string } {
  return {
    nickname: getRandomNickname(),
    avatar: getRandomAvatar(),
  };
}

export function getAllAvatars(): string[] {
  return [...AVATARS];
}

const ANONYMOUS_ID_KEY = "byungskerlog_anonymous_id";
const ANONYMOUS_IDENTITY_KEY = "byungskerlog_anonymous_identity";

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "";

  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!anonymousId) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }
  return anonymousId;
}

export interface AnonymousIdentity {
  nickname: string;
  avatar: string;
}

export function getStoredIdentity(): AnonymousIdentity | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(ANONYMOUS_IDENTITY_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function saveIdentity(identity: AnonymousIdentity): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANONYMOUS_IDENTITY_KEY, JSON.stringify(identity));
}

export function getOrCreateIdentity(): AnonymousIdentity {
  const stored = getStoredIdentity();
  if (stored) return stored;

  const newIdentity = getRandomIdentity();
  saveIdentity(newIdentity);
  return newIdentity;
}
