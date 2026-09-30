// Посредник между страницей SSI (GitHub Pages) и GigaChat API.
// Размещается в Yandex Cloud Functions, среда выполнения Node.js 18 или новее, точка входа: index.handler
// Переменные окружения функции:
//   GIGACHAT_AUTH_KEY  — ключ авторизации (Authorization key) из личного кабинета developers.sber.ru
//   ALLOWED_ORIGIN     — адрес страницы, которой разрешено обращаться: https://goxaman2-dot.github.io
//   GIGACHAT_SCOPE     — необязательно, по умолчанию GIGACHAT_API_PERS (физическое лицо)
const https = require('https');
const crypto = require('crypto');

const OAUTH_URL = process.env.OAUTH_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_URL = process.env.API_URL || 'https://gigachat.devices.sberbank.ru/api/v1';
// Сертификаты НУЦ Минцифры с официального сервера Госуслуг: без них соединение со Сбером не будет доверенным
const CA_URLS = ['https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt',
                 'https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt'];

let caCache = null, token = null, tokenExp = 0;

function request(url, { method = 'GET', headers = {}, body = null, ca = null } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers, ca: ca || undefined, timeout: 280000 }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buf: Buffer.concat(chunks) }));
    });
    req.on('timeout', () => req.destroy(new Error('таймаут соединения')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function toPem(buf) {
  const s = buf.toString('latin1');
  if (s.includes('BEGIN CERTIFICATE')) return s;
  const b64 = buf.toString('base64').match(/.{1,64}/g).join('\n');
  return `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----\n`;
}

async function getCA() {
  if (caCache) return caCache;
  if (process.env.EXTRA_CA_PEM) return (caCache = [process.env.EXTRA_CA_PEM]);
  const list = [];
  for (const u of CA_URLS) {
    const r = await request(u);
    if (r.status !== 200) throw new Error('не удалось скачать сертификат Минцифры: ' + u + ' (HTTP ' + r.status + ')');
    list.push(toPem(r.buf));
  }
  return (caCache = [...require('tls').rootCertificates, ...list]);
}

async function getToken() {
  if (token && Date.now() < tokenExp - 60000) return token; // токен живёт 30 минут, обновляем заранее
  const r = await request(OAUTH_URL, {
    method: 'POST', ca: await getCA(),
    headers: { Authorization: 'Basic ' + process.env.GIGACHAT_AUTH_KEY, RqUID: crypto.randomUUID(),
               'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: 'scope=' + (process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS')
  });
  const j = JSON.parse(r.buf.toString('utf8') || '{}');
  if (r.status !== 200 || !j.access_token) throw new Error('Сбер не выдал токен: ' + (j.message || 'HTTP ' + r.status));
  token = j.access_token; tokenExp = j.expires_at || Date.now() + 25 * 60000;
  return token;
}

exports.handler = async (event) => {
  const allowed = process.env.ALLOWED_ORIGIN || 'https://goxaman2-dot.github.io';
  const origin = (event.headers && (event.headers.Origin || event.headers.origin)) || '';
  const cors = { 'Access-Control-Allow-Origin': allowed, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  const reply = (code, obj) => ({ statusCode: code, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) });

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (origin !== allowed) return reply(403, { error: { message: 'запрос не со страницы SSI' } });
  if (!process.env.GIGACHAT_AUTH_KEY) return reply(500, { error: { message: 'в функции не задан GIGACHAT_AUTH_KEY' } });

  try {
    const auth = { Authorization: 'Bearer ' + await getToken(), Accept: 'application/json' };
    if (event.httpMethod === 'GET') { // проверка связи: список доступных моделей
      const r = await request(API_URL + '/models', { headers: auth, ca: await getCA() });
      return reply(r.status, JSON.parse(r.buf.toString('utf8') || '{}'));
    }
    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '{}');
    const q = JSON.parse(raw);
    const body = JSON.stringify({ model: q.model || 'GigaChat-2-Max', messages: q.messages,
                                  temperature: q.temperature ?? 0.1, max_tokens: Math.min(q.max_tokens || 6000, 8000) });
    const r = await request(API_URL + '/chat/completions', {
      method: 'POST', ca: await getCA(), body,
      headers: { ...auth, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    });
    return reply(r.status, JSON.parse(r.buf.toString('utf8') || '{}'));
  } catch (e) {
    return reply(502, { error: { message: 'посредник GigaChat: ' + e.message } });
  }
};
