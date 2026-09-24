#!/usr/bin/env python3
"""Servidor local para desenvolvimento, sem cache.

O `python3 -m http.server` comum deixa o navegador reaproveitar arquivos .js
antigos, então mudanças no código podem não aparecer. Este servidor manda
o navegador sempre buscar a versão atual.

Uso: python3 serve.py [porta]   (padrão: 8000)
"""

import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = http.server.ThreadingHTTPServer(("", port), NoCacheHandler)
    print(f"Jogo em http://localhost:{port}  (Ctrl+C para parar)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
