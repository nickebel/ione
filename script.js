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
  document.getElementById("currentDateTitle").textContent = now.toLocaleDateString('pt-BR', options);
}

function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    currentPhotoBase64 = event.target.result;
    document.getElementById("imagePreviewContainer").innerHTML = 
      `<img src="${currentPhotoBase64}" class="preview-img" alt="Prévia" />`;
  };
  reader.readAsDataURL(file);
}

function saveEntry() {
  const text = document.getElementById("entryText").value.trim();
  if (!text && !currentPhotoBase64) {
    alert("Escreva algo ou adicione uma foto!");
    return;
  }

  let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");

  if (editingId) {
    // Editar registro existente
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
    editingId = null;
    document.getElementById("saveBtn").textContent = "Salvar Registro";
  } else {
    // Criar novo registro
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString('pt-BR'),
      text: text,
      photo: currentPhotoBase64
    };
    entries.unshift(newEntry);
  }

  localStorage.setItem("journal_entries", JSON.stringify(entries));

  // Limpar campos
  document.getElementById("entryText").value = "";
  document.getElementById("entryPhoto").value = "";
  document.getElementById("imagePreviewContainer").innerHTML = "";
  currentPhotoBase64 = "";

  renderEntries();
}

function renderEntries() {
  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const container = document.getElementById("entriesList");

  if (entries.length === 0) {
    container.innerHTML = "<p style='color: var(--text-secondary);'>Nenhum registro até agora.</p>";
    return;
  }

  container.innerHTML = entries.map(entry => `
    <div class="entry-card">
      <div class="entry-header">
        <span>${entry.date}</span>
        <div class="entry-actions">
          <button class="btn-edit" onclick="editEntry(${entry.id})">✏️ Editar</button>
          <button class="btn-delete" onclick="deleteEntry(${entry.id})">🗑️ Apagar</button>
        </div>
      </div>
      <p style="white-space: pre-wrap;">${escapeHtml(entry.text)}</p>
      ${entry.photo ? `<img src="${entry.photo}" class="entry-img" alt="Foto" />` : ''}
    </div>
  `).join("");
}

// Preenche o formulário para edição
function editEntry(id) {
  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const entryToEdit = entries.find(e => e.id === id);

  if (entryToEdit) {
    document.getElementById("entryText").value = entryToEdit.text;
    currentPhotoBase64 = entryToEdit.photo || "";
    
    if (currentPhotoBase64) {
      document.getElementById("imagePreviewContainer").innerHTML = 
        `<img src="${currentPhotoBase64}" class="preview-img" alt="Prévia" />`;
    } else {
      document.getElementById("imagePreviewContainer").innerHTML = "";
    }

    editingId = id;
    document.getElementById("saveBtn").textContent = "Atualizar Registro";
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Apagar registro
function deleteEntry(id) {
  if (confirm("Tem certeza que deseja apagar este registro?")) {
    let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem("journal_entries", JSON.stringify(entries));
    renderEntries();
  }
}

// Trocar Fundo Inteiro
function changeBg(colorName) {
  document.body.setAttribute("data-bg", colorName);
  localStorage.setItem("journal_bg", colorName);
}

// Trocar Tema (Escuro / Claro)
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  body.setAttribute("data-theme", newTheme);
  document.getElementById("themeToggleBtn").textContent = newTheme === "dark" ? "🌙 Escuro" : "☀️ Claro";
  localStorage.setItem("journal_theme", newTheme);
}

function loadPreferences() {
  const savedTheme = localStorage.getItem("journal_theme") || "dark";
  const savedBg = localStorage.getItem("journal_bg") || "default";

  document.body.setAttribute("data-theme", savedTheme);
  document.body.setAttribute("data-bg", savedBg);
  document.getElementById("themeToggleBtn").textContent = savedTheme === "dark" ? "🌙 Escuro" : "☀️ Claro";
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match]));
}
