let currentPhotoBase64 = "";
let editingId = null;
let currentTab = "active";
let selectedFilterDate = null;
let currentCalendarDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
  setDynamicDate();
  loadPreferences();
  cleanOldTrashEntries();
  renderCalendar();
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

  const reader = new FileReader();
  reader.onload = function (event) {
    currentPhotoBase64 = event.target.result;
    document.getElementById("imagePreviewContainer").innerHTML = 
      `<img src="${currentPhotoBase64}" class="preview-img" alt="Prévia" />`;
    document.getElementById("removePhotoBtn").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function removeSelectedPhoto() {
  currentPhotoBase64 = "";
  document.getElementById("entryPhoto").value = "";
  document.getElementById("imagePreviewContainer").innerHTML = "";
  document.getElementById("removePhotoBtn").classList.add("hidden");
}

function saveEntry() {
  const textInput = document.getElementById("entryText");
  const text = textInput.value.trim();

  if (!text && !currentPhotoBase64) return;

  let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");

  if (editingId) {
    entries = entries.map(entry => {
      if (entry.id === editingId) {
        return {
          ...entry,
          text: text,
          photo: currentPhotoBase64
        };
      }
      return entry;
    });
  } else {
    const now = new Date();
    const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const formattedDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    const newEntry = {
      id: Date.now(),
      isoDate: isoDate,
      date: formattedDate,
      text: text,
      photo: currentPhotoBase64,
      deletedAt: null
    };
    entries.unshift(newEntry);
  }

  localStorage.setItem("journal_entries", JSON.stringify(entries));
  resetForm();
  renderCalendar();
  renderEntries();
}

function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  document.getElementById("calendarMonthYear").textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const activeEntries = entries.filter(e => !e.deletedAt);

  let html = "";
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const hasEntry = activeEntries.some(e => e.isoDate === dateKey);
    const isSelected = selectedFilterDate === dateKey;

    html += `
      <div class="calendar-day ${hasEntry ? 'has-entry' : ''} ${isSelected ? 'selected' : ''}" 
           onclick="selectCalendarDate('${dateKey}')">
        ${day}
      </div>
    `;
  }

  document.getElementById("calendarDays").innerHTML = html;
}

function changeMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderCalendar();
}

function selectCalendarDate(dateKey) {
  if (selectedFilterDate === dateKey) {
    clearDateFilter();
  } else {
    selectedFilterDate = dateKey;
    const [y, m, d] = dateKey.split('-');
    document.getElementById("filterLabel").textContent = `Filtrado por: ${d}/${m}/${y}`;
    document.getElementById("filterInfo").classList.remove("hidden");
    renderCalendar();
    renderEntries();
  }
}

function clearDateFilter() {
  selectedFilterDate = null;
  document.getElementById("filterInfo").classList.add("hidden");
  renderCalendar();
  renderEntries();
}

function renderEntries() {
  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const container = document.getElementById("entriesList");

  let filtered = entries.filter(e => currentTab === "trash" ? e.deletedAt !== null : !e.deletedAt);

  if (selectedFilterDate && currentTab === "active") {
    filtered = filtered.filter(e => e.isoDate === selectedFilterDate);
  }

  const trashCount = entries.filter(e => e.deletedAt !== null).length;
  document.getElementById("trashCount").textContent = trashCount;

  if (filtered.length === 0) {
    const msg = selectedFilterDate 
      ? "Nenhuma nota registrada nesta data." 
      : (currentTab === "trash" ? "Nenhuma nota na lixeira." : "Nenhum registro até o momento.");
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">${msg}</p>`;
    return;
  }

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  container.innerHTML = filtered.map(entry => {
    let daysRemaining = 30;
    if (entry.deletedAt) {
      const elapsed = now - entry.deletedAt;
      daysRemaining = Math.max(0, Math.ceil((THIRTY_DAYS - elapsed) / (1000 * 60 * 60 * 24)));
    }

    return `
      <article class="entry-card">
        <div class="entry-meta">
          <div>
            <time class="entry-date">${entry.date}</time>
            ${currentTab === "trash" ? `<span class="trash-warning">(Apaga em ${daysRemaining}d)</span>` : ''}
          </div>
          <div class="card-actions">
            ${currentTab === "active" ? `
              <button class="action-btn" onclick="editEntry(${entry.id})">Editar</button>
              <button class="action-btn delete" onclick="moveToTrash(${entry.id})">Apagar</button>
            ` : `
              <button class="action-btn" onclick="restoreEntry(${entry.id})">Restaurar</button>
              <button class="action-btn delete" onclick="permanentDelete(${entry.id})">Excluir Definitivamente</button>
            `}
          </div>
        </div>
        <div class="entry-body">${escapeHtml(entry.text)}</div>
        ${entry.photo ? `<img src="${entry.photo}" class="entry-img" alt="Anexo" />` : ''}
      </article>
    `;
  }).join("");
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById("tabActive").classList.toggle("active", tab === "active");
  document.getElementById("tabTrash").classList.toggle("active", tab === "trash");
  renderEntries();
}

function moveToTrash(id) {
  let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  entries = entries.map(e => e.id === id ? { ...e, deletedAt: Date.now() } : e);
  localStorage.setItem("journal_entries", JSON.stringify(entries));
  renderCalendar();
  renderEntries();
}

function restoreEntry(id) {
  let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  entries = entries.map(e => e.id === id ? { ...e, deletedAt: null } : e);
  localStorage.setItem("journal_entries", JSON.stringify(entries));
  renderCalendar();
  renderEntries();
}

function permanentDelete(id) {
  if (confirm("Deseja excluir definitivamente? Esta ação é irreversível.")) {
    let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem("journal_entries", JSON.stringify(entries));
    renderCalendar();
    renderEntries();
  }
}

function cleanOldTrashEntries() {
  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const validEntries = entries.filter(e => {
    if (!e.deletedAt) return true;
    return (now - e.deletedAt) < THIRTY_DAYS;
  });

  localStorage.setItem("journal_entries", JSON.stringify(validEntries));
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
    document.getElementById("removePhotoBtn").classList.remove("hidden");
  } else {
    removeSelectedPhoto();
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
  document.getElementById("imagePreviewContainer").innerHTML = "";
  document.getElementById("removePhotoBtn").classList.add("hidden");
  document.getElementById("saveBtn").textContent = "Publicar";
  document.getElementById("cancelBtn").classList.add("hidden");
}

function setPalette(palette) {
  document.body.setAttribute("data-palette", palette);
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
  const palette = localStorage.getItem("journal_palette") || "tweed";

  document.body.setAttribute("data-theme", theme);
  document.body.setAttribute("data-palette", palette);
  document.getElementById("themeToggleBtn").querySelector(".theme-icon").textContent = theme === "dark" ? "☼" : "☾";
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
