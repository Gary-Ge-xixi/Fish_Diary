#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从Wikimedia Commons下载鱼类图片 (CC协议免费图片)
"""

import os
import re
import time
import json
from urllib.request import urlopen, Request
from urllib.parse import quote
import ssl

IMAGES_DIR = "/Users/wanshuiwanqigaozhishang/Downloads/MINIAPP/images"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'FishDatabaseBot/1.0 (Education Purpose)',
}

# 鱼类及其Wikimedia Commons搜索词
FISH_LIST = [
    ('狮头', 'Lionhead goldfish', 'carassius'),
    ('虎头', 'Oranda goldfish', 'carassius'),
    ('朝天眼', 'Celestial Eye goldfish', 'carassius'),
    ('鹤顶红', 'Oranda goldfish red cap', 'carassius'),
    ('绿莲灯', 'Paracheirodon simulans', 'paracheirodon'),
    ('火焰灯', 'Hyphessobrycon amandae', 'hyphessobrycon'),
    ('刚果灯', 'Phenacogrammus interruptus', 'phenacogrammus'),
    ('红剪刀', 'Hyphessobrycon erythrostigma', 'hyphessobrycon'),
    ('帝王鼠', 'Corydoras', 'corydoras'),
    ('皇冠鼠', 'Corydoras splendens', 'corydoras'),
    ('太空飞鼠', 'Corydoras pygmaeus', 'corydoras'),
    ('L333黄金帝王', 'Hypancistrus', 'hypancistrus'),
    ('L134豹纹', 'Peckoltia', 'peckoltia'),
    ('L066帝王', 'Hypancistrus zebra', 'hypancistrus'),
    ('小精灵', 'Otocinclus', 'otocinclus'),
    ('黑线飞狐', 'Crossocheilus oblongus', 'crossocheilus'),
    ('青苔鼠', 'Gyrinocheilus aymonieri', 'gyrinocheilus'),
    ('大和藻虾', 'Caridina multidentata', 'caridina'),
    ('樱花虾', 'Neocaridina davidi', 'neocaridina'),
    ('水晶虾', 'Caridina cantonensis', 'caridina'),
    ('苹果螺', 'Pomacea bridgesii', 'pomacea'),
    ('斑马螺', 'Neritina natalensis', 'neritina'),
    ('红宝石', 'Hemichromis bimaculatus', 'hemichromis'),
    ('蓝宝石', 'Aulonocara', 'aulonocara'),
    ('黄金孔雀', 'Aulonocara peacock cichlid', 'aulonocara'),
    ('火焰红孔雀', 'Aulonocara dragon blood', 'aulonocara'),
    ('礼服孔雀', 'Guppy tuxedo', 'poecilia'),
    ('蛇纹孔雀', 'Guppy cobra', 'poecilia'),
    ('马赛克孔雀', 'Guppy mosaic', 'poecilia'),
    ('缎带孔雀', 'Guppy', 'poecilia'),
]

def search_wikimedia(search_term):
    """搜索Wikimedia Commons图片"""
    encoded = quote(search_term)
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={encoded}&srnamespace=6&format=json&srlimit=5"

    try:
        req = Request(url, headers=HEADERS)
        response = urlopen(req, timeout=15, context=ctx)
        data = json.loads(response.read().decode('utf-8'))

        results = data.get('query', {}).get('search', [])
        for result in results:
            title = result.get('title', '')
            if title.startswith('File:') and any(ext in title.lower() for ext in ['.jpg', '.jpeg', '.png']):
                return title
    except Exception as e:
        print(f"  搜索错误: {e}")
    return None

def get_image_url(file_title):
    """获取图片的实际URL"""
    encoded = quote(file_title)
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={encoded}&prop=imageinfo&iiprop=url&format=json"

    try:
        req = Request(url, headers=HEADERS)
        response = urlopen(req, timeout=15, context=ctx)
        data = json.loads(response.read().decode('utf-8'))

        pages = data.get('query', {}).get('pages', {})
        for page_id, page_data in pages.items():
            imageinfo = page_data.get('imageinfo', [])
            if imageinfo:
                return imageinfo[0].get('url')
    except Exception as e:
        print(f"  获取URL错误: {e}")
    return None

def download_image(img_url, filepath):
    """下载图片"""
    try:
        req = Request(img_url, headers=HEADERS)
        response = urlopen(req, timeout=30, context=ctx)
        img_data = response.read()
        if len(img_data) > 3000:
            with open(filepath, 'wb') as f:
                f.write(img_data)
            return True
    except Exception as e:
        print(f"  下载错误: {e}")
    return False

def main():
    print("=" * 50)
    print("Wikimedia Commons Fish Image Downloader")
    print("=" * 50)

    success = 0
    failed = 0

    for fish_name, search_term, sci_name in FISH_LIST:
        safe_name = re.sub(r'[^\w\u4e00-\u9fff]', '', fish_name)
        filename = f"fish_new_{safe_name}_{sci_name}.jpg"
        filepath = os.path.join(IMAGES_DIR, filename)

        if os.path.exists(filepath) and os.path.getsize(filepath) > 3000:
            print(f"[跳过] {fish_name}")
            success += 1
            continue

        print(f"处理: {fish_name}...")

        # 搜索图片
        file_title = search_wikimedia(search_term)
        if not file_title:
            # 尝试只用学名
            file_title = search_wikimedia(sci_name.capitalize())

        if file_title:
            img_url = get_image_url(file_title)
            if img_url:
                if download_image(img_url, filepath):
                    print(f"  [成功] -> {filename}")
                    success += 1
                else:
                    print(f"  [失败] 下载失败")
                    failed += 1
            else:
                print(f"  [失败] 无法获取URL")
                failed += 1
        else:
            print(f"  [失败] 未找到图片")
            failed += 1

        time.sleep(0.5)

    print("\n" + "=" * 50)
    print(f"完成! 成功: {success}, 失败: {failed}")
    print("=" * 50)

if __name__ == '__main__':
    main()
