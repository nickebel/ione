:root {
  --bg-primary: #f1f5f9;
  --bg-card: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-color: #cbd5e1;
  --accent-color: #2563eb;
}

/* Modo Escuro Padrão */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-card: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-color: #334155;
}

/* Alteração Completa da Cor de Fundo (Temas Customizados) */
[data-bg="blue"] { --bg-primary: #1e3a8a; }
[data-bg="green"] { --bg-primary: #064e3b; }
[data-bg="purple"] { --bg-primary: #4c1d95; }
[data-bg="warm"] { --bg-primary: #7c2d12; }

/* Para modo claro com cores de fundo */
[data-theme="light"][data-bg="blue"] { --bg-primary: #dbeafe; }
[data-theme="light"][data-bg="green"] { --bg-primary: #d1fae5; }
[data-theme="light"][data-bg="purple"] { --bg-primary: #f3e8ff; }
[data-theme="light"][data-bg="warm"] { --bg-primary: #ffedd5; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  margin: 0;
  padding: 20px;
  transition: background-color 0.3s ease;
}

.container { max-width: 800px; margin: 0 auto; }

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon { font-size: 2rem; }

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

button {
  background-color: var(--accent-color);
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.color-picker { display: flex; gap: 8px; }
.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--bg-card);
}
.color-dot.default { background-color: #64748b; }
.color-dot.blue { background-color: #2563eb; }
.color-dot.green { background-color: #059669; }
.color-dot.purple { background-color: #7c3aed; }
.color-dot.warm { background-color: #ea580c; }

.entry-form, .entry-card {
  background-color: var(--bg-card);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-bottom: 24px;
}

textarea {
  width: 100%;
  height: 120px;
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  box-sizing: border-box;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.file-label {
  background-color: var(--border-color);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

input[type="file"] { display: none; }

.preview-img, .entry-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-top: 12px;
  object-fit: cover;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.entry-actions button {
  background: none;
  padding: 4px 8px;
  margin-left: 4px;
  font-size: 0.8rem;
}
.btn-edit { color: #3b82f6; }
.btn-delete { color: #ef4444; }
