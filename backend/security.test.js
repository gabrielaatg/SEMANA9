const test = require("node:test");
const assert = require("node:assert/strict");
const net = require("node:net");
const { createServer } = require("./server");

// Envía una petición HTTP "cruda" por socket para poder mandar objetivos (request
// targets) y cabeceras malformadas que fetch() normalizaría o rechazaría.
function rawRequest(port, rawText, { timeout = 1500 } = {}) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => socket.write(rawText));
    let data = "";
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("timeout: el servidor no respondió (posible caída del proceso)."));
    }, timeout);
    socket.on("data", (chunk) => (data += chunk));
    socket.on("close", () => {
      clearTimeout(timer);
      const statusLine = data.split("\r\n")[0] || "";
      const status = Number(statusLine.split(" ")[1]) || 0;
      const body = data.split("\r\n\r\n").slice(1).join("\r\n\r\n");
      resolve({ status, statusLine, headers: data.split("\r\n\r\n")[0], body });
    });
    socket.on("error", reject);
  });
}

test("10 casos de seguridad del aula virtual", async (suite) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  suite.after(() => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));

  // Caso 1 — Acceso a archivos fuera de app/
  await suite.test("1. rechaza el traversal y no revela archivos del backend", async () => {
    for (const target of ["/..%2Fbackend%2Fserver.js", "/..%2F..%2Fpackage.json", "/%2e%2e%2fbackend%2fserver.js"]) {
      const response = await fetch(`${baseUrl}${target}`);
      assert.ok([403, 404].includes(response.status), `${target} debería ser 403/404, fue ${response.status}`);
      const text = await response.text();
      assert.doesNotMatch(text, /createServer|require\(/, `no debe filtrar el contenido de server.js (${target})`);
    }
  });

  // Caso 2 — Codificación inválida en rutas
  await suite.test("2. responde error controlado ante percent-encoding malformado", async () => {
    for (const target of ["/%", "/%E0%A4%A", "/%zz"]) {
      const response = await fetch(`${baseUrl}${target}`);
      assert.equal(response.status, 400, `${target} debería ser 400`);
      const payload = await response.json();
      assert.ok(typeof payload.error === "string" && payload.error.length > 0);
      assert.doesNotMatch(payload.error, /\bat \/|node:|Error:|\.js:\d+/, "no debe exponer trazas internas");
    }
  });

  // Caso 3 — JSON malformado
  await suite.test("3. rechaza JSON inválido sin insertar mensajes ni caer", async () => {
    const before = (await (await fetch(`${baseUrl}/api/messages`)).json()).messages.length;
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ esto no es json",
    });
    assert.equal(response.status, 400);
    const after = (await (await fetch(`${baseUrl}/api/messages`)).json()).messages.length;
    assert.equal(after, before, "no debe insertarse ningún mensaje");
  });

  // Caso 4 — Cuerpo mayor al límite (16 KiB)
  await suite.test("4. rechaza cuerpos mayores a 16 KiB con 413 y sigue disponible", async () => {
    const oversized = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: "calc-201", subject: "Asunto", body: "x".repeat(17 * 1024) }),
    });
    assert.equal(oversized.status, 413);
    const alive = await fetch(`${baseUrl}/api/courses`);
    assert.equal(alive.status, 200, "el servidor debe seguir atendiendo tras un cuerpo grande");
  });

  // Caso 5 — Validación de campos
  await suite.test("5. valida curso, asunto y mensaje con 400", async () => {
    const casos = [
      { courseId: "inexistente", subject: "Asunto válido", body: "Mensaje válido" }, // curso inexistente
      { courseId: "calc-201", subject: "ab", body: "Mensaje válido" }, // asunto corto
      { courseId: "calc-201", subject: "a".repeat(101), body: "Mensaje válido" }, // asunto largo
      { courseId: "calc-201", subject: "Asunto válido", body: "no" }, // mensaje corto
      { courseId: "calc-201", subject: "Asunto válido", body: "a".repeat(1001) }, // mensaje largo
    ];
    for (const payload of casos) {
      const response = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      assert.equal(response.status, 400, `payload inválido debería dar 400: ${JSON.stringify(payload).slice(0, 40)}`);
    }
  });

  // Caso 6 — Inyección de contenido en mensajes
  await suite.test("6. almacena el contenido como texto, sin interpretarlo", async () => {
    const malicioso = '<script>alert(1)</script><img src=x onerror=alert(2)>';
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: "calc-201", subject: "Asunto con <b>", body: `Cuerpo ${malicioso}` }),
    });
    assert.equal(response.status, 201);
    const { message } = await response.json();
    // Se guarda tal cual (como texto). El frontend escapa con escapeHtml al renderizar.
    assert.ok(message.body.includes(malicioso), "el contenido debe conservarse literal como dato");
    // La API responde JSON, no HTML: el navegador no lo interpreta como marcado.
    const listResponse = await fetch(`${baseUrl}/api/messages`);
    assert.match(listResponse.headers.get("content-type"), /application\/json/);
  });

  // Caso 7 — Métodos y rutas no permitidos
  await suite.test("7. métodos/rutas no contemplados devuelven error controlado", async () => {
    for (const method of ["PUT", "DELETE", "PATCH", "OPTIONS"]) {
      const response = await fetch(`${baseUrl}/api/messages`, { method });
      assert.equal(response.status, 404, `${method} debería ser 404`);
      const payload = await response.json();
      assert.ok(payload.error && !/node:|\.js:\d+|at \//.test(payload.error), "sin detalles internos");
    }
    const unknown = await fetch(`${baseUrl}/api/inexistente`);
    assert.equal(unknown.status, 404);
  });

  // Caso 8 — Cabeceras de seguridad
  await suite.test("8. entrega cabeceras de seguridad en las respuestas", async () => {
    const page = await fetch(baseUrl);
    assert.equal(page.headers.get("x-frame-options"), "DENY");
    assert.equal(page.headers.get("x-content-type-options"), "nosniff");
    assert.ok(page.headers.get("content-security-policy"), "debe incluir CSP");
    assert.ok(page.headers.get("referrer-policy"), "debe incluir Referrer-Policy");

    const api = await fetch(`${baseUrl}/api/courses`);
    assert.equal(api.headers.get("x-content-type-options"), "nosniff");
    assert.equal(api.headers.get("cache-control"), "no-store");
  });

  // Caso 9 — Acceso y exposición de datos
  await suite.test("9. documenta que perfil, cursos y mensajes son públicos (demo)", async () => {
    // En esta demo los datos son públicos a propósito: una solicitud anónima los obtiene.
    // Esta prueba fija el comportamiento ACTUAL; si el negocio exige autenticación,
    // debería cambiarse a esperar 401/403 para peticiones anónimas.
    const [student, courses, messages] = await Promise.all([
      fetch(`${baseUrl}/api/student`),
      fetch(`${baseUrl}/api/courses`),
      fetch(`${baseUrl}/api/messages`),
    ]);
    assert.equal(student.status, 200);
    assert.equal(courses.status, 200);
    assert.equal(messages.status, 200);
  });

  // Caso 10 — Abuso repetido de solicitudes (disponibilidad)
  await suite.test("10. soporta muchas solicitudes seguidas sin degradarse (no hay rate limiting)", async () => {
    // El servidor NO implementa rate limiting; esta prueba mide disponibilidad bajo ráfaga.
    const ráfaga = await Promise.all(
      Array.from({ length: 150 }, () => fetch(`${baseUrl}/api/courses`).then((r) => r.status)),
    );
    assert.ok(ráfaga.every((status) => status === 200), "todas las respuestas deben ser 200 bajo ráfaga");
  });

  // Caso 10bis — Robustez ante entradas malformadas que hoy tumban el proceso.
  // Estas dos pruebas DOCUMENTAN FALLOS REALES y quedarán en ROJO hasta aplicar el parche.
  await suite.test("10bis-a. una ruta con byte nulo (%00) no debe tumbar el servidor", async () => {
    const response = await rawRequest(port, "GET /app.js%00.html HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n");
    assert.ok(response.status >= 400 && response.status < 500, `debería ser error 4xx controlado, fue ${response.status}`);
    const alive = await fetch(`${baseUrl}/api/courses`);
    assert.equal(alive.status, 200, "el servidor debe seguir vivo tras un byte nulo en la ruta");
  });

  await suite.test("10bis-b. un objetivo/Host malformado no debe tumbar el servidor", async () => {
    const response = await rawRequest(port, "GET http://[/ HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n");
    assert.ok(response.status >= 400 && response.status < 500, `debería ser error 4xx controlado, fue ${response.status}`);
    const alive = await fetch(`${baseUrl}/api/courses`);
    assert.equal(alive.status, 200, "el servidor debe seguir vivo tras un objetivo malformado");
  });
});
