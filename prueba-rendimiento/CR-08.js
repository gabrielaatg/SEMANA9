import http from 'k6/http';
import { check, sleep } from 'k6';
const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const headers = { headers: { 'Content-Type': 'application/json' } };
const courseId = 'calc-201';
function validMessage(size=50) {
  return JSON.stringify({ courseId, subject: `Rendimiento ${__VU}-${__ITER}`, body: 'M'.repeat(size) });
}
function getOk(path) {
  const r = http.get(BASE + path);
  check(r, { [`GET ${path}: HTTP 200`]: x => x.status === 200 });
  return r;
}
function postOk(size=50) {
  const r = http.post(BASE + '/api/messages', validMessage(size), headers);
  check(r, { 'POST /api/messages: HTTP 201': x => x.status === 201 });
  return r;
}
function jsonBody(r) { try { return r.json(); } catch (_) { return null; } }

export const options = { vus:10, iterations:100, thresholds:{http_req_failed:['rate<0.01']} };
export default function () {
  const n=(__ITER%2===0)?5:1000; const r=postOk(n); check(r, {'201 para tamaño válido':x=>x.status===201}); sleep(0.2);
}
