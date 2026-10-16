
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '30s', target: 20 },
    { duration: '30s', target: 40 },
    { duration: '30s', target: 60 },
    { duration: '30s', target: 0 }
  ]
};

export default function () {
  const respuesta = http.get('http://127.0.0.1:3000/api/courses');

  check(respuesta, {
    'Respuesta HTTP 200': (r) => r.status === 200
  });

  sleep(1);
}
