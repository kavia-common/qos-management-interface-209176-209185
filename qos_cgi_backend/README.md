# QoS CGI Backend

Express backend providing CGI-style REST endpoints for QoS management (QDISK-first).

## Run

- Install: npm install
- Dev: npm run dev
- Start: npm start
- API Docs: /docs

.env variables (see `.env.example`):
- PORT, HOST
- QDISC_EXEC_MODE=stub (default)
- DATA_DIR=./data

## Endpoints (QDISKS)

Base path: `/api/qdisks`

- GET `/api/qdisks` — list qdiscs
- GET `/api/qdisks/:id` — get one
- POST `/api/qdisks` — create
- PUT `/api/qdisks/:id` — update
- DELETE `/api/qdisks/:id` — delete

### Create Examples

TBF:
```bash
curl -sS -X POST http://localhost:3000/api/qdisks \
  -H "Content-Type: application/json" \
  -d '{
    "device": "eth0",
    "parent": "root",
    "handle": "1:",
    "kind": "tbf",
    "params": { "rate": "10mbit", "burst": "32k", "latency": "400ms" }
  }'
```

fq_codel:
```bash
curl -sS -X POST http://localhost:3000/api/qdisks \
  -H "Content-Type: application/json" \
  -d '{
    "device": "eth0",
    "parent": "root",
    "kind": "fq_codel",
    "params": { "limit": "1000" }
  }'
```

### Update Example
```bash
curl -sS -X PUT http://localhost:3000/api/qdisks/eth0-root-tbf \
  -H "Content-Type: application/json" \
  -d '{ "params": { "rate": "20mbit", "burst": "64k", "latency": "300ms" } }'
```

### Delete Example
```bash
curl -sS -X DELETE http://localhost:3000/api/qdisks/eth0-root-tbf
```

### Notes

- Persistence is a simple JSON file at `DATA_DIR/qdisks.json`.
- System interaction is stubbed via `QDISC_EXEC_MODE=stub`. A later implementation can replace the executor to run real `tc qdisc` commands.
- Swagger docs are available at `/docs`. The server URL is inferred dynamically from the request host/port.
