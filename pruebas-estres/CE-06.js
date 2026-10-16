
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://127.0.0.1:3000';

export const options = {
  scenarios: {
    envios_validos: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '10s', target: 30 },
        { duration: '20s', target: 30 },
        { duration: '10s', target: 0 }
      ],
      gracefulRampDown: '5s'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.01']
  }
};

export default function () {
  const datos = JSON.stringify({
    courseId: 'calc-201',
    subject: `Prueba CE06 ${__VU}-${__ITER}`,
    body: 'Mensaje válido enviado durante la prueba de estrés con Grafana k6.'
  });

  const respuesta = http.post(
    `${BASE_URL}/api/messages`,
    datos,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  check(respuesta, {
    'Mensaje creado HTTP 201': (r) => r.status === 201,
    'Respuesta contiene mensaje': (r) => {
      try {
        return Boolean(r.json('message.id'));
      } catch (e) {
        return false;
      }
    }
  });

  sleep(2);
}
