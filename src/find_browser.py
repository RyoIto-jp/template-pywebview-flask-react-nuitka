import platform
import os


def canAccessFile(paths: list[str]) -> str:
    """受け取ったPathが存在するか確認する

    Args:
        paths (list[str]): Pathリスト

    Returns:
        str: 最初に存在が確認できたPath。無ければ "" を返す。
    """
    for path in paths:
        if os.path.exists(path):
            return path
    return ""


def winPaths(channel: str) -> list[str]:
    """環境変数からインストール先候補（複数)を返却する

    Args:
        channel (str): _description_

    Returns:
        list[str]: _description_
    """
    currentPaths = {
        'chrome': "Google/Chrome/Application/chrome.exe",
        'chrome-beta': "Google/Chrome Beta/Application/chrome.exe",
        'chrome-dev': "Google/Chrome Dev/Application/chrome.exe",
        'chrome-canary': "Google/Chrome SxS/Application/chrome.exe",
        'msedge': "Microsoft/Edge/Application/msedge.exe",
        'msedge-beta': "Microsoft/Edge Beta/Application/msedge.exe",
        'msedge-dev': "Microsoft/Edge Dev/Application/msedge.exe",
        'msedge-canary': "Microsoft/Edge SxS/Application/msedge.exe",
    }
    envPaths = ['LOCALAPPDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)']
    suffix = currentPaths.get(channel)
    if not suffix: return ""

    prefix: list[str] = [
        os.environ.get(x) for x in envPaths if os.environ.get(x)
    ]
    result = [os.path.join(x, suffix) for x in prefix]
    return result


def findBrowserPath(channel: str) -> str:
    """受け取ったブラウザ名のインストールPathを返す

    Args:
        channel (str): ブラウザ名: Chrome系、Edge系だけ

    Returns:
        str: インストールPath
    """

    if platform.system() == 'Windows':
        InstallationPaths = winPaths(channel)
    else:
        return ""

    result = canAccessFile(InstallationPaths)

    return result


if __name__ == "__main__":
    print('chrome', findBrowserPath('chrome'))
    print('chrome-beta', findBrowserPath('chrome-beta'))
    print('chrome-dev', findBrowserPath('chrome-dev'))
    print('chrome-canary', findBrowserPath('chrome-canary'))
    print('msedge', findBrowserPath('msedge'))
    print('msedge-beta', findBrowserPath('msedge-beta'))
    print('msedge-dev', findBrowserPath('msedge-dev'))
    print('msedge-canary', findBrowserPath('msedge-canary'))
    print('xxxxx', findBrowserPath('xxxxx'))
