from datetime import datetime
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

from tests.pages.aula_page import AulaPage


@pytest.fixture(scope="session")
def navegador():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        yield browser

        browser.close()


@pytest.fixture(scope="session")
def carpeta_evidencias():
    fecha = datetime.now().strftime("%Y%m%d_%H%M%S")

    carpeta = Path("evidencias") / "playwright" / fecha
    carpeta.mkdir(parents=True, exist_ok=True)

    return carpeta


@pytest.fixture
def aula(navegador, carpeta_evidencias, request):
    contexto = navegador.new_context(
        viewport={"width": 1366, "height": 768}
    )

    pagina = contexto.new_page()
    objeto_aula = AulaPage(pagina)

    try:
        objeto_aula.abrir()
        yield objeto_aula
    finally:
        try:
            pagina.screenshot(
                path=str(
                    carpeta_evidencias / f"{request.node.name}.png"
                ),
                full_page=True
            )
        finally:
            contexto.close()