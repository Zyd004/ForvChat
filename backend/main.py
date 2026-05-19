from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import os
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE = "./workspace"
os.makedirs(WORKSPACE, exist_ok=True)


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def root():
    return {"status": "FORVCHAT backend running with Aider"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    content = await file.read()

    filepath = os.path.join(WORKSPACE, file.filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return {
        "status": "uploaded",
        "filename": file.filename,
        "files": os.listdir(WORKSPACE)
    }


@app.get("/files")
def list_files():
    return {
        "files": os.listdir(WORKSPACE)
    }


@app.delete("/files/{filename}")
def remove_file(filename: str):

    filepath = os.path.join(WORKSPACE, filename)

    if os.path.exists(filepath):
        os.remove(filepath)

    return {
        "status": "removed",
        "files": os.listdir(WORKSPACE)
    }


@app.post("/chat")
async def chat(req: ChatRequest):

    def stream():

        cmd = [
            "aider",
            "--yes",
            "--model",
            "gemini/gemini-2.5-pro",
            "--message",
            req.message
        ]

        process = subprocess.Popen(
            cmd,
            cwd=WORKSPACE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        for line in iter(process.stdout.readline, ''):
            yield line

        process.stdout.close()
        process.wait()

    return StreamingResponse(
        stream(),
        media_type="text/plain"
    )