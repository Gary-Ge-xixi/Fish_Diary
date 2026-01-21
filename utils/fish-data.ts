export interface FishSpecies {
  id: string;
  name: string;
  englishName: string;
  scientificName: string;
  category: 'characins' | 'cichlids' | 'cyprinids' | 'livebearers' | 'catfish' | 'others';
  categoryName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  temperature: string; // e.g. "22-28"
  ph: string; // e.g. "6.0-7.5"
  size: string; // cm
  temperament: string; // 性格
  diet: string; // 食性
  description: string;
  imageUrl: string;
}

export const fishEncyclopedia: FishSpecies[] = [
  {
    id: 'f001',
    name: '红绿灯',
    englishName: 'Neon Tetra',
    scientificName: 'Paracheirodon innesi',
    category: 'characins',
    categoryName: '灯科鱼',
    difficulty: 'easy',
    temperature: '20-26',
    ph: '5.0-7.0',
    size: '3-4',
    temperament: '温和/群游',
    diet: '杂食性',
    description: '水族箱中最经典的品种之一，身体侧面有一条明亮的蓝绿色带和一条红色带。性格温和，适合群养，喜欢弱酸性软水。',
    imageUrl: 'https://img.yzcdn.cn/vant/cat.jpeg' // 替换为真实图片
  },
  {
    id: 'f002',
    name: '孔雀鱼',
    englishName: 'Guppy',
    scientificName: 'Poecilia reticulata',
    category: 'livebearers',
    categoryName: '卵胎生',
    difficulty: 'easy',
    temperature: '22-28',
    ph: '7.0-8.0',
    size: '3-6',
    temperament: '温和',
    diet: '杂食性',
    description: '繁殖能力极强，有“百万鱼”之称。尾巴形状和颜色千变万化。适应能力强，适合新手。',
    imageUrl: ''
  },
  {
    id: 'f003',
    name: '神仙鱼',
    englishName: 'Angelfish',
    scientificName: 'Pterophyllum scalare',
    category: 'cichlids',
    categoryName: '慈鲷',
    difficulty: 'medium',
    temperature: '24-30',
    ph: '6.0-7.5',
    size: '12-15',
    temperament: '半攻击性',
    diet: '肉食性/杂食',
    description: '体形侧扁如燕，泳姿优雅。需要较高的水体（鱼缸高度最好>45cm）。对于小灯鱼可能有攻击性。',
    imageUrl: ''
  },
  {
    id: 'f004',
    name: '七彩神仙',
    englishName: 'Discus',
    scientificName: 'Symphysodon',
    category: 'cichlids',
    categoryName: '慈鲷',
    difficulty: 'hard',
    temperature: '28-32',
    ph: '5.0-7.0',
    size: '15-20',
    temperament: '温和/敏感',
    diet: '肉食性',
    description: '热带鱼之王，体色艳丽。对水质要求极高，需要高温、软水和极其稳定的环境。不适合新手。',
    imageUrl: ''
  },
  {
    id: 'f005',
    name: '斑马鱼',
    englishName: 'Zebra Danio',
    scientificName: 'Danio rerio',
    category: 'cyprinids',
    categoryName: '鲤科',
    difficulty: 'easy',
    temperature: '18-25',
    ph: '6.5-7.5',
    size: '4-6',
    temperament: '活泼',
    diet: '杂食性',
    description: '身体有深蓝色条纹，极其耐寒，活泼好动，几乎整天在游动。是极其优秀的闯缸鱼。',
    imageUrl: ''
  },
  {
    id: 'f006',
    name: '斗鱼',
    englishName: 'Betta Fish',
    scientificName: 'Betta splendens',
    category: 'others',
    categoryName: '迷鳃鱼',
    difficulty: 'easy',
    temperature: '24-30',
    ph: '6.0-8.0',
    size: '6-8',
    temperament: '好斗（雄性）',
    diet: '肉食性',
    description: '雄性好斗不能混养。拥有特殊的迷鳃辅助呼吸器官，可以直接呼吸空气，对低氧环境耐受度高。',
    imageUrl: ''
  },
  {
    id: 'f007',
    name: '鼠鱼',
    englishName: 'Corydoras',
    scientificName: 'Corydoras',
    category: 'catfish',
    categoryName: '底栖鱼',
    difficulty: 'easy',
    temperature: '22-26',
    ph: '6.0-7.5',
    size: '3-8',
    temperament: '温和',
    diet: '沉底饲料',
    description: '底栖性鱼类，性格温和呆萌，通过触须寻找底砂中的食物残渣，是很好的工具鱼。建议使用细沙底床。',
    imageUrl: ''
  },
  {
    id: 'f008',
    name: '异形鱼',
    englishName: 'Pleco',
    scientificName: 'Loricariidae',
    category: 'catfish',
    categoryName: '底栖鱼',
    difficulty: 'medium',
    temperature: '24-28',
    ph: '6.5-7.5',
    size: '10-50',
    temperament: '温和',
    diet: '素食/沉底',
    description: '吸盘嘴，能刮食藻类。品种繁多（如胡子、皇冠豹、熊猫异形）。部分品种能长得非常巨大。',
    imageUrl: ''
  },
  {
    id: 'f009',
    name: '一眉道人',
    englishName: 'Denison Barb',
    scientificName: 'Puntius denisonii',
    category: 'cyprinids',
    categoryName: '鲤科',
    difficulty: 'medium',
    temperature: '15-25',
    ph: '6.5-7.5',
    size: '10-15',
    temperament: '温和',
    diet: '杂食性',
    description: '身体有一条贯穿眼睛的黑红条纹。需要较大的活动空间和高溶氧量。群游效果极佳。',
    imageUrl: ''
  },
  {
    id: 'f010',
    name: '米奇鱼',
    englishName: 'Mickey Mouse Platy',
    scientificName: 'Xiphophorus maculatus',
    category: 'livebearers',
    categoryName: '卵胎生',
    difficulty: 'easy',
    temperature: '20-26',
    ph: '7.0-8.0',
    size: '4-6',
    temperament: '温和',
    diet: '杂食性',
    description: '尾柄处有三个黑点，形似米奇老鼠的头。颜色丰富（红、白、黄）。性格温和，容易繁殖。',
    imageUrl: ''
  },
  {
    id: 'f011',
    name: '红鼻剪刀',
    englishName: 'Rummy-nose Tetra',
    scientificName: 'Hemigrammus bleheri',
    category: 'characins',
    categoryName: '灯科鱼',
    difficulty: 'medium',
    temperature: '24-28',
    ph: '5.5-7.0',
    size: '4-5',
    temperament: '温和/群游',
    diet: '杂食性',
    description: '头部红色，尾部有黑白条纹。群游性极强，是水草缸的最佳配角。对水质变化较敏感（头部颜色会变淡）。',
    imageUrl: ''
  },
  {
    id: 'f012',
    name: '三湖慈鲷',
    englishName: 'African Cichlids',
    scientificName: 'Cichlidae',
    category: 'cichlids',
    categoryName: '慈鲷',
    difficulty: 'medium',
    temperature: '24-28',
    ph: '7.5-8.5',
    size: '10-20',
    temperament: '攻击性强',
    diet: '杂食性',
    description: '产自非洲三大湖。颜色艳丽如海水鱼。喜欢硬水高pH。领地意识极强，需要专门造景（岩石堆）。',
    imageUrl: ''
  }
];
