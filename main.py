import os
import json
from pathlib import Path
import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from google import genai
from google.genai import types
from typing import Union, List, Dict, Any
import traceback
import re


app = FastAPI()

# CORS (tighten this later; "*" is fine for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Gemini client ----------
_client = None

def get_gemini_client():
    global _client
    if _client is None:
        api_key = os.environ.get("API_KEY")
        if not api_key:
            raise ValueError("API_KEY environment variable is not set")
        _client = genai.Client(api_key=api_key)
    return _client


# ---------- Health ----------
@app.get("/health")
async def health_check():
    api_key = os.environ.get("API_KEY")
    if not api_key:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": "API_KEY not configured"},
        )
    return {"status": "healthy", "api_configured": True}


# ---------- Taxonomy ----------

class TaxonomyResponse(BaseModel):
    summary: dict
    lookup: dict

class TaxonomyRequest(BaseModel):
    conditions: Union[str, List[str]]


@app.post("/api/categorize", response_model=TaxonomyResponse)
async def categorize_conditions(request: TaxonomyRequest):
    try:
        client = get_gemini_client()
        
        # Normalize: allow string OR list of strings
        if isinstance(request.conditions, list):
            conditions_list = [str(x).strip() for x in request.conditions if x]
            conditions_str = ", ".join(conditions_list)
        else:
            conditions_str = str(request.conditions or "").strip()
            conditions_list = [c.strip() for c in conditions_str.split(",") if c.strip()]

        if not conditions_str.strip():
            raise HTTPException(status_code=422, detail="conditions cannot be empty")

        # CHUNKING: If there are many conditions, process in batches
        chunk_size = 400  # Process 50 conditions at a time
        if len(conditions_list) > chunk_size:
            print(f"Processing {len(conditions_list)} conditions in chunks of {chunk_size}")
            return await categorize_in_chunks(client, conditions_list, chunk_size)

        prompt = f"""Role: You are a Clinical Trial Data Architect specializing in medical taxonomy. You output ONLY valid JSON. Do not include any conversational text or markdown formatting.

Task: Analyze the provided list of clinical conditions and categorize every single term into the structured schema below.


Classification Rules:
1. Genetic: Chromosomal anomalies, hereditary syndromes, or gene mutations.
2. RecentEvents: Acute states, physical symptoms, surgical interventions, or recent medical events.
3. OtherMajorDiagnosis: Chronic diseases, primary malignancies, and systemic long-term conditions.

- Aim for 5-15 major terms total

Constraint: EVERY term provided in the Input List must be included in the "TermMapping" object. Do not truncate the list.


Output Schema:
{{
  "SummaryLists": {{
    "Genetic": ["Master Term 1", "Master Term 2"],
    "RecentEvents": ["Master Term 3"],
    "OtherMajorDiagnosis": ["Master Term 4"]
  }},
  "TermMapping": {{
    "Master Term 1": ["original_string_a", "original_string_b"],
    "Master Term 3": ["original_string_c"]
  }}
}}

Input List: {conditions_str}"""

        # INCREASED TIMEOUT + RETRY LOGIC
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                print(f"Categorization attempt {attempt + 1}/{max_retries}")
                
                # Run in thread pool to avoid blocking
                response = await asyncio.to_thread(
                    lambda: client.models.generate_content(
                        model="gemini-2.0-flash-001",
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            # Increased timeout
                            temperature=0.1,  # More deterministic
                        ),
                    )
                )
                
                raw = response.text
                try:
                    data = extract_json_obj(raw)
                    break  # Success, exit retry loop
                except Exception as e:
                    print(f"JSON extraction error on attempt {attempt + 1}:", str(e))
                    print("Gemini raw response (first 2000 chars):", raw[:2000])
                    last_error = e
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                    
            except Exception as e:
                print(f"API call error on attempt {attempt + 1}:", str(e))
                last_error = e
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                continue
        else:
            # All retries failed
            raise Exception(f"Failed after {max_retries} attempts. Last error: {str(last_error)}")

        lookup = {}
        term_mapping = data.get("TermMapping") or {}
        if isinstance(term_mapping, dict):
            for master, originals in term_mapping.items():
                if isinstance(originals, list):
                    for orig in originals:
                        if orig:
                            lookup[str(orig).lower().strip()] = master

        return TaxonomyResponse(
            summary=data.get("SummaryLists", {"Genetic": [], "RecentEvents": [], "OtherMajorDiagnosis": []}),
            lookup=lookup,
        )
        
    except ValueError as e:
        # Only treat missing API_KEY as 503
        msg = str(e)
        if "API_KEY" in msg:
            raise HTTPException(status_code=503, detail=msg)
        print("ValueError in /api/categorize:", msg)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"ValueError: {msg}")
    except Exception as e:
        print("Exception in /api/categorize:", repr(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Categorization failed: {str(e)}")


async def categorize_in_chunks(client, conditions_list: List[str], chunk_size: int) -> TaxonomyResponse:
    """Process conditions in chunks to avoid timeout"""
    all_summary = {"Genetic": [], "RecentEvents": [], "OtherMajorDiagnosis": []}
    all_lookup = {}
    
    # Split into chunks
    chunks = [conditions_list[i:i + chunk_size] for i in range(0, len(conditions_list), chunk_size)]
    
    for idx, chunk in enumerate(chunks):
        print(f"Processing chunk {idx + 1}/{len(chunks)} ({len(chunk)} conditions)")
        
        chunk_str = ", ".join(chunk)
        prompt = f"""Role: You are a Clinical Trial Data Architect specializing in medical taxonomy. You output ONLY valid JSON. Do not include any conversational text or markdown formatting.

Task: Analyze the provided list of clinical conditions and categorize every single term into the structured schema below.

Classification Rules:
1. Genetic: Chromosomal anomalies, hereditary syndromes, or gene mutations.
2. RecentEvents: Acute states, physical symptoms, surgical interventions, or recent medical events.
3. OtherMajorDiagnosis: Chronic diseases, primary malignancies, and systemic long-term conditions.

Constraint: Most terms provided in the Input List must be included in the "TermMapping" object. 

Output Schema:
{{
  "SummaryLists": {{
    "Genetic": ["Master Term 1", "Master Term 2"],
    "RecentEvents": ["Master Term 3"],
    "OtherMajorDiagnosis": ["Master Term 4"]
  }},
  "TermMapping": {{
    "Master Term 1": ["original_string_a", "original_string_b"],
    "Master Term 3": ["original_string_c"]
  }}
}}

Input List: {chunk_str}"""

        try:
            response = await asyncio.to_thread(
                lambda: client.models.generate_content(
                    model="gemini-2.0-flash-exp",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    ),
                )
            )
            
            raw = response.text
            data = extract_json_obj(raw)
            
            # Merge results
            summary_lists = data.get("SummaryLists", {})
            for category in ["Genetic", "RecentEvents", "OtherMajorDiagnosis"]:
                items = summary_lists.get(category, [])
                if items:
                    all_summary[category].extend(items)
            
            term_mapping = data.get("TermMapping", {})
            if isinstance(term_mapping, dict):
                for master, originals in term_mapping.items():
                    if isinstance(originals, list):
                        for orig in originals:
                            if orig:
                                all_lookup[str(orig).lower().strip()] = master
            
            # Brief pause between chunks
            if idx < len(chunks) - 1:
                await asyncio.sleep(0.5)
                
        except Exception as e:
            print(f"Error processing chunk {idx + 1}: {str(e)}")
            traceback.print_exc()
            # Continue with other chunks
            continue
    
    # Deduplicate summary lists
    for category in all_summary:
        all_summary[category] = list(dict.fromkeys(all_summary[category]))
    
    return TaxonomyResponse(
        summary=all_summary,
        lookup=all_lookup,
    )


# ---------- Websocket ----------
@app.websocket("/ws/verify/{nct_id}")
async def websocket_endpoint(websocket: WebSocket, nct_id: str):
    await websocket.accept()
    chat_session = None

    try:
        try:
            client = get_gemini_client()
        except ValueError:
            await websocket.send_json({"type": "error", "text": "Backend configuration error. Please contact support."})
            await websocket.close()
            return

        while True:
            data = json.loads(await websocket.receive_text())

            if data.get("type") == "start":
                context = data.get("context", {})
                title = context.get("title", "the clinical trial")
                criteria = context.get("criteria", "No criteria provided.")

                system_instruction = f"""
You are a Clinical Trial Eligibility Assistant for the study: "{title}".
Your goal is to help a user understand if they might be eligible for this trial based on the protocol criteria.

STUDY CRITERIA:
{criteria}

PROTOCOL:
1. Greet the user and explain your role.
2. Ask eligibility questions ONE BY ONE. Do not list them all at once.
3. If a user's answer clearly makes them ineligible, explain why based on the criteria and stop further screening.
4. If they seem eligible, provide a summary at the end.
5. ALWAYS include a disclaimer that this is not medical advice and they must consult with the trial team or their doctor.
6. Keep responses professional, empathetic, and concise.
"""

                chat_session = client.chats.create(
                    model="gemini-2.5-pro",
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                    ),
                )

                await websocket.send_json({"type": "typing"})
                resp = chat_session.send_message("Introduce yourself and ask the first eligibility question.")
                await websocket.send_json({"type": "message", "text": resp.text})

            elif data.get("type") == "message" and chat_session:
                user_text = data.get("text", "")
                await websocket.send_json({"type": "typing"})
                resp = chat_session.send_message(user_text)
                await websocket.send_json({"type": "message", "text": resp.text})

    except WebSocketDisconnect:
        print(f"Session disconnected for NCT ID: {nct_id}")
    except Exception as e:
        print(f"Server Error: {e}")
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "message", "text": "Sorry, I encountered an internal error. Please try again later."})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
        
        
# --- helper method ---

def extract_json_obj(raw: str) -> Dict[str, Any]:
    """
    Notebook-style JSON extraction:
    1) strip common code fences
    2) regex grab first {...} blob (greedy, DOTALL)
    3) json.loads on that blob
    """
    if not raw or not raw.strip():
        raise json.JSONDecodeError("Empty response", raw or "", 0)

    text = raw.strip()

    # Match notebook behavior but tolerate code fences in prod
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    m = re.search(r"(\{.*\})", text, flags=re.DOTALL)
    if not m:
        raise json.JSONDecodeError("No JSON object found in response", text, 0)

    blob = m.group(1)

    try:
        data = json.loads(blob)
    except json.JSONDecodeError as e:
        # Helpful snippet around the failure point
        start = max(0, e.pos - 250)
        end = min(len(blob), e.pos + 250)
        snippet = blob[start:end]
        raise json.JSONDecodeError(
            f"Invalid JSON from model (near pos {e.pos}). Snippet:\n{snippet}",
            blob,
            e.pos,
        ) from None

    if not isinstance(data, dict):
        raise json.JSONDecodeError("Top-level JSON is not an object (dict)", blob, 0)

    return data


# ---------- Static frontend serving (safe) ----------
DIST_DIR = Path(__file__).parent / "dist"
ASSETS_DIR = DIST_DIR / "assets"

if DIST_DIR.exists():
    # Serve Vite assets explicitly
    if ASSETS_DIR.exists():
        app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

    # Serve index
    @app.get("/")
    async def serve_index():
        return FileResponse(str(DIST_DIR / "index.html"))

    # SPA fallback WITHOUT intercepting /api or /ws
    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        if path.startswith("api/") or path.startswith("ws/") or path == "health":
            raise HTTPException(status_code=404)

        candidate = DIST_DIR / path
        if candidate.exists() and candidate.is_file():
            return FileResponse(str(candidate))

        return FileResponse(str(DIST_DIR / "index.html"))