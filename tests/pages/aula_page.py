from playwright.sync_api import expect


class AulaPage:
    def __init__(self, page):
        self.page = page
        self.dialogo = page.locator("#message-dialog")
        self.curso = page.locator("#message-course")
        self.asunto = page.locator("#message-subject")
        self.mensaje = page.locator("#message-body")
        self.feedback = page.locator("#form-feedback")

    def abrir(self):
        self.page.goto("http://localhost:3000")

        # Esperar a que termine la carga inicial.
        expect(
            self.page.locator("#dashboard-courses .course-row")
        ).to_have_count(4)

    def navegar(self, seccion):
        self.page.locator(
            f'.nav-link[data-view="{seccion}"]'
        ).click()

        expect(
            self.page.locator(f"#view-{seccion}")
        ).to_be_visible()

    def abrir_formulario(self):
        self.navegar("mensajes")

        self.page.locator(
            "#view-mensajes [data-open-message]"
        ).click()

        expect(self.dialogo).to_be_visible()

    def completar_mensaje(self, curso, asunto, cuerpo):
        self.curso.select_option(curso)
        self.asunto.fill(asunto)
        self.mensaje.fill(cuerpo)

    def enviar(self):
        self.page.locator("#send-message").click()

    def cantidad_mensajes(self):
        respuesta = self.page.request.get(
            "http://localhost:3000/api/messages"
        )

        assert respuesta.status == 200
        return len(respuesta.json()["messages"])

    def comprobar_rechazo(self, cantidad_anterior, texto):
        # Esperar a que aparezca el error.
        expect(self.feedback).to_contain_text(texto)

        # El formulario continúa abierto.
        expect(self.dialogo).to_be_visible()

        # El servidor no agregó mensajes.
        assert self.cantidad_mensajes() == cantidad_anterior