from flask import Flask, redirect
from flask_cors import CORS



from src.blueprint.webui import webui
from src.blueprint.api import api


app = Flask(__name__, template_folder='templates',
            static_folder='static')
app.config['JSON_AS_ASCII'] = False     # 日本語文字化け対策
app.config["JSON_SORT_KEYS"] = False    # ソートをそのまま


@app.after_request
def after_request(res):
    res.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    res.headers.add('Access-Control-Allow-Methods',
                    'GET,PUT,POST,DELETE,OPTIONS')
    return res


# todo: エンドポイント毎に割り当てる方法を確認する
CORS(app)                               # CORS対策

# todo: blueprint
app.register_blueprint(webui)
app.register_blueprint(api)


@app.route("/favicon.ico")
def favicon():
    return app.send_static_file("./favicon.ico")

# -----------------------------------------------------------------
# ルーティング
# -----------------------------------------------------------------


@app.route('/')
def index():
    # return "hello World!"
    return redirect('/webui')



if __name__ == '__main__':
    # 公開設定 => host='0.0.0.0'で別ホスト接続許可
    app.run(host='0.0.0.0', port=5000, debug=True)
