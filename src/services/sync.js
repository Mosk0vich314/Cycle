// Peer-to-peer sync via a private GitHub Gist used as a JSON store.
// The user creates a Gist (any visibility) and a Personal Access Token
// with the `gist` scope; both are kept in localStorage and never sent
// anywhere except api.github.com.

const FILE_NAME = 'cycle-sync.json';
const API = 'https://api.github.com';

export const TOKEN_KEY  = 'cute-cycle-sync-token';
export const GIST_KEY   = 'cute-cycle-sync-gist-id';
export const PARTNER_KEY = 'cute-cycle-partner-mode';

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function pushToGist({ token, gistId, payload }) {
  if (!token)  throw new Error('Missing GitHub token');
  if (!gistId) throw new Error('Missing Gist ID');

  const body = {
    files: {
      [FILE_NAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  };

  const res = await fetch(`${API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Push failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

export async function pullFromGist({ token, gistId }) {
  if (!token)  throw new Error('Missing GitHub token');
  if (!gistId) throw new Error('Missing Gist ID');

  const res = await fetch(`${API}/gists/${gistId}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pull failed (${res.status}): ${text || res.statusText}`);
  }

  const gist = await res.json();
  const file = gist.files?.[FILE_NAME];
  if (!file) throw new Error(`No ${FILE_NAME} found in this Gist yet — push first from the primary device.`);

  // GitHub truncates files larger than ~1MB inline; fall back to raw_url if so.
  const raw = file.truncated && file.raw_url
    ? await fetch(file.raw_url).then((r) => r.text())
    : file.content;

  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error('Gist content is not valid JSON');
  }
}
