
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://127.0.0.1:3000';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '20s', target: 40 },
    { duration: '20s', target: 40 },
    { duration: '15s', target: 0 }
  ]
};

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json'
    },
    responseCallback: http.expectedStatuses(200, 400)
  };

  const invalido = JSON.stringify({
    courseId: 'curso-inexistente',
    subject: 'AB',
    body: '123'
  });

  const respuesta1 = http.post(
    `${BASE_URL}/api/messages`,
    invalido,
    params
  );

  check(respuesta1, {
    'Datos invalidos rechazados HTTP 400': (r) => r.status === 400
  });

  const respuesta2 = http.post(
    `${BASE_URL}/api/messages`,
    '{"courseId":',
    params
  );

  check(respuesta2, {
    'JSON malformado rechazado HTTP 400': (r) => r.status === 400
  });

  const respuesta3 = http.get(
    `${BASE_URL}/api/courses`
  );

  check(respuesta3, {
    'Servidor disponible HTTP 200': (r) => r.status === 200
  });

  sleep(1);
}
