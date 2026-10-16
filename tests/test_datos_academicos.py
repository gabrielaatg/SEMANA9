from playwright.sync_api import expect


def test_CF06_datos_personales(aula):
    aula.navegar("perfil")

    expect(
        aula.page.locator("#profile-name")
    ).to_have_text("María García López")

    expect(
        aula.page.locator("#profile-code")
    ).to_have_text("202310458")

    expect(
        aula.page.locator("#profile-email")
    ).to_have_text("maria.garcia@universidad.edu")


def test_CF07_nombres_cursos(aula):
    aula.navegar("cursos")

    expect(
        aula.page.locator("#all-courses .course-tile h2")
    ).to_have_text([
        "Cálculo diferencial",
        "Fundamentos de programación",
        "Metodología de investigación",
        "Bases de datos",
    ])


def test_CF08_informacion_curso(aula):
    aula.navegar("cursos")

    tarjeta = aula.page.locator(
        "#all-courses .course-tile"
    ).filter(has_text="Cálculo diferencial")

    expect(tarjeta).to_have_count(1)
    expect(tarjeta).to_contain_text("MAT-201")
    expect(tarjeta).to_contain_text("Dra. Elena Torres")
    expect(tarjeta).to_contain_text("B-204")

    expect(
        tarjeta.locator(".course-tile-meta > div")
        .filter(has_text="Créditos")
        .locator("strong")
    ).to_have_text("4")


def test_CF09_calificaciones_calculo(aula):
    aula.navegar("notas")

    fila = aula.page.locator(
        "#grades-body tr"
    ).filter(has_text="Cálculo diferencial")

    celdas = fila.locator("td")

    expect(celdas.nth(2)).to_have_text("17.0")
    expect(celdas.nth(3)).to_have_text("16.0")
    expect(celdas.nth(4)).to_have_text("18.0")
    expect(celdas.nth(5)).to_have_text("17.2")


def test_CF10_calificacion_pendiente(aula):
    aula.navegar("notas")

    fila = aula.page.locator(
        "#grades-body tr"
    ).filter(has_text="Metodología de investigación")

    expect(
        fila.locator("td").nth(4)
    ).to_have_text("—")