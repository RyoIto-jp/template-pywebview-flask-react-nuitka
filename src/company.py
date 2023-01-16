# 自分の勤怠情報を取得
import csv
import requests
from bs4 import BeautifulSoup
# from requests_html import HTMLSession
import datetime as dt
import time
import sys

start_time = time.time()

# ヘッダーからレポートの状態を取得する関数 
def getReportStatus(header_text):
    # 用いる文字列を辞書で定義する 
    choices = {
        "この期間の勤務データはまだ月次提出": "状態：未入力",
        "この期間の勤務データは既に提出され": "第１段階の承認待ち",
        "この期間の実績はすでに承認済です。": "最終承認済み"
    }
   # ヘッダー文字列をカラムが入力されているかどうかをチェック 
    for choice in choices:
        # もしヘッダー文字列が辞書に定義されていれば 
        if choice in header_text:
            # Trueなら該当のカラムを返す 
            return choices[choice]
            break
    # Falseならなにもないを返す 
    return "empty"

# Name属性からvalueを取得する 
def form_getattrs_value(element, name_key):
    # 要素からname属性がname_keyかつtype属性がhiddenの値を取得し、その名前をrに格納 
    r = element.find(
        'input', attrs={'name': name_key, 'type': 'hidden'})
    # 取得したrの属性のvalueを返す 
    return r.get_attribute_list('value')[0]  # type:ignore

# ログイン要求を行う関数 
def login_request(url, user_cred):
    # URLからログインページを取得し、現在のセッション情報を取得する 
    response_0 = requests.get(url)
    soup_login = BeautifulSoup(response_0.text, 'lxml')

    # ログイン処理 
    r = session.post(
        url=url,
        data={
            "uid": user_cred['id'],
            "pwd": user_cred['pw'],
            "@SID": form_getattrs_value(soup_login, "@SID"),
            "@SN": form_getattrs_value(soup_login, "@SN"),
            "@FN": form_getattrs_value(soup_login, "@FN"),
            "@FS": form_getattrs_value(soup_login, "@FS"),
            "TMZ_MIN": "",
            "login": "ログイン",
        }
    )

    # ログイン完了の出力 
    print('ログイン完了', time.time() - start_time)
    # ログイン要求の結果を返す 
    return r


def page_frame_request():
    # ----
    # 勤怠情報を取得するためのパラメータを取得する
    r = session.get(
        url="https://gcws3.outsourcing.co.jp/cws/cws?@SID=null&@SUB=root.cws.shuro.personal.term_kinmu_input&@SN=root.cws.shuro.personal.term_kinmu_input&@FN=form_shuro"
    )

    bs = BeautifulSoup(r.text, 'lxml')
    print('勤怠用パラメータ取得', time.time() - start_time)
    return bs

def page_worktime_request(page_frame):
    # ----
    # 勤怠情報を取得する
    data = {
        "@SID": "",
        "@SQ": form_getattrs_value(page_frame, "@SQ"),
        "@SN": "root.cws.shuro.personal.term_kinmu_input",
        "@FN": form_getattrs_value(page_frame, "@SN"),
        "@FS": "I",
        "@SRACT": "NONE",
        "@SRSNDF": "jp.co.worksap.companyweb.service.shuro.term_kinmu_input_commons.forms.FormWaitingMessage",
        "@SRSNDC": "NONE",
        "@SRCMD0": "NONE",
        "@SRCMD1": "NONE",
        "@SRCMD2": "NONE",
        "@SRCMD3": "NONE",
        "@SRCMD4": "NONE",
        "posX": "0",
        "posY": "0",
        "scrollDivPosX": "0",
        "scrollDivPosY": "0",
        "dummy": ""
    }

    mykintai = session.post(
        url=LOGIN_URL,
        data=data
    )

    kintai_page = BeautifulSoup(mykintai.text, 'lxml')
    

    print('勤怠情報取得完了', time.time() - start_time)
    return kintai_page


def get_button_params(element):
    # ボタンのリンク先を取得
    href_str = element.attrs['onclick'].replace("location.href='cws?", '')[:-1].split('&')
    # リンク先のQueryStringをdict形式に加工
    href_dict = {x.split('=')[0]: x.split('=')[1] for x in href_str}
    return href_dict


def move_month(page, id):
    element = page.find('input', id=id)
    params = get_button_params(element)

    r = session.get(
    url=LOGIN_URL,
    params=params
    )
    bs_r = BeautifulSoup(r.text, 'lxml')
    return bs_r


def move_target_page(page, target_year, target_month):
    # 月度移動回数
    today = dt.datetime.now()
    move_amount = (int(today.year)*12 + int(today.month)) - (int(target_year)*12 + int(target_month))
    id = 'TOPRVTM' if move_amount > 0 else 'TONXTTM'

    if abs(move_amount) > 6:
        print('一応ストップ')
        sys.exit()

    for _ in range(move_amount):
        pre = move_month(page, id)
        page = page_worktime_request(pre)
    return page


def getStatus(class_name):
    if class_name == 'mg_normal':
        return '未提出'
    elif class_name == 'mg_saved':
        return '一時保存'
    elif class_name == 'mg_dc_saved':
        return '日次提出'
    elif class_name == 'mg_confirmed':
        return '-'
    else:
        return ''


def get_worktime(kintai_table, target_year, mode_reported=True):
    # 取得結果を加工して・・・
    result = []

    for row in kintai_table:
        # print([x.text for x in row.contents])
        # mode_reported = True
        if not row.contents[0].find(id='MONTH'):
            continue

        if mode_reported:
            worktime = row.contents[8].findAll('span')
            projects = row.contents[13].find('table').findAll('tr') if row.contents[13].find('table') else ''
            comment = row.contents[14].text
            Work = row.contents[3].text
            Actual = row.contents[10].text
        else:
            worktime = row.contents[9].findAll('option', attrs={'selected': True})
            projects = row.contents[14].find('table').findAll('tr') if row.contents[14].find('table') else ''
            comment = row.contents[15].text
            Work = row.contents[3].find('option', selected=True).text
            Actual = row.contents[11].text

        
        if not projects:
            continue

        for p in projects:
            if p.findAll("td")[2].findAll('input'):
                projtime = p.findAll("td")[2].findAll('input')[0].attrs['value'].zfill(2) + ':' + p.findAll("td")[2].findAll('input')[1].attrs['value'].zfill(2)
            else:
                projtime = p.findAll("td")[2].text[1:-1]

            temp_row = {
                "status": getStatus(row.contents[3].attrs['class'][0]),
                "work": Work,
                "date": f"{target_year}-{row.contents[0].find(id='MONTH').text}-{row.contents[0].find(id='DAY').text}",
                "start": f"{worktime[1].text}:{worktime[2].text}" if len(worktime) > 1 else '',
                "end": f"{worktime[4].text}:{worktime[5].text}" if len(worktime) > 1 else '',
                "type":p.findAll("td")[0].text+p.findAll("td")[1].text,
                "times":projtime,
                "actual":Actual,
                "pjsum":projtime,
                "comment": comment,
            }
            # print(temp_row)
            result.append(temp_row)

    print('勤怠情報加工完了', time.time() - start_time)
    return result


def presearch_request():
    # ----
    # 勤怠情報を取得するためのパラメータを取得する
    r = session.get(
        url="https://gcws3.outsourcing.co.jp/cws/cws?@SID=null&@SUB=root.cws.shuro.boss.term_kinmu_input_approval&@SN=root.cws.shuro.boss.term_kinmu_input_approval&@FN=form_shuro"
    )

    bs_result = BeautifulSoup(r.text, 'lxml')
    print('勤怠用パラメータ取得', time.time() - start_time)
    return bs_result


def search_request(bs_html, url, t_year, t_month, t_employee):
    # メンバー検索結果のパラメータ取得
    payload_1 = {
        "@SID": "",
        "@SQ": form_getattrs_value(bs_html, "@SQ"),
        "@SN": "root.cws.shuro.boss.term_kinmu_input_approval",
        "@FN": form_getattrs_value(bs_html, "@FN"),
        "@FS": "I",
        "@SRACT": "LoadAndListPersonalSummariesAction",
        "@SRSNDF": "FormListPersonalSummaries",
        "@SRSNDC": "NONE",
        "@SRCMD0": "NONE",
        "@SRCMD1": "NONE",
        "@SRCMD2": "NONE",
        "@SRCMD3": "NONE",
        "@SRCMD4": "NONE",
        "posX": "0",
        "posY": "0",
        "scrollDivPosX": "0",
        "scrollDivPosY": "0",
        "@PSTDDATEYEAR": t_year,
        "@PSTDDATEMONTH": t_month,
        "@PSTDDATEDAY": "1",
        "@PTSYZ": "PERSONAL_FLOW_TARGETS",
        "@PSTATUSCOND": "0",
        "@PTCSRCH": "-1",
        "emps_cond": t_employee,
        "dummy": ""
    }

    r = session.post(
        url=url,
        data=payload_1
    )

    kensaku_page = BeautifulSoup(r.text, 'lxml')

    # 勤怠情報を取得する
    payload_2 = {
        "@SID": "",
        "@SQ": form_getattrs_value(kensaku_page, "@SQ"),
        "@SN": "root.cws.shuro.boss.term_kinmu_input_approval",
        "@FN": form_getattrs_value(kensaku_page, "@FN"),
        "@FS": "I",
        "@SRACT": "NONE",
        "@SRSNDF": "jp.co.worksap.companyweb.service.shuro.term_kinmu_input_commons.forms.FormWaitingMessage",
        "@SRSNDC": "NONE",
        "@SRCMD0": "NONE",
        "@SRCMD1": "NONE",
        "@SRCMD2": "NONE",
        "@SRCMD3": "NONE",
        "@SRCMD4": "NONE",
        "posX": "0",
        "posY": "0",
        "scrollDivPosX": "0",
        "scrollDivPosY": "0",
        "dummy": ""
    }

    member_info_r = session.post(
        url=LOGIN_URL,
        data=payload_2
    )

    member_info = BeautifulSoup(member_info_r.text, 'lxml')
    # print(member_info)

    # ----
    # ユーザー勤怠表示ボタンのelementを取得
    href_str = member_info.find('input', attrs={'value': '詳細'})
    # ボタンのリンク先を取得
    href_str = href_str.attrs['onclick'].replace("location.href='cws?", '')[:-1].split('&')
    # リンク先のQueryStringをdict形式に加工
    href_dict = {x.split('=')[0]: x.split('=')[1] for x in href_str}


    dispName = member_info.find('span', id='EmpNm1').text.replace('\u3000', ' ')
    reportStatus = member_info.find('span', id='flowinfo1').text

    return href_dict, dispName, reportStatus


def member_worktime_request(formdata: dict):
    # test = form_getattrs_value(member_info, "@SID")
    params = {
        "@SID": formdata['@SID'],
        "@SUB": "root.cws.shuro.boss.term_kinmu_input_approval",
        "@SN": "root.cws.shuro.boss.term_kinmu_input_approval",
        "@FN": "FormListPersonalSummaries",
        "@SRACT": "LoadAndListPersonalDetailsAction",
        "@SRSNDF": "FormListPersonalSummaries",
        "@SRSNDSVC": "TermKinmuInputApprovalService",
        "@PEMPID": formdata['@PEMPID'],
    }
    pre_r = session.get(
        url=LOGIN_URL,
        params=params
    )

    pre_kintai = BeautifulSoup(pre_r.text, 'lxml')

    payload = {
        "@SID": "",
        "@SQ": form_getattrs_value(pre_kintai, "@SQ"),
        "@SN": "root.cws.shuro.boss.term_kinmu_input_approval",
        "@FN": form_getattrs_value(pre_kintai, "@FN"),
        "@FS": "I",
        "@SRACT": "NONE",
        "@SRSNDF": "jp.co.worksap.companyweb.service.shuro.term_kinmu_input_commons.forms.FormWaitingMessage",
        "@SRSNDC": "NONE",
        "@SRCMD0": "NONE",
        "@SRCMD1": "NONE",
        "@SRCMD2": "NONE",
        "@SRCMD3": "NONE",
        "@SRCMD4": "NONE",
        "posX": "0",
        "posY": "0",
        "scrollDivPosX": "0",
        "scrollDivPosY": "0",
        "dummy": ""
    }

    worktime_page_r = session.post(
        url=LOGIN_URL,
        data=payload
    )

    worktime_page = BeautifulSoup(worktime_page_r.text, 'lxml')
    worktime_table = worktime_page.find('table', id="APPROVALGRD")

    print('勤怠情報取得完了', time.time() - start_time)
    return worktime_table


def get_member_worktime(worktime_table, target_year, mode_reported=True):
    # 取得結果を加工して・・・
    result = []

    for row in worktime_table:


        if not row.contents[0].find(id='MONTH'):
            continue

        # print(f"{target_year}-{row.contents[0].find(id='MONTH').text}-{row.contents[0].find(id='DAY').text}")
        if mode_reported:
            worktime = row.contents[8].findAll('span')
            projects = row.contents[32].find('table').findAll('tr') if row.contents[32].find('table') else ''
            comment = row.contents[35].text
            Work = row.contents[3].text
            Actual = row.contents[10].text
            pjsum = ":".join([x.text for x in row.contents[31].findAll('span')])
        else:
            worktime = row.contents[9].findAll('option', attrs={'selected': True})
            projects = row.contents[33].find('table').findAll('tr') if row.contents[33].find('table') else ''
            comment = row.contents[36].text
            Work = row.contents[3].find('option', selected=True).text if row.contents[3].find('select') else row.contents[3].text
            Actual = row.contents[11].text
            pjsum = ":".join([x.text for x in row.contents[32].findAll('span')])


        if not projects:
            continue

        for p in projects:
            if p.findAll("td")[2].findAll('input'):
                projtime = p.findAll("td")[2].findAll('input')[0].attrs['value'].zfill(2) + ':' + p.findAll("td")[2].findAll('input')[1].attrs['value'].zfill(2)
            else:
                projtime = p.findAll("td")[2].text[1:-1]

            temp_row = {
                'status': getStatus(row.contents[3].attrs['class'][0]),
                "work": Work,
                "date": f"{target_year}-{row.contents[0].find(id='MONTH').text}-{row.contents[0].find(id='DAY').text}",
                "start": f"{worktime[1].text}:{worktime[2].text}" if len(worktime) > 1 else '',
                "end": f"{worktime[4].text}:{worktime[5].text}" if len(worktime) > 1 else '',
                "type":p.findAll("td")[0].text+p.findAll("td")[1].text,
                "times":projtime,
                "actual":Actual,
                "pjsum": pjsum,
                "comment": comment,
            }

            # print(temp_row)
            result.append(temp_row)

    print('勤怠情報加工完了', time.time() - start_time)
    return result




def report_csv(output_path: str, data: dict, empNum, empName):
    # CSV出力
    with open(output_path, 'w', encoding="utf_8_sig") as f:
        if data:
            writer = csv.writer(f, lineterminator='\n')
            writer.writerow(data[0].keys())  # header
            for row in data:
                writer.writerow(row.values())
        else:
            pass
            # writer = csv.writer(f, lineterminator='\n')
            # writer.writerow(["date", "times", "comment", "Name", "Num"])
            # writer.writerow(["2023-1-1", 0, "DataISEmpty", empName, empNum])
            # print("DataISEmpty: ", f"{empNum}:{empName}")
    return


def main(params, queue):

    global session
    global LOGIN_URL
    # ログイン
    session = requests.Session()
    login = login_request(url=LOGIN_URL, user_cred={'id': params['username'], 'pw': params['password']})
    completed = ['start']
    queue.put(completed)
    
    # 自分の勤怠
    if params['isSelf']:
        page_frame = page_frame_request()
        page = page_worktime_request(page_frame)
        # worktime_table = worktime_page.find('table', id="APPROVALGRD")

        page = move_target_page(page, params['Year'], params['Month'])

        dispName = page.find('div', class_='syain').contents[1].text.replace('社員名称：\xa0', '').replace('\u3000', ' ')
        reportStatus = getReportStatus(page.find('form', attrs={'name': 'FormListPersonalDetails'}).contents[32])

        isReported = False if reportStatus=="状態：未入力" else True

        result = get_worktime(page.find('table', id="APPROVALGRD"), params['Year'], isReported)

        result = [{**row, "Name": dispName, "Num": params['username'],
                "Report": reportStatus} for row in result]

        output_path = f"result/company_{str(params['Year'])[2:]}{str(params['Month']).zfill(2)}_{params['username']}.csv"
        report_csv(output_path, result, params['username'], dispName)

        completed.append(params['username'])
        queue.put(completed)
        print(time.time() - start_time)

    for member in params['members']:
        queue.put(completed)
        # メンバーの勤怠
        search_page = presearch_request()

        # members = ['611674', '629606', '608401', '611646', '327328', '611606', '618329', '618679', '629588']
        member_info, dispName, reportStatus = search_request(search_page, LOGIN_URL, params['Year'], params['Month'], member)
        worktime_table = member_worktime_request(member_info)
        queue.put(completed)
        isReported = False if reportStatus=="状態：未入力" else True
        result = get_member_worktime(worktime_table, params['Year'], isReported)
        result = [{**row, "Name": dispName, "Num": member,
                "Report": reportStatus} for row in result]
        queue.put(completed)
        output_path = f"result/company_{str(params['Year'])[2:]}{str(params['Month']).zfill(2)}_{member}.csv"
        report_csv(output_path, result, member, dispName)
        queue.put(completed)
        print(time.time() - start_time)
        completed.append(member)
        queue.put(completed)

global LOGIN_URL
LOGIN_URL = "https://gcws3.outsourcing.co.jp/cws/cws"

if __name__ == '__main__':

    # パラメータ
    # USER_NAME = "608409"
    # PASS_WORD = "p@ssw6rd"
    # TARGET_YEAR = "2022"
    # TARGET_MONTH = "11"

    params = {
        "Year": "2023",
        "Month": "1",
        "username": "608409",
        "password": "p@ssw6rd",
        "members": ['611674', '629606', '608401'],
        "isSelf": True, # !debug
        "async": False,
    }

    main(params)
