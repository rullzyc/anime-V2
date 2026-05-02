from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
import os
import uvicorn
import requests as req_lib

# Import existing scraping logic
from API.otakudesu import (
    getOngoing,
    getGenreList,
    getGenreAnime,
    getEpisodes,
    getDownload,
    getStreams,
    getSchedule,
    searchAnime
)

app = FastAPI(title="PyAnimeIndo Web API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory if it doesn't exist
if not os.path.exists("static"):
    os.makedirs("static")

# Mount static files for the frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def serve_index():
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "Frontend not found in static/index.html"}

@app.get("/api/ongoing")
async def api_ongoing(page: int = 1):
    try:
        return {"status": "success", "data": getOngoing(page)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schedule")
async def api_schedule():
    try:
        return {"status": "success", "data": getSchedule()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/genres")
async def api_genres():
    try:
        return {"status": "success", "data": getGenreList()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/genre")
async def api_genre_anime(path: str = Query(..., description="Path from genres list")):
    try:
        return {"status": "success", "data": getGenreAnime(path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/episodes")
async def api_episodes(url: str = Query(..., description="Anime URL")):
    try:
        return {"status": "success", "data": getEpisodes(url)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download")
async def api_download(url: str = Query(..., description="Episode URL")):
    try:
        return {"status": "success", "data": getDownload(url)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/streams")
async def api_streams(url: str = Query(..., description="Episode URL")):
    try:
        return {"status": "success", "data": getStreams(url)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
async def api_search(title: str = Query(..., description="Search title")):
    try:
        return {"status": "success", "data": searchAnime(title)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/img")
async def api_img_proxy(url: str = Query(..., description="Image URL to proxy")):
    """Proxy image requests to bypass hotlink protection."""
    try:
        r = req_lib.get(url, headers={
            "Referer": "https://otakudesu.blog/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }, timeout=10)
        content_type = r.headers.get("Content-Type", "image/jpeg")
        return Response(content=r.content, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
