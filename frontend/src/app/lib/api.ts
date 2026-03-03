// lib/api.ts
export async function apiFetch(url: string, method = 'GET', body?: any) {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
