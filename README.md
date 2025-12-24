# WebSocket Platform

**Protocol:** v1 (stable)  
**Server:** Production-ready  
**Publisher:** Stateless & scalable  
**Client:** Reconnect-safe & protocol-strict

---

## 📌 Overview

WebSocket Platform dengan arsitektur **server – client – publisher** yang terpisah, aman, dan scalable.

Dirancang untuk kebutuhan event real-time seperti **order**, **payment**, **notification**, dan event bisnis lainnya, dengan konsep **publisher tidak langsung terkoneksi ke WebSocket**.

---

## 🧩 Architecture

Diagram berikut menunjukkan alur komunikasi utama dalam WebSocket Platform:

```
┌──────────────────┐     HTTP POST          ┌────────────────────────┐
│    Publisher     │ ───────────────────▶  │   WebSocket Server     │
│  (PHP / Backend) │                        │   (NestJS + ws)        │
└──────────────────┘                        └───────────┬────────────┘
                                                        │
                                                        │ WebSocket
                                                        ▼
                                              ┌────────────────────────┐
                                              │  Web / Mobile Client   │
                                              │  (@sejator/ws-client)  │
                                              └────────────────────────┘
```

- **Publisher**
  - Mengirim event melalui HTTP/POST
  - Stateless dan mudah di-scale horizontal
  - Cocok untuk backend PHP, Node.js, Golang, dll

- **WebSocket Server**
  - Menjadi perantara utama distribusi event
  - Mengelola koneksi client secara real-time
  - Menjamin kompatibilitas protocol v1

- **Client**
  - Terhubung melalui WebSocket
  - Aman terhadap reconnect
  - Wajib mematuhi spesifikasi protocol

## 🔁 Redis (Shared State)

```
┌──────────────────────────────────────────────┐
│               Redis                          │
│----------------------------------------------│
│ ws_server:socket:{socketId}     → appId      │
│ ws_server:activity:{socketId}   → timestamp  │
│ ws_server:replay:{socketId}:{channel}        │
│ ws_server:presence:{channel}    → counter    │
└──────────────────────────────────────────────┘
```

Redis menjadi single source of truth untuk validasi socket & activity.

---

## 🛠️ Installation & Setup

Panduan ini menjelaskan cara menjalankan WebSocket Server secara lokal
setelah clone repository dari GitHub.

### Prerequisites

- Node.js ≥ 18
- PostgreSQL
- Redis
- Git

### Clone Repository

```bash
git clone https://github.com/sejator/ws-server.git
cd ws-server
```

### Install Dependencies

```bash
npm install
```

### Environment Configuration

```bash
cp .env.example .env
```

### Database Migration

```bash
npm run prisma:migrate
```

### Run Server

```bash
npm run start:dev
```

---

## 🚀 Publisher (Backend)

Publisher **TIDAK** terkoneksi langsung ke WebSocket.
Event dikirim ke server melalui **HTTP POST**.

### Endpoint

```

POST /api/events/{APP_KEY}

```

### Header Wajib

```http
Content-Type: application/json
X-Timestamp: 1734512345
X-Signature: <hex_hmac>
```

> Timestamp → Unix epoch (seconds)

### 🔐 Signature Validation

```txt
Signature dihitung menggunakan HMAC SHA256 dengan format:

HMAC_SHA256(
  APP_KEY + "." + X-Timestamp,
  APP_SECRET
)

Catatan:
- Timestamp harus berada dalam rentang ±5 menit

Request ditolak jika:
- Timestamp kedaluwarsa
- Signature tidak valid
```

### Payload Contoh

```json
{
  "channel": "my-channel",
  "event": "order.created",
  "data": {
    "order_id": 123,
    "amount": 50000
  }
}
```

---

## ✅ Response Standar

Server **selalu** mengembalikan response informatif.

```json
{
  "success": true,
  "code": 201,
  "data": {
    "event_id": "xxx-xxx-xxx",
    "channel": "my-channel",
    "event": "order.created",
    "delivered": true,
    "subscribers": 2,
    "message": "Event berhasil dikirim ke subscriber yang aktif"
  }
}
```

## ❌ Error Response

```json
{
  "success": false,
  "code": 401,
  "message": "Signature tidak valid"
}
```

### Catatan Penting

- `success = true` → request valid & diterima
- `delivered = false` → **BUKAN error**
- Event tetap dicatat untuk logging & retry

---

## 🧠 Event Delivery

| Kondisi             | Arti                        |
| ------------------- | --------------------------- |
| **HTTP 201**        | Event diterima server       |
| `delivered = true`  | Ada subscriber aktif        |
| `delivered = false` | Channel sedang kosong       |
| **HTTP 401**        | APP_KEY / Signature invalid |

> **No subscriber ≠ error**

---

## 📦 SDK Resmi

| SDK                       | Status |
| ------------------------- | ------ |
| `@sejator/ws-client` (TS) | ✅     |
| `sejator/ws-server-php`   | ✅     |
| Mobile SDK                | ⏳     |

---

## 🔐 Protocol

- Versi: **v1**
- Status: **Stable**
- Strict validation untuk payload & event
- Backward compatible untuk minor update

---

## 🚀 Production Ready

Fitur utama:

- Real-time event delivery berbasis WebSocket
- Publisher via **HTTP Webhook** (PHP, Node.js, dll)
- Client Web / Mobile via WebSocket murni
- Stateless publisher & scalable server
- Security dengan **APP_KEY + HMAC Signature**

---

## 📮 Postman API Collection

Untuk mempermudah integrasi dan pengujian, tersedia Postman Collection lengkap yang berisi semua endpoint API yang diperlukan — termasuk contoh request, header, body, dan response.

📌 Kamu bisa mengakses dokumentasi resmi di Postman berikut:
[https://documenter.getpostman.com/view/20500330/2sB3dWr6Ta](https://documenter.getpostman.com/view/20500330/2sB3dWr6Ta)

---

## Kontak & Dukungan

Maintainer: [@sejator](https://github.com/sejator)\
Email: [sejatordev@gmail.com](sejatordev@gmail.com)\
Donasi: [https://saweria.co/sejator](https://saweria.co/sejator)
