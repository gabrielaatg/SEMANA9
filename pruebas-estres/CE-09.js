
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://127.0.0.1:3000';

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '20s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '20s', target: 100 },
    { duration: '15s', target: 0 }
  ]
};

export default function () {
  const respuestas = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/api/student`],
    ['GET', `${BASE_URL}/api/courses`],
    ['GET', `${BASE_URL}/api/messages`]
  ]);

  check(respuestas[0], {
    'Pagina principal HTTP 200': (r) => r.status === 200
  });

  check(respuestas[1], {
    'Perfil HTTP 200': (r) => r.status === 200
  });

  check(respuestas[2], {
    'Cursos HTTP 200': (r) => r.status === 200
  });

  check(respuestas[3], {
    'Mensajes HTTP 200': (r) => r.status === 200
  });

  sleep(1);
}
