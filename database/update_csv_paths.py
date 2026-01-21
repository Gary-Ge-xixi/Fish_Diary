#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新CSV中新增记录的图片路径
"""

import csv
import os
import re

DATABASE_DIR = "/Users/wanshuiwanqigaozhishang/Downloads/MINIAPP/database"
IMAGES_DIR = "/Users/wanshuiwanqigaozhishang/Downloads/MINIAPP/images"
INPUT_FILE = f"{DATABASE_DIR}/Fish_Database_Enhanced_v2.csv"
OUTPUT_FILE = f"{DATABASE_DIR}/Fish_Database_Enhanced_v2.csv"

# 新增鱼类与对应的科名
NEW_FISH_SCI_NAMES = {
    '狮头': 'carassius',
    '虎头': 'carassius',
    '朝天眼': 'carassius',
    '鹤顶红': 'carassius',
    '绿莲灯': 'paracheirodon',
    '火焰灯': 'hyphessobrycon',
    '刚果灯': 'phenacogrammus',
    '红剪刀': 'hyphessobrycon',
    '帝王鼠': 'corydoras',
    '皇冠鼠': 'corydoras',
    '太空飞鼠': 'corydoras',
    'L333黄金帝王': 'hypancistrus',
    'L134豹纹': 'peckoltia',
    'L066帝王': 'hypancistrus',
    '小精灵': 'otocinclus',
    '黑线飞狐': 'crossocheilus',
    '青苔鼠': 'gyrinocheilus',
    '大和藻虾': 'caridina',
    '樱花虾': 'neocaridina',
    '水晶虾': 'caridina',
    '苹果螺': 'pomacea',
    '斑马螺': 'neritina',
    '红宝石': 'hemichromis',
    '蓝宝石': 'aulonocara',
    '黄金孔雀': 'aulonocara',
    '火焰红孔雀': 'aulonocara',
    '礼服孔雀': 'poecilia',
    '蛇纹孔雀': 'poecilia',
    '马赛克孔雀': 'poecilia',
    '缎带孔雀': 'poecilia',
}

def main():
    print("更新CSV图片路径...")

    # 读取CSV
    rows = []
    with open(INPUT_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows.append(row)

    # 更新新增记录的图片路径
    updated = 0
    for row in rows:
        name = row['name']
        if name in NEW_FISH_SCI_NAMES:
            safe_name = re.sub(r'[^\w\u4e00-\u9fff]', '', name)
            sci_name = NEW_FISH_SCI_NAMES[name]
            expected_filename = f"fish_new_{safe_name}_{sci_name}.jpg"
            expected_path = os.path.join(IMAGES_DIR, expected_filename)

            # 检查图片是否存在
            if os.path.exists(expected_path):
                row['localImagePath'] = expected_path
                updated += 1
                print(f"  ✓ {name} -> {expected_filename}")
            else:
                print(f"  ✗ {name} 图片不存在: {expected_filename}")

    # 保存更新后的CSV
    with open(OUTPUT_FILE, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n完成! 更新了 {updated} 条记录的图片路径")
    print(f"输出文件: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
