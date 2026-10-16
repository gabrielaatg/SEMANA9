
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = 'http://127.0.0.1:3000';

const latenciaInicial = new Trend('latencia_inicial', true);
const latenciaEstres = new Trend('latencia_estres', true);
const latenciaRecuperacion = new Trend('latencia_recuperacion', true);

const erroresInicial = new Rate('errores_inicial');
const erroresEstres = new Rate('errores_estres');
const erroresRecuperacion = new Rate('errores_recuperacion');

export const options = {
  scenarios: {
    carga_inicial: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'inicial',
      startTime: '0s'
    },
    estres: {
      executor: 'constant-vus',
      vus: 100,
      duration: '1m',
      exec: 'alta',
      startTime: '30s'
    },
    recuperacion: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'recuperar',
      startTime: '1m30s'
    }
  }
};

function consultar(latencia, errores, fase) {
  const respuesta = http.get(
    `${BASE_URL}/api/courses`,
    { tags: { fase: fase } }
  );

  latencia.add(respuesta.timings.duration);
  errores.add(respuesta.status !== 200);

  check(respuesta, {
    'Respuesta HTTP 200': (r) => r.status === 200
  });

  sleep(1);
}

export function inicial() {
  consultar(latenciaInicial, erroresInicial, 'inicial');
}

export function alta() {
  consultar(latenciaEstres, erroresEstres, 'estres');
}

export function recuperar() {
  consultar(latenciaRecuperacion, erroresRecuperacion, 'recuperacion');
}
