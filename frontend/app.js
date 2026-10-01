const API = 'http://localhost:4000/api';
let token = localStorage.getItem('ov_token'),
    user = localStorage.getItem('ov_user'),
    view = 'vault';
const app = document.getElementById('app');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

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
  x.textContent = s;
  document.body.append(x);
  setTimeout(() => x.remove(), duration);
  return x;
}

function authPage(mode = 'login') {
  app.innerHTML = `
    <div class="login">
      <section class="hero">
        <h1>Files that no single server owns</h1>
        <p>OrioVault encrypts files in your browser, stores encrypted content on IPFS, and records ownership metadata on an EVM blockchain.</p>
        <p class="meta">Real frontend + Node.js backend + IPFS + Solidity.</p>
      </section>
      <section class="form">
        <form class="card" id="auth">
          <div class="row">
            <button type="button" data-mode="login">Sign in</button>
            <button type="button" data-mode="register">Create account</button>
          </div>
          <label>Username</label>
          <input name="username" required minlength="3">
          <label>Password</label>
          <input name="password" type="password" required minlength="6">
          <p class="err" id="err"></p>
          <button class="pri" style="width:100%">${mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
      </section>
    </div>`;

  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => authPage(b.dataset.mode));
  document.getElementById('auth').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const d = await api('/auth/' + (mode === 'login' ? 'login' : 'register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(f))
      });
      if (mode === 'register') {
        toast('Account created! Please sign in.');
        return authPage('login');
      }
      token = d.token;
      user = d.username;
      localStorage.setItem('ov_token', token);
      localStorage.setItem('ov_user', user);
      render();
    } catch (x) {
      document.getElementById('err').textContent = x.message;
    }
  };
}

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
  if (buf.byteLength < 28) throw new Error('File is too small to be a valid OrioVault encrypted file');

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

  const downloadBlob = new Blob([plain], { type: mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(downloadBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  // Allow download to complete before revoking object URL
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 30000);
}

function showDecryptModal(cid, fileName, mimeType) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Decrypt & Download</h3>
      <p class="meta">File: <b>${esc(fileName)}</b></p>
      <form id="decrypt-form">
        <label for="decrypt-pass">Enter your decryption passphrase</label>
        <input id="decrypt-pass" type="password" required autofocus placeholder="Passphrase entered during upload" style="margin-bottom:.8rem">
        <div class="row" style="justify-content:flex-end">
          <button type="button" id="modal-cancel">Cancel</button>
          <button type="submit" class="pri" id="modal-submit">Decrypt & Save</button>
        </div>
        <div id="decrypt-status" class="status-box"></div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const passInput = overlay.querySelector('#decrypt-pass');
  const statusBox = overlay.querySelector('#decrypt-status');
  const submitBtn = overlay.querySelector('#modal-submit');
  const cancelBtn = overlay.querySelector('#modal-cancel');

  passInput.focus();

  const close = () => overlay.remove();
  cancelBtn.onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };

  overlay.querySelector('#decrypt-form').onsubmit = async e => {
    e.preventDefault();
    const pass = passInput.value;
    if (!pass) return;

    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    statusBox.className = 'status-box info';
    statusBox.textContent = '1/3 Fetching encrypted file from IPFS…';

    try {
      const res = await fetch(`${API}/ipfs/${encodeURIComponent(cid)}`);
      if (!res.ok) throw new Error(`Could not fetch from IPFS (status ${res.status})`);
      const blob = await res.blob();

      statusBox.textContent = '2/3 Deriving PBKDF2 key and decrypting AES-256-GCM…';
      await decryptFile(blob, pass, fileName, mimeType);

      statusBox.className = 'status-box success';
      statusBox.textContent = '3/3 Decrypted successfully! Download started.';
      toast(`Downloaded "${fileName}"!`);
      setTimeout(close, 1200);
    } catch (err) {
      console.error('Decryption failed:', err);
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
      statusBox.className = 'status-box error';
      if (err.name === 'OperationError' || !err.message || err.message.includes('operation-specific')) {
        statusBox.textContent = 'Decryption failed: Incorrect passphrase! Please verify and try again.';
      } else {
        statusBox.textContent = 'Error: ' + err.message;
      }
    }
  };
}

async function uploadPage() {
  app.querySelector('main').innerHTML = `
    <h2>Upload File</h2>
    <form class="card" id="upload">
      <label>File</label>
      <input type="file" name="file" required>
      <label>Passphrase</label>
      <input type="password" name="pass" minlength="6" required placeholder="Choose a passphrase to encrypt this file">
      <p class="meta">The passphrase never leaves your browser. Files are encrypted client-side using AES-256-GCM before storage on IPFS.</p>
      <button class="pri">Encrypt & upload to IPFS</button>
      <p id="status" class="meta" style="margin-top:.8rem"></p>
    </form>`;

  document.getElementById('upload').onsubmit = async e => {
    e.preventDefault();
    const file = e.target.file.files[0];
    const pass = e.target.pass.value;
    const s = document.getElementById('status');
    const btn = e.target.querySelector('button.pri');

    try {
      btn.disabled = true;
      s.textContent = '1/3 Encrypting file with AES-256-GCM in browser…';
      const encrypted = await encryptFile(file, pass);

      s.textContent = '2/3 Sending encrypted blob to IPFS node…';
      const fd = new FormData();
      fd.append('file', encrypted, file.name + '.ovenc');
      const ipfsRes = await api('/ipfs/add', { method: 'POST', body: fd });

      s.textContent = '3/3 Registering file record on blockchain & ledger…';
      await api('/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootCid: ipfsRes.cid,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size
        })
      });

      toast('Uploaded and pinned to IPFS: ' + ipfsRes.cid);
      view = 'vault';
      render();
    } catch (x) {
      btn.disabled = false;
      s.textContent = 'Upload failed: ' + x.message;
    }
  };
}

async function vault() {
  const fs = await api('/files');
  return `
    <h2>Your vault</h2>
    ${fs.length ? fs.map(f => `
      <div class="card file">
        <h3>${esc(f.name)}</h3>
        <div class="meta">${f.size.toLocaleString()} bytes · Owner: ${esc(f.owner)} · ${new Date(f.createdAt).toLocaleString()}</div>
        <div class="mono" style="margin:.4rem 0">IPFS CID: ${esc(f.rootCid)}</div>
        ${f.txHash ? `<div class="mono meta">Tx: ${esc(f.txHash)}</div>` : ''}
        <div class="row">
          <button class="pri" data-download="${esc(f.rootCid)}" data-name="${esc(f.name)}" data-mime="${esc(f.mimeType)}">Decrypt & Download</button>
          <button data-copy="${esc(f.rootCid)}">Copy CID</button>
          <a target="_blank" href="${API}/ipfs/${encodeURIComponent(f.rootCid)}"><button type="button">Raw IPFS</button></a>
          <button data-share="${f.id}">Share</button>
        </div>
      </div>
    `).join('') : '<div class="card">No files yet. Use the Upload tab to encrypt and store files.</div>'}
  `;
}

async function ledger() {
  const e = await api('/events');
  return `
    <h2>Activity ledger</h2>
    <div class="card">
      ${e.length ? e.map(x => `
        <div style="padding:.7rem 0;border-bottom:1px solid var(--line)">
          <b>${esc(x.type)}</b>
          <div class="meta">${new Date(x.at).toLocaleString()} · ${esc(x.by || x.from || '')}</div>
          ${x.txHash ? `<div class="mono meta">Tx: ${esc(x.txHash)}</div>` : ''}
        </div>
      `).join('') : 'No events.'}
    </div>
  `;
}

function team() {
  return `
    <h2>Project team</h2>
    <div class="grid">
      ${[
        ['Utsav Gond', 'Frontend and UI'],
        ['Suhas H', 'Backend and integration'],
        ['Prashanth Erappa Shetteppanavar', 'Blockchain and IPFS'],
        ['Shrihari M Mantur', 'Security and testing']
      ].map(x => `
        <div class="card">
          <h3>${esc(x[0])}</h3>
          <p class="meta">${esc(x[1])}</p>
        </div>
      `).join('')}
    </div>
  `;
}

async function render() {
  if (!token) return authPage();

  app.innerHTML = `
    <header class="header">
      <b>OrioVault</b>
      <nav class="nav">
        ${['vault', 'upload', 'ledger', 'team'].map(v => `
          <button class="${view === v ? 'active' : ''}" data-view="${v}">${v[0].toUpperCase() + v.slice(1)}</button>
        `).join('')}
      </nav>
      <span class="meta">${esc(user)}</span>
      <button id="logout">Sign out</button>
    </header>
    <main><div id="content">Loading…</div></main>
  `;

  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
    view = b.dataset.view;
    render();
  });

  document.getElementById('logout').onclick = () => {
    token = user = null;
    localStorage.clear();
    render();
  };

  const c = document.getElementById('content');
  c.innerHTML = view === 'vault' ? await vault()
              : view === 'upload' ? (await uploadPage(), c.innerHTML)
              : view === 'ledger' ? await ledger()
              : team();

  document.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => {
    navigator.clipboard.writeText(b.dataset.copy).then(() => toast('CID copied to clipboard'));
  });

  document.querySelectorAll('[data-share]').forEach(b => b.onclick = async () => {
    const u = prompt('Username to share with:');
    if (!u) return;
    try {
      await api('/files/' + b.dataset.share + '/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u })
      });
      toast('Shared file with ' + u);
      render();
    } catch (x) {
      toast(x.message);
    }
  });

  document.querySelectorAll('[data-download]').forEach(b => {
    b.onclick = () => {
      showDecryptModal(b.dataset.download, b.dataset.name, b.dataset.mime);
    };
  });
}

render();
