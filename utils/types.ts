/**
 * Fish Diary - 前端表单和辅助类型定义
 *
 * 注意：数据模型类型（Tank, Fish, Equipment, 各种 Record 等）定义在 typings/index.d.ts
 * 本文件只包含前端特有的表单类型和辅助类型
 */

// ==================== 鱼缸表单 ====================

export interface TankItem {
  _id: string;
  name: string;
  coverUrl: string;
  size?: {
    length: number;
    width: number;
    height: number;
  };
  price?: number;
  stats?: {
    fishCount: number;
  };
}

export interface TankForm {
  coverUrl: string;
  name: string;
  sizeKey: string;
  price: string;
}

// ==================== 鱼类表单 ====================

export interface FishForm {
  speciesId: string;
  speciesName: string;
  price: string;
  count: string;
}

export interface EditFishForm {
  _id: string;
  name: string;
  baseQuantity: number;
  deadCount: string;
  currentAlive: number;
  tankId: string;
  tankName: string;
}

export interface FishListItem {
  _id: string;
  tankId: string;
  speciesId: string;
  customName: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  status: 'alive' | 'dead' | 'sold';

  // 前端展示辅助字段
  purchaseDateDisplay?: string;
  totalPriceDisplay?: string;
}

// ==================== 喂食表单 ====================

export interface FeedingForm {
  time: string;
  foodType: string;
  foodName: string;
  customFood: string;
  imageUrl: string;
}

// ==================== 换水表单 ====================

export interface WaterChangeForm {
  time: string;
  percent: number;
}

// ==================== 设备表单 ====================

export interface EquipmentForm {
  _id?: string;
  type: string;
  name: string;
  brand: string;
  model: string;
  price: string;
  purchaseDate: string;
}

// ==================== 水质表单 ====================

export interface WaterQualityForm {
  time: string;
  ph: string;
  temperature: string;
  ammonia: string;
  nitrite: string;
  nitrate: string;
  imageUrl: string;
}

// ==================== 分类辅助类型 ====================
// 注意: FishCategory, FishSubcategory 已在 typings/index.d.ts 中定义

// ==================== 统计辅助类型 ====================
// 注意: TankStats, OverallStats 已在 typings/index.d.ts 中定义

// ==================== 本地 FishSpecies 简化版 (仅前端搜索用) ====================

export interface LocalFishSpecies {
  id: string;
  name: string;
  englishName: string;
  scientificName: string;
  category: string;
  categoryName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  temperature: string;
  ph: string;
  size: string;
  temperament: string;
  diet: string;
  description: string;
  imageUrl: string;
}
