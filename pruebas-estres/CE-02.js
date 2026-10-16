
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '1s', target: 80 },
    { duration: '30s', target: 80 },
    { duration: '1s', target: 5 },
    { duration: '30s', target: 5 },
    { duration: '10s', target: 0 }
  ]
};

const BASE_URL = 'http://127.0.0.1:3000';

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
