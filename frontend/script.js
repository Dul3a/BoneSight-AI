const dropArea        = document.getElementById("drop-area");
const inputFile       = document.getElementById("input-file");
const loading         = document.getElementById("loading");
const resultContainer = document.getElementById("result-container");
let isProcessing      = false;

function getApiUrl() {
  return "https://bonesight-api.onrender.com/api/detect";
}

window.addEventListener("DOMContentLoaded", () => {
  loading.style.display     = "none";
  resultContainer.innerHTML = "";
});

// Drag & drop + click
dropArea.addEventListener("click", () => {
  if (!isProcessing) inputFile.click();
});
dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  if (!isProcessing) dropArea.classList.add("dragging");
});
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragging");
});
dropArea.addEventListener("drop", e => {
  e.preventDefault();
  dropArea.classList.remove("dragging");
  if (!isProcessing && e.dataTransfer.files.length) {
    sendImage(e.dataTransfer.files[0]);
  }
});
inputFile.addEventListener("change", () => {
  if (!isProcessing && inputFile.files.length) {
    sendImage(inputFile.files[0]);
  }
});

function sendImage(file) {
  if (!file.type.startsWith("image/")) {
    alert("Te rog selectează o imagine!");
    return;
  }

  isProcessing     = true;
  loading.style.display     = "block";
  resultContainer.innerHTML = "";  // stergem orice imagine anterioara

  const formData = new FormData();
  formData.append("file", file);

  fetch(getApiUrl(), { method: "POST", body: formData })
    .then(resp => {
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      return resp.json();
    })
    .then(data => {
      if (!data.url) {
        throw new Error("Răspuns fără url");
      }

      // Construim URL-ul catre FastAPI
      const fullUrl = "https://bonesight-api.onrender.com" + data.url + "?t=" + Date.now();

      const img = new Image();
      img.alt = "Rezultat detectare";
      img.onload = () => {
        loading.style.display = "none";
        isProcessing = false;
      };
      img.onerror = () => {
        loading.style.display = "none";
        isProcessing = false;
        alert("Eroare la încărcarea imaginii procesate.");
      };
      img.src = fullUrl;

      resultContainer.appendChild(img);
    })
    .catch(err => {
      console.error("Fetch error:", err);
      alert("A apărut o eroare la procesare.");
      loading.style.display = "none";
      isProcessing = false;
    });
}
