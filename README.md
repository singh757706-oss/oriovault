# OrioVault — Decentralized Encrypted File Storage

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636.svg)](https://soliditylang.org/)
[![IPFS](https://img.shields.io/badge/IPFS-Kubo%20v0.32-69C4CD.svg)](https://ipfs.tech/)
[![Hardhat](https://img.shields.io/badge/Hardhat-EVM%20Local-yellow.svg)](https://hardhat.org/)
[![Encryption](https://img.shields.io/badge/Security-AES--256--GCM%20%2B%20PBKDF2-blue.svg)](#security--cryptography)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> **Decentralized, zero-knowledge file storage.** Files are encrypted client-side in the browser before ever touching a server, pinned to the IPFS decentralized network, and permanently registered on an EVM blockchain.

---

## 📑 Table of Contents
- [Architecture & Data Flow](#-architecture--data-flow)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Security & Cryptography](#-security--cryptography)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
- [Smart Contract Details](#-smart-contract-details)
- [Environment Configuration](#-environment-configuration)
- [API Reference](#-api-reference)
- [License](#-license)

---

## 🏛 Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER (CLIENT)                         │
│                                                                        │
│  [File] + [Passphrase]                                                │
│      │                                                                 │
│      ▼ (WebCrypto API)                                                 │
│  PBKDF2 (150k iterations, SHA-256, 16-byte salt)                      │
│      ▼                                                                 │
│  AES-256-GCM Encryption (12-byte IV)                                   │
│      │                                                                 │
│      ▼                                                                 │
│  Encrypted Blob [ Salt (16B) | IV (12B) | Ciphertext + Tag ]           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         (Encrypted bytes only)
                                    ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                         NODE.JS / EXPRESS BACKEND                      │
│                                                                        │
│   • Authenticates JWT token                                            │
│   • Streams encrypted buffer to IPFS node                              │
│   • Invokes EVM Smart Contract (`registerFile`)                        │
│   • Appends transaction to immutable activity ledger                   │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
      ┌─────────────────────────┐       ┌─────────────────────────┐
      │       IPFS KUBO         │       │     HARDHAT EVM /       │
      │   (Docker Container)    │       │     ETHEREUM CHAIN      │
      │                         │       │                         │
      │  P2P decentralized      │       │  OrioVaultRegistry.sol  │
      │  content-addressed      │       │  Immutable ownership,   │
      │  storage (CID)          │       │  CID & audit records    │
      └─────────────────────────┘       └─────────────────────────┘
```

---

## ✨ Key Features

- 🔐 **Zero-Knowledge Client-Side Encryption**: Plaintext files and encryption passphrases never leave the user's browser. The backend and IPFS network only ever receive encrypted ciphertext.
- ⚡ **Interactive In-Browser Decryption & Download**: Download encrypted files directly from IPFS and decrypt them in-memory using PBKDF2 + AES-GCM without exposing decrypted bytes to any intermediate server.
- 🌐 **Decentralized Storage (IPFS)**: Encrypted files are stored on IPFS (Kubo) using content-addressed CIDs for censorship-resistant, tamper-proof distribution.
- ⛓ **EVM Blockchain Registry**: Smart contract ([`contracts/OrioVaultRegistry.sol`](./contracts/OrioVaultRegistry.sol)) records file ownership, file CIDs, MIME types, and timestamps on-chain.
- 👥 **Access Sharing**: Share access to stored files with other registered users securely.
- 📜 **Audit Trail & Activity Ledger**: Comprehensive record of all `UPLOAD`, `SHARE`, and `DELETE` events.
- 🛡 **JWT + Bcrypt Authentication**: Secure user management with salted hashed credentials.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES2022) | High-performance, zero-framework UI with WebCrypto API |
| **Backend** | Node.js, Express.js | REST API handling auth, IPFS gateway proxy, and chain interaction |
| **Storage** | IPFS Kubo (Docker) | Decentralized peer-to-peer storage engine |
| **Blockchain** | Solidity `^0.8.24`, Hardhat, Ethers.js v6 | EVM-compatible registry contract and local node |
| **Security** | AES-256-GCM, PBKDF2, Bcrypt, JWT | Multi-layered defense and client-side encryption |

---

## 🔒 Security & Cryptography

Every uploaded file is transformed into a self-contained encrypted payload:

```
[  16 Bytes Salt  ] [  12 Bytes IV  ] [  Ciphertext + 16-Byte AES-GCM Auth Tag  ]
      0 - 15              16 - 27                         28+
```

1. **Key Derivation (PBKDF2)**:
   - Salt: 16 cryptographically secure random bytes (`crypto.getRandomValues`).
   - Iterations: `150,000` rounds of `SHA-256`.
   - Output: 256-bit AES encryption key.
2. **Authenticated Encryption (AES-GCM)**:
   - Initialization Vector (IV): 12 cryptographically random bytes per file.
   - Tag Length: 128-bit authentication tag ensuring ciphertext integrity.
3. **Decryption Guarantee**:
   - Any tampering or incorrect passphrase immediately triggers an AES-GCM authentication failure, preventing corrupted or unauthorized access.

---

## 📋 Prerequisites

Before running the project, make sure you have installed:
- **Node.js**: v20 or higher (`node -v`)
- **Docker & Docker Compose**: For running the IPFS Kubo daemon (`docker --version`)
- **Git**

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/nishchal-gond/OrioVault.git
cd OrioVault

# Install root dependencies (Hardhat, concurrently, serve)
npm install

# Install backend dependencies (Express, Ethers, IPFS client, bcrypt, JWT)
npm --prefix backend install
```

### 2. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

### 3. Start IPFS Kubo Container

Launch the IPFS node using Docker Compose:
```bash
docker compose up -d
```
*Verify it is running: `curl -X POST http://127.0.0.1:5001/api/v0/version`*

### 4. Start Local Blockchain Node

In a new terminal:
```bash
npm run chain
```
This boots Hardhat EVM at `http://127.0.0.1:8545` and outputs local test accounts.

### 5. Deploy Smart Contract

In another terminal, deploy the registry contract to your local chain:
```bash
npm run deploy
```
Copy the printed contract address (e.g. `0x5FbDB2315678afecb367f032d93F642f64180aa3`) into your `.env`:
```env
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 6. Run Backend & Frontend

Start both services:
```bash
# Terminal 1: Backend API (port 4000)
npm run backend

# Terminal 2: Frontend static server (port 5173)
npm run frontend
```

Or run everything simultaneously with:
```bash
npm run dev
```

### 7. Open the App
Visit **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 📜 Smart Contract Details

The contract [`OrioVaultRegistry.sol`](./contracts/OrioVaultRegistry.sol) maintains decentralized records of all files:

```solidity
struct FileRecord {
    address owner;
    string rootCid;
    string name;
    string mimeType;
    uint256 size;
    uint256 createdAt;
    bool active;
}
```

### Key Functions
- `registerFile(string rootCid, string name, string mimeType, uint256 size)`: Records ownership of an IPFS CID on-chain.
- `deleteFile(uint256 id)`: Marks a file as inactive (owner only).
- `getOwnerFiles(address owner)`: Retrieves all file IDs registered by a specific wallet.

---

## ⚙️ Environment Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP API port | `4000` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | `change-this-secret` |
| `IPFS_API` | URL to IPFS Kubo HTTP API | `http://127.0.0.1:5001/api/v0` |
| `RPC_URL` | EVM Blockchain JSON-RPC endpoint | `http://127.0.0.1:8545` |
| `CONTRACT_ADDRESS`| Deployed `OrioVaultRegistry` contract address | Generated on deploy |
| `BLOCKCHAIN_PRIVATE_KEY` | Signer private key for local EVM transactions | Hardhat Account #0 |

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | System health check (backend, IPFS, blockchain) |
| `POST` | `/api/auth/register` | No | Register new user account |
| `POST` | `/api/auth/login` | No | Sign in and receive JWT token |
| `POST` | `/api/ipfs/add` | Yes | Upload and pin an encrypted file blob to IPFS |
| `GET` | `/api/ipfs/:cid` | No | Retrieve encrypted file stream by CID |
| `GET` | `/api/files` | Yes | List files owned by or shared with current user |
| `POST` | `/api/files` | Yes | Register file metadata and record on-chain transaction |
| `POST` | `/api/files/:id/share` | Yes | Share a file with another user |
| `GET` | `/api/events` | Yes | Retrieve immutable activity ledger |
| `DELETE` | `/api/files/:id` | Yes | Mark a file as deleted |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
