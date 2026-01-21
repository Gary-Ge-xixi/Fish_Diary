#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fish Image Downloader - 使用Pixabay API下载高质量鱼类图片
"""

import os
import re
import time
import json
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import quote
import ssl

# 配置
IMAGES_DIR = "/Users/wanshuiwanqigaozhishang/Downloads/MINIAPP/images"

# 创建SSL上下文
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

# 需要下载图片的新增鱼类及其英文搜索词
NEW_FISH = [
    ('狮头', 'lionhead goldfish', 'carassius'),
    ('虎头', 'oranda goldfish', 'carassius'),
    ('朝天眼', 'celestial eye goldfish', 'carassius'),
    ('鹤顶红', 'red cap oranda goldfish', 'carassius'),
    ('绿莲灯', 'green neon tetra', 'paracheirodon'),
    ('火焰灯', 'ember tetra', 'hyphessobrycon'),
    ('刚果灯', 'congo tetra', 'phenacogrammus'),
    ('红剪刀', 'bleeding heart tetra', 'hyphessobrycon'),
    ('帝王鼠', 'corydoras catfish', 'corydoras'),
    ('皇冠鼠', 'emerald cory catfish', 'corydoras'),
    ('太空飞鼠', 'pygmy corydoras', 'corydoras'),
    ('L333黄金帝王', 'king tiger pleco L333', 'hypancistrus'),
    ('L134豹纹', 'leopard frog pleco', 'peckoltia'),
    ('L066帝王', 'king tiger pleco', 'hypancistrus'),
    ('小精灵', 'otocinclus catfish', 'otocinclus'),
    ('黑线飞狐', 'siamese algae eater', 'crossocheilus'),
    ('青苔鼠', 'chinese algae eater', 'gyrinocheilus'),
    ('大和藻虾', 'amano shrimp', 'caridina'),
    ('樱花虾', 'cherry shrimp', 'neocaridina'),
    ('水晶虾', 'crystal red shrimp', 'caridina'),
    ('苹果螺', 'mystery snail', 'pomacea'),
    ('斑马螺', 'zebra nerite snail', 'neritina'),
    ('红宝石', 'red jewel cichlid', 'hemichromis'),
    ('蓝宝石', 'blue peacock cichlid', 'aulonocara'),
    ('黄金孔雀', 'lemon jake peacock cichlid', 'aulonocara'),
    ('火焰红孔雀', 'dragon blood peacock cichlid', 'aulonocara'),
    ('礼服孔雀', 'tuxedo guppy', 'poecilia'),
    ('蛇纹孔雀', 'cobra guppy', 'poecilia'),
    ('马赛克孔雀', 'mosaic guppy', 'poecilia'),
    ('缎带孔雀', 'ribbon guppy', 'poecilia'),
]

def download_from_pixabay(fish_name, search_term, sci_name):
    """从Pixabay下载图片"""
    safe_name = re.sub(r'[^\w\u4e00-\u9fff]', '', fish_name)
    filename = f"fish_new_{safe_name}_{sci_name}.jpg"
    filepath = os.path.join(IMAGES_DIR, filename)

    if os.path.exists(filepath):
        print(f"[跳过] {fish_name}")
        return filepath

    # Pixabay免费API
    api_key = "46797847-ef8d7c7ce4cceab08a4ff77c2"  # 公开API key
    encoded = quote(search_term)
    url = f"https://pixabay.com/api/?key={api_key}&q={encoded}&image_type=photo&per_page=5"

    try:
        req = Request(url, headers=HEADERS)
        response = urlopen(req, timeout=15, context=ctx)
        data = json.loads(response.read().decode('utf-8'))

        if data.get('hits'):
            for hit in data['hits']:
                img_url = hit.get('webformatURL', '')
                if img_url:
                    try:
                        img_req = Request(img_url, headers=HEADERS)
                        img_response = urlopen(img_req, timeout=20, context=ctx)
                        img_data = img_response.read()
                        if len(img_data) > 3000:
                            with open(filepath, 'wb') as f:
                                f.write(img_data)
                            print(f"[成功] {fish_name} -> {filename}")
                            return filepath
                    except Exception as e:
                        continue
        print(f"[失败] {fish_name} - Pixabay无结果")
    except Exception as e:
        print(f"[错误] {fish_name}: {e}")

    return os.path.join(IMAGES_DIR, f"placeholder_{safe_name}.jpg")

def download_from_unsplash(fish_name, search_term, sci_name):
    """从Unsplash下载图片 (备选)"""
    safe_name = re.sub(r'[^\w\u4e00-\u9fff]', '', fish_name)
    filename = f"fish_new_{safe_name}_{sci_name}.jpg"
    filepath = os.path.join(IMAGES_DIR, filename)

    if os.path.exists(filepath):
        return filepath

    # 使用Unsplash Source (无需API key)
    encoded = quote(search_term)
    url = f"https://source.unsplash.com/400x300/?{encoded}"

    try:
        req = Request(url, headers=HEADERS)
        response = urlopen(req, timeout=20, context=ctx)
        img_data = response.read()
        if len(img_data) > 5000:
            with open(filepath, 'wb') as f:
                f.write(img_data)
            print(f"[成功-Unsplash] {fish_name} -> {filename}")
            return filepath
    except Exception as e:
        pass

    return None

def main():
    print("=" * 50)
    print("Fish Image Downloader")
    print("=" * 50)

    success = 0
    failed = 0

    for fish_name, search_term, sci_name in NEW_FISH:
        # 先尝试Pixabay
        result = download_from_pixabay(fish_name, search_term, sci_name)

        # 如果失败，尝试Unsplash
        if 'placeholder' in result:
            unsplash_result = download_from_unsplash(fish_name, search_term, sci_name)
            if unsplash_result and 'placeholder' not in unsplash_result:
                result = unsplash_result

        if 'placeholder' not in result:
            success += 1
        else:
            failed += 1

        time.sleep(0.3)  # 避免请求过快

    print("\n" + "=" * 50)
    print(f"完成! 成功: {success}, 失败: {failed}")
    print("=" * 50)

if __name__ == '__main__':
    main()
