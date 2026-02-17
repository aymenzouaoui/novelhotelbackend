"""
Microservice de traduction avec NLLB-200 (Hugging Face Transformers).
Expose une API REST pour traduire du texte.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Import synchrone pour le modèle (chargement au démarrage)
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Codes langue NLLB courants (format: langue_Script)
# Voir https://github.com/facebookresearch/flores/blob/main/flores200/README.md
LANG_CODES = {
    "en": "eng_Latn",
    "fr": "fra_Latn",
    "ar": "arb_Arab",
    "es": "spa_Latn",
    "de": "deu_Latn",
    "it": "ita_Latn",
    "pt": "por_Latn",
    "ru": "rus_Cyrl",
    "zh": "zho_Hans",
    "ja": "jpn_Jpan",
}

MODEL_NAME = os.environ.get("NLLB_MODEL", "facebook/nllb-200-distilled-600M")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

tokenizer = None
model = None


def get_lang_code(lang: str) -> str:
    """Retourne le code NLLB (e.g. fra_Latn) à partir de 'fr' ou du code complet."""
    if not lang:
        return "eng_Latn"
    lang = lang.strip().lower()
    if "_" in lang:
        return lang
    return LANG_CODES.get(lang, "eng_Latn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Charge le modèle au démarrage."""
    global tokenizer, model
    print("Chargement du tokenizer et du modèle NLLB...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    model = model.to(DEVICE)
    print(f"Modèle chargé sur {DEVICE}. Prêt pour la traduction.")
    yield
    # Shutdown si besoin
    print("Arrêt du service de traduction.")


app = FastAPI(
    title="Translation Microservice",
    description="Traduction de texte avec NLLB-200 (Facebook)",
    version="1.0.0",
    lifespan=lifespan,
)


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Texte à traduire")
    source_lang: str = Field(default="en", description="Code langue source (ex: en, fr, ar)")
    target_lang: str = Field(default="fr", description="Code langue cible (ex: en, fr, ar)")


class TranslateResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str


@app.get("/health")
def health():
    """Santé du service."""
    return {"status": "ok", "model": MODEL_NAME, "device": DEVICE}


@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    """Traduit le texte de la langue source vers la langue cible."""
    if tokenizer is None or model is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé")
    try:
        src_code = get_lang_code(req.source_lang)
        tgt_code = get_lang_code(req.target_lang)
        tokenizer.src_lang = src_code
        forced_bos_id = tokenizer.convert_tokens_to_ids(tgt_code)
        inputs = tokenizer(req.text, return_tensors="pt", truncation=True, max_length=512)
        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                forced_bos_token_id=forced_bos_id,
                max_length=512,
                num_beams=5,
            )
        translated = tokenizer.batch_decode(outputs, skip_special_tokens=True)
        return TranslateResponse(
            translated_text=translated[0].strip(),
            source_lang=req.source_lang,
            target_lang=req.target_lang,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/langs")
def list_langs():
    """Liste les codes langue supportés (raccourcis)."""
    return {"codes": LANG_CODES}
