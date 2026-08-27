let currentPhotoBase64 = "";
let currentAudioBase64 = "";
let mediaRecorder = null;
let audioChunks = [];
let recordingTimerInterval = null;
let recordingSeconds = 0;
let isRecording = false;

let editingId = null;
let currentTab = "active"; // "active", "reminders" ou "trash"
let selectedFilterDate = null;
let currentCalendarDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
  setDynamicDate();
  loadPreferences();
  cleanOldTrashEntries();
  setDefaultReminderDate();
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

function setDefaultReminderDate() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  document.getElementById("reminderDate").value = todayStr;
}

// Lógica de Lembretes & Sincronização com Agenda do Celular
function addReminder() {
  const title = document.getElementById("reminderTitle").value.trim();
  const dateVal = document.getElementById("reminderDate").value;
  const timeVal = document.getElementById("reminderTime").value;

  if (!title || !dateVal || !timeVal) {
    alert("Preencha o título, a data e a hora do lembrete.");
    return;
  }

  const reminders = JSON.parse(localStorage.getItem("journal_reminders") || "[]");
  
  const newReminder = {
    id: Date.now(),
    title: title,
    date: dateVal,
    time: timeVal,
    completed: false
  };

  reminders.unshift(newReminder);
  localStorage.setItem("journal_reminders", JSON.stringify(reminders));

  document.getElementById("reminderTitle").value = "";
  renderEntries();
}

function toggleReminderStatus(id) {
  let reminders = JSON.parse(localStorage.getItem("journal_reminders") || "[]");
  reminders = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
  localStorage.setItem("journal_reminders", JSON.stringify(reminders));
  renderEntries();
}

function deleteReminder(id) {
  let reminders = JSON.parse(localStorage.getItem("journal_reminders") || "[]");
  reminders = reminders.filter(r => r.id !== id);
  localStorage.setItem("journal_reminders", JSON.stringify(reminders));
  renderEntries();
}

// Abrir e Sincronizar na Agenda Nativa do Aparelho (iOS / Android)
function syncToCalendar(title, dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');

  const startDate = new Date(year, month - 1, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min de duração

  const isoStart = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const isoEnd = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

  // Detecta se é dispositivo Apple (iPhone, iPad, Mac)
  const isAppleDevice = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);

  if (isAppleDevice) {
    // Formato estrito para o Calendário do iOS
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Diario de Bordo//PT',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DTSTART:${isoStart}`,
      `DTEND:${isoEnd}`,
      'DESCRIPTION:Lembrete do Diário de Bordo',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Usa Data URI com redirecionamento direto, que o Safari no iOS entende nativamente
    const uri = 'data:text/calendar;charset=utf8,' + encodeURIComponent(icsData);
    
    // Abre no Safari acionando o aplicativo de Calendário do iPhone
    window.location.href = uri;
  } else {
    // Para Android/Windows mantém o Google Agenda
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${isoStart}/${isoEnd}&details=${encodeURIComponent('Criado pelo Diário de Bordo')}`;
    window.open(googleCalendarUrl, '_blank');
  }
}
// Alternar entre Memórias, Lembretes e Lixeira
function switchTab(tab) {
  currentTab = tab;
  document.getElementById("tabActive").classList.toggle("active", tab === "active");
  document.getElementById("tabReminders").classList.toggle("active", tab === "reminders");
  document.getElementById("tabTrash").classList.toggle("active", tab === "trash");

  const reminderBox = document.getElementById("reminderFormContainer");
  if (tab === "reminders") {
    reminderBox.classList.remove("hidden");
  } else {
    reminderBox.classList.add("hidden");
  }

  renderEntries();
}

function renderEntries() {
  const container = document.getElementById("entriesList");

  // Atualizar contador de Lembretes
  const reminders = JSON.parse(localStorage.getItem("journal_reminders") || "[]");
  document.getElementById("remindersCount").textContent = reminders.filter(r => !r.completed).length;

  if (currentTab === "reminders") {
    if (reminders.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhum lembrete registrado.</p>`;
      return;
    }

    container.innerHTML = reminders.map(r => {
      const [y, m, d] = r.date.split('-');
      const formattedDate = `${d}/${m}/${y}`;

      return `
        <article class="entry-card" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" ${r.completed ? 'checked' : ''} onchange="toggleReminderStatus(${r.id})" style="width:18px; height:18px; cursor:pointer;" />
              <span style="font-size:1rem; ${r.completed ? 'text-decoration:line-through; opacity:0.6;' : ''}">${escapeHtml(r.title)}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">📅 ${formattedDate} às ${r.time}</div>
          </div>
          <div class="card-actions">
            <button class="action-btn" onclick="syncToCalendar('${escapeHtml(r.title)}', '${r.date}', '${r.time}')" title="Adicionar à Agenda do Celular">📅 Sincronizar</button>
            <button class="action-btn delete" onclick="deleteReminder(${r.id})">Apagar</button>
          </div>
        </article>
      `;
    }).join("");
    return;
  }

  // Renderizar Memórias ou Lixeira
  const entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");
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
        ${entry.text ? `<div class="entry-body">${escapeHtml(entry.text)}</div>` : ''}
        ${entry.audio ? `<audio controls src="${entry.audio}" class="entry-audio"></audio>` : ''}
        ${entry.photo ? `<img src="${entry.photo}" class="entry-img" alt="Anexo" />` : ''}
      </article>
    `;
  }).join("");
}

async function toggleRecording() {
  const recordBtn = document.getElementById("recordAudioBtn");

  if (!isRecording) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Atenção: A gravação de áudio exige conexão segura (HTTPS).");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          currentAudioBase64 = reader.result;
          const audioPreview = document.getElementById("audioPreview");
          audioPreview.src = currentAudioBase64;
          audioPreview.classList.remove("hidden");
          document.getElementById("removeAudioBtn").classList.remove("hidden");
        };
      };

      mediaRecorder.start(100);
      isRecording = true;
      recordBtn.textContent = "🛑 Parar Gravação";
      recordBtn.style.backgroundColor = "#ef4444";
      recordBtn.style.color = "#ffffff";

      document.getElementById("audioRecorderContainer").classList.remove("hidden");
      startTimer();
    } catch (err) {
      alert("Não foi possível acessar o microfone. Verifique a permissão do seu navegador.");
    }
  } else {
    stopRecording();
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;

    const recordBtn = document.getElementById("recordAudioBtn");
    recordBtn.textContent = "🎙️ Gravar Áudio";
    recordBtn.style.backgroundColor = "";
    recordBtn.style.color = "";

    stopTimer();
  }
}

function startTimer() {
  recordingSeconds = 0;
  const timerDisplay = document.getElementById("recordingTimer");
  recordingTimerInterval = setInterval(() => {
    recordingSeconds++;
    const mins = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
    const secs = String(recordingSeconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() { clearInterval(recordingTimerInterval); }

function removeAudio() {
  currentAudioBase64 = "";
  document.getElementById("audioPreview").src = "";
  document.getElementById("audioPreview").classList.add("hidden");
  document.getElementById("audioRecorderContainer").classList.add("hidden");
  document.getElementById("removeAudioBtn").classList.add("hidden");
  document.getElementById("recordingTimer").textContent = "00:00";
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
  if (isRecording) stopRecording();

  const textInput = document.getElementById("entryText");
  const text = textInput.value.trim();

  if (!text && !currentPhotoBase64 && !currentAudioBase64) return;

  let entries = JSON.parse(localStorage.getItem("journal_entries") || "[]");

  if (editingId) {
    entries = entries.map(entry => {
      if (entry.id === editingId) {
        return {
          ...entry,
          text: text,
          photo: currentPhotoBase64,
          audio: currentAudioBase64
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
      audio: currentAudioBase64,
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

  document.getElementById("entryText").value = entry.text || "";
  editingId = id;

  if (entry.audio) {
    currentAudioBase64 = entry.audio;
    const audioPreview = document.getElementById("audioPreview");
    audioPreview.src = currentAudioBase64;
    audioPreview.classList.remove("hidden");
    document.getElementById("audioRecorderContainer").classList.remove("hidden");
    document.getElementById("removeAudioBtn").classList.remove("hidden");
  } else {
    removeAudio();
  }

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

function cancelEdit() { resetForm(); }

function resetForm() {
  editingId = null;
  currentPhotoBase64 = "";
  removeAudio();
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
