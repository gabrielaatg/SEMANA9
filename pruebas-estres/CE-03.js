
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://127.0.0.1:3000';

export const options = {
  stages: [
    { duration: '30s', target: 80 },
    { duration: '3m', target: 80 },
    { duration: '30s', target: 0 }
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500']
  }
};

export default function () {
  const rutas = [
    '/',
    '/api/student',
    '/api/courses',
    '/api/messages'
  ];

  const ruta = rutas[Math.floor(Math.random() * rutas.length)];
  const respuesta = http.get(`${BASE_URL}${ruta}`);

  check(respuesta, {
    'Respuesta HTTP 200': (r) => r.status === 200
  });

  sleep(1);
}
