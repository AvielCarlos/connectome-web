export const AURA_CONTACT_EMAIL = 'aura.ai.intelligence@gmail.com';

export function auraMailto(subject: string, body?: string) {
  const params = new URLSearchParams({ subject });
  if (body) params.set('body', body);
  return `mailto:${AURA_CONTACT_EMAIL}?${params.toString()}`;
}
