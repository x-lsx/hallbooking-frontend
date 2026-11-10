"""Экспорт схемы из соседнего backend без запуска сервера или подключения к БД."""
import json
import sys
from pathlib import Path

frontend = Path(__file__).resolve().parent.parent
backend = frontend.parent / "backend"
sys.path.insert(0, str(backend))
from app.main import app

(frontend / "openapi.json").write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2), encoding="utf-8")
print("OpenAPI snapshot exported")
