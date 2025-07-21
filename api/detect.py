import os
import uuid
import shutil
import glob
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO

# === CONFIGURARE ===
MODEL_PATH = "best.pt"
STATIC_RESULTS_DIR = "static/results"
os.makedirs(STATIC_RESULTS_DIR, exist_ok=True)

# === INSTANTIERE APP ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")
model = YOLO(MODEL_PATH)

# === FUNCTIE PENTRU ULTIMA IMAGINE DIN PREDICT ===
def get_latest_predict_image():
    predict_dirs = sorted(glob.glob("runs/detect/predict*"), key=os.path.getmtime, reverse=True)
    for folder in predict_dirs:
        images = glob.glob(os.path.join(folder, "*.jpg"))
        if images:
            return sorted(images, key=os.path.getmtime, reverse=True)[0]
    return None

# === ENDPOINT DE DETECTIE ===
@app.post("/api/detect")
async def detect_fracture(file: UploadFile = File(...)):
    try:
        print(f"📥 Imagine primită: {file.filename}")
        temp_filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        model(source=temp_filename, save=True, save_txt=False, show=False)

        pred_img_path = get_latest_predict_image()
        if not pred_img_path or not os.path.exists(pred_img_path):
            os.remove(temp_filename)
            return JSONResponse({"error": "Nu s-a generat nicio imagine!"}, status_code=500)

        result_filename = f"{uuid.uuid4().hex}.jpg"
        result_path = os.path.join(STATIC_RESULTS_DIR, result_filename)
        shutil.copy(pred_img_path, result_path)

        print(f"🖼 Imagine finală: {result_path}")
        os.remove(temp_filename)

        return JSONResponse({"url": f"/static/results/{result_filename}"})
    
    except Exception as e:
        print("❌ Eroare server:", str(e))
        return JSONResponse({"error": "Eroare la procesare imagine!"}, status_code=500)

# === HANDLER PENTRU ERORI GLOBALE ===
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("❌ EROARE GLOBALĂ:", exc)
    return JSONResponse({"error": str(exc)}, status_code=500)
