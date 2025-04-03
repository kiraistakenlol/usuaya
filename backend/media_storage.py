import os
import uuid
from pathlib import Path
from typing import BinaryIO

# Define the base storage path relative to the project root
# Assuming this script is run from the project root or the path is adjusted
# When run via uvicorn inside backend/, the relative path needs to be ../data/audio
MEDIA_DIR = Path(__file__).parent.parent / "data" / "audio"

# Ensure the directory exists when the module is loaded
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

def save_media_file(file: BinaryIO, original_filename: str) -> str:
    """Saves a media file to the local storage.

    Args:
        file: The file-like object containing the media data.
        original_filename: The original name of the uploaded file (used for extension).

    Returns:
        The unique identifier (filename) of the saved file.
        
    Raises:
        IOError: If the file cannot be saved.
    """
    # Get file extension
    file_extension = Path(original_filename).suffix.lower()
    if not file_extension:
        # Default or raise error if no extension? Let's default for now.
        file_extension = ".mp3" # Or derive from mimetype if available later

    # Generate a unique filename
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}{file_extension}"
    file_path = MEDIA_DIR / filename

    try:
        with open(file_path, "wb") as buffer:
            while True:
                chunk = file.read(1024 * 1024) # Read in chunks (e.g., 1MB)
                if not chunk:
                    break
                buffer.write(chunk)
        print(f"Saved media file to: {file_path}") # Log saving
        return filename # Return the unique filename (our ID for now)
    except IOError as e:
        print(f"Error saving media file {filename}: {e}")
        # Clean up potentially partially written file?
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass # Ignore cleanup error
        raise IOError(f"Failed to save media file: {e}")


def get_media_file_path(file_id: str) -> Path | None:
    """Gets the full path to a media file given its ID (filename).

    Args:
        file_id: The unique filename identifier.

    Returns:
        A Path object to the file, or None if it doesn't exist.
    """
    file_path = MEDIA_DIR / file_id
    if file_path.is_file():
        return file_path
    else:
        print(f"Media file not found for ID: {file_id}")
        return None

# --- TODO Future --- 
# def delete_media_file(file_id: str) -> bool:
#     """Deletes a media file.
#     Returns True if successful or file didn't exist, False on error.
#     """
#     pass 