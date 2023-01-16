from flask import Blueprint, jsonify, request, request, jsonify, Response

from queue import Queue
import datetime
import time
import json

from src import pickle_obj as pkl
# from . import company
import datetime
import glob
import time
import csv
import os

from werkzeug.exceptions import NotFound, BadRequest, InternalServerError, abort, MethodNotAllowed
# from flask.views import MethodView

api = Blueprint(
    'api',
    __name__,
    url_prefix='/api')

# ---------------------------------------

# @api.after_request
# def after_request(res):
#     res.headers.add('Access-Control-Allow-Headers', 'Content-Type')
#     res.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
#     return res

@api.errorhandler(BadRequest)
@api.errorhandler(NotFound)
@api.errorhandler(InternalServerError)
@api.errorhandler(MethodNotAllowed)
def error_handler(e):
    print(e)
    res = jsonify({
        "error": {
            "name": e.name,
            "description": e.description
        }
    })
    return res, e.code

# ---------------------------------------
# https://tokidoki-web.com/2020/02/flask%E3%81%A7%E7%B0%A1%E6%98%93%E7%89%88%E3%83%97%E3%83%AD%E3%82%B0%E3%83%AC%E3%82%B9%E3%83%90%E3%83%BC%E5%AE%9F%E8%A3%85%E3%81%97%E3%81%A6%E5%87%A6%E7%90%86%E3%81%AE%E9%80%B2%E6%8D%97%E8%A6%8B/
# 進捗パーセンテージ用キュー
queue = Queue()

# プログレスバーストリーム
@api.route('/stream')
def stream():
    response = Response(event_stream(queue), mimetype='text/event-stream')
    response.headers["X-Accel-Buffering"] = "no"
    return response


# Queueの値を取り出してEventSourceの'progress-item'に出力（100だったら'last-item'イベントに出力）
def event_stream(queue):
    while True:
        persent = queue.get(True)
        print("progress：{}%".format(persent))
        sse_event = 'progress-item'
        # if persent == 100:
        #     sse_event = 'last-item'
        yield "event:{event}\ndata:{data}\n\n".format(event=sse_event, data=persent)


@api.route("/ajax", methods=['POST'])
def ajax():
    if request.method == 'POST':
        start = str(datetime.datetime.now())
        print("-------------- {} --------------".format(request.json['data']))
        """
        処理runner_01が終わったら10％まで進行としてキューに追加
        runner_01()
        queue.put(10)
 
        処理runner_02が終わったら20％まで進行としてキューに追加
        runner_02()
        queue.put(20)
        ・・・
        """

        # サンプル用ループ処理（2秒ごとに10パーセントづつ進行）
        for i in range(10, 110, 10):
            queue.put(str(i) + 'test')
            time.sleep(1)

        end = str(datetime.datetime.now())
        result = {"start": start, "end": end}
        return jsonify(json.dumps(result))


# @api.get('/xxx')
# def python_function(val):
#     print(val)  # (val + " from JavaScript")
#     eel.run_js_from_python(val)  # ("result: " + val)
#     time.sleep(3)


@api.get('/xxx6')
def load_labels_from_file():
    return [{"Test": 1, "name": "test"}, {"Test": 2, "name": "testman"}]


def getMembers(val):
    # print(val)
    members = [x.strip() for x in val.split(",")]
    for member in members:
        if len(member) != 6:
            print('Error! ' + member + 'は不正な値です。')
            # eel.pyUpdateMessage('Error! ' + member + 'は不正な値です。')
            return ''
    # eel.pyUpdateMessage('')
    return members


@api.post('/company')
def py_download_company():
    # COMPANYから工数表を取得

    # パラメータを取得
    val = request.json

    # 同期モードに応じてライブラリのインポート
    if val.get('async'):
        from . import mult_web as company  # 非同期処理有効：高速化、サーバー負荷増
    else:
        from src import company
    print(val)
    print('called')

    # パラメータをpickleで一時保存
    pkl.pkl_dumps_loads(val, 'company_cond')

    # membersパラメータを文字列からリスト形式に変換する
    members = getMembers(val['members'])
    val['members'] = members

    print(members)
    if members:
        # COMPANY取得関数を実行
        company.main(val, queue)
        return val


@api.get('/loadconfig')
def load_pickle():
    print(request.args.get('obj_name'))
    print('called load_pickle')
    result = pkl.pkl_loads(request.args.get('obj_name'))
    # print(result)
    return result


@api.get('/xxx3')
def getFileList():
    fileList = glob.glob("./result/*.csv")
    fileList = [x.replace("./result\\", "") for x in fileList]
    # print(fileList)
    return fileList


@api.post('/data')
def getFileDatas():
    """ファイル名一覧から全データを取得

    Args:
        fileList (dict[str, str]): ファイル名リスト

    Returns:
        list[dict[str, str]]: 行を辞書形式で1つのリストにまとめる
        # fileList: dict[str, str]) -> list[dict[str, str]]:
    """
    print(request)
    fileList = request.json['files']
    data = []
    for filename in fileList:
        with open('result/' + filename, encoding='utf-8-sig') as fr:
            csv_data_obj = csv.DictReader(
                fr,
                delimiter=",",
                doublequote=True,
                lineterminator="\r\n",
                quotechar='"',
                skipinitialspace=True)
            csv_data_dict = [row for row in csv_data_obj]
            data.extend(csv_data_dict)

    return data


@api.get('/xxx1')
def hello():
    print('hello2')


# ----------
# Users
# ----------
USERS_CSV = 'tmp/users.csv'
FIELD_NAMES = ['id', 'name', 'status', 'created', 'modified']


@api.get('/users')
def getUsers():
    print('call GetUsers()')
    data = []
    msg = checkUsersFile(USERS_CSV)
    if msg:
        print(msg)
    with open(USERS_CSV, encoding='cp932') as fr:
        csv_data_obj = csv.DictReader(
            fr,
            delimiter=",",
            doublequote=True,
            lineterminator="\n",
            quotechar='"',
            skipinitialspace=True)
        csv_data_dict = [row for row in csv_data_obj]
        data.extend(csv_data_dict)
    return data


def checkUsersFile(csv_path):
    if not os.path.exists(csv_path):
        with open(csv_path, 'w', encoding='cp932') as fw:
            writer = csv.writer(fw)
            writer.writerow(FIELD_NAMES)
        return 'CSVファイルが存在しないため、新規作成しました。'


@api.get('/open')
def openUsersCsv():
    print('call openUsersCsv')
    os.system("start " + os.path.join(os.getcwd(), USERS_CSV))


@api.put('/users')
def updateUser():
    r = request.json
    # print(r)
    users = r['users']
    payload = r['payload']

    print('call ')
    with open(USERS_CSV, 'w', encoding='cp932', newline="") as fw:
        writer = csv.DictWriter(fw, fieldnames=FIELD_NAMES)
        writer.writeheader()
        for index, elem in enumerate(users):
            if index == payload["index"]:
                elem[payload["key"]] = payload["value"]
                elem["modified"] = datetime.datetime.now().strftime("%Y/%m/%d %H:%M")
            writer.writerow(elem)
    return payload


@api.post('/users')
def addUser():
    r = request.json
    # print(r)
    # users = r['users']
    print('call addUser')
    print(datetime.datetime.now())
    with open(USERS_CSV, 'a', encoding='cp932', newline="") as fw:
        writer = csv.DictWriter(fw, fieldnames=FIELD_NAMES)
        newData = {"id": "", "name": "", "created": datetime.datetime.now().strftime("%Y/%m/%d %H:%M"), "modified": ""}
        writer.writerow(newData)
    return newData


@api.delete('/users')
def deleteUser():
    print('call deleteUser')
    r = request.json
    # print(r)
    users = r['users']
    deleteIndex = r['index']
    with open(USERS_CSV, 'w', encoding='cp932', newline="") as fw:
        writer = csv.DictWriter(fw, fieldnames=FIELD_NAMES)
        writer.writeheader()
        for index, elem in enumerate(users):
            if index == deleteIndex:
                result = elem
            else:
                writer.writerow(elem)
    return result
