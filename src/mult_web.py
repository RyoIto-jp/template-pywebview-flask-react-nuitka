from concurrent.futures.thread import ThreadPoolExecutor
import threading
from time import sleep

from playwright.sync_api import Playwright, BrowserType, BrowserContext, Page
from playwright.sync_api import sync_playwright

# for company
import time
import csv
import os

try:
    from . import find_browser
except Exception:
    import sys
    sys.path.append(os.path.join(os.getcwd(), '..'))
    import find_browser


class Tls(threading.local):
    def __init__(self):
        self.playwright: Playwright = None
        self.browser: BrowserType = None
        self.context: BrowserContext = None
        self.page: Page = None
        
        chrome_path = find_browser.findBrowserPath('chrome')
        if not chrome_path:
            chrome_path = "./driver/chrome-win/chrome.exe"
        self.chrome_path = chrome_path


class Generator:
    tls = Tls()

    def __init__(self):
        pass

    def loginCompany(self, cred):
        # Go to Company Web page
        self.tls.page.goto("https://gcws3.outsourcing.co.jp/cws/cws")
        print('open login page', self.tls.page.title())

        # Authorize
        self.tls.page.locator("input[name=\"uid\"]").fill(cred["user"])
        self.tls.page.locator("input[name=\"pwd\"]").fill(cred["pass"])
        self.tls.page.locator("input[alt=\"login\"]").press("Enter")
    
        loginStatus = False
        if self.tls.page.title() == 'メインメニュー':
            loginStatus = True
        return loginStatus

    def moveToApprovalPage(self):
        # 就労管理/上長用メニュー/勤務実績承認（期間承認用）
        self.tls.page.locator("text=就労管理").click()
        self.tls.page.locator("a:has-text(\"上長用メニュー\")").click()
        self.tls.page.locator("text=勤務実績承認（期間承認用）").click()

        err_count = 0
        for i in range(3):
            if self.tls.page.title() != "勤務実績承認（期間承認用）":
                print("------------------- error")
                self.tls.page.reload()
                err_count += 1
                sleep(1)
            else:
                if err_count > 0:
                    print('err -> success !!!')
                break

    def navMyPage(self, target_date):
        self.tls.page.locator("text=就労管理").click()
        self.tls.page.click("a:has-text('勤務実績入力（期間入力用）')")

        while True:
            buf = self.tls.page.locator('span.sp_kintai_kikan').text_content()
            now_date = buf[0:4] + ('00' + buf[5:buf.find("月\xa0")])[-2:]
            target = target_date[0] + ('00' + target_date[1])[-2:]
            if target == now_date:
                break
            elif target < now_date:
                self.tls.page.locator("#TOPRVTM").click()  # go to previous month
            elif target > now_date:
                self.tls.page.locator("#TONXTTM").click()
            else:
                print('不正な値です')
                os.system('pause')

        self.tls.page.wait_for_load_state("load")
        empName = self.tls.page.locator('.syain > div:nth-child(2)').text_content().replace('社員名称：\xa0', '').replace('\u3000', ' ')
        header_text = self.tls.page.query_selector("form[name=\"FormListPersonalDetails\"]").text_content()

        reportStatus = self.getReportStatus(header_text)

        return empName, reportStatus

    def navMemberPage(self, target_date, empNum, eel):
        # fill condition values
        self.tls.page.locator(
            "input[name=\"\\@PSTDDATEYEAR\"]").fill(target_date[0])
        self.tls.page.locator(
            "select[name=\"\\@PSTDDATEMONTH\"]").select_option(target_date[1])
        self.tls.page.locator(
            "select[name=\"\\@PSTDDATEDAY\"]").select_option("1")
        self.tls.page.locator("input[name=\"emps_cond\"]").fill(empNum)

        print("THREAD: %s - FIND" % empNum)
        if eel:
            eel.pyUpdateMessage("THREAD: %s - FIND" % empNum)
        if self.tls.page.title() != '勤務実績承認（期間承認用）':
            print('err')

        # 検索処理の実行 ：個人ごとの期間合計を表示
        with self.tls.page.expect_navigation():
            self.tls.page.locator("text=個人ごとの期間合計を表示").click()

        # Get a employee Name
        empName = self.tls.page.locator(
            "#EmpNm1").text_content().replace("\u3000", ' ')

        # todo: 提出状況
        reportStatus = self.tls.page.locator(
            "#flowinfo1").text_content().replace("\u3000", ' ')
        # print(reportStatus)

        # Click input:has-text("詳細")
        self.tls.page.locator("input:has-text(\"詳細\")").click()
        return empName, reportStatus

    def getUserWorkTime(self, empNum, empName, reportStatus, target_date):
        # 印刷用ページを開く
        popup = self.navPrintPage()

        # テーブル情報を取得
        result = self.getTable(popup, target_year=target_date[0])

        # 結果を整形
        result = [{**row, "Name": empName, "Num": empNum,
                   "Report": reportStatus} for row in result]

        # 結果をCSV出力
        self.exportCSV(result, empNum, empName, target_date)

        popup.close()

    def navPrintPage(self):
        with self.tls.page.expect_event("popup") as page_info:
            self.tls.page.locator("input[name=\"btnPrint\"]").click()
        popup = page_info.value

        # Get a table html
        popup.wait_for_load_state("domcontentloaded")
        return popup

    def getReportStatus(self, header_text):
        choices = {
            "この期間の勤務データはまだ月次提出": "状態：未入力",
            "この期間の勤務データは既に提出され": "第１段階の承認待ち",
            "この期間の実績はすでに承認済です。": "最終承認済み"
        }
        for choice in choices:
            if choice in header_text:
                return choices[choice]
                break
        
        return "empty"

    def getTable(self, popup, target_year):
        table_rows = popup.query_selector_all(
            "table[name=\"APPROVALGRD\"] > tbody > tr")

        # initialize
        result_row = {}
        result = []

        for row in table_rows[1:]:
            tempWork = row.query_selector("td:nth-child(3)")
            # 提出状況
            rowStatus = self.getStatus(tempWork.get_attribute('class'))
            # 業務区分
            rowWork = tempWork.text_content()
            # 実働時間
            actual = row.query_selector("td:nth-child(11)").text_content()

            # 日付
            tempDate = row.query_selector("td >> nth=0")
            # 日付がない行は処理をしない
            if tempDate.query_selector("#MONTH"):
                targetDate = target_year + '-' + tempDate.query_selector(
                    "#MONTH").text_content() + '-' + tempDate.query_selector("#DAY").text_content()
                # print(targetDate)

            # project code
            # time, code, name: 35-000
            tempProjects = row.query_selector(
                "td:nth-child(32) > table:nth-child(1) > tbody")
            comment_idx = 35
            resPrj = ""

            # ProjectCode列にTableなし時はスキップ。
            if not tempProjects:
                tempProjects = row.query_selector(
                    "td:nth-child(14) > table:nth-child(1) > tbody")
                comment_idx = 15
                if not tempProjects:
                    continue

            # 各行の1列目のデータが35-000なら取得。
            for prj in tempProjects.query_selector_all("tr"):
                resPrj = prj.query_selector("td:nth-child(3)").text_content()[1:-1]
                result_row["date"] = targetDate
                result_row["work"] = rowWork
                result_row['status'] = rowStatus
                result_row["times"] = resPrj
                result_row["type"] = prj.query_selector("td:nth-child(2)").text_content()
                result_row["actual"] = actual

                # データが存在しなければこの行はスキップ。
                if resPrj == "":
                    continue

                # 備考欄を取得
                tempComment = row.query_selector(
                    f"td:nth-child({comment_idx})").text_content().replace('\xa0', '')
                result_row["comment"] = tempComment

                # 取得結果をresultに格納
                result.append(result_row)
                result_row = {}
        return result

    # todo: static
    def getStatus(self, class_name):
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

    # todo: static
    def exportCSV(self, result, empNum, empName, target_date):
        # [2012, 5] -> 1205
        file_name_date = target_date[0][2:] + ('00' + target_date[1])[-2:]
        # CSVに出力
        try:
            with open(f'result/company_{file_name_date}_{empNum}.csv', 'w', encoding='utf8', newline="") as f:
                if result:
                    writer = csv.DictWriter(f, fieldnames=result[0].keys())
                    writer.writeheader()
                    for elem in result:
                        writer.writerow(elem)
                else:
                    writer = csv.writer(f, lineterminator='\n')
                    writer.writerow(
                        ["date", "times", "comment", "Name", "Num"])
                    writer.writerow(["2/1", 0, "DataISEmpty", empName, empNum])
                    print("DataISEmpty: ", f"{empNum}:{empName}")
        except IOError:
            print("I/O error")

    def run(self, k):
        # print("THREAD: %s - ENTER" % k)
        credential = k[1]["credential"]
        target_date = k[1]["target_date"]
        member = k[1]["member"]
        eel = k[2]
        prefix = "THREAD" if member != "me" else "myTHREAD"

        headless = False
        if eel:
            eel.pyUpdateMessage(prefix + ": %s - ENTER" % member)
            headless = True
        print("THREAD: %s - ENTER" % member)
        # logger.info("THREAD: %s - ENTER" % k)

        self.tls.playwright = sync_playwright().start()
        self.tls.browser = self.tls.playwright.chromium.launch(
            headless=headless,  # ! DEBUG
            executable_path=self.tls.chrome_path)

        # Create 3 different contexts
        self.tls.context = self.tls.browser.new_context()

        # Create 3 different pages
        self.tls.page = self.tls.context.new_page()

        if eel:
            eel.pyUpdateMessage("browserを起動")

        # * Companyにログイン
        loginStatus = self.loginCompany(credential)

        if not loginStatus:
            print("ログインに失敗しました。処理を中断します。")
            if eel:
                eel.pyUpdateMessage("ログインに失敗しました。処理を中断します。")    
        else:
            print(prefix + ": %s - LOGIN" % member)
            if eel:
                eel.pyUpdateMessage(prefix + ": %s - LOGIN" % member)

        if member == 'me':
            empName, reportStatus = self.navMyPage(target_date)
            member = credential[0]
            print("myTHREAD: %s - LOADED" % member)
        else:
            # 就労管理/上長用メニュー/勤務実績承認（期間承認用）
            self.moveToApprovalPage()

            # page, empName, reportStatus = navMemberPage(page, target_date, member)
            empName, reportStatus = self.navMemberPage(target_date, member, eel)
            
            print("THREAD: %s - LOADED" % member)

            if eel:
                eel.pyUpdateMessage("THREAD: %s - LOADED" % member)

        # 工数CSVを取得
        self.getUserWorkTime(member, empName, reportStatus, target_date)
        # getUserWorkTime(page, member, empName, reportStatus, target_date)

        # ? -------------------------------
        self.tls.page.close()
        # self.tls.second_page.close()
        # self.tls.third_page.close()

        self.tls.context.close()
        # self.tls.second_context.close()
        # self.tls.third_context.close()

        self.tls.browser.close()
        # self.tls.playwright.stop()

        print("THREAD: %s - EXIT" % member)
        if eel:
            eel.pyUpdateMessage("THREAD: %s - EXIT" % member)
        # logger.info("THREAD: %s - EXIT" % k)

    def run_org(self, k):
        print("THREAD: %s - ENTER" % k)
        # logger.info("THREAD: %s - ENTER" % k)

        self.tls.playwright = sync_playwright().start()
        self.tls.browser = self.tls.playwright.firefox.launch(headless=False)

        # Create 3 different contexts
        self.tls.context = self.tls.browser.new_context()
        # self.tls.second_context = self.tls.browser.new_context()
        # self.tls.third_context = self.tls.browser.new_context()

        # Create 3 different pages
        self.tls.page = self.tls.context.new_page()
        # self.tls.second_page = self.tls.context.new_page()
        # self.tls.third_page = self.tls.context.new_page()

        # Navigate to 3 different websites
        self.tls.page.goto("https://google.com")
        # self.tls.second_page.goto("https://web.de")
        # self.tls.page.third_page.goto("https://cnn.com")
        # do separate work on  each of the pages
        # how can we achieve concurrency in this scenario?

        self.tls.page.close()
        # self.tls.second_page.close()
        # self.tls.third_page.close()

        self.tls.context.close()
        # self.tls.second_context.close()
        # self.tls.third_context.close()

        self.tls.browser.close()
        self.tls.playwright.stop()

        print("THREAD: %s - EXIT" % k)
        # logger.info("THREAD: %s - EXIT" % k)


def main(web_settings: dict, eel=None):
    start_time = time.time()
    generators = list()
    tpe = ThreadPoolExecutor()

    members = web_settings["members"]
    if web_settings["is_self"]:
        members.insert(0, 'me')

    for i, member in enumerate(members):
        # parameter
        web_setting = {
            "credential": web_settings["credential"],
            "target_date": web_settings["target_date"],
            "member": member,
            # "is_self": False  # todo
        }
        generator = Generator()
        generators.append(generator)
        tpe.submit(generator.run, [i, web_setting, eel])
        # sleep(0.1)
        sleep(2.0)
    tpe.shutdown(wait=False)

    # 実行中なら再ループ
    while sum([int(t.is_alive()) for t in tpe._threads]) > 1:
        sleep(1.5)

    print('task end', time.time() - start_time)


if __name__ == "__main__":
    start_time = time.time()
    # ---------------------------------
    # Companyの認証情報を設定
    credential = {"user": "608409", "pass": os.environ.get("OST_PW")}

    # 取得したい社員番号リストを設定
    EmployeeNumbers = [
        # "319794",  # 小田　龍哉
        "608401",  # 横山　洸二
        "611606",  # 髙田　純也
        "611646",  # 中川　拓哉
        "611674",  # 林　大貴
        "618329",  # 松田　翔
        "618679",  # 大木　美保
        "629588",  # 笠原　誠人
        "629600",  # 中山　晴登
        "629606",  # 竹本　脩二
    ]

    # 対象月度を設定
    target_date = ("2022", "10")

    # parameter
    web_settings = {
        "credential": credential,
        "target_date": target_date,
        "members": EmployeeNumbers,
        "is_self": True
    }

    main(web_settings)
    print('all end', time.time() - start_time)
    # ---------------------------------

    # generators = list()
    # tpe = ThreadPoolExecutor()
    # my_value = 'this is my value.'

    # for i, member in enumerate(EmployeeNumbers):
    #     # parameter
    #     web_settings = {
    #         "credential": credential,
    #         "target_date": target_date,
    #         "member": member,
    #         "is_self": False  # todo
    #     }
    #     generator = Generator()
    #     generators.append(generator)
    #     tpe.submit(generator.run, [i, web_settings])
    #     # sleep(0.1)
    #     sleep(1.0)
    # tpe.shutdown(wait=False)

    # # 実行中なら再ループ
    # while sum([int(t.is_alive()) for t in tpe._threads]) > 1:
    #     sleep(3)

    # print(time.time() - start_time)
