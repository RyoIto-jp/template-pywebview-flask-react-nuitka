from flask import Flask, redirect
from flask_cors import CORS
from screeninfo import get_monitors
import webview
import sys

from src.blueprint.webui import webui
from src.blueprint.api import api

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False     # 日本語文字化け対策
app.config["JSON_SORT_KEYS"] = False    # ソートをそのまま

CORS(app)                               # CORS対策

app.register_blueprint(webui)
app.register_blueprint(api)


def get_primary_screensize():
    screens = get_monitors()
    for screen in screens:
        if screen.is_primary:
            return screen


@app.route('/')
def index():
    # return "hello World!"
    return redirect('/webui')


if __name__ == '__main__':

    pri_screen = get_primary_screensize()

    screen_width = int(pri_screen.width *
                       0.8) if pri_screen.width > 1250 else 1000
    screen_height = int(pri_screen.height * 0.8)
    print(screen_width)

    # webview.create_window("PyWebView & Flask", "http://localhost:3100")
    webview.create_window("PyWebView & Flask", app,
                          width=screen_width, height=screen_height)
    webview.start(debug=True)
    sys.exit()
