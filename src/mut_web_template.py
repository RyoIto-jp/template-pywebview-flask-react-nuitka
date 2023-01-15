# import random
import threading
from concurrent.futures.thread import ThreadPoolExecutor
from time import sleep

# from loguru import logger
from playwright.sync_api import Playwright, BrowserType, BrowserContext, Page
from playwright.sync_api import sync_playwright


class Tls(threading.local):
    def __init__(self):
        self.playwright: Playwright = None
        self.browser: BrowserType = None
        self.context: BrowserContext = None
        self.page: Page = None


class Generator:
    tls = Tls()

    def __init__(self):
        pass

    def run(self, k):
        print("THREAD: %s - ENTER" % k)
        # logger.info("THREAD: %s - ENTER" % k)

        self.tls.playwright = sync_playwright().start()
        self.tls.browser = self.tls.playwright.firefox.launch(headless=False)

        # Create 3 different contexts
        self.tls.context = self.tls.browser.new_context()
        self.tls.second_context = self.tls.browser.new_context()
        self.tls.third_context = self.tls.browser.new_context()

        # Create 3 different pages
        self.tls.page = self.tls.context.new_page()
        self.tls.second_page = self.tls.context.new_page()
        self.tls.third_page = self.tls.context.new_page()

        # Navigate to 3 different websites
        self.tls.page.goto("https://google.com")
        self.tls.second_page.goto("https://web.de")
        self.tls.page.third_page.goto("https://cnn.com")
        # do separate work on  each of the pages
        # how can we achieve concurrency in this scenario?

        self.tls.page.close()
        self.tls.second_page.close()
        self.tls.third_page.close()

        self.tls.context.close()
        self.tls.second_context.close()
        self.tls.third_context.close()

        self.tls.browser.close()
        self.tls.playwright.stop()

        print("THREAD: %s - EXIT" % k)
        # logger.info("THREAD: %s - EXIT" % k)


if __name__ == "__main__":
    generators = list()
    tpe = ThreadPoolExecutor()
    my_value = 'this is my value.'
    for i in range(1, 11):
        generator = Generator()
        generators.append(generator)
        tpe.submit(generator.run, [i, my_value])
        sleep(0.1)
    tpe.shutdown(wait=False)

    # 実行中なら再ループ
    while sum([int(t.is_alive()) for t in tpe._threads]) > 1:
        sleep(3)
