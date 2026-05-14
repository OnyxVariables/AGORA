# Postman – AGORA

1. Import `AGORA_API.postman_collection.json` and `AGORA_dev.postman_environment.json`.
2. Start the stack (`compose.dev.yml`) so Laravel is available at `http://localhost:8000`.
3. Run **Auth → CSRF cookie**, then copy the `XSRF-TOKEN` cookie value into the environment variable `xsrf_token` (Postman can read cookies if you use the Postman Cookie manager for the domain).
4. Run **Login cert** (dev mode uses hardcoded admin DNI in `CertAuthController`).
5. Execute the rest of the folder (admin vs citizen flows as appropriate).

**Newman (CLI):**

```bash
npx newman run docs/postman/AGORA_API.postman_collection.json -e docs/postman/AGORA_dev.postman_environment.json
```
