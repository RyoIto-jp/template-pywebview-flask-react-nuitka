# メンバーの勤怠情報を取得
import csv
import time
import requests
from bs4 import BeautifulSoup

start_time = time.time()

# パラメータ
LOGIN_URL = "https://gcws3.outsourcing.co.jp/cws/cws"
USER_NAME = "608409"
PASS_WORD = "p@ssw6rd"


def form_getattrs_value(element, name_key):
    # Name属性からvalueを取得する
    r = element.find(
        'input', attrs={'name': name_key, 'type': 'hidden'})
    return r.get_attribute_list('value')[0]  # type:ignore


def login_request(url, user_cred):

    # ログインページを表示して、現在セッション情報を取得する
    response_0 = requests.get(url)
    soup_login = BeautifulSoup(response_0.text, 'lxml')

    # ログインする

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

    print('ログイン完了', time.time() - start_time)
    return r


def temp():
    pass


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

    return href_dict


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


def get_member_worktime(worktime_table):
    # 取得結果を加工して・・・
    result = []

    for row in worktime_table:

        worktime = row.contents[8].findAll('span')
        projects = row.contents[32].find('table').findAll(
            'tr') if row.contents[32].find('table') else ''

        if not row.contents[0].find(id='MONTH'):
            continue

        temp_row = {
            "kubun": row.contents[0].attrs['class'][0],
            "date": row.contents[0].find(id='MONTH').text + "/" + row.contents[0].find(id='DAY').text,
            "start": f"{worktime[1].text}:{worktime[2].text}" if worktime else '',
            "end": f"{worktime[4].text}:{worktime[5].text}" if worktime else '',
            "projects": [
                {
                    "code": p.findAll("td")[0].text,
                    "name":p.findAll("td")[1].text,
                    "times":p.findAll("td")[2].text[1:-1]
                }
                for p in projects
            ] if projects else '',
            "comment": row.contents[35].text.replace('\t', '')
        }
        # print(temp_row)
        result.append(temp_row)

    print('勤怠情報加工完了', time.time() - start_time)
    return result


def report_csv(output_path: str, data: dict):
    # CSV出力
    with open(output_path, 'w', encoding="utf_8_sig") as f:
        writer = csv.writer(f, lineterminator='\n')
        writer.writerow(data[0].keys())  # header
        for row in data:
            writer.writerow(row.values())
    return

if __name__ == '__main__':

    # パラメータ
    LOGIN_URL = "https://gcws3.outsourcing.co.jp/cws/cws"
    USER_NAME = "608409"
    PASS_WORD = "p@ssw6rd"
    TARGET_YEAR = "2023"
    TARGET_MONTH = "1"
    TARGET = '611674'

    session = requests.Session()
    login = login_request(url=LOGIN_URL, user_cred={'id': USER_NAME, 'pw': PASS_WORD})
    search_page = presearch_request()

    # members = ['611674', '629606', '608401', '611646', '327328', '611606', '618329', '618679', '629588']
    member_info = search_request(search_page, LOGIN_URL, TARGET_YEAR, TARGET_MONTH, TARGET)
    worktime_table = member_worktime_request(member_info)

    worktimes = get_member_worktime(worktime_table)

    output_path = f"result/aa_{str(TARGET_YEAR)[2:]}{str(TARGET_MONTH).zfill(2)}_{TARGET}.csv"
    report_csv('202301_61174_xxx.csv', worktimes)

    print(time.time() - start_time)
