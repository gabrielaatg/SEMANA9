
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://127.0.0.1:3000';

export const options = {
  vus: 10,
  duration: '30s'
};

export default function () {
  const cercaLimite = JSON.stringify({
    courseId: 'calc-201',
    subject: 'Prueba de cuerpo cercano al limite',
    body: 'A'.repeat(1000),
    metadata: 'B'.repeat(14000)
  });

  const superaLimite = JSON.stringify({
    courseId: 'calc-201',
    subject: 'Prueba de exceso de cuerpo',
    body: 'A'.repeat(1000),
    metadata: 'B'.repeat(17000)
  });

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const respuesta1 = http.post(
    `${BASE_URL}/api/messages`,
    cercaLimite,
    params
  );

  check(respuesta1, {
    'Cuerpo cercano al limite HTTP 201': (r) => r.status === 201
  });

  const respuesta2 = http.post(
    `${BASE_URL}/api/messages`,
    superaLimite,
    {
      ...params,
      responseCallback: http.expectedStatuses(413)
    }
  );

  check(respuesta2, {
    'Cuerpo mayor a 16 KiB rechazado HTTP 413': (r) => r.status === 413
  });

  sleep(2);
}
