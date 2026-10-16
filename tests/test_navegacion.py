from playwright.sync_api import expect


def test_CF01_visualizar_inicio(aula):
    expect(
        aula.page.locator("#view-inicio")
    ).to_be_visible()

    expect(
        aula.page.locator("#view-inicio h1")
    ).to_contain_text("¡Hola, María!")

    expect(
        aula.page.locator("#dashboard-courses .course-row")
    ).to_have_count(4)


def test_CF02_acceder_cursos(aula):
    aula.navegar("cursos")

    expect(
        aula.page.locator("#view-cursos h1")
    ).to_have_text("Mis cursos")

    expect(
        aula.page.locator("#all-courses .course-tile")
    ).to_have_count(4)


def test_CF03_acceder_calificaciones(aula):
    aula.navegar("notas")

    expect(
        aula.page.locator("#view-notas h1")
    ).to_have_text("Mis calificaciones")

    expect(
        aula.page.locator("#grades-body tr")
    ).to_have_count(4)


def test_CF04_acceder_mensajes(aula):
    aula.navegar("mensajes")

    expect(
        aula.page.locator("#view-mensajes h1")
    ).to_have_text("Mensajes")

    expect(
        aula.page.locator("#view-mensajes [data-open-message]")
    ).to_be_visible()


def test_CF05_acceder_perfil(aula):
    aula.navegar("perfil")

    expect(
        aula.page.locator("#view-perfil h1")
    ).to_have_text("Mi perfil")

    expect(
        aula.page.locator("#profile-name")
    ).to_be_visible()