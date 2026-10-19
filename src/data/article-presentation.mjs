// Display-only syndication labels: preserve source titles and publisher wording.
export function displayArticleTitle(title) {
  if (typeof title !== 'string') return '';
  const displayed = title.replace(/^(?:Show|Ask) HN:\s*/i, '');
  return displayed.trim() ? displayed : title;
}

export function articleHostname(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.hostname : '';
  } catch {
    return '';
  }
}
