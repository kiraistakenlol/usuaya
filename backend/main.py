from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select


# Database Configuration (using details from docker-compose.yml)
DATABASE_URL = "postgresql://user:password@localhost:5432/vibe_dev"

# --- Models ---

# Phrase Model (Vocabulary)
class Phrase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str = Field(index=True)

class PhraseCreate(SQLModel):
    text: str

class PhraseRead(SQLModel):
    id: int
    text: str

# Text Model (Generated Texts)
class Text(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    spanish_content: str
    english_translation: Optional[str] = None # Allow null for now
    # Future: Add relationship to vocab used, timestamp etc.

class TextCreateRequest(SQLModel):
    vocabulary: List[str] # List of words/phrases from frontend

class TextRead(SQLModel):
    id: int
    spanish_content: str
    english_translation: Optional[str]

# --- Database Setup ---
engine = create_engine(DATABASE_URL, echo=True, connect_args={})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# --- App Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating database tables (if they don't exist)...")
    create_db_and_tables()
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints: Phrases (Vocabulary) ---

@app.get("/phrases", response_model=List[PhraseRead])
def get_phrases(session: Session = Depends(get_session)):
    statement = select(Phrase)
    phrases = session.exec(statement).all()
    return phrases

@app.post("/phrases", response_model=PhraseRead, status_code=201)
def create_phrase(phrase: PhraseCreate, session: Session = Depends(get_session)):
    # Basic check to avoid duplicates (consider more robust checks)
    existing = session.exec(select(Phrase).where(Phrase.text == phrase.text)).first()
    if existing:
        # Return existing phrase instead of erroring or creating duplicate
        return existing
    
    db_phrase = Phrase.model_validate(phrase)
    session.add(db_phrase)
    session.commit()
    session.refresh(db_phrase)
    return db_phrase

@app.delete("/phrases/{phrase_id}", status_code=204)
def delete_phrase(phrase_id: int, session: Session = Depends(get_session)):
    db_phrase = session.get(Phrase, phrase_id)
    if not db_phrase:
        raise HTTPException(status_code=404, detail="Phrase not found")
    session.delete(db_phrase)
    session.commit()
    return

# --- Endpoints: Texts (Generated Content) ---

@app.post("/texts", response_model=TextRead, status_code=201)
def generate_text(request: TextCreateRequest, session: Session = Depends(get_session)):
    # --- Placeholder Generation Logic --- 
    # TODO: Replace with actual GPT call in the future
    if not request.vocabulary:
        raise HTTPException(status_code=400, detail="Vocabulary list cannot be empty")
        
    generated_spanish = "\n".join(request.vocabulary) # Just join the input words for now
    generated_english = "(English translation placeholder)" 
    # --- End Placeholder Logic ---

    db_text = Text(
        spanish_content=generated_spanish,
        english_translation=generated_english
    )
    session.add(db_text)
    session.commit()
    session.refresh(db_text)
    return db_text

@app.get("/texts", response_model=List[TextRead])
def get_texts(session: Session = Depends(get_session)):
    statement = select(Text).order_by(Text.id.desc()) # Show newest first
    texts = session.exec(statement).all()
    return texts

@app.get("/texts/{text_id}", response_model=TextRead)
def get_text(text_id: int, session: Session = Depends(get_session)):
    db_text = session.get(Text, text_id)
    if not db_text:
        raise HTTPException(status_code=404, detail="Text not found")
    return db_text

# Optional: Keep for direct execution if needed
if __name__ == "__main__":
    import uvicorn
    print("Warning: Running directly via __main__ may bypass lifespan events (table creation). Use uvicorn command or start-dev.sh.")
    create_db_and_tables() # Manually create tables if run directly
    uvicorn.run(app, host="0.0.0.0", port=8000) 