from flask import Flask, redirect
import webview
import sys
import threading

from src.blueprint.webui import webui
from src.blueprint.api import api

app = Flask(__name__)

app.register_blueprint(webui)
app.register_blueprint(api)

@app.route('/')
def hello_world():
    # return 'Hello World!'
    return redirect('/webui')

def start_server():
    app.run(host='0.0.0.0', port=3000)

if __name__ == '__main__':

    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()

    webview.create_window("PyWebView & Flask", "http://localhost:3000/")
    webview.start()
    sys.exit()