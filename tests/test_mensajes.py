from uuid import uuid4

from playwright.sync_api import expect


def test_CF11_abrir_formulario(aula):
    aula.abrir_formulario()

    expect(aula.curso).to_be_visible()
    expect(aula.asunto).to_be_visible()
    expect(aula.mensaje).to_be_visible()


def test_CF12_cancelar_mensaje(aula):
    cantidad_anterior = aula.cantidad_mensajes()

    aula.abrir_formulario()

    aula.completar_mensaje(
        "calc-201",
        "Consulta cancelada",
        "Este mensaje no debe enviarse."
    )

    aula.page.locator("#cancel-dialog").click()

    expect(aula.dialogo).not_to_be_visible()

    assert aula.cantidad_mensajes() == cantidad_anterior


def test_CF13_cursos_formulario(aula):
    aula.abrir_formulario()

    opciones = aula.curso.locator("option")

    expect(opciones).to_have_count(5)

    expect(opciones).to_have_text([
        "Selecciona un curso",
        "Cálculo diferencial",
        "Fundamentos de programación",
        "Metodología de investigación",
        "Bases de datos",
    ])

    valores = [
        opciones.nth(i).get_attribute("value")
        for i in range(5)
    ]

    assert valores == [
        "",
        "calc-201",
        "prog-105",
        "met-220",
        "bd-210",
    ]
    
def test_CF14_enviar_mensaje_valido(aula):
    # El identificador permite reconocer este envío.
    asunto = f"Consulta de práctica {uuid4().hex[:8]}"
    cuerpo = "Tengo una duda sobre el ejercicio tres."

    aula.abrir_formulario()

    aula.completar_mensaje(
        "calc-201",
        asunto,
        cuerpo
    )

    aula.enviar()

    expect(aula.dialogo).not_to_be_visible()

    mensaje = aula.page.locator(
        "#messages-list .message-entry"
    ).filter(has_text=asunto)

    expect(mensaje).to_have_count(1)
    expect(mensaje).to_contain_text("Dra. Elena Torres")
    expect(mensaje).to_contain_text("Cálculo diferencial")
    expect(mensaje.locator("p")).to_have_text(cuerpo)


def test_CF15_conservar_mensaje_al_recargar(aula):
    asunto = f"Persistencia {uuid4().hex[:8]}"
    cuerpo = "Este mensaje debe continuar al recargar."

    aula.abrir_formulario()

    aula.completar_mensaje(
        "calc-201",
        asunto,
        cuerpo
    )

    aula.enviar()

    expect(aula.dialogo).not_to_be_visible()

    aula.page.reload()

    expect(
        aula.page.locator("#dashboard-courses .course-row")
    ).to_have_count(4)

    aula.navegar("mensajes")

    mensaje = aula.page.locator(
        "#messages-list .message-entry"
    ).filter(has_text=asunto)

    expect(mensaje).to_have_count(1)
    expect(mensaje.locator("p")).to_have_text(cuerpo)


def test_CF16_curso_obligatorio(aula):
    cantidad_anterior = aula.cantidad_mensajes()

    aula.abrir_formulario()

    aula.completar_mensaje(
        "",
        "Consulta",
        "Necesito ayuda con la práctica."
    )

    aula.enviar()

    aula.comprobar_rechazo(
        cantidad_anterior,
        "Completa el curso, el asunto y el mensaje."
    )


def test_CF17_asunto_obligatorio(aula):
    cantidad_anterior = aula.cantidad_mensajes()

    aula.abrir_formulario()

    aula.completar_mensaje(
        "calc-201",
        "",
        "Necesito ayuda con la práctica."
    )

    aula.enviar()

    aula.comprobar_rechazo(
        cantidad_anterior,
        "Completa el curso, el asunto y el mensaje."
    )


def test_CF18_asunto_demasiado_corto(aula):
    cantidad_anterior = aula.cantidad_mensajes()

    aula.abrir_formulario()

    aula.completar_mensaje(
        "calc-201",
        "Ho",
        "Necesito ayuda con la práctica."
    )

    aula.enviar()

    aula.comprobar_rechazo(
        cantidad_anterior,
        "asunto (3–100 caracteres)"
    )


def test_CF19_cuerpo_obligatorio(aula):
    cantidad_anterior = aula.cantidad_mensajes()

    aula.abrir_formulario()

    aula.completar_mensaje(
        "calc-201",
        "Consulta",
        ""
    )

    aula.enviar()

    aula.comprobar_rechazo(
        cantidad_anterior,
        "Completa el curso, el asunto y el mensaje."
    )


def test_CF20_cuerpo_demasiado_corto(aula):
    cantidad_anterior = aula.cantidad_mensajes()

    aula.abrir_formulario()

    aula.completar_mensaje(
        "calc-201",
        "Consulta",
        "Hola"
    )

    aula.enviar()

    aula.comprobar_rechazo(
        cantidad_anterior,
        "mensaje (5–1000 caracteres)"
    )