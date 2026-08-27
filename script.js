let currentPhotoBase64 = "";
let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  setDynamicDate();
  loadPreferences();
  renderEntries();

  document.getElementById("entryPhoto").addEventListener("change", handlePhotoUpload);
  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);
});

function setDynamicDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = now.toLocaleDateString('pt-BR', options);
  document.getElementById("currentDateTitle").textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("fileName").textContent = file.name;

  const reader = new FileReader();
  reader.onload = function (event) {
    currentPhotoBase64 = event.target.result;
    document.getElementById("imagePreviewContainer").innerHTML = 
      `<img src="${currentPhotoBase64}" class="preview-img" alt="Prévia" />`;
  };
  reader.readAsDataURL(file);
}

function saveEntry() {
  const textInput = document.getElementById("entryText");
  const text = textInput.value.trim();

  if (!text && !currentPhotoBase64) {
    return;
  }

  let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");

  if (editingId) {
    entries = entries.map(entry => {
      if (entry.id === editingId) {
        return {
          ...entry,
          text: text,
          photo: currentPhotoBase64 !== "" ? currentPhotoBase64 : entry.photo
        };
      }
      return entry;
    });
  } else {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      text: text,
      photo: currentPhotoBase64
    };
    entries.unshift(newEntry);
  }

  localStorage.setItem("journal_entries", JSON.stringify(entries));
  resetForm();
  renderEntries();
}

function renderEntries() {
  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const container = document.getElementById("entriesList");

  if (entries.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhum registro ainda.</p>`;
    return;
  }

  container.innerHTML = entries.map(entry => `
    <article class="entry-card">
      <div class="entry-meta">
        <time>${entry.date}</time>
        <div class="card-actions">
          <button class="action-btn" onclick="editEntry(${entry.id})">Editar</button>
          <button class="action-btn delete" onclick="deleteEntry(${entry.id})">Apagar</button>
        </div>
      </div>
      <div class="entry-body">${escapeHtml(entry.text)}</div>
      ${entry.photo ? `<img src="${entry.photo}" class="entry-img" alt="Anexo" />` : ''}
    </article>
  `).join("");
}

function editEntry(id) {
  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const entry = entries.find(e => e.id === id);

  if (!entry) return;

  document.getElementById("entryText").value = entry.text;
  editingId = id;

  if (entry.photo) {
    currentPhotoBase64 = entry.photo;
    document.getElementById("imagePreviewContainer").innerHTML = 
      `<img src="${entry.photo}" class="preview-img" alt="Anexo" />`;
  } else {
    currentPhotoBase64 = "";
    document.getElementById("imagePreviewContainer").innerHTML = "";
  }

  document.getElementById("saveBtn").textContent = "Atualizar";
  document.getElementById("cancelBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  resetForm();
}

function resetForm() {
  editingId = null;
  currentPhotoBase64 = "";
  document.getElementById("entryText").value = "";
  document.getElementById("entryPhoto").value = "";
  document.getElementById("fileName").textContent = "";
  document.getElementById("imagePreviewContainer").innerHTML = "";
  document.getElementById("saveBtn").textContent = "Publicar";
  document.getElementById("cancelBtn").classList.add("hidden");
}

function deleteEntry(id) {
  if (confirm("Deseja apagar esta nota?")) {
    let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem("journal_entries", JSON.stringify(entries));
    renderEntries();
  }
}

function setPalette(palette) {
  document.body.setAttribute("data-bg", palette);
  localStorage.setItem("journal_palette", palette);
}

function toggleTheme() {
  const current = document.body.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", next);
  document.getElementById("themeToggleBtn").querySelector(".theme-icon").textContent = next === "dark" ? "☼" : "☾";
  localStorage.setItem("journal_theme", next);
}

function loadPreferences() {
  const theme = localStorage.getItem("journal_theme") || "dark";
  const palette = localStorage.getItem("journal_palette") || "mono";

  document.body.setAttribute("data-theme", theme);
  document.body.setAttribute("data-bg", palette);
  document.getElementById("themeToggleBtn").querySelector(".theme-icon").textContent = theme === "dark" ? "☼" : "☾";
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
