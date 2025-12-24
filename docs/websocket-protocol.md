# WebSocket Protocol Specification

Dokumen ini menjelaskan **protokol resmi WebSocket** yang digunakan oleh server dan client:

- `@sejator/ws-server`
- `@sejator/ws-client`

Dokumen ini berfungsi sebagai:

- Kontrak komunikasi server ↔ client
- Referensi implementasi SDK lain (Web, Mobile, Backend)
- Pencegah breaking change

---

## 🔌 Connection Lifecycle

### ➜ Server → Client

### `ws_internal:connect_success`

```json
{
  "event": "ws_internal:connect_success",
  "data": {
    "socket_id": "abc123xyz",
    "activity_timeout": 30
  }
}
```

| Field            | Type   | Required | Description              |
| ---------------- | ------ | -------- | ------------------------ |
| socket_id        | string | ✅       | Unique socket identifier |
| activity_timeout | number | ✅       | Ping interval (seconds)  |

---

## ❤️ Heartbeat

### ➜ Client → Server

### `ws:ping`

```json
{ "event": "ws:ping" }
```

### ➜ Server → Client

### `ws:pong`

```json
{ "event": "ws:pong" }
```

---

## 📡 Channel Subscription

### `ws:subscribe`

```json
{
  "event": "ws:subscribe",
  "channel": "public-orders"
}
```

### `ws_internal:subscribe_success`

```json
{
  "event": "ws_internal:subscribe_success",
  "channel": "public-orders",
  "data": {
    "socket_id": "abc123xyz",
    "timestamp": 1710000000000
  }
}
```

### `ws_internal:subscribe_error`

Event ini dikirim jika proses subscribe gagal.

```json
{
  "event": "ws_internal:subscribe_error",
  "channel": "public-orders",
  "message": "ALREADY_SUBSCRIBED"
}
```

Possible message values
| Message | Description |
| -------------------- | ------------------------------------- |
| `ALREADY_SUBSCRIBED` | Socket sudah terdaftar di channel |
| `AUTH_REQUIRED` | Channel private membutuhkan auth |
| `INVALID_SIGNATURE` | Signature private channel tidak valid |

> Client HARUS menganggap error ini non-fatal dan tetap menjaga koneksi.

---

## 📦 Publish Event (Business Event)

```json
{
  "event": "order.created",
  "channel": "public-orders",
  "data": {
    "order_id": 123,
    "amount": 20000
  }
}
```

---

## ❌ Error Event

```json
{
  "event": "ws_internal:error",
  "message": "INVALID_JSON"
}
```

---

## 🧭 Channel Naming Rules

| Type     | Format                      | Example                     |
| -------- | --------------------------- | --------------------------- |
| Public   | public-\* atau `my-channel` | public-orders atau `orders` |
| Private  | private-\*                  | private-orders              |
| Presence | presence-\*                 | presence-room.1             |

---

## Kontak & Dukungan

Maintainer: [@sejator](https://github.com/sejator)\
Email: [sejatordev@gmail.com](sejatordev@gmail.com)\
Donasi: [https://saweria.co/sejator](https://saweria.co/sejator)
