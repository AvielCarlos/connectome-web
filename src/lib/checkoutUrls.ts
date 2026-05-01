const APP_BASENAME = '/connectome-web';

function appPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (window.location.pathname.startsWith(APP_BASENAME)) {
    return `${APP_BASENAME}${normalized}`;
  }
  return normalized;
}

export function checkoutReturnUrl(path: string): string {
  return `${window.location.origin}${appPath(path)}`;
}

export function billingSuccessUrl(tier?: string): string {
  const qs = new URLSearchParams({ checkout: 'success' });
  if (tier) qs.set('tier', tier);
  return checkoutReturnUrl(`/app/billing/success?${qs.toString()}`);
}

export function billingCancelUrl(): string {
  return checkoutReturnUrl('/app/profile?checkout=cancelled');
}
