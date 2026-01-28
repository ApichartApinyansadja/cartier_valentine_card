// lib/setUrl.js
function isExternalUrl(url) {
  if (!url) return false;
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  );
}

function joinUrl(a, b) {
  if (!a) return b || '';
  if (!b) return a || '';
  return a.replace(/\/+$/, '') + '/' + b.replace(/^\/+/, '');
}

export function apiFullUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_LINE_LIFF_BASEURL || '';
  const subUrl = process.env.NEXT_PUBLIC_SUB_URL || '';
  return joinUrl(joinUrl(baseUrl, subUrl), path);
}

export function assetPrefixFullUrl(path) {
  if (!path) return '';

  if (isExternalUrl(path)) return path;

  const subUrl = process.env.NEXT_PUBLIC_SUB_URL || '';
  if (subUrl) return joinUrl(subUrl, path);

  return path;
}
