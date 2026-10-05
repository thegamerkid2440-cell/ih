import removeBackground from "https://esm.sh/@imgly/background-removal";

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

const workspace = document.getElementById("workspace");
const originalImage = document.getElementById("originalImage");
const resultImage = document.getElementById("resultImage");

const fileName = document.getElementById("fileName");
const statusText = document.getElementById("status");

const removeButton = document.getElementById("removeButton");
const downloadButton = document.getElementById("downloadButton");
const newImageButton = document.getElementById("newImageButton");

const progressArea = document.getElementById("progressArea");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");

const emptyResult = document.getElementById("emptyResult");

let selectedFile = null;
let resultBlob = null;
let originalURL = null;
let resultURL = null;

/* -------------------------
   FILE SELECTION
------------------------- */

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    loadFile(fileInput.files[0]);
  }
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();

  dropZone.classList.remove("dragging");

  const file = event.dataTransfer.files[0];

  if (file && file.type.startsWith("image/")) {
    loadFile(file);
  }
});

/* -------------------------
   LOAD IMAGE
------------------------- */

function loadFile(file) {
  selectedFile = file;

  if (originalURL) {
    URL.revokeObjectURL(originalURL);
  }

  if (resultURL) {
    URL.revokeObjectURL(resultURL);
  }

  originalURL = URL.createObjectURL(file);

  originalImage.src = originalURL;

  fileName.textContent = file.name;
  statusText.textContent = "Image loaded";

  resultImage.style.display = "none";
  emptyResult.style.display = "block";

  downloadButton.disabled = true;

  resultBlob = null;
  resultURL = null;

  workspace.classList.remove("hidden");

  workspace.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* -------------------------
   REMOVE BACKGROUND
------------------------- */

removeButton.addEventListener("click", async () => {
  if (!selectedFile) return;

  removeButton.disabled = true;
  downloadButton.disabled = true;

  progressArea.classList.remove("hidden");

  progressFill.style.width = "5%";
  progressPercent.textContent = "5%";
  progressText.textContent = "Loading AI model...";

  statusText.textContent = "AI is working...";

  try {
    const result = await removeBackground(selectedFile, {

      progress: (key, current, total) => {
        let percent = 0;

        if (total > 0) {
          percent = Math.round((current / total) * 100);
        }

        // Keep progress visually inside 10–95%.
        percent = Math.max(10, Math.min(95, percent));

        progressFill.style.width = percent + "%";
        progressPercent.textContent = percent + "%";

        if (key) {
          progressText.textContent =
            "AI: " + key;
        } else {
          progressText.textContent =
            "Removing background...";
        }
      }

    });

    resultBlob = result;

    if (resultURL) {
      URL.revokeObjectURL(resultURL);
    }

    resultURL = URL.createObjectURL(resultBlob);

    resultImage.src = resultURL;

    resultImage.style.display = "block";
    emptyResult.style.display = "none";

    progressFill.style.width = "100%";
    progressPercent.textContent = "100%";
    progressText.textContent = "Background removed!";

    statusText.textContent = "Background successfully removed";

    downloadButton.disabled = false;

  } catch (error) {
    console.error(error);

    progressText.textContent =
      "Something went wrong.";

    statusText.textContent =
      "Background removal failed";

    alert(
      "The background remover could not process this image. " +
      "Try another image or reload the page."
    );

  } finally {
    removeButton.disabled = false;
  }
});

/* -------------------------
   DOWNLOAD
------------------------- */

downloadButton.addEventListener("click", () => {
  if (!resultBlob || !resultURL) return;

  const link = document.createElement("a");

  link.href = resultURL;

  const baseName = selectedFile.name
    .replace(/\.[^/.]+$/, "");

  link.download = baseName + "-no-background.png";

  document.body.appendChild(link);

  link.click();

  link.remove();
});

/* -------------------------
   NEW IMAGE
------------------------- */

newImageButton.addEventListener("click", () => {
  fileInput.value = "";

  workspace.classList.add("hidden");

  if (originalURL) {
    URL.revokeObjectURL(originalURL);
    originalURL = null;
  }

  if (resultURL) {
    URL.revokeObjectURL(resultURL);
    resultURL = null;
  }

  selectedFile = null;
  resultBlob = null;

  progressArea.classList.add("hidden");

  progressFill.style.width = "0%";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

/* -------------------------
   CLEANUP
------------------------- */

window.addEventListener("beforeunload", () => {
  if (originalURL) {
    URL.revokeObjectURL(originalURL);
  }

  if (resultURL) {
    URL.revokeObjectURL(resultURL);
  }
});