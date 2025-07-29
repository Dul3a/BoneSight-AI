const dropArea = document.getElementById("drop-area");
const inputFile = document.getElementById("input-file");
const loading = document.getElementById("loading");
const resultContainer = document.getElementById("result-container");
let isProcessing = false;

function getApiUrl() {
  return "https://bonesight-api.onrender.com/api/detect";
}

window.addEventListener("DOMContentLoaded", () => {
  loading.style.display = "none";
  resultContainer.innerHTML = "";
  
  document.body.style.opacity = "0";
  setTimeout(() => {
    document.body.style.transition = "opacity 0.5s ease-in";
    document.body.style.opacity = "1";
  }, 100);
});

dropArea.addEventListener("click", (e) => {
  if (!isProcessing) {
    inputFile.click();
    dropArea.style.transform = "scale(0.98)";
    setTimeout(() => {
      dropArea.style.transform = "scale(1)";
    }, 150);
  } else {
    showNotification("Se procesează deja o imagine. Așteaptă să se termine.", "info");
  }
});

dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  if (!isProcessing) {
    dropArea.classList.add("dragging");
    dropArea.style.borderColor = "#667eea";
    dropArea.style.background = "rgba(102, 126, 234, 0.1)";
  }
});

dropArea.addEventListener("dragleave", e => {
  e.preventDefault();
  dropArea.classList.remove("dragging");
  dropArea.style.borderColor = "#ddd";
  dropArea.style.background = "rgba(255,255,255,0.5)";
});

dropArea.addEventListener("drop", e => {
  e.preventDefault();
  dropArea.classList.remove("dragging");
  dropArea.style.borderColor = "#ddd";
  dropArea.style.background = "rgba(255,255,255,0.5)";
  
  if (e.dataTransfer.files.length) {
    sendImage(e.dataTransfer.files[0]);
  }
});

inputFile.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    sendImage(e.target.files[0]);
    e.target.value = '';
  }
});

inputFile.addEventListener("click", (e) => {
  e.stopPropagation();
});

function sendImage(file) {
  if (isProcessing) {
    showNotification("Se procesează deja o imagine. Așteaptă să se termine.", "info");
    return;
  }

  if (!file.type.startsWith("image/")) {
    showNotification("Te rog selectează o imagine!", "error");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showNotification("Imaginea este prea mare. Maxim 10MB permis.", "error");
    return;
  }

  isProcessing = true;
  showLoading();
  resultContainer.innerHTML = "";

  const formData = new FormData();
  formData.append("file", file);

  showFilePreview(file);

  fetch(getApiUrl(), { 
    method: "POST", 
    body: formData 
  })
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`Server error ${resp.status}`);
      }
      return resp.json();
    })
    .then(data => {
      if (!data.url) {
        throw new Error("Răspuns fără url");
      }

      const fullUrl = "https://bonesight-api.onrender.com" + data.url + "?t=" + Date.now();

      const img = new Image();
      img.alt = "Rezultat detectare";
      img.className = "result-image";
      
      img.onload = () => {
        hideLoading();
        isProcessing = false;
        showNotification("Analiza completă! Fractura a fost detectată.", "success");
        
        const existingPreview = document.querySelector(".file-preview");
        if (existingPreview) {
          existingPreview.remove();
        }
        
        const resultWrapper = document.createElement("div");
        resultWrapper.className = "result-wrapper";
        
        const resultTitle = document.createElement("h3");
        resultTitle.textContent = "Rezultat Analiză";
        resultTitle.className = "result-title";
        
        resultWrapper.appendChild(resultTitle);
        resultWrapper.appendChild(img);
        
        resultContainer.appendChild(resultWrapper);
      };
      
      img.onerror = () => {
        hideLoading();
        isProcessing = false;
        showNotification("Eroare la încărcarea imaginii procesate.", "error");
      };
      
      img.src = fullUrl;
    })
    .catch(err => {
      console.error("Fetch error:", err);
      hideLoading();
      isProcessing = false;
      showNotification("A apărut o eroare la procesare. Încearcă din nou.", "error");
    });
}

function showLoading() {
  loading.style.display = "flex";
  loading.style.animation = "fadeInUp 0.3s ease-out";
}

function hideLoading() {
  loading.style.display = "none";
}

function showFilePreview(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.createElement("div");
    preview.className = "file-preview";
    preview.innerHTML = `
      <div class="preview-content">
        <i class="fas fa-image"></i>
        <p>${file.name}</p>
        <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
    `;
    
    const existingPreview = document.querySelector(".file-preview");
    if (existingPreview) {
      existingPreview.remove();
    }
    
    resultContainer.appendChild(preview);
  };
  reader.readAsDataURL(file);
}

function showNotification(message, type = "info") {
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach(notification => notification.remove());
  
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = "translateY(0)";
    notification.style.opacity = "1";
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = "translateY(-100px)";
    notification.style.opacity = "0";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 5000);
}

const notificationStyles = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1000;
    transform: translateY(-100px);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 400px;
    border: 1px solid rgba(255,255,255,0.2);
  }
  
  .notification-success {
    border-left: 4px solid #28a745;
  }
  
  .notification-error {
    border-left: 4px solid #dc3545;
  }
  
  .notification-info {
    border-left: 4px solid #667eea;
  }
  
  .notification i {
    font-size: 1.2rem;
  }
  
  .notification-success i {
    color: #28a745;
  }
  
  .notification-error i {
    color: #dc3545;
  }
  
  .notification-info i {
    color: #667eea;
  }
  
  .file-preview {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 20px;
    margin: 20px 0;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    animation: fadeInUp 0.3s ease-out;
  }
  
  .preview-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .preview-content i {
    font-size: 2rem;
    color: #667eea;
  }
  
  .preview-content p {
    font-weight: 500;
    color: #333;
    margin: 0;
  }
  
  .preview-content span {
    font-size: 0.9rem;
    color: #666;
  }
  
  .result-wrapper {
    text-align: center;
    animation: fadeInUp 0.5s ease-out;
  }
  
  .result-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
