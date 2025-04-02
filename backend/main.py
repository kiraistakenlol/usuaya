from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# In-memory storage for phrases (replace with DB later)
phrases_db = [
    {"id": 1, "text": "Hola"},
    {"id": 2, "text": "Adiós"},
]
next_id = 3

class Phrase(BaseModel):
    text: str

class PhraseInDB(Phrase):
    id: int

# Allow CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/phrases", response_model=list[PhraseInDB])
async def get_phrases():
    return phrases_db

@app.post("/phrases", response_model=PhraseInDB, status_code=201)
async def create_phrase(phrase: Phrase):
    global next_id
    new_phrase = PhraseInDB(id=next_id, text=phrase.text)
    phrases_db.append(new_phrase.dict())
    next_id += 1
    return new_phrase

@app.delete("/phrases/{phrase_id}", status_code=204)
async def delete_phrase(phrase_id: int):
    global phrases_db
    phrases_db = [p for p in phrases_db if p["id"] != phrase_id]
    return

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 