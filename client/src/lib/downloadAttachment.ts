const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

let tokenGetter: () => string | null = () => null;
export function setDownloadTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

/** Downloads via fetch (not a plain <a href>) so the auth bearer token reaches the protected endpoint. */
export async function downloadAttachment(id: string, filename: string) {
  const token = tokenGetter();
  const res = await fetch(`${API_URL}/attachments/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
