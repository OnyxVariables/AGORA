#!/usr/bin/env python3
"""
Demostración local: un voto HTTP por DNI usando X-Demo-DNI (requiere APP_ENV=local y AGORA_DEMO_AUTH=true)
Comando: php artisan demo:seed-citizens && php artisan demo:cast-votes <votationId>
Dependencias: pip install requests eth-hash

Ejemplo:
  set AGORA_DEMO_AUTH=true en backend/.env
  python tools/demo_vote_http.py --base-url http://localhost:8000 --votation-id 1 --party-id 1 --dni-file dnis.txt

dnis.txt: una línea por DNI (usuarios ya existentes y activos en BD).
"""

from __future__ import annotations

import argparse
import secrets
import sys
import urllib.parse
from pathlib import Path

import requests
from eth_hash.auto import keccak


def build_vote_hash(nickname: str, codigo_hex: str, votation_id: int) -> str:
    payload = f"{nickname}{codigo_hex}{votation_id}".encode("utf-8")
    return "0x" + keccak(payload).hex()


def xsrf_header(session: requests.Session) -> str | None:
    raw = session.cookies.get("XSRF-TOKEN")
    if raw is None:
        return None
    return urllib.parse.unquote(raw)


def main() -> int:
    p = argparse.ArgumentParser(description="Voto demo vía API (local + AGORA_DEMO_AUTH)")
    p.add_argument("--base-url", required=True, help="URL del backend, ej. http://localhost:8000")
    p.add_argument("--votation-id", type=int, required=True)
    p.add_argument("--party-id", type=int, required=True)
    p.add_argument("--dni-file", type=Path, required=True, help="Texto con un DNI por línea")
    args = p.parse_args()

    base = args.base_url.rstrip("/")
    dnies = [
        line.strip().upper()
        for line in args.dni_file.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if not dnies:
        print("El fichero de DNIs está vacío.", file=sys.stderr)
        return 1

    s = requests.Session()
    s.headers.update(
        {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
        }
    )

    r = s.get(f"{base}/sanctum/csrf-cookie")
    if r.status_code >= 400:
        print(f"CSRF falló ({r.status_code}). ¿URL base correcta y ruta /sanctum/csrf-cookie?", file=sys.stderr)
        return 1

    token = xsrf_header(s)
    if not token:
        print("No se recibió cookie XSRF-TOKEN tras /sanctum/csrf-cookie.", file=sys.stderr)
        return 1

    ok = 0
    for dni in dnies:
        s.headers["X-XSRF-TOKEN"] = token
        s.headers["X-Demo-DNI"] = dni
        login = s.get(f"{base}/api/login-cert")
        if login.status_code >= 400:
            print(f"[{dni}] login-cert {login.status_code}: {login.text[:200]}")
            continue

        me = s.get(f"{base}/api/me")
        if me.status_code >= 400:
            print(f"[{dni}] /api/me {me.status_code}: {me.text[:200]}")
            continue

        data = me.json()
        nickname = data.get("nickname")
        municipality_id = data.get("municipalityId")
        if not nickname:
            print(f"[{dni}] sin nickname en BD; asigna nickname antes de votar.")
            continue

        codigo = secrets.token_hex(32)
        vote_hash = build_vote_hash(nickname, codigo, args.votation_id)
        body = {
            "partyId": args.party_id,
            "votationId": args.votation_id,
            "municipalityId": municipality_id,
            "voteHash": vote_hash,
        }
        vote = s.post(f"{base}/api/vote", json=body)
        if vote.status_code >= 400:
            print(f"[{dni}] vote {vote.status_code}: {vote.text[:300]}")
            continue
        print(f"[{dni}] OK {vote.json()}")
        ok += 1

    print(f"Enviados correctamente: {ok} / {len(dnies)}")
    return 0 if ok == len(dnies) else 1


if __name__ == "__main__":
    raise SystemExit(main())