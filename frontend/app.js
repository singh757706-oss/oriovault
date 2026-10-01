const API = 'http://localhost:4000/api';
let token = localStorage.getItem('ov_token');
let user = localStorage.getItem('ov_user');
let view = 'vault';
let cachedFiles = [];
let searchQuery = '';

const app = document.getElementById('app');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(name = '', mime = '') {
  const ext = name.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext) || mime.startsWith('image/')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
  }
  if (ext === 'pdf' || mime.includes('pdf')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12v6"/><path d="M10 15h3a1.5 1.5 0 0 0 0-3h-3"/></svg>`;
  }
  if (['py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'sol'].includes(ext)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;
}

async function api(path, opt = {}) {
  opt.headers = { ...(opt.headers || {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) };
  const r = await fetch(API + path, opt);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(d.error || 'Request failed');
  return d;
}

function toast(s, duration = 3000) {
  const x = document.createElement('div');
  x.className = 'toast';
  x.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
    <span>${esc(s)}</span>
  `;
  document.body.append(x);
  setTimeout(() => x.remove(), duration);
  return x;
}

/* ================= AUTHENTICATION ================= */
function authPage(mode = 'login') {
  app.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-brand">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        <h1>OrioVault</h1>
      </div>
      <div class="auth-card">
        <div class="auth-header">
          <h2>${mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
          <p>${mode === 'login' ? 'Sign in to access your encrypted files' : 'Zero-knowledge client-side encrypted storage'}</p>
        </div>
        <div class="tab-switch">
          <button type="button" class="${mode === 'login' ? 'active' : ''}" data-mode="login">Sign In</button>
          <button type="button" class="${mode === 'register' ? 'active' : ''}" data-mode="register">Create Account</button>
        </div>
        <form id="auth-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" placeholder="Enter your username" required minlength="3" autocomplete="username">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" placeholder="••••••••" required minlength="6" autocomplete="current-password">
            <p class="input-hint">Minimum 6 characters required</p>
          </div>
          <div class="form-err" id="err"></div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:0.5rem">
            ${mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  `;

  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => authPage(b.dataset.mode));
  document.getElementById('auth-form').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const errEl = document.getElementById('err');
    errEl.textContent = '';
    try {
      const d = await api('/auth/' + (mode === 'login' ? 'login' : 'register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(f))
      });
      if (mode === 'register') {
        toast('Account created successfully! Please sign in.');
        return authPage('login');
      }
      token = d.token;
      user = d.username;
      localStorage.setItem('ov_token', token);
      localStorage.setItem('ov_user', user);
      render();
    } catch (x) {
      errEl.textContent = x.message;
    }
  };
}

/* ================= CRYPTOGRAPHY ================= */
async function encryptFile(file, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const buf = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buf));
  const out = new Uint8Array(28 + ct.length);
  out.set(salt);
  out.set(iv, 16);
  out.set(ct, 28);
  return new Blob([out], { type: 'application/octet-stream' });
}

async function decryptFile(blob, password, fileName, mimeType) {
  const enc = new TextEncoder();
  const buf = await blob.arrayBuffer();
  if (buf.byteLength < 28) throw new Error('File format invalid or corrupted');

  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 28);
  const ct = buf.slice(28);

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(salt), iterations: 150000, hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    ct
  );

  const isPdf = fileName.toLowerCase().endsWith('.pdf') || (mimeType && mimeType.includes('pdf'));
  const finalMime = isPdf ? 'application/pdf' : (mimeType || 'application/octet-stream');
  const downloadBlob = new Blob([plain], { type: finalMime });
  const url = URL.createObjectURL(downloadBlob);

  // Attempt automatic download
  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 1000);
  } catch (e) {
    console.warn('Programmatic download trigger failed, falling back to manual link:', e);
  }

  return { plain, url, blob: downloadBlob, isPdf, byteLength: plain.byteLength };
}

/* ================= DECRYPT MODAL ================= */
function showDecryptModal(cid, fileName, mimeType) {
  let cachedEncryptedBlob = null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Decrypt & Download</h3>
        <button type="button" class="btn-icon" id="modal-close" style="border:none;background:transparent">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:1.2rem">
        File: <b style="color:var(--text-main)">${esc(fileName)}</b>
      </p>
      <div id="modal-body">
        <form id="decrypt-form">
          <div class="form-group">
            <label for="decrypt-pass">Decryption Passphrase</label>
            <input id="decrypt-pass" type="password" required autofocus placeholder="Enter passphrase used when uploading">
            <p class="input-hint">AES-256-GCM authenticated client-side decryption</p>
          </div>
          <div class="row" style="display:flex;gap:0.6rem;justify-content:flex-end;margin-top:1.5rem">
            <button type="button" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="modal-submit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Decrypt & Save
            </button>
          </div>
          <div id="decrypt-status" class="status-box"></div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const passInput = overlay.querySelector('#decrypt-pass');
  const statusBox = overlay.querySelector('#decrypt-status');
  const submitBtn = overlay.querySelector('#modal-submit');
  const cancelBtn = overlay.querySelector('#modal-cancel');
  const closeBtn = overlay.querySelector('#modal-close');
  const modalBody = overlay.querySelector('#modal-body');

  passInput.focus();

  let activeBlobUrl = null;
  const close = () => {
    if (activeBlobUrl) {
      setTimeout(() => URL.revokeObjectURL(activeBlobUrl), 30000);
    }
    overlay.remove();
  };

  cancelBtn.onclick = close;
  closeBtn.onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };

  overlay.querySelector('#decrypt-form').onsubmit = async e => {
    e.preventDefault();
    const pass = passInput.value;
    if (!pass) return;

    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    statusBox.className = 'status-box info';

    try {
      if (!cachedEncryptedBlob) {
        statusBox.textContent = '1/3 Fetching encrypted file from IPFS network…';
        const res = await fetch(`${API}/ipfs/${encodeURIComponent(cid)}`);
        if (!res.ok) throw new Error(`Could not fetch file from IPFS (status ${res.status})`);
        cachedEncryptedBlob = await res.blob();
      }

      statusBox.textContent = '2/3 Deriving PBKDF2 key and decrypting AES-256-GCM…';
      const result = await decryptFile(cachedEncryptedBlob, pass, fileName, mimeType);
      activeBlobUrl = result.url;

      // Render success state with direct download and view buttons
      modalBody.innerHTML = `
        <div style="text-align:center;padding:1rem 0">
          <div style="width:52px;height:52px;border-radius:50%;background:var(--success-light);color:var(--success);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h4 style="font-size:1.15rem;font-weight:700;margin-bottom:0.35rem;color:var(--text-main)">Decryption Successful!</h4>
          <p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:1.5rem">
            ${esc(fileName)} (${formatBytes(result.byteLength)}) is decrypted and ready.
          </p>

          <div style="display:flex;flex-direction:column;gap:0.75rem">
            <a href="${result.url}" download="${esc(fileName)}" class="btn-primary" style="text-decoration:none;padding:0.75rem 1.25rem;font-size:0.95rem;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Click Here to Download ${result.isPdf ? 'PDF' : 'File'}
            </a>
            ${result.isPdf ? `
              <a href="${result.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">
                <button type="button" style="width:100%;padding:0.65rem 1rem">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  Open PDF in Browser Tab
                </button>
              </a>
            ` : ''}
            <button type="button" id="modal-done" style="margin-top:0.5rem">Done</button>
          </div>
        </div>
      `;

      overlay.querySelector('#modal-done').onclick = close;
      toast(`Decrypted "${fileName}"!`);
    } catch (err) {
      console.error('Decryption failed:', err);
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
      statusBox.className = 'status-box error';
      if (err.name === 'OperationError' || !err.message || err.message.includes('operation-specific')) {
        statusBox.textContent = 'Decryption failed: Incorrect passphrase! The key does not match this file. Please re-enter the passphrase used during upload.';
      } else {
        statusBox.textContent = 'Error: ' + err.message;
      }
      passInput.focus();
      passInput.select();
    }
  };
}

/* ================= PAGES ================= */
async function vault() {
  cachedFiles = await api('/files');
  const displayFiles = searchQuery
    ? cachedFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : cachedFiles;

  return `
    <div class="page-header">
      <div class="page-title">
        <h2>Your Vault</h2>
        <p>Decentralized encrypted files stored on IPFS and EVM smart contracts</p>
      </div>
      <button class="btn-primary" data-nav="upload">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        Upload File
      </button>
    </div>

    ${cachedFiles.length > 0 ? `
      <div class="vault-controls">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="vault-search" placeholder="Search files by name…" value="${esc(searchQuery)}">
        </div>
        <div style="font-size:0.85rem;color:var(--text-muted);font-weight:500">
          Showing ${displayFiles.length} of ${cachedFiles.length} file${cachedFiles.length === 1 ? '' : 's'}
        </div>
      </div>
    ` : ''}

    ${displayFiles.length === 0 ? `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M3 15h6"/>
          <path d="M6 12v6"/>
        </svg>
        <h3>${searchQuery ? 'No matching files found' : 'No files in your vault yet'}</h3>
        <p>${searchQuery ? 'Try clearing your search term to see all files.' : 'Upload your first file to encrypt it locally and pin it across IPFS.'}</p>
        ${searchQuery ? `
          <button type="button" id="clear-search">Clear Search</button>
        ` : `
          <button class="btn-primary" data-nav="upload">Upload File Now</button>
        `}
      </div>
    ` : `
      <div class="files-grid">
        ${displayFiles.map(f => `
          <div class="file-card">
            <div>
              <div class="file-card-top">
                <div class="file-icon">
                  ${getFileIcon(f.name, f.mimeType)}
                </div>
                <div class="file-info">
                  <div class="file-name" title="${esc(f.name)}">${esc(f.name)}</div>
                  <div class="file-meta">
                    ${formatBytes(f.size)} · ${new Date(f.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}
                  </div>
                </div>
              </div>
              <div class="file-cid-chip" title="IPFS CID: ${esc(f.rootCid)}">
                <span class="cid-text">CID: ${esc(f.rootCid)}</span>
                <button type="button" class="btn-icon" data-copy="${esc(f.rootCid)}" title="Copy CID" style="border:none;background:transparent;padding:2px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            </div>
            <div class="file-card-actions">
              <button class="btn-primary btn-sm" data-download="${esc(f.rootCid)}" data-name="${esc(f.name)}" data-mime="${esc(f.mimeType)}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Decrypt & Save
              </button>
              <button class="btn-sm" data-share="${f.id}" title="Share with user">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                Share
              </button>
              <a target="_blank" href="${API}/ipfs/${encodeURIComponent(f.rootCid)}" style="text-decoration:none">
                <button type="button" class="btn-sm" title="View raw IPFS stream">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                  IPFS
                </button>
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

async function uploadPage() {
  return `
    <div class="upload-container">
      <div class="page-header" style="justify-content:center;text-align:center;margin-bottom:2rem">
        <div class="page-title">
          <h2>Upload & Encrypt File</h2>
          <p>Files are encrypted client-side using AES-256-GCM before uploading to IPFS</p>
        </div>
      </div>

      <div class="auth-card" style="max-width:100%">
        <form id="upload-form">
          <div class="dropzone" id="dropzone">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
              <path d="M12 12v9"/>
              <path d="m16 16-4-4-4 4"/>
            </svg>
            <div class="dropzone-title">Click to browse or drag & drop file</div>
            <div class="dropzone-desc">Any document, image, or archive (up to 25 MB)</div>
            <input type="file" id="file-input" style="display:none" required>
            <div id="file-pill" class="selected-file-pill" style="display:none">
              <span id="file-pill-name"></span>
              <button type="button" id="remove-file" class="btn-icon" style="background:transparent;border:none;padding:2px;color:inherit">✕</button>
            </div>
          </div>

          <div class="form-group">
            <label for="pass">Encryption Passphrase</label>
            <input type="password" id="pass" required minlength="6" placeholder="Choose a secure passphrase">
            <p class="input-hint">Your passphrase derives a local 256-bit AES key. It is never transmitted to the server.</p>
          </div>

          <div id="upload-status" class="status-box"></div>

          <button type="submit" class="btn-primary" id="upload-btn" style="width:100%;margin-top:1.2rem">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            Encrypt & Upload to IPFS
          </button>
        </form>
      </div>
    </div>
  `;
}

async function ledger() {
  const events = await api('/events');
  return `
    <div class="page-header">
      <div class="page-title">
        <h2>Activity Ledger</h2>
        <p>Immutable audit trail of all vault operations and blockchain interactions</p>
      </div>
    </div>

    ${events.length === 0 ? `
      <div class="empty-state">
        <h3>No activity recorded yet</h3>
        <p>Upload or share a file to generate transactions on the ledger.</p>
      </div>
    ` : `
      <div class="ledger-list">
        ${events.map(x => `
          <div class="ledger-item">
            <div class="ledger-left">
              <span class="badge badge-${x.type.toLowerCase()}">${esc(x.type)}</span>
              <div>
                <div style="font-weight:600;font-size:0.92rem;color:var(--text-main)">
                  ${x.type === 'UPLOAD' ? `File uploaded by <b>${esc(x.by)}</b>` : x.type === 'SHARE' ? `File shared by <b>${esc(x.from)}</b> with <b>${esc(x.to)}</b>` : `File removed`}
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.2rem">
                  ${new Date(x.at).toLocaleString()}
                </div>
              </div>
            </div>
            ${x.txHash ? `
              <div class="file-cid-chip" style="margin:0;max-width:240px" title="Tx: ${esc(x.txHash)}">
                <span class="cid-text">Tx: ${esc(x.txHash.slice(0, 10))}…${esc(x.txHash.slice(-6))}</span>
                <button type="button" class="btn-icon" data-copy="${esc(x.txHash)}" title="Copy Tx Hash" style="border:none;background:transparent;padding:2px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `}
  `;
}

/* ================= MAIN RENDER ================= */
async function render() {
  if (!token) return authPage();

  const userInitial = (user || 'U').charAt(0).toUpperCase();

  app.innerHTML = `
    <header class="app-header">
      <div class="header-container">
        <a href="#" class="header-brand" id="brand-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>OrioVault</span>
        </a>

        <nav class="nav-links">
          <button class="nav-item ${view === 'vault' ? 'active' : ''}" data-view="vault">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            <span>Vault</span>
            <span class="nav-badge" id="nav-count" style="display:none">0</span>
          </button>
          <button class="nav-item ${view === 'upload' ? 'active' : ''}" data-view="upload">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            <span>Upload</span>
          </button>
          <button class="nav-item ${view === 'ledger' ? 'active' : ''}" data-view="ledger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Ledger</span>
          </button>
        </nav>

        <div class="header-user">
          <div class="status-indicator" title="Connected to local IPFS Kubo & Hardhat EVM">
            <span class="status-dot"></span>
            <span>IPFS & EVM Active</span>
          </div>
          <div class="user-pill">
            <div class="avatar">${esc(userInitial)}</div>
            <span class="username">${esc(user)}</span>
          </div>
          <button id="logout" class="btn-sm" title="Sign out of OrioVault">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>
    </header>

    <main class="main-wrapper">
      <div id="content">Loading…</div>
    </main>
  `;

  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
    view = b.dataset.view;
    render();
  });

  const brandLink = document.getElementById('brand-link');
  if (brandLink) {
    brandLink.onclick = e => {
      e.preventDefault();
      view = 'vault';
      render();
    };
  }

  document.getElementById('logout').onclick = () => {
    token = user = null;
    localStorage.clear();
    render();
  };

  const c = document.getElementById('content');
  if (view === 'vault') {
    c.innerHTML = await vault();
    const countBadge = document.getElementById('nav-count');
    if (countBadge && cachedFiles.length) {
      countBadge.style.display = 'inline-block';
      countBadge.textContent = cachedFiles.length;
    }
  } else if (view === 'upload') {
    c.innerHTML = await uploadPage();
    setupUploadHandlers();
  } else if (view === 'ledger') {
    c.innerHTML = await ledger();
  }

  // Quick navigation buttons inside pages (e.g. Empty State or Header button)
  document.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = () => {
      view = b.dataset.nav;
      render();
    };
  });

  // Search input handler
  const searchInput = document.getElementById('vault-search');
  if (searchInput) {
    searchInput.oninput = e => {
      searchQuery = e.target.value;
      vault().then(html => {
        c.innerHTML = html;
        wireVaultButtons();
        const newSearch = document.getElementById('vault-search');
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      });
    };
  }

  const clearSearchBtn = document.getElementById('clear-search');
  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      searchQuery = '';
      render();
    };
  }

  wireVaultButtons();
}

function wireVaultButtons() {
  document.querySelectorAll('[data-copy]').forEach(b => {
    b.onclick = () => {
      navigator.clipboard.writeText(b.dataset.copy).then(() => toast('Copied to clipboard!'));
    };
  });

  document.querySelectorAll('[data-share]').forEach(b => {
    b.onclick = async () => {
      const u = prompt('Enter username to share with:');
      if (!u) return;
      try {
        await api('/files/' + b.dataset.share + '/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u })
        });
        toast('File shared with ' + u);
        render();
      } catch (x) {
        toast(x.message);
      }
    };
  });

  document.querySelectorAll('[data-download]').forEach(b => {
    b.onclick = () => {
      showDecryptModal(b.dataset.download, b.dataset.name, b.dataset.mime);
    };
  });
}

function setupUploadHandlers() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const filePill = document.getElementById('file-pill');
  const filePillName = document.getElementById('file-pill-name');
  const removeFileBtn = document.getElementById('remove-file');
  const form = document.getElementById('upload-form');
  const statusBox = document.getElementById('upload-status');
  const uploadBtn = document.getElementById('upload-btn');

  let selectedFile = null;

  dropzone.onclick = e => {
    if (e.target !== removeFileBtn && !removeFileBtn.contains(e.target)) {
      fileInput.click();
    }
  };

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, e => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, e => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
    });
  });

  dropzone.addEventListener('drop', e => {
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.onchange = () => {
    if (fileInput.files && fileInput.files.length) {
      setFile(fileInput.files[0]);
    }
  };

  function setFile(f) {
    selectedFile = f;
    filePillName.textContent = `${f.name} (${formatBytes(f.size)})`;
    filePill.style.display = 'flex';
  }

  removeFileBtn.onclick = e => {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    filePill.style.display = 'none';
  };

  form.onsubmit = async e => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    const pass = document.getElementById('pass').value;
    if (!pass || pass.length < 6) {
      alert('Passphrase must be at least 6 characters');
      return;
    }

    uploadBtn.disabled = true;
    statusBox.className = 'status-box info';
    statusBox.textContent = '1/3 Encrypting file client-side with AES-256-GCM…';

    try {
      const encrypted = await encryptFile(selectedFile, pass);

      statusBox.textContent = '2/3 Pinning encrypted blob to IPFS network…';
      const fd = new FormData();
      fd.append('file', encrypted, selectedFile.name + '.ovenc');
      const ipfsRes = await api('/ipfs/add', { method: 'POST', body: fd });

      statusBox.textContent = '3/3 Registering ownership on EVM contract & ledger…';
      await api('/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootCid: ipfsRes.cid,
          name: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          size: selectedFile.size
        })
      });

      statusBox.className = 'status-box success';
      statusBox.textContent = 'Upload complete! Stored on IPFS: ' + ipfsRes.cid;
      toast('File encrypted and uploaded to IPFS!');
      setTimeout(() => {
        view = 'vault';
        render();
      }, 1000);
    } catch (err) {
      uploadBtn.disabled = false;
      statusBox.className = 'status-box error';
      statusBox.textContent = 'Upload failed: ' + err.message;
    }
  };
}

render();
