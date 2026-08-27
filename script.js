let currentPhotoBase64 = "";

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  setDynamicDate();
  loadPreferences();
  renderEntries();

  // Escutar upload de foto
  document.getElementById("entryPhoto").addEventListener("change", handlePhotoUpload);
  
  // Escutar botão de tema
  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);
});

// Atualização dinâmica para o dia atual e próximo ano automaticamente
function setDynamicDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("currentDateTitle").textContent = now.toLocaleDateString('pt-BR', options);
}

// Converter foto para Base64 para guardar localmente
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

// Salvar entrada no localStorage
function saveEntry() {
  const text = document.getElementById("entryText").value.trim();
  if (!text && !currentPhotoBase64) {
    alert("Escreva algo ou adicione uma foto antes de salvar!");
    return;
  }

  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const newEntry = {
    id: Date.now(),
    date: new Date().toLocaleString('pt-BR'),
    text: text,
    photo: currentPhotoBase64
  };

  entries.unshift(newEntry);
  localStorage.setItem("journal_entries", JSON.stringify(entries));

  // Limpar formulário
  document.getElementById("entryText").value = "";
  document.getElementById("entryPhoto").value = "";
  document.getElementById("imagePreviewContainer").innerHTML = "";
  currentPhotoBase64 = "";

  renderEntries();
}

// Renderizar registros salvos
function renderEntries() {
  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const container = document.getElementById("entriesList");

  if (entries.length === 0) {
    container.innerHTML = "<p style='color: var(--text-secondary);'>Nenhum registro encontrado.</p>";
    return;
  }

  container.innerHTML = entries.map(entry => `
    <div class="entry-card">
      <div class="entry-header">
        <span>${entry.date}</span>
        <button onclick="deleteEntry(${entry.id})" style="background:none; color:#ef4444; padding:0; font-size:0.8rem;">Excluir</button>
      </div>
      <p style="white-space: pre-wrap;">${escapeHtml(entry.text)}</p>
      ${entry.photo ? `<img src="${entry.photo}" class="entry-img" alt="Anexo" />` : ''}
    </div>
  `).join("");
}

// Deletar entrada
function deleteEntry(id) {
  let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  entries = entries.filter(entry => entry.id !== id);
  localStorage.setItem("journal_entries", JSON.stringify(entries));
  renderEntries();
}

// Trocar tema Claro/Escuro
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  body.setAttribute("data-theme", newTheme);
  document.getElementById("themeToggleBtn").textContent = newTheme === "dark" ? "🌙 Modo Escuro" : "☀️ Modo Claro";
  localStorage.setItem("journal_theme", newTheme);
}

// Trocar cor de destaque
function changeAccent(color) {
  document.body.setAttribute("data-color", color);
  localStorage.setItem("journal_color", color);
}

// Carregar preferências salvas do usuário
function loadPreferences() {
  const savedTheme = localStorage.getItem("journal_theme") || "dark";
  const savedColor = localStorage.getItem("journal_color") || "blue";

  document.body.setAttribute("data-theme", savedTheme);
  document.body.setAttribute("data-color", savedColor);
  document.getElementById("themeToggleBtn").textContent = savedTheme === "dark" ? "🌙 Modo Escuro" : "☀️ Modo Claro";
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match]));
}
