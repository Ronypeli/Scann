const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d');
const placeholderText = document.getElementById('placeholder-text');
const btnEnhance = document.getElementById('btn-enhance');
const btnOcr = document.getElementById('btn-ocr');
const btnPdf = document.getElementById('btn-pdf');
const ocrText = document.getElementById('ocr-text');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');

let cvLoaded = false;
let currentImage = null;

function cvReady() {
    cvLoaded = true;
    console.log("OpenCV listo");
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            canvas.style.display = 'block';
            placeholderText.style.display = 'none';
            btnEnhance.disabled = false;
            btnOcr.disabled = false;
            btnPdf.disabled = false;
            ocrText.value = "";
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

btnEnhance.addEventListener('click', () => {
    if (!cvLoaded) {
        alert("El motor de procesamiento aún está cargando. Espera un momento.");
        return;
    }
    showLoader("Aplicando filtro de escáner...");
    setTimeout(() => {
        try {
            let src = cv.imread(canvas);
            let dst = new cv.Mat();
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
            let dst2 = new cv.Mat();
            cv.adaptiveThreshold(dst, dst2, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
            cv.imshow(canvas, dst2);
            src.delete(); dst.delete(); dst2.delete();
        } catch (error) {
            console.error(error);
            alert("Error procesando la imagen.");
        }
        hideLoader();
    }, 100);
});

btnOcr.addEventListener('click', async () => {
    showLoader("Extrayendo texto... (Esto puede tardar)");
    ocrText.value = "";
    try {
        const result = await Tesseract.recognize(canvas, 'spa', { logger: m => console.log(m) });
        ocrText.value = result.data.text;
    } catch (error) {
        console.error(error);
        alert("Error al extraer el texto.");
    }
    hideLoader();
});

btnPdf.addEventListener('click', () => {
    showLoader("Generando PDF...");
    setTimeout(() => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            doc.save('escaneo_webscan.pdf');
        } catch (error) {
            console.error(error);
            alert("Error al generar PDF.");
        }
        hideLoader();
    }, 100);
});

function showLoader(text) {
    loaderText.textContent = text;
    loader.style.display = 'flex';
}

function hideLoader() {
    loader.style.display = 'none';
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('SW registrado:', registration.scope);
        }, err => {
            console.log('SW falló:', err);
        });
    });
}