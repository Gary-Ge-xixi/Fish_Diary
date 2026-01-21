#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fish Database Enhancement Script
修正分类、补充字段、添加新品种、下载图片
"""

import csv
import os
import time
import re
from urllib.parse import quote
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import ssl
import json

# 配置
BASE_DIR = "/Users/wanshuiwanqigaozhishang/Downloads/MINIAPP"
DATABASE_DIR = f"{BASE_DIR}/database"
IMAGES_DIR = f"{BASE_DIR}/images"
INPUT_FILE = f"{DATABASE_DIR}/Fish_Database_Enhanced.csv"
OUTPUT_FILE = f"{DATABASE_DIR}/Fish_Database_Enhanced_v2.csv"

# 请求头
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

# ============ 分类修正映射 ============
CATEGORY_FIXES = {
    # 格式: '鱼名': ('正确的categoryName', '正确的subcategoryName')
    '玻璃拉拉': ('鲤科/小型', '亚洲小型'),
    '三角灯': ('鲤科/小型', '亚洲小型'),
    '金波子': ('南美慈鲷', '短鲷'),
    '中国斗鱼': ('迷鳃/斗鱼', '原生斗鱼'),
    '圆尾斗鱼': ('迷鳃/斗鱼', '原生斗鱼'),
    '白云金丝': ('鲤科/小型', '亚洲小型'),
}

# ============ 新增字段数据 (体长cm, 寿命年, 食性, 混养兼容性) ============
FISH_EXTRA_DATA = {
    # 金鱼
    '草金鱼': ('15-30', '10-15', '杂食', '同类'),
    '兰寿': ('12-20', '10-15', '杂食', '同类'),
    '泰狮': ('15-25', '10-15', '杂食', '同类'),
    '琉金': ('12-18', '10-15', '杂食', '同类'),
    '蝶尾': ('12-18', '8-12', '杂食', '同类'),
    '珍珠鳞': ('10-15', '5-10', '杂食', '同类'),
    '水泡眼': ('10-15', '5-10', '杂食', '同类单养'),
    '丹顶红帽': ('12-18', '10-15', '杂食', '同类'),
    '黑兰寿': ('12-20', '10-15', '杂食', '同类'),
    '土佐金': ('12-18', '5-10', '杂食', '同类单养'),
    # 锦鲤/原生
    '昭和三色': ('60-100', '25-35', '杂食', '同类'),
    '大正三色': ('60-100', '25-35', '杂食', '同类'),
    '红白锦鲤': ('60-100', '25-35', '杂食', '同类'),
    '写鲤': ('60-100', '25-35', '杂食', '同类'),
    '黄金锦鲤': ('60-100', '25-35', '杂食', '同类'),
    '中国斗鱼': ('6-8', '3-5', '杂食', '雄性单养'),
    '圆尾斗鱼': ('5-7', '3-5', '杂食', '雄性单养'),
    '白云金丝': ('3-4', '3-5', '杂食', '群居温和'),
    '鳑鲏': ('4-8', '3-5', '杂食', '群居温和'),
    '宽鳍鱲': ('10-15', '3-5', '杂食', '同类'),
    # 灯科
    '红绿灯': ('2-3', '5-8', '杂食', '群居温和'),
    '宝莲灯': ('3-4', '5-8', '杂食', '群居温和'),
    '红鼻剪刀': ('4-5', '5-8', '杂食', '群居温和'),
    '黑幻影': ('4-5', '5-8', '杂食', '群居温和'),
    '帝王灯': ('5-6', '5-8', '杂食', '群居温和'),
    '扯旗鱼': ('4-5', '3-5', '杂食', '有攻击性'),
    '黑莲灯': ('3-4', '5-8', '杂食', '群居温和'),
    '金丝灯': ('4-5', '5-8', '杂食', '群居温和'),
    '柠檬灯': ('4-5', '5-8', '杂食', '群居温和'),
    '企鹅灯': ('5-6', '5-8', '杂食', '群居温和'),
    '玻璃拉拉': ('5-8', '3-5', '杂食', '群居温和'),
    '三角灯': ('4-5', '5-8', '杂食', '群居温和'),
    '一线长虹': ('4-5', '5-8', '杂食', '群居温和'),
    '红腹食人鱼': ('25-35', '10-15', '肉食', '同类群养'),
    '银板': ('15-20', '10-15', '素食', '群居温和'),
    '枯叶鱼': ('8-10', '5-8', '肉食', '单养'),
    # 鲤科小型
    '斑马鱼': ('4-5', '3-5', '杂食', '群居温和'),
    '虎皮鱼': ('5-7', '5-7', '杂食', '有攻击性'),
    '樱桃灯': ('4-5', '5-7', '杂食', '群居温和'),
    '一眉道人': ('10-15', '5-8', '杂食', '群居温和'),
    '金波子': ('5-7', '2-3', '杂食', '温和配对'),
    '五点铅笔': ('3-4', '3-5', '杂食', '群居温和'),
    '小丑罗汉': ('20-30', '15-20', '杂食', '群居'),
    # 卵胎生
    '孔雀鱼': ('3-6', '2-3', '杂食', '群居温和'),
    '安德拉斯': ('2-3', '2-3', '杂食', '群居温和'),
    '米奇鱼': ('4-5', '3-5', '杂食', '群居温和'),
    '红剑': ('10-12', '3-5', '杂食', '有攻击性'),
    '黑玛丽': ('6-10', '3-5', '杂食', '群居温和'),
    '球玛丽': ('5-8', '3-5', '杂食', '群居温和'),
    '皮球银玛丽': ('5-8', '3-5', '杂食', '群居温和'),
    # 斗鱼/迷鳃
    '泰国斗鱼': ('5-7', '2-4', '杂食', '雄性单养'),
    '半月斗鱼': ('5-7', '2-4', '杂食', '雄性单养'),
    '将军斗鱼': ('5-7', '2-4', '杂食', '雄性单养'),
    '珍珠马甲': ('10-12', '4-6', '杂食', '温和'),
    '丽丽鱼': ('5-6', '3-4', '杂食', '温和'),
    '蓝曼龙': ('10-15', '4-6', '杂食', '有攻击性'),
    '接吻鱼': ('15-30', '5-7', '杂食', '有攻击性'),
    '巧克力飞船': ('5-6', '3-5', '杂食', '温和'),
    '彩虹雷龙': ('10-15', '8-10', '肉食', '单养'),
    '阿萨姆雷龙': ('12-15', '8-10', '肉食', '单养'),
    '黄金眼镜蛇': ('40-60', '10-15', '肉食', '单养'),
    '巴卡雷龙': ('60-90', '15-20', '肉食', '单养'),
    # 南美慈鲷
    '神仙鱼': ('12-15', '10-12', '杂食', '温和'),
    '埃及神仙': ('15-20', '10-15', '杂食', '温和'),
    '七彩神仙': ('15-20', '10-15', '杂食', '同类'),
    '荷兰凤凰': ('5-7', '2-3', '杂食', '配对'),
    '波利维亚凤凰': ('7-8', '4-6', '杂食', '配对'),
    '阿凡达短鲷': ('6-8', '3-5', '杂食', '配对'),
    '金宝短鲷': ('6-8', '3-5', '杂食', '配对'),
    '地图鱼': ('25-35', '10-15', '杂食', '大型混养'),
    '罗汉鱼': ('25-30', '8-12', '杂食', '单养'),
    '鹦鹉鱼': ('20-25', '10-15', '杂食', '同类'),
    '火口鱼': ('12-15', '10-12', '杂食', '有攻击性'),
    '绿恐怖': ('20-30', '10-12', '杂食', '有攻击性'),
    # 三湖慈鲷
    '特蓝斑马': ('10-12', '8-10', '杂食', '高密度'),
    '雪鲷': ('10-12', '8-10', '杂食', '高密度'),
    '黄统领': ('8-10', '8-10', '杂食', '高密度'),
    '阿里': ('15-18', '8-10', '肉食', '高密度'),
    '萨伊蓝六间': ('30-35', '15-25', '肉食', '同类'),
    '卷贝鱼': ('3-5', '5-8', '杂食', '群居'),
    # 鼠鱼/异型
    '熊猫鼠': ('4-5', '8-10', '杂食', '群居温和'),
    '咖啡鼠': ('5-7', '10-15', '杂食', '群居温和'),
    '珍珠鼠': ('5-6', '10-15', '杂食', '群居温和'),
    '白鼠': ('5-7', '10-15', '杂食', '群居温和'),
    '金线绿鼠': ('5-6', '8-10', '杂食', '群居温和'),
    '胡子': ('10-15', '10-15', '素食', '温和'),
    '直升机': ('15-20', '8-12', '素食', '温和'),
    '皇冠豹': ('30-40', '15-20', '素食', '温和'),
    '熊猫异型': ('8-10', '10-15', '杂食', '温和'),
    '金达尼': ('20-25', '10-15', '杂食', '有领地'),
    '蓝眼大胡子': ('10-12', '10-15', '素食', '温和'),
    # 大型/古代
    '银龙': ('60-100', '15-20', '肉食', '大型混养'),
    '金龙': ('60-90', '15-20', '肉食', '大型混养'),
    '红龙': ('60-90', '15-20', '肉食', '大型混养'),
    '海象': ('150-200', '15-20', '肉食', '单养'),
    '招财鱼': ('40-70', '15-20', '杂食', '大型混养'),
    '黑白魟': ('40-60', '15-25', '肉食', '单养'),
    '虎鱼': ('30-45', '10-15', '肉食', '大型混养'),
    '恐龙鱼': ('25-40', '15-20', '肉食', '大型混养'),
    '鳄雀鳝': ('100-200', '25-50', '肉食', '单养'),
    '肺鱼': ('60-100', '20-25', '肉食', '单养'),
    '电鳗': ('150-250', '15-22', '肉食', '单养'),
    # 海水
    '公子小丑': ('8-11', '6-10', '杂食', '配对'),
    '黑小丑': ('8-11', '6-10', '杂食', '配对'),
    '透红小丑': ('15-17', '6-10', '杂食', '配对'),
    '蓝魔': ('6-8', '5-8', '杂食', '有攻击性'),
    '三点白': ('10-14', '5-8', '杂食', '有攻击性'),
    '雷达': ('7-9', '3-5', '肉食', '温和'),
    '医生虾': ('5-6', '3-5', '杂食', '温和'),
    '蓝吊': ('20-30', '8-12', '素食', '有攻击性'),
    '黄金吊': ('15-20', '10-15', '素食', '有攻击性'),
    '粉蓝吊': ('20-25', '8-12', '素食', '有攻击性'),
    '火焰仙': ('10-15', '5-7', '杂食', '有攻击性'),
    '马鞍神仙': ('25-30', '10-15', '杂食', '单养'),
    '狮子鱼': ('30-38', '10-15', '肉食', '单养'),
}

# ============ 需要补充的新品种 ============
NEW_FISH_DATA = [
    # 金鱼补充
    {
        'name': '狮头', 'englishName': 'Lionhead', 'scientificName': 'Carassius auratus var.',
        'categoryName': '冷水/国粹', 'subcategoryName': '金鱼', 'origin': '中国',
        'difficulty': 'medium', 'tempMin': 15, 'tempMax': 25, 'phMin': 7, 'phMax': 8,
        'description': '头部肉瘤极度发达，无背鳍。',
        'careTip': '水质要求高，需定期换水。',
        'size': '15-20', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '同类'
    },
    {
        'name': '虎头', 'englishName': 'Tiger Head', 'scientificName': 'Carassius auratus var.',
        'categoryName': '冷水/国粹', 'subcategoryName': '金鱼', 'origin': '中国',
        'difficulty': 'medium', 'tempMin': 15, 'tempMax': 25, 'phMin': 7, 'phMax': 8,
        'description': '头部肉瘤较狮头更紧实。',
        'careTip': '需要良好的水质维护。',
        'size': '15-20', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '同类'
    },
    {
        'name': '朝天眼', 'englishName': 'Celestial Eye', 'scientificName': 'Carassius auratus var.',
        'categoryName': '冷水/国粹', 'subcategoryName': '金鱼', 'origin': '中国',
        'difficulty': 'hard', 'tempMin': 15, 'tempMax': 25, 'phMin': 7, 'phMax': 8,
        'description': '眼睛朝上翻转，独特品种。',
        'careTip': '视力差，需单独喂食。',
        'size': '10-15', 'lifespan': '5-10', 'diet': '杂食', 'compatibility': '同类单养'
    },
    {
        'name': '鹤顶红', 'englishName': 'Red Cap Oranda', 'scientificName': 'Carassius auratus var.',
        'categoryName': '冷水/国粹', 'subcategoryName': '金鱼', 'origin': '中国',
        'difficulty': 'medium', 'tempMin': 15, 'tempMax': 25, 'phMin': 7, 'phMax': 8,
        'description': '全身银白，头顶鲜红肉瘤。',
        'careTip': '保持水质稳定利于发色。',
        'size': '15-20', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '同类'
    },
    # 灯科补充
    {
        'name': '绿莲灯', 'englishName': 'Green Neon Tetra', 'scientificName': 'Paracheirodon simulans',
        'categoryName': '灯科/加拉辛', 'subcategoryName': '南美小型', 'origin': '亚马逊',
        'difficulty': 'medium', 'tempMin': 24, 'tempMax': 28, 'phMin': 5, 'phMax': 6.5,
        'description': '比红绿灯更小，绿色荧光带。',
        'careTip': '需要极软的酸性水。',
        'size': '2-2.5', 'lifespan': '3-5', 'diet': '杂食', 'compatibility': '群居温和'
    },
    {
        'name': '火焰灯', 'englishName': 'Ember Tetra', 'scientificName': 'Hyphessobrycon amandae',
        'categoryName': '灯科/加拉辛', 'subcategoryName': '南美小型', 'origin': '巴西',
        'difficulty': 'easy', 'tempMin': 23, 'tempMax': 28, 'phMin': 5.5, 'phMax': 7,
        'description': '通体橙红如火焰，迷你型。',
        'careTip': '深色底砂更利于发色。',
        'size': '1.5-2', 'lifespan': '2-4', 'diet': '杂食', 'compatibility': '群居温和'
    },
    {
        'name': '刚果灯', 'englishName': 'Congo Tetra', 'scientificName': 'Phenacogrammus interruptus',
        'categoryName': '灯科/加拉辛', 'subcategoryName': '其他加拉辛', 'origin': '刚果',
        'difficulty': 'medium', 'tempMin': 24, 'tempMax': 28, 'phMin': 6, 'phMax': 7.5,
        'description': '大型灯鱼，彩虹色泽，公鱼尾鳍延长。',
        'careTip': '需要较大的游泳空间。',
        'size': '8-10', 'lifespan': '3-5', 'diet': '杂食', 'compatibility': '群居温和'
    },
    {
        'name': '红剪刀', 'englishName': 'Bleeding Heart Tetra', 'scientificName': 'Hyphessobrycon erythrostigma',
        'categoryName': '灯科/加拉辛', 'subcategoryName': '南美小型', 'origin': '南美',
        'difficulty': 'medium', 'tempMin': 23, 'tempMax': 28, 'phMin': 6, 'phMax': 7,
        'description': '体侧有红色心形斑点。',
        'careTip': '喜欢植物密集的环境。',
        'size': '6-8', 'lifespan': '3-5', 'diet': '杂食', 'compatibility': '群居温和'
    },
    # 鼠鱼补充
    {
        'name': '帝王鼠', 'englishName': 'Emperor Cory', 'scientificName': 'Corydoras sp.',
        'categoryName': '鼠鱼/异型', 'subcategoryName': '鼠鱼', 'origin': '秘鲁',
        'difficulty': 'medium', 'tempMin': 22, 'tempMax': 26, 'phMin': 6, 'phMax': 7.5,
        'description': '体型较大的鼠鱼，金属光泽。',
        'careTip': '需要细沙底材。',
        'size': '6-8', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '群居温和'
    },
    {
        'name': '皇冠鼠', 'englishName': 'Emerald Cory', 'scientificName': 'Corydoras splendens',
        'categoryName': '鼠鱼/异型', 'subcategoryName': '鼠鱼', 'origin': '南美',
        'difficulty': 'easy', 'tempMin': 22, 'tempMax': 26, 'phMin': 6, 'phMax': 7.5,
        'description': '绿色金属光泽，体型大。',
        'careTip': '皮实好养，适合新手。',
        'size': '7-9', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '群居温和'
    },
    {
        'name': '太空飞鼠', 'englishName': 'Pygmy Cory', 'scientificName': 'Corydoras pygmaeus',
        'categoryName': '鼠鱼/异型', 'subcategoryName': '鼠鱼', 'origin': '南美',
        'difficulty': 'medium', 'tempMin': 22, 'tempMax': 26, 'phMin': 6, 'phMax': 7,
        'description': '迷你型鼠鱼，会在中层游动。',
        'careTip': '需要大群饲养。',
        'size': '2-3', 'lifespan': '3-5', 'diet': '杂食', 'compatibility': '群居温和'
    },
    # 异型补充
    {
        'name': 'L333黄金帝王', 'englishName': 'King Tiger Pleco', 'scientificName': 'Hypancistrus sp.',
        'categoryName': '鼠鱼/异型', 'subcategoryName': '异型', 'origin': '巴西',
        'difficulty': 'medium', 'tempMin': 26, 'tempMax': 30, 'phMin': 6, 'phMax': 7,
        'description': '黄黑条纹，小型异型。',
        'careTip': '需要高温和洞穴。',
        'size': '10-12', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '温和'
    },
    {
        'name': 'L134豹纹', 'englishName': 'Leopard Frog Pleco', 'scientificName': 'Peckoltia compta',
        'categoryName': '鼠鱼/异型', 'subcategoryName': '异型', 'origin': '巴西',
        'difficulty': 'medium', 'tempMin': 26, 'tempMax': 30, 'phMin': 6, 'phMax': 7,
        'description': '黄底黑斑如豹纹。',
        'careTip': '需要沉木和洞穴。',
        'size': '10-12', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '温和'
    },
    {
        'name': 'L066帝王', 'englishName': 'King Tiger Pleco', 'scientificName': 'Hypancistrus sp.',
        'categoryName': '鼠鱼/异型', 'subcategoryName': '异型', 'origin': '巴西',
        'difficulty': 'hard', 'tempMin': 28, 'tempMax': 32, 'phMin': 6, 'phMax': 7,
        'description': '黑白条纹分明，高端异型。',
        'careTip': '高温高氧是关键。',
        'size': '12-15', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '温和'
    },
    # 工具鱼类别
    {
        'name': '小精灵', 'englishName': 'Otocinclus', 'scientificName': 'Otocinclus affinis',
        'categoryName': '工具鱼', 'subcategoryName': '除藻', 'origin': '南美',
        'difficulty': 'medium', 'tempMin': 22, 'tempMax': 26, 'phMin': 6, 'phMax': 7.5,
        'description': '草缸除藻神器，体型迷你。',
        'careTip': '需要稳定的老缸，不耐新水。',
        'size': '3-5', 'lifespan': '3-5', 'diet': '素食', 'compatibility': '群居温和'
    },
    {
        'name': '黑线飞狐', 'englishName': 'Siamese Algae Eater', 'scientificName': 'Crossocheilus oblongus',
        'categoryName': '工具鱼', 'subcategoryName': '除藻', 'origin': '东南亚',
        'difficulty': 'easy', 'tempMin': 24, 'tempMax': 28, 'phMin': 6.5, 'phMax': 7.5,
        'description': '吃黑毛藻的利器。',
        'careTip': '体型会变大，成年后除藻效率下降。',
        'size': '12-16', 'lifespan': '8-10', 'diet': '杂食', 'compatibility': '有攻击性'
    },
    {
        'name': '青苔鼠', 'englishName': 'Chinese Algae Eater', 'scientificName': 'Gyrinocheilus aymonieri',
        'categoryName': '工具鱼', 'subcategoryName': '除藻', 'origin': '东南亚',
        'difficulty': 'easy', 'tempMin': 22, 'tempMax': 28, 'phMin': 6, 'phMax': 8,
        'description': '幼鱼除藻好手。',
        'careTip': '成年后会吸其他鱼体表粘液，慎混养。',
        'size': '15-28', 'lifespan': '10-15', 'diet': '杂食', 'compatibility': '有攻击性'
    },
    {
        'name': '大和藻虾', 'englishName': 'Amano Shrimp', 'scientificName': 'Caridina multidentata',
        'categoryName': '工具鱼', 'subcategoryName': '除藻', 'origin': '日本',
        'difficulty': 'easy', 'tempMin': 18, 'tempMax': 28, 'phMin': 6.5, 'phMax': 7.5,
        'description': '除藻效率最高的虾。',
        'careTip': '淡水不能繁殖，需定期补充。',
        'size': '4-5', 'lifespan': '2-3', 'diet': '杂食', 'compatibility': '温和'
    },
    {
        'name': '樱花虾', 'englishName': 'Cherry Shrimp', 'scientificName': 'Neocaridina davidi',
        'categoryName': '工具鱼', 'subcategoryName': '观赏虾', 'origin': '台湾',
        'difficulty': 'easy', 'tempMin': 18, 'tempMax': 28, 'phMin': 6.5, 'phMax': 8,
        'description': '红色观赏虾，易繁殖。',
        'careTip': '避免与大型鱼混养。',
        'size': '2-3', 'lifespan': '1-2', 'diet': '杂食', 'compatibility': '温和'
    },
    {
        'name': '水晶虾', 'englishName': 'Crystal Red Shrimp', 'scientificName': 'Caridina cantonensis',
        'categoryName': '工具鱼', 'subcategoryName': '观赏虾', 'origin': '日本改良',
        'difficulty': 'hard', 'tempMin': 20, 'tempMax': 25, 'phMin': 5.5, 'phMax': 6.8,
        'description': '红白条纹，高端观赏虾。',
        'careTip': '对水质极其敏感。',
        'size': '2-3', 'lifespan': '1.5-2', 'diet': '杂食', 'compatibility': '温和'
    },
    {
        'name': '苹果螺', 'englishName': 'Apple Snail', 'scientificName': 'Pomacea bridgesii',
        'categoryName': '工具鱼', 'subcategoryName': '螺类', 'origin': '南美',
        'difficulty': 'easy', 'tempMin': 18, 'tempMax': 28, 'phMin': 7, 'phMax': 8,
        'description': '清理残饵，多种颜色。',
        'careTip': '可能啃食水草嫩叶。',
        'size': '5-8', 'lifespan': '1-3', 'diet': '杂食', 'compatibility': '温和'
    },
    {
        'name': '斑马螺', 'englishName': 'Zebra Nerite', 'scientificName': 'Neritina natalensis',
        'categoryName': '工具鱼', 'subcategoryName': '螺类', 'origin': '非洲',
        'difficulty': 'easy', 'tempMin': 22, 'tempMax': 28, 'phMin': 7, 'phMax': 8.5,
        'description': '除藻效率高，不吃水草。',
        'careTip': '淡水不繁殖，会产白色卵。',
        'size': '2-3', 'lifespan': '1-2', 'diet': '素食', 'compatibility': '温和'
    },
    # 三湖补充 - 孔雀类
    {
        'name': '红宝石', 'englishName': 'Red Jewel Cichlid', 'scientificName': 'Hemichromis bimaculatus',
        'categoryName': '三湖慈鲷', 'subcategoryName': '马鲷', 'origin': '西非',
        'difficulty': 'medium', 'tempMin': 24, 'tempMax': 28, 'phMin': 7, 'phMax': 8,
        'description': '通体红色带蓝点，发色惊艳。',
        'careTip': '领地意识极强，繁殖期凶猛。',
        'size': '10-15', 'lifespan': '5-8', 'diet': '杂食', 'compatibility': '有攻击性'
    },
    {
        'name': '蓝宝石', 'englishName': 'Blue Peacock', 'scientificName': 'Aulonocara stuartgranti',
        'categoryName': '三湖慈鲷', 'subcategoryName': '孔雀', 'origin': '马拉维湖',
        'difficulty': 'medium', 'tempMin': 24, 'tempMax': 28, 'phMin': 7.5, 'phMax': 8.5,
        'description': '电光蓝色，孔雀类代表。',
        'careTip': '高密度饲养分散攻击力。',
        'size': '12-15', 'lifespan': '8-10', 'diet': '杂食', 'compatibility': '高密度'
    },
    {
        'name': '黄金孔雀', 'englishName': 'Lemon Jake', 'scientificName': 'Aulonocara sp.',
        'categoryName': '三湖慈鲷', 'subcategoryName': '孔雀', 'origin': '马拉维湖',
        'difficulty': 'medium', 'tempMin': 24, 'tempMax': 28, 'phMin': 7.5, 'phMax': 8.5,
        'description': '金黄色系孔雀。',
        'careTip': '沙层觅食，需细底砂。',
        'size': '12-15', 'lifespan': '8-10', 'diet': '杂食', 'compatibility': '高密度'
    },
    {
        'name': '火焰红孔雀', 'englishName': 'Dragon Blood Peacock', 'scientificName': 'Aulonocara sp.',
        'categoryName': '三湖慈鲷', 'subcategoryName': '孔雀', 'origin': '改良',
        'difficulty': 'medium', 'tempMin': 24, 'tempMax': 28, 'phMin': 7.5, 'phMax': 8.5,
        'description': '橙红色改良品种。',
        'careTip': '避免与同色系混养。',
        'size': '12-15', 'lifespan': '8-10', 'diet': '杂食', 'compatibility': '高密度'
    },
    # 孔雀鱼品系补充
    {
        'name': '礼服孔雀', 'englishName': 'Tuxedo Guppy', 'scientificName': 'Poecilia reticulata var.',
        'categoryName': '孔雀/卵胎生', 'subcategoryName': '孔雀品系', 'origin': '改良',
        'difficulty': 'easy', 'tempMin': 22, 'tempMax': 28, 'phMin': 7, 'phMax': 8,
        'description': '后半身深色如礼服。',
        'careTip': '基因稳定，繁殖容易。',
        'size': '3-5', 'lifespan': '2-3', 'diet': '杂食', 'compatibility': '群居温和'
    },
    {
        'name': '蛇纹孔雀', 'englishName': 'Cobra Guppy', 'scientificName': 'Poecilia reticulata var.',
        'categoryName': '孔雀/卵胎生', 'subcategoryName': '孔雀品系', 'origin': '改良',
        'difficulty': 'easy', 'tempMin': 22, 'tempMax': 28, 'phMin': 7, 'phMax': 8,
        'description': '身体有蛇皮般纹路。',
        'careTip': '体质强健。',
        'size': '3-5', 'lifespan': '2-3', 'diet': '杂食', 'compatibility': '群居温和'
    },
    {
        'name': '马赛克孔雀', 'englishName': 'Mosaic Guppy', 'scientificName': 'Poecilia reticulata var.',
        'categoryName': '孔雀/卵胎生', 'subcategoryName': '孔雀品系', 'origin': '改良',
        'difficulty': 'medium', 'tempMin': 22, 'tempMax': 28, 'phMin': 7, 'phMax': 8,
        'description': '尾部马赛克般斑块。',
        'careTip': '保持品系需要选种。',
        'size': '3-5', 'lifespan': '2-3', 'diet': '杂食', 'compatibility': '群居温和'
    },
    {
        'name': '缎带孔雀', 'englishName': 'Ribbon Guppy', 'scientificName': 'Poecilia reticulata var.',
        'categoryName': '孔雀/卵胎生', 'subcategoryName': '孔雀品系', 'origin': '改良',
        'difficulty': 'medium', 'tempMin': 22, 'tempMax': 28, 'phMin': 7, 'phMax': 8,
        'description': '腹鳍延长如缎带。',
        'careTip': '游速慢，避免与快鱼混养。',
        'size': '3-5', 'lifespan': '2-3', 'diet': '杂食', 'compatibility': '群居温和'
    },
]

def download_image(fish_name, scientific_name, category):
    """下载鱼类图片"""
    # 构建文件名
    safe_name = re.sub(r'[^\w\u4e00-\u9fff]', '', fish_name)
    safe_sci = re.sub(r'[^\w]', '', scientific_name.split()[0].lower()) if scientific_name else 'unknown'
    filename = f"fish_new_{safe_name}_{safe_sci}.jpg"
    filepath = os.path.join(IMAGES_DIR, filename)

    # 检查是否已存在
    if os.path.exists(filepath):
        print(f"  [跳过] {fish_name} 图片已存在")
        return filepath

    # SSL上下文
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # 搜索关键词
    search_terms = [
        f"{fish_name} 观赏鱼",
        f"{fish_name} aquarium fish",
    ]

    for term in search_terms:
        try:
            # 使用必应图片搜索
            encoded_term = quote(term)
            url = f"https://www.bing.com/images/search?q={encoded_term}&form=HDRSC2&first=1"

            req = Request(url, headers=HEADERS)
            response = urlopen(req, timeout=10, context=ctx)
            html = response.read().decode('utf-8', errors='ignore')

            # 查找murl参数中的图片URL
            matches = re.findall(r'"murl":"(https?://[^"]+\.(?:jpg|jpeg|png))"', html, re.IGNORECASE)

            if matches:
                for img_url in matches[:3]:  # 尝试前3个
                    try:
                        img_req = Request(img_url, headers=HEADERS)
                        img_response = urlopen(img_req, timeout=15, context=ctx)
                        img_data = img_response.read()
                        if len(img_data) > 5000:
                            with open(filepath, 'wb') as f:
                                f.write(img_data)
                            print(f"  [成功] {fish_name} -> {filename}")
                            return filepath
                    except Exception as e:
                        continue
        except Exception as e:
            print(f"  [错误] {fish_name}: {e}")
            continue

        time.sleep(0.5)  # 请求间隔

    print(f"  [失败] {fish_name} 未找到合适图片")
    return os.path.join(IMAGES_DIR, f"placeholder_{safe_name}.jpg")

def load_existing_data():
    """加载现有数据"""
    data = []
    with open(INPUT_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data

def fix_categories(data):
    """修正分类"""
    for row in data:
        name = row['name']
        if name in CATEGORY_FIXES:
            new_cat, new_sub = CATEGORY_FIXES[name]
            print(f"  修正: {name} -> {new_cat}/{new_sub}")
            row['categoryName'] = new_cat
            row['subcategoryName'] = new_sub
    return data

def add_extra_fields(data):
    """添加额外字段"""
    for row in data:
        name = row['name']
        if name in FISH_EXTRA_DATA:
            size, lifespan, diet, compat = FISH_EXTRA_DATA[name]
            row['size'] = size
            row['lifespan'] = lifespan
            row['diet'] = diet
            row['compatibility'] = compat
        else:
            # 默认值
            row['size'] = ''
            row['lifespan'] = ''
            row['diet'] = ''
            row['compatibility'] = ''
    return data

def process_new_fish():
    """处理新增鱼类"""
    new_records = []
    for fish in NEW_FISH_DATA:
        # 下载图片
        img_path = download_image(fish['name'], fish['scientificName'], fish['categoryName'])

        # 构建完整记录
        record = {
            'name': fish['name'],
            'englishName': fish['englishName'],
            'scientificName': fish['scientificName'],
            'categoryName': fish['categoryName'],
            'subcategoryName': fish['subcategoryName'],
            'origin': fish['origin'],
            'difficulty': fish['difficulty'],
            'tempMin': fish['tempMin'],
            'tempMax': fish['tempMax'],
            'phMin': fish['phMin'],
            'phMax': fish['phMax'],
            'description': fish['description'],
            'careTip': fish['careTip'],
            'environment': '',  # 后续可补充
            'husbandry_features': '',
            'notes': '',
            'localImagePath': img_path,
            'size': fish.get('size', ''),
            'lifespan': fish.get('lifespan', ''),
            'diet': fish.get('diet', ''),
            'compatibility': fish.get('compatibility', ''),
        }
        new_records.append(record)
    return new_records

def save_data(data, output_file):
    """保存数据"""
    fieldnames = [
        'name', 'englishName', 'scientificName', 'categoryName', 'subcategoryName',
        'origin', 'difficulty', 'tempMin', 'tempMax', 'phMin', 'phMax',
        'description', 'careTip', 'environment', 'husbandry_features', 'notes',
        'localImagePath', 'size', 'lifespan', 'diet', 'compatibility'
    ]

    with open(output_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"\n保存完成: {output_file}")
    print(f"总记录数: {len(data)}")

def main():
    print("=" * 60)
    print("Fish Database Enhancement Script")
    print("=" * 60)

    # 1. 加载现有数据
    print("\n[1/5] 加载现有数据...")
    data = load_existing_data()
    print(f"  加载 {len(data)} 条记录")

    # 2. 修正分类
    print("\n[2/5] 修正分类归属...")
    data = fix_categories(data)

    # 3. 添加额外字段
    print("\n[3/5] 添加额外字段 (体长/寿命/食性/混养)...")
    data = add_extra_fields(data)

    # 4. 处理新增鱼类
    print("\n[4/5] 添加新品种并下载图片...")
    new_records = process_new_fish()
    data.extend(new_records)
    print(f"  新增 {len(new_records)} 条记录")

    # 5. 保存数据
    print("\n[5/5] 保存数据...")
    save_data(data, OUTPUT_FILE)

    print("\n" + "=" * 60)
    print("处理完成!")
    print("=" * 60)

if __name__ == '__main__':
    main()
