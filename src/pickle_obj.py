from __future__ import annotations
import pickle
import os

DIR_NAME = "./tmp"


def pkl_dumps_loads(obj: dict[str, str], pkl_name: str) -> dict[str, str]:
    """dumps -> file.write -> file.read -> loadsを行い、pickleオブジェクトを読み書きする"""
    path: str = os.path.join(DIR_NAME, pkl_name)

    os.makedirs('./tmp', exist_ok=True)
    
    # pickleオブジェクトを書き出す
    with open(path, "wb") as f:
        f.write(pickle.dumps(obj))
    # pickleオブジェクトを読み込む
    with open(path, "rb") as f:
        ojb_: dict[str, str] = pickle.loads(f.read())

    # 読み込んだpickleオブジェクトを返す
    return ojb_


def pkl_dumps(obj: dict[str, str], pkl_name: str) -> None:
    """dumps -> file.write"""
    path = os.path.join(DIR_NAME, pkl_name)
    with open(path, "wb") as f:
        f.write(pickle.dumps(obj))


def pkl_loads(pkl_name: str) -> dict[str, str] | bool:
    """file.read -> loads"""
    path = os.path.join(DIR_NAME, pkl_name)
    if os.path.exists(path):
        with open(path, "rb") as f:
            ojb_ = pickle.loads(f.read())
        return ojb_
    else:
        return False


if __name__ == "__main__":
    # 読み込むだけ(初回)
    pickle_obj1: dict[str, str] | bool = pkl_loads('test')
    # 更新処理をするとき
    pickle_obj2: dict[str, str] = pkl_dumps_loads({'test': 'test'}, 'test')
