const ATTRIBUTION_KEY = 'abc-tutoring-attribution';
const trafficType = new URLSearchParams(window.location.search).get('traffic') === 'simulation'
  ? 'simulated'
  : 'live';

function captureAttribution() {
  const query = new URLSearchParams(window.location.search);
  const next = Object.fromEntries(
    ['utm_source', 'utm_medium', 'utm_campaign']
      .filter((key) => query.has(key))
      .map((key) => [key, query.get(key)]),
  );

  try {
    if (Object.keys(next).length) sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
    return JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || '{}');
  } catch {
    return {};
  }
}

function referralCategory(attribution) {
  if (attribution.utm_source?.toLowerCase() === 'facebook' || document.referrer.includes('facebook.com')) return 'facebook';
  if (attribution.utm_source) return attribution.utm_source.toLowerCase();
  if (document.referrer) return 'referral';
  return 'direct';
}

export function capture(eventName, properties = {}) {
  const attribution = captureAttribution();
  window.posthog?.capture?.(eventName, {
    traffic_type: trafficType,
    referral_category: referralCategory(attribution),
    ...attribution,
    ...properties,
  });
}

export function capturePageView(pageName) {
  capture('site page viewed', { page_name: pageName });
}
