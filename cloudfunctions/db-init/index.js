// 数据库初始化云函数 - 创建集合和导入预设数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 需要创建的集合列表
const collections = [
  'users',
  'tanks',
  'fish',
  'fish_categories',
  'fish_subcategories',
  'fish_species',
  'fish_care_tips',
  'equipment',
  'feeding_records',
  'feeding_schedules',
  'water_change_records',
  'water_change_schedules',
  'water_quality_records',
  'subscriptions'
]

// 预设数据
const presetData = {
  fish_categories: [
    {
      "_id": "cat_freshwater",
      "name": "淡水鱼",
      "slug": "freshwater",
      "description": "生活在淡水环境中的观赏鱼，占大多数观赏鱼品种",
      "order": 1,
      "createdAt": new Date("2025-01-08T00:00:00.000Z")
    },
    {
      "_id": "cat_saltwater",
      "name": "海水鱼",
      "slug": "saltwater",
      "description": "生活在海水环境中的观赏鱼，需要专业的海水缸设备",
      "order": 2,
      "createdAt": new Date("2025-01-08T00:00:00.000Z")
    },
    {
      "_id": "cat_brackish",
      "name": "汽水鱼",
      "slug": "brackish",
      "description": "半咸水鱼，可适应淡水和低盐度环境",
      "order": 3,
      "createdAt": new Date("2025-01-08T00:00:00.000Z")
    }
  ],
  fish_subcategories: [
    {"_id": "subcat_goldfish", "categoryId": "cat_freshwater", "name": "金鱼", "slug": "goldfish", "description": "中国传统冷水观赏鱼，适应力强，品种多样", "order": 1, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "subcat_koi", "categoryId": "cat_freshwater", "name": "锦鲤", "slug": "koi", "description": "大型冷水鱼，色彩艳丽，需要大水体饲养", "order": 2, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "subcat_tetra", "categoryId": "cat_freshwater", "name": "灯鱼", "slug": "tetra", "description": "小型热带群游鱼，霓虹色彩，适合群养", "order": 3, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "subcat_arowana", "categoryId": "cat_freshwater", "name": "龙鱼", "slug": "arowana", "description": "大型热带鱼，体态优雅，被视为风水鱼", "order": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "subcat_livebearer", "categoryId": "cat_freshwater", "name": "卵胎生鱼", "slug": "livebearer", "description": "繁殖力强，直接产仔，适合新手饲养", "order": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "subcat_labyrinth", "categoryId": "cat_freshwater", "name": "斗鱼/迷鳃鱼", "slug": "labyrinth", "description": "有迷鳃器官可呼吸空气，色彩艳丽", "order": 6, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "subcat_cichlid", "categoryId": "cat_freshwater", "name": "慈鲷", "slug": "cichlid", "description": "色彩丰富，有领地意识，种类繁多", "order": 7, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "subcat_catfish", "categoryId": "cat_freshwater", "name": "鲶鱼/工具鱼", "slug": "catfish", "description": "底栖清洁鱼，帮助清理鱼缸藻类和残渣", "order": 8, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "subcat_clownfish", "categoryId": "cat_saltwater", "name": "小丑鱼", "slug": "clownfish", "description": "与海葵共生的热带海水鱼，因电影《海底总动员》而闻名", "order": 1, "createdAt": new Date("2025-01-08T00:00:00.000Z")}
  ],
  fish_species: [
    {"_id": "species_goldfish", "subcategoryId": "subcat_goldfish", "name": "金鱼", "englishName": "Goldfish", "scientificName": "Carassius auratus", "priceMin": 5, "priceMax": 500, "description": "最常见的观赏鱼之一，有多种品种如狮头、龙睛、珍珠等。适应性强，适合新手饲养。", "characteristics": "体型圆润，色彩丰富（红、金、白、黑等），尾鳍形态多变，游动优雅", "bodyLengthMin": 10, "bodyLengthMax": 20, "tempMin": 10, "tempMax": 25, "phMin": 6.5, "phMax": 8.0, "difficulty": "easy", "temperament": "peaceful", "lifespan": "10-15年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_koi", "subcategoryId": "subcat_koi", "name": "锦鲤", "englishName": "Koi", "scientificName": "Cyprinus rubrofuscus", "priceMin": 20, "priceMax": 10000, "description": "大型观赏鱼，色彩艳丽，需要大型水体饲养。寿命长，可达数十年。", "characteristics": "体型修长，鳞片光泽，花纹独特，每条锦鲤花纹都是独一无二的", "bodyLengthMin": 30, "bodyLengthMax": 90, "tempMin": 15, "tempMax": 25, "phMin": 6.8, "phMax": 8.2, "difficulty": "medium", "temperament": "peaceful", "lifespan": "25-35年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_guppy", "subcategoryId": "subcat_livebearer", "name": "孔雀鱼", "englishName": "Guppy", "scientificName": "Poecilia reticulata", "priceMin": 3, "priceMax": 50, "description": "最受欢迎的热带鱼之一，繁殖力强，色彩丰富，雄鱼尾鳍华丽。", "characteristics": "雄鱼尾鳍扇形展开如孔雀开屏，色彩斑斓，体型小巧活泼", "bodyLengthMin": 3, "bodyLengthMax": 5, "tempMin": 22, "tempMax": 28, "phMin": 6.8, "phMax": 7.8, "difficulty": "easy", "temperament": "peaceful", "lifespan": "1-3年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_betta", "subcategoryId": "subcat_labyrinth", "name": "斗鱼", "englishName": "Betta", "scientificName": "Betta splendens", "priceMin": 10, "priceMax": 500, "description": "泰国斗鱼，色彩艳丽，雄鱼具有攻击性，不能混养。有迷鳃器官可呼吸空气。", "characteristics": "鱼鳍飘逸如纱，色彩鲜艳，雄鱼好斗，领地意识强烈", "bodyLengthMin": 5, "bodyLengthMax": 7, "tempMin": 24, "tempMax": 30, "phMin": 6.0, "phMax": 8.0, "difficulty": "easy", "temperament": "aggressive", "lifespan": "2-5年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_neon_tetra", "subcategoryId": "subcat_tetra", "name": "红绿灯鱼", "englishName": "Neon Tetra", "scientificName": "Paracheirodon innesi", "priceMin": 2, "priceMax": 5, "description": "小型热带鱼，身体侧面有霓虹般的蓝色和红色条纹，适合群养。", "characteristics": "身体中部有蓝绿色荧光带，下半部为红色，群游效果极佳", "bodyLengthMin": 2.5, "bodyLengthMax": 3.5, "tempMin": 20, "tempMax": 26, "phMin": 6.0, "phMax": 7.0, "difficulty": "easy", "temperament": "peaceful", "lifespan": "5-8年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_angelfish", "subcategoryId": "subcat_cichlid", "name": "神仙鱼", "englishName": "Angelfish", "scientificName": "Pterophyllum scalare", "priceMin": 15, "priceMax": 200, "description": "体型优雅的慈鲷科鱼类，呈三角形，有多种颜色变异。需要较高的水深。", "characteristics": "体型扁平呈菱形，背鳍和臀鳍延长如天使翅膀，游姿优雅", "bodyLengthMin": 10, "bodyLengthMax": 15, "tempMin": 24, "tempMax": 30, "phMin": 6.0, "phMax": 7.5, "difficulty": "medium", "temperament": "semi-aggressive", "lifespan": "10-15年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_discus", "subcategoryId": "subcat_cichlid", "name": "七彩神仙", "englishName": "Discus", "scientificName": "Symphysodon spp.", "priceMin": 100, "priceMax": 2000, "description": "被称为热带鱼之王，色彩绚丽，体型圆盘状。对水质要求高，适合有经验的玩家。", "characteristics": "体型圆如盘，色彩绚丽如画，花纹独特，被誉为热带鱼之王", "bodyLengthMin": 15, "bodyLengthMax": 20, "tempMin": 26, "tempMax": 32, "phMin": 5.5, "phMax": 6.8, "difficulty": "hard", "temperament": "peaceful", "lifespan": "10-18年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_pleco", "subcategoryId": "subcat_catfish", "name": "清道夫", "englishName": "Plecostomus", "scientificName": "Hypostomus plecostomus", "priceMin": 10, "priceMax": 50, "description": "底栖鱼类，主要食用藻类和残渣，对清洁鱼缸有帮助。夜行性。", "characteristics": "嘴部吸盘状，身体扁平，善于吸附在缸壁上清理藻类", "bodyLengthMin": 20, "bodyLengthMax": 45, "tempMin": 22, "tempMax": 30, "phMin": 6.5, "phMax": 7.5, "difficulty": "easy", "temperament": "peaceful", "lifespan": "10-15年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_clownfish", "subcategoryId": "subcat_clownfish", "name": "小丑鱼", "englishName": "Clownfish", "scientificName": "Amphiprion ocellaris", "priceMin": 50, "priceMax": 300, "description": "海水观赏鱼，与海葵共生。因电影《海底总动员》而闻名。", "characteristics": "橙色身体配白色条纹，与海葵共生，游动活泼可爱", "bodyLengthMin": 8, "bodyLengthMax": 11, "tempMin": 24, "tempMax": 28, "phMin": 8.0, "phMax": 8.4, "difficulty": "medium", "temperament": "semi-aggressive", "lifespan": "6-10年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_platy", "subcategoryId": "subcat_livebearer", "name": "米奇鱼", "englishName": "Mickey Mouse Platy", "scientificName": "Xiphophorus maculatus", "priceMin": 5, "priceMax": 20, "description": "卵胎生鱼类，尾部有米老鼠图案斑纹。繁殖力强，颜色多样。", "characteristics": "尾柄处有米老鼠头像斑纹，小巧可爱，色彩多样", "bodyLengthMin": 3, "bodyLengthMax": 5, "tempMin": 20, "tempMax": 28, "phMin": 7.0, "phMax": 8.2, "difficulty": "easy", "temperament": "peaceful", "lifespan": "3-5年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_black_molly", "subcategoryId": "subcat_livebearer", "name": "黑玛丽", "englishName": "Black Molly", "scientificName": "Poecilia sphenops", "priceMin": 5, "priceMax": 25, "description": "全身黑色的卵胎生鱼，容易繁殖，性情温和。可适应淡水和汽水环境。", "characteristics": "全身墨黑如缎，体型健壮，适应性强", "bodyLengthMin": 6, "bodyLengthMax": 10, "tempMin": 22, "tempMax": 28, "phMin": 7.5, "phMax": 8.5, "difficulty": "easy", "temperament": "peaceful", "lifespan": "3-5年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_tiger_barb", "subcategoryId": "subcat_tetra", "name": "虎皮鱼", "englishName": "Tiger Barb", "scientificName": "Puntigrus tetrazona", "priceMin": 5, "priceMax": 15, "description": "活泼好动的鱼类，身上有黑色条纹。群养时会减少对其他鱼的攻击行为。", "characteristics": "身体呈金黄色，有4条黑色竖纹如虎斑，活泼好动", "bodyLengthMin": 5, "bodyLengthMax": 7, "tempMin": 20, "tempMax": 26, "phMin": 6.0, "phMax": 7.5, "difficulty": "easy", "temperament": "semi-aggressive", "lifespan": "5-7年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_zebra_danio", "subcategoryId": "subcat_tetra", "name": "斑马鱼", "englishName": "Zebra Danio", "scientificName": "Danio rerio", "priceMin": 3, "priceMax": 10, "description": "身上有水平条纹的小型鱼，非常活泼，适合群养。常用于科学研究。", "characteristics": "身体有蓝黑色水平条纹如斑马纹，游速快，活力充沛", "bodyLengthMin": 3, "bodyLengthMax": 5, "tempMin": 18, "tempMax": 26, "phMin": 6.5, "phMax": 7.5, "difficulty": "easy", "temperament": "peaceful", "lifespan": "3-5年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_pearl_gourami", "subcategoryId": "subcat_labyrinth", "name": "珍珠马甲", "englishName": "Pearl Gourami", "scientificName": "Trichopodus leerii", "priceMin": 15, "priceMax": 50, "description": "迷鳃鱼，体表布满珍珠般的斑点，胸鳍细长如触须。性情温和。", "characteristics": "体表布满银白色珍珠状斑点，腹鳍延长如丝，优雅美丽", "bodyLengthMin": 8, "bodyLengthMax": 12, "tempMin": 24, "tempMax": 28, "phMin": 6.0, "phMax": 8.0, "difficulty": "easy", "temperament": "peaceful", "lifespan": "4-6年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_moonlight_gourami", "subcategoryId": "subcat_labyrinth", "name": "月光鱼", "englishName": "Moonlight Gourami", "scientificName": "Trichopodus microlepis", "priceMin": 20, "priceMax": 60, "description": "银白色的迷鳃鱼，体型较大，性情温和。眼睛呈红色。", "characteristics": "全身银白如月光，眼睛红色，体态优雅", "bodyLengthMin": 10, "bodyLengthMax": 15, "tempMin": 25, "tempMax": 30, "phMin": 6.0, "phMax": 7.5, "difficulty": "easy", "temperament": "peaceful", "lifespan": "4-6年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_flowerhorn", "subcategoryId": "subcat_cichlid", "name": "罗汉鱼", "englishName": "Flowerhorn", "scientificName": "Hybrid", "priceMin": 50, "priceMax": 5000, "description": "人工培育的慈鲷杂交品种，头部隆起明显，颜色鲜艳，具有攻击性。", "characteristics": "头部隆起形成寿星头，体色艳丽，花纹独特，极具观赏价值", "bodyLengthMin": 20, "bodyLengthMax": 30, "tempMin": 26, "tempMax": 30, "phMin": 6.5, "phMax": 8.0, "difficulty": "medium", "temperament": "aggressive", "lifespan": "8-12年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_oscar", "subcategoryId": "subcat_cichlid", "name": "地图鱼", "englishName": "Oscar", "scientificName": "Astronotus ocellatus", "priceMin": 30, "priceMax": 300, "description": "大型慈鲷，智商高，可以认识主人。需要大型鱼缸，有攻击性。", "characteristics": "体表花纹如地图，智商高，能与主人互动，个性鲜明", "bodyLengthMin": 25, "bodyLengthMax": 35, "tempMin": 22, "tempMax": 28, "phMin": 6.0, "phMax": 8.0, "difficulty": "medium", "temperament": "aggressive", "lifespan": "10-20年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_arowana", "subcategoryId": "subcat_arowana", "name": "银龙鱼", "englishName": "Silver Arowana", "scientificName": "Osteoglossum bicirrhosum", "priceMin": 100, "priceMax": 3000, "description": "大型观赏鱼，体型修长，鳞片银色闪亮。被认为能带来好运。", "characteristics": "体型修长如龙，鳞片银光闪闪，游姿威武，被视为风水鱼", "bodyLengthMin": 60, "bodyLengthMax": 90, "tempMin": 24, "tempMax": 30, "phMin": 6.0, "phMax": 7.5, "difficulty": "hard", "temperament": "semi-aggressive", "lifespan": "10-20年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_blood_parrot", "subcategoryId": "subcat_cichlid", "name": "鹦鹉鱼", "englishName": "Blood Parrot Cichlid", "scientificName": "Hybrid", "priceMin": 20, "priceMax": 200, "description": "人工杂交品种，嘴型似鹦鹉，多为红色。性情温和，适合社区缸。", "characteristics": "嘴型弯曲似鹦鹉喙，体色鲜红喜庆，性格温顺可爱", "bodyLengthMin": 15, "bodyLengthMax": 20, "tempMin": 24, "tempMax": 28, "phMin": 6.5, "phMax": 7.5, "difficulty": "easy", "temperament": "peaceful", "lifespan": "10-15年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "species_african_cichlid", "subcategoryId": "subcat_cichlid", "name": "三湖慈鲷", "englishName": "African Cichlid", "scientificName": "Various", "priceMin": 20, "priceMax": 500, "description": "来自非洲三大湖的慈鲷总称，颜色艳丽多变，有一定攻击性。", "characteristics": "色彩艳丽如热带鱼，品种繁多，领地意识强", "bodyLengthMin": 10, "bodyLengthMax": 15, "tempMin": 24, "tempMax": 28, "phMin": 7.8, "phMax": 8.6, "difficulty": "medium", "temperament": "aggressive", "lifespan": "8-15年", "imageUrl": "", "source": "preset", "isVerified": true, "createdAt": new Date("2025-01-08T00:00:00.000Z"), "updatedAt": new Date("2025-01-08T00:00:00.000Z")}
  ],
  fish_care_tips: [
    {"_id": "tip_goldfish_feeding", "speciesId": "species_goldfish", "tipType": "feeding", "content": "每日喂食1-2次，每次以3-5分钟内吃完为宜。金鱼贪吃，容易过量进食导致消化问题，建议少量多餐。可投喂专用金鱼饲料、水蚤、红虫等。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_goldfish_water", "speciesId": "species_goldfish", "tipType": "water_quality", "content": "每周换水20-30%，金鱼产生废物较多，需要良好的过滤系统。水温保持稳定，避免剧烈波动。新水需要除氯处理后使用。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_goldfish_tank", "speciesId": "species_goldfish", "tipType": "tank_setup", "content": "金鱼需要较大的游动空间，建议每条金鱼至少配备20升水量。底砂选用圆滑的河沙或裸缸，避免金鱼翻找时受伤。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_goldfish_disease", "speciesId": "species_goldfish", "tipType": "disease", "content": "常见疾病包括白点病、烂鳍病、肠炎等。保持水质清洁是预防的关键。发现异常及时隔离治疗，可使用专用鱼药。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_goldfish_compatibility", "speciesId": "species_goldfish", "tipType": "compatibility", "content": "金鱼性格温和，适合与同类混养。避免与热带鱼混养（水温需求不同），也不宜与游速快的鱼混养（会抢食）。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_neon_feeding", "speciesId": "species_neon_tetra", "tipType": "feeding", "content": "每日喂食1-2次，每次以3分钟内吃完为宜。可投喂薄片饲料、微粒饲料或冷冻丰年虾。口型较小，需选择细小颗粒的饲料。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_neon_water", "speciesId": "species_neon_tetra", "tipType": "water_quality", "content": "每周换水20-30%，保持水质清洁。对氨氮敏感，需要成熟的硝化系统。喜欢弱酸性软水环境。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_neon_tank", "speciesId": "species_neon_tetra", "tipType": "tank_setup", "content": "建议使用水草缸，提供躲避空间和阴影区域。群养数量建议10条以上，群游效果更佳。灯光不宜过强。", "importance": 3, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_neon_compatibility", "speciesId": "species_neon_tetra", "tipType": "compatibility", "content": "性格温顺，适合与其他小型温和鱼类混养，如孔雀鱼、斑马鱼等。避免与大型鱼或攻击性鱼类混养。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_betta_feeding", "speciesId": "species_betta", "tipType": "feeding", "content": "每日喂食1-2次，可接受各种饲料，但建议以高蛋白饲料为主。喜食活食如红虫、丰年虾。每周可禁食1天帮助消化。", "importance": 3, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_betta_tank", "speciesId": "species_betta", "tipType": "tank_setup", "content": "单独饲养或与温和鱼类混养，雄鱼之间绝不能混养。提供浮水植物供其休息，水流不宜过强。最小鱼缸建议5升以上。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_betta_disease", "speciesId": "species_betta", "tipType": "disease", "content": "注意预防白点病和烂鳍病，保持水温稳定在24-28°C。发现鱼鳍破损要及时检查水质并适当用药。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_betta_compatibility", "speciesId": "species_betta", "tipType": "compatibility", "content": "雄鱼具有强烈领地意识，绝对不能与其他雄性斗鱼混养。可与底栖鱼或小型温和鱼类混养，避免与长鳍鱼或颜色鲜艳的鱼混养。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_guppy_feeding", "speciesId": "species_guppy", "tipType": "feeding", "content": "杂食性，每日喂食2-3次，少量多餐。可投喂薄片饲料、颗粒饲料、丰年虾、水蚤等。幼鱼期可增加喂食次数。", "importance": 3, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_guppy_breeding", "speciesId": "species_guppy", "tipType": "breeding", "content": "卵胎生鱼，繁殖力极强。雌鱼每月可产仔20-50条。建议设置繁殖盒或水草丛供幼鱼躲避，否则可能被成鱼吃掉。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_guppy_compatibility", "speciesId": "species_guppy", "tipType": "compatibility", "content": "性格温和，适合与其他小型温和鱼类混养。避免与会咬鳍的鱼（如虎皮鱼）混养，以保护雄鱼美丽的尾鳍。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_discus_feeding", "speciesId": "species_discus", "tipType": "feeding", "content": "需要高蛋白饮食，可投喂汉堡（自制或商品）、牛心、红虫等。每日喂食2-3次，幼鱼期需要更频繁喂食。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_discus_water", "speciesId": "species_discus", "tipType": "water_quality", "content": "对水质要求极高，需要弱酸性软水（pH 5.5-6.8）。建议每日换水10-20%，使用RO水或软化水。水温保持28-32°C。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_discus_disease", "speciesId": "species_discus", "tipType": "disease", "content": "容易感染肠道寄生虫和细菌感染。新鱼入缸前建议检疫2-4周。定期驱虫，保持水质稳定是预防的关键。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_discus_tank", "speciesId": "species_discus", "tipType": "tank_setup", "content": "需要高度至少45cm的鱼缸，水深足够七彩神仙展示体态。裸缸或简单造景便于清洁，水草缸需要强大的过滤系统。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_clownfish_feeding", "speciesId": "species_clownfish", "tipType": "feeding", "content": "杂食性，可投喂海水鱼专用饲料、冷冻丰年虾、糠虾等。每日喂食1-2次，注意不要污染水质。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_clownfish_tank", "speciesId": "species_clownfish", "tipType": "tank_setup", "content": "海水缸饲养，需要配备蛋白质分离器、活石等。可与海葵共生，但海葵饲养难度较高，没有海葵小丑鱼也能存活。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_clownfish_water", "speciesId": "species_clownfish", "tipType": "water_quality", "content": "需要稳定的海水环境，盐度1.020-1.025，pH 8.0-8.4。定期检测氨氮、亚硝酸盐和硝酸盐，保持在安全范围。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_pleco_feeding", "speciesId": "species_pleco", "tipType": "feeding", "content": "主要食用藻类，但仅靠缸内藻类不够。需要补充藻片、蔬菜（黄瓜、西葫芦）和沉底饲料。夜间活动，可在熄灯后投喂。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_pleco_tank", "speciesId": "species_pleco", "tipType": "tank_setup", "content": "需要沉木供其啃食和躲避。体型可长到很大，需要大型鱼缸。提供洞穴或躲避处供其白天休息。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_arowana_feeding", "speciesId": "species_arowana", "tipType": "feeding", "content": "肉食性，喜食活食如小鱼、虾、蟋蟀、蜈蚣等。幼鱼期每日喂食2-3次，成鱼每日1次或隔日1次。避免投喂金鱼以防传染疾病。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_arowana_tank", "speciesId": "species_arowana", "tipType": "tank_setup", "content": "需要超大型鱼缸，建议长度1.5米以上，宽度60cm以上。加盖防止跳缸，龙鱼跳跃能力很强。水流不宜过强。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_arowana_disease", "speciesId": "species_arowana", "tipType": "disease", "content": "常见问题包括掉眼、翻鳃、蒙眼等。保持水质稳定，避免惊吓。定期检查并保持良好的饲养环境是预防的关键。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_oscar_feeding", "speciesId": "species_oscar", "tipType": "feeding", "content": "肉食性，食量大。可投喂专用慈鲷饲料、虾、小鱼等。智商高，可训练定点喂食，甚至能认识主人。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_oscar_tank", "speciesId": "species_oscar", "tipType": "tank_setup", "content": "需要大型鱼缸（建议200升以上），强大的过滤系统。喜欢挖掘，造景简单为宜，避免使用易倒塌的装饰物。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_oscar_compatibility", "speciesId": "species_oscar", "tipType": "compatibility", "content": "有攻击性，只能与体型相近的大型鱼混养。会吃掉小型鱼，不适合社区缸。同类混养需要足够大的空间。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_flowerhorn_feeding", "speciesId": "species_flowerhorn", "tipType": "feeding", "content": "肉食为主，可投喂专用罗汉饲料、虾、鱼肉等。适当补充增色饲料可使头瘤更加鲜艳。避免过度投喂。", "importance": 4, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_flowerhorn_tank", "speciesId": "species_flowerhorn", "tipType": "tank_setup", "content": "建议单独饲养，攻击性强。需要大型鱼缸和强力过滤。可使用镜子短暂训练起头，但不宜长时间放置。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_tiger_barb_compatibility", "speciesId": "species_tiger_barb", "tipType": "compatibility", "content": "有咬鳍习性，建议群养6条以上以分散攻击性。避免与长鳍鱼（如神仙鱼、孔雀鱼、斗鱼）混养。", "importance": 5, "createdAt": new Date("2025-01-08T00:00:00.000Z")},
    {"_id": "tip_tiger_barb_tank", "speciesId": "species_tiger_barb", "tipType": "tank_setup", "content": "活泼好动，需要足够的游动空间。水草缸和裸缸皆可，提供一些躲避处。群养时更有观赏性。", "importance": 3, "createdAt": new Date("2025-01-08T00:00:00.000Z")}
  ]
}

// 云函数入口函数
exports.main = async (event, context) => {
  const results = {
    collections: { created: [], existed: [], failed: [] },
    presetData: { imported: [], skipped: [], failed: [] }
  }

  // 1. 创建集合
  console.log('开始创建集合...')
  for (const collectionName of collections) {
    try {
      await db.createCollection(collectionName)
      results.collections.created.push(collectionName)
      console.log(`创建集合成功: ${collectionName}`)
    } catch (err) {
      if (err.errCode === -502005 || err.message.includes('collection already exists')) {
        results.collections.existed.push(collectionName)
        console.log(`集合已存在: ${collectionName}`)
      } else {
        results.collections.failed.push({ name: collectionName, error: err.message })
        console.error(`创建集合失败: ${collectionName}`, err)
      }
    }
  }

  // 2. 导入预设数据
  console.log('开始导入预设数据...')
  for (const [collectionName, data] of Object.entries(presetData)) {
    try {
      // 检查集合是否为空
      const countRes = await db.collection(collectionName).count()
      if (countRes.total > 0) {
        results.presetData.skipped.push({ name: collectionName, reason: `已有 ${countRes.total} 条数据` })
        console.log(`跳过导入: ${collectionName} (已有 ${countRes.total} 条数据)`)
        continue
      }

      // 批量插入数据（每次最多 20 条）
      const batchSize = 20
      let insertedCount = 0
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        for (const item of batch) {
          try {
            await db.collection(collectionName).add({ data: item })
            insertedCount++
          } catch (addErr) {
            // 如果是重复 ID 错误，跳过
            if (addErr.errCode === -502001) {
              console.log(`跳过重复记录: ${item._id}`)
            } else {
              throw addErr
            }
          }
        }
      }
      results.presetData.imported.push({ name: collectionName, count: insertedCount })
      console.log(`导入成功: ${collectionName} (${insertedCount} 条)`)
    } catch (err) {
      results.presetData.failed.push({ name: collectionName, error: err.message })
      console.error(`导入失败: ${collectionName}`, err)
    }
  }

  return {
    code: 0,
    message: 'success',
    data: results
  }
}
