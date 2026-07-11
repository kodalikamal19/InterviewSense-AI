import re
from app.utils.logger import get_logger

logger = get_logger("app.services.diarization_service")

def diarize_transcript(raw_text: str) -> list:
    """
    Parses raw transcript text, segmenting dialogue by speaker (Interviewer/Candidate)
    and generating mock incremental timestamps based on word counts.
    """
    logger.info("Initializing text speaker diarization parser...")
    
    if not raw_text or not raw_text.strip():
        logger.warning("Empty raw text passed to diarizer.")
        return []

    # Regex splits on Interviewer: or Candidate: boundaries case-insensitively
    pattern = r'(?i)(Interviewer:|Candidate:)'
    parts = re.split(pattern, raw_text)
    
    segments = []
    current_speaker = None
    current_time_seconds = 0
    
    for part in parts:
        if not part:
            continue
        
        clean_part = part.strip()
        
        # Check if the part is a speaker tag
        if clean_part.lower() in ["interviewer:", "candidate:"]:
            # Normalize casing
            current_speaker = "Interviewer" if clean_part.lower() == "interviewer:" else "Candidate"
        else:
            # This part is the dialog content
            if current_speaker:
                # Estimate dialogue duration roughly (average speaking rate of 2.5 words per second)
                words = clean_part.split()
                word_count = len(words)
                segment_duration = max(5, int(word_count / 2.5))
                
                # Format seconds to MM:SS string
                mins = int(current_time_seconds / 60)
                secs = int(current_time_seconds % 60)
                timestamp_str = f"{mins:02d}:{secs:02d}"
                
                segments.append({
                    "speaker": current_speaker,
                    "text": clean_part,
                    "timestamp": timestamp_str
                })
                
                # Increment time counter for next speaker turn
                current_time_seconds += segment_duration
                
    # Fallback: if no speaker tags were found, return the entire block under a default speaker
    if not segments:
        logger.warning("No Interviewer/Candidate tags detected in raw transcript. Reverting to single segment fallback.")
        segments.append({
            "speaker": "Interviewer",
            "text": raw_text.strip(),
            "timestamp": "00:00"
        })
        
    logger.info(f"Diarization complete. Generated {len(segments)} dialogue segments.")
    return segments
