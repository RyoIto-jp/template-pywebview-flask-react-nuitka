from flask import Flask, redirect
import webview
import sys
import threading
from time import time
from blueprint.webui import webui

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False     # 日本語文字化け対策
app.config["JSON_SORT_KEYS"] = False    # ソートをそのまま

app.register_blueprint(webui)

@app.route('/')
def index():
    # return "hello World!"
    return redirect('/webui')

@app.route('/h')
def hello_world():
    return 'Hello World!'

# def start_server():
#     app.run(host='0.0.0.0', port=3100)

def set_interval(interval):
    def decorator(function):
        def wrapper(*args, **kwargs):
            stopped = threading.Event()

            def loop(): # executed in another thread
                while not stopped.wait(interval): # until stopped
                    function(*args, **kwargs)

            t = threading.Thread(target=loop)
            t.daemon = True # stop if the program exits
            t.start()
            return stopped
        return wrapper
    return decorator

@set_interval(1)
def update_ticker():
    if len(webview.windows) > 0:
        webview.windows[0].evaluate_js('window.pywebview.state.setTicker("%d")' % time())


if __name__ == '__main__':

    # webview.create_window("PyWebView & Flask", "http://localhost:3100")
    webview.create_window("PyWebView & Flask", app)
    webview.start(update_ticker, debug=True)
    sys.exit()