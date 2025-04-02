from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select


# Database Configuration (using details from docker-compose.yml)
DATABASE_URL = "postgresql://user:password@localhost:5432/vibe_dev"

# SQLModel Table Definition
class Phrase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str = Field(index=True)

# Pydantic models for request/response (can reuse SQLModel definition often)
class PhraseCreate(SQLModel):
    text: str

class PhraseRead(SQLModel):
    id: int
    text: str

# Database Engine Setup
# connect_args is important for SQLite, may not be needed for PostgreSQL but doesn't hurt
engine = create_engine(DATABASE_URL, echo=True, connect_args={})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Dependency to get DB session
def get_session():
    with Session(engine) as session:
        yield session

# Lifespan context manager for startup/shutdown events (recommended over @on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating database tables...")
    create_db_and_tables()
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

# Allow CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/phrases", response_model=List[PhraseRead])
def get_phrases(session: Session = Depends(get_session)):
    statement = select(Phrase)
    phrases = session.exec(statement).all()
    return phrases

@app.post("/phrases", response_model=PhraseRead, status_code=201)
def create_phrase(phrase: PhraseCreate, session: Session = Depends(get_session)):
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

# Optional: Keep for direct execution if needed, though start-dev.sh is preferred
if __name__ == "__main__":
    import uvicorn
    # Note: Uvicorn doesn't run the lifespan events when run directly like this
    # unless using --lifespan on. `start-dev.sh` handles lifespan correctly.
    print("Warning: Running directly via __main__ may bypass lifespan events (table creation). Use uvicorn command or start-dev.sh.")
    create_db_and_tables() # Manually create tables if run directly
    uvicorn.run(app, host="0.0.0.0", port=8000) 