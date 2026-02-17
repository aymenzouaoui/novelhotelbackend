# Microservice de traduction (NLLB-200)

Service Python qui expose une API REST pour traduire du texte avec le modèle **facebook/nllb-200-distilled-600M** (Hugging Face Transformers).

## Prérequis

- Python 3.10+
- ~2.5 Go d’espace disque pour le modèle (et plus si GPU)

## Installation

```bash
cd translation-service
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
```

## Démarrage

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

Variable d’environnement optionnelle :

- `NLLB_MODEL` : nom du modèle (défaut : `facebook/nllb-200-distilled-600M`)

## API

- **GET /health** — Santé du service
- **POST /translate** — Traduction  
  Body JSON : `{ "text": "...", "source_lang": "en", "target_lang": "fr" }`  
  Réponse : `{ "translated_text": "...", "source_lang": "en", "target_lang": "fr" }`
- **GET /langs** — Liste des codes langue (en, fr, ar, es, de, it, pt, ru, zh, ja)

## Exemple

```bash
curl -X POST http://localhost:8000/translate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello world\", \"source_lang\": \"en\", \"target_lang\": \"fr\"}"
```

## Intégration backend Node.js

Le backend peut appeler ce service via l’URL configurée dans `.env` :

```env
TRANSLATION_SERVICE_URL=http://127.0.0.1:8000
```

Puis utiliser les routes `/api/translate` du backend (voir `routes/translationRoutes.js`).
