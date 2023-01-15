from flask import Flask, redirect
from flask_cors import CORS
import webview
import sys
import threading
from time import time
from src.blueprint.webui import webui
from src.blueprint.api import api

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False     # 日本語文字化け対策
app.config["JSON_SORT_KEYS"] = False    # ソートをそのまま

CORS(app)                               # CORS対策

app.register_blueprint(webui)
app.register_blueprint(api)



@app.route('/')
def index():
    # return "hello World!"
    return redirect('/webui')

# @app.route('/h')
# def hello_world():
#     return 'Hello World!'


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

    screen_width = int(webview.screens[0].width * 0.8) if webview.screens[0].width > 1250 else 1000
    screen_height = int(webview.screens[0].height * 0.8)
    print(screen_width) 

    # webview.create_window("PyWebView & Flask", "http://localhost:3100")
    webview.create_window("PyWebView & Flask", app, width=screen_width, height=screen_height)
    webview.start(update_ticker, debug=True)
    sys.exit()