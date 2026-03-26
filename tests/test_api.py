import os
import subprocess
import time
import requests
import signal
import tempfile
import json
from pathlib import Path
import socket
import sys
import threading

BASE_DIR = Path(__file__).resolve().parent.parent
NODE = 'node'
SERVER_SCRIPT = BASE_DIR / 'backend' / 'server.js'

def wait_for(url, timeout=5.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(url, timeout=0.5)
            return True
        except Exception:
            time.sleep(0.1)
    return False


def start_server(tmp_users_path, timeout=5.0):
    # pick a free port to avoid conflicts with existing servers
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    host, port = s.getsockname()
    s.close()

    env = os.environ.copy()
    env['USERS_FILE'] = str(tmp_users_path)
    env['PORT'] = str(port)
    print(f"[test] Starting server on port={port} with USERS_FILE={tmp_users_path}")
    proc = subprocess.Popen([NODE, str(SERVER_SCRIPT)], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # stream server stdout/stderr to test stdout to make server logs visible
    def _stream(reader, prefix):
        for line in iter(reader.readline, b''):
            try:
                sys.stdout.buffer.write(prefix + line)
                sys.stdout.buffer.flush()
            except Exception:
                pass

    if proc.stdout:
        threading.Thread(target=_stream, args=(proc.stdout, b'[server][out] '), daemon=True).start()
    if proc.stderr:
        threading.Thread(target=_stream, args=(proc.stderr, b'[server][err] '), daemon=True).start()

    url = f'http://127.0.0.1:{port}/api/users'
    if not wait_for(url, timeout=timeout):
        # capture output for debugging
        try:
            out, err = proc.communicate(timeout=1)
        except Exception:
            out, err = (b'', b'')
        proc.kill()
        raise RuntimeError(f"Server did not start in time. stdout={out}\nstderr={err}")

    # ensure subprocess is still running
    if proc.poll() is not None:
        out, err = proc.communicate(timeout=1)
        raise RuntimeError(f"Server process exited prematurely. stdout={out}\nstderr={err}")

    return proc, port


def stop_server(proc):
    try:
        proc.send_signal(signal.SIGINT)
        proc.wait(timeout=2)
    except Exception:
        proc.kill()


def test_register_and_auth():
    # create temporary users file
    with tempfile.TemporaryDirectory() as td:
        tmp_users = Path(td) / 'tmp_users.json'
        # ensure file exists
        tmp_users.write_text('[]')
        proc, port = start_server(tmp_users)
        try:
            url = f'http://127.0.0.1:{port}'
            user = { 'name': 'Кабаканов Темирхан', 'email': 'xilay.den@gmail.com', 'pass': 'XilaY_deNs_1994' }
            r = requests.post(f'{url}/api/users', json=user, timeout=2)
            assert r.status_code == 201
            data = r.json()
            print(f"[test] Registered user: {data.get('email')}")
            assert data['email'] == user['email']

            auth = requests.post(f'{url}/api/auth', json={'email': user['email'], 'pass': user['pass']}, timeout=2)
            assert auth.status_code == 200
            a = auth.json()
            print(f"[test] Authenticated user: {a.get('email')}")
            assert a['email'] == user['email']

            # ensure users persisted
            all_users = requests.get(f'{url}/api/users', timeout=2).json()
            assert any(u['email'] == user['email'] for u in all_users)
            print(f"[test] Persistence check passed, total users: {len(all_users)}")
        finally:
            stop_server(proc)
    print('[test] test_register_and_auth completed')
