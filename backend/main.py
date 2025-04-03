from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, Field, create_engine, Session, select

# Use direct import since main.py is run as a script
from text_generator import generate_text_with_claude 
from media_storage import save_media_file, get_media_file_path


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
    audio_file_id: Optional[str] = Field(default=None, index=True) # Store unique filename
    # Future: Add relationship to vocab used, timestamp etc.

class TextCreateRequest(SQLModel):
    vocabulary: List[str] # List of words/phrases from frontend

class TextRead(SQLModel):
    id: int
    spanish_content: str
    english_translation: Optional[str]
    audio_file_id: Optional[str]

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
def generate_text_and_audio(
    session: Session = Depends(get_session),
    # Use Form(...) to receive vocabulary list as form field
    vocabulary: List[str] = Form(...), 
    # Optional audio file upload
    audio_file: Optional[UploadFile] = File(None) 
):
    if not vocabulary:
        raise HTTPException(status_code=400, detail="Vocabulary list cannot be empty")

    # --- Placeholder: Generate Text (using Claude or similar) --- 
    # In a real scenario, you might generate text first, then TTS
    print(f"Generating text for vocabulary: {vocabulary}")
    generated_spanish, generated_english = generate_text_with_claude(vocabulary)
    print(f"Spanish: {generated_spanish[:100]}... English: {generated_english[:100]}...")

    if generated_spanish.startswith("Error generating text"):
         raise HTTPException(status_code=503, detail=generated_english)
    # --- End Placeholder --- 

    saved_audio_id = None
    if audio_file:
        # --- Save Uploaded Audio --- 
        try:
            # Pass the file object and its original filename
            saved_audio_id = save_media_file(audio_file.file, audio_file.filename)
            print(f"Associated audio file ID: {saved_audio_id}")
        except IOError as e:
            raise HTTPException(status_code=500, detail=f"Failed to save audio file: {e}")
        except Exception as e:
             raise HTTPException(status_code=500, detail=f"Unexpected error saving audio file: {e}")
        finally:
            # Important: Close the file explicitly after reading/saving
            # UploadFile.file is often a SpooledTemporaryFile
            audio_file.file.close()
            
    # --- Save Text to DB --- 
    db_text = Text(
        spanish_content=generated_spanish,
        english_translation=generated_english,
        audio_file_id=saved_audio_id # Store the unique filename
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

# --- Endpoint: Audio Files ---

@app.get("/audio/{file_id}")
async def get_audio_file(file_id: str):
    file_path = get_media_file_path(file_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # Determine MIME type based on extension (basic)
    media_type = "application/octet-stream" # Default
    ext = file_path.suffix.lower()
    if ext == ".mp3":
        media_type = "audio/mpeg"
    elif ext == ".wav":
        media_type = "audio/wav"
    elif ext == ".ogg":
        media_type = "audio/ogg"
    # Add more types as needed

    return FileResponse(path=file_path, media_type=media_type, filename=file_id)

# Optional: Keep for direct execution if needed
if __name__ == "__main__":
    import uvicorn
    print("Warning: Running directly via __main__ may bypass lifespan events (table creation). Use uvicorn command or start-dev.sh.")
    create_db_and_tables() # Manually create tables if run directly
    uvicorn.run(app, host="0.0.0.0", port=8000) 