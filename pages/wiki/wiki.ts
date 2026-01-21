import { speciesGetCategories, speciesList, speciesSearch } from '../../utils/api'
import { logger } from '../../utils/logger'

// 云端鱼种数据类型
interface CloudFishSpecies {
  _id: string
  name: string
  englishName?: string
  scientificName?: string
  subcategoryId?: string
  categoryId?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  temperament?: 'peaceful' | 'semi-aggressive' | 'aggressive'
  // 新数据结构：直接使用 min/max 字段
  tempMin?: number
  tempMax?: number
  phMin?: number
  phMax?: number
  bodyLengthMin?: number
  bodyLengthMax?: number
  // 新增字段
  origin?: string  // 产地
  diet?: string  // 食性
  compatibility?: string  // 混养兼容性
  careTip?: string  // 饲养技巧
  environment?: string  // 环境要求
  husbandryFeatures?: string  // 饲养特点
  notes?: string  // 注意事项
  lifespan?: string  // 寿命
  description?: string
  imageUrl?: string
  subcategory?: { _id: string; name: string }
  category?: { _id: string; name: string }
}

interface CategoryItem {
  _id: string
  name: string
  slug?: string
  subcategories?: { _id: string; name: string }[]
}

Page({
  data: {
    loading: true,
    fishList: [] as CloudFishSpecies[],
    filteredList: [] as CloudFishSpecies[],
    searchQuery: '',
    activeCategory: 'all',
    categories: [{ _id: 'all', name: '全部' }] as { _id: string; name: string }[],
    showDetailPopup: false,
    currentFish: null as CloudFishSpecies | null,
    page: 1,
    hasMore: true,
    searching: false
  },

  async onLoad() {
    await this.loadCategories()
    await this.loadFishList()
  },

  onShow() {
    // 设置状态栏颜色：白色背景 + 黑色文字
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff',
      animation: { duration: 0, timingFunc: 'linear' }
    })

    // 设置自定义 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  async loadCategories() {
    try {
      const res = await speciesGetCategories()

      const cats = res.categories.map((cat: CategoryItem) => ({
        _id: cat._id,
        name: cat.name
      }))

      this.setData({
        categories: [{ _id: 'all', name: '全部' }, ...cats]
      })
    } catch (err) {
      logger.error('加载分类失败:', err)
    }
  },

  async loadFishList(reset = true) {
    const { activeCategory, searchQuery, page } = this.data

    if (reset) {
      this.setData({ loading: true, page: 1 })
    }

    try {
      let res
      if (searchQuery.trim()) {
        // 搜索模式
        res = await speciesSearch({
          keyword: searchQuery.trim(),
          categoryId: activeCategory !== 'all' ? activeCategory : undefined,
          page: reset ? 1 : page,
          pageSize: 20
        })
      } else {
        // 列表模式
        res = await speciesList({
          categoryId: activeCategory !== 'all' ? activeCategory : undefined,
          page: reset ? 1 : page,
          pageSize: 20
        })
      }

      const newList = res.list || []
      const hasMore = newList.length >= 20

      let finalRawList = []
      if (reset) {
        finalRawList = newList
      } else {
        finalRawList = [...this.data.fishList, ...newList]
      }

      // 按照名称拼音 A-Z 排序 (Frontend Sort)
      finalRawList.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN', { sensitivity: 'accent' }))

      // 格式化展示数据
      const displayList = finalRawList.map((item: any) => {
        const habit = []
        if (item.temperament) habit.push(this.getTemperamentLabel(item.temperament))
        if (item.diet) habit.push(item.diet)

        const method = []
        // 使用新的字段结构 tempMin/tempMax
        if (item.tempMin !== undefined && item.tempMax !== undefined) {
          method.push(`${item.tempMin}-${item.tempMax}°C`)
        }
        if (item.phMin !== undefined && item.phMax !== undefined) {
          method.push(`pH ${item.phMin}-${item.phMax}`)
        }

        return {
          ...item,
          habitDisplay: habit.join(' / ') || '暂无习性',
          methodDisplay: method.join('  ') || '暂无参数'
        }
      })

      this.setData({
        fishList: displayList,
        filteredList: displayList, // 简化：假设没有前端二次搜索过滤 (搜索走API)
        loading: false,
        hasMore
      })
    } catch (err) {
      logger.error('加载鱼种列表失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const query = e.detail.value
    this.setData({ searchQuery: query })
  },

  onSearchConfirm() {
    this.loadFishList(true)
  },

  onCategorySelect(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    // 切换分类时清空搜索词，避免混合查询
    this.setData({ activeCategory: id, searchQuery: '' }, () => {
      this.loadFishList(true)
    })
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return

    this.setData({ page: this.data.page + 1 }, () => {
      this.loadFishList(false)
    })
  },

  onFishClick(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    const fish = this.data.fishList.find(f => f._id === id) || null

    if (fish) {
      // 隐藏 TabBar
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ hidden: true })
      }
      this.setData({
        currentFish: fish,
        showDetailPopup: true
      })
    }
  },

  onCloseDetail() {
    this.setData({ showDetailPopup: false })
    // 恢复显示 TabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: false })
    }
  },

  // 阻止事件冒泡（弹窗内部点击不关闭弹窗）
  stopPropagation() {
    // 空函数，仅用于阻止事件冒泡
  },

  // 辅助函数：格式化温度范围
  formatTemperature(temp?: { min: number; max: number }): string {
    if (!temp) return '-'
    return `${temp.min}-${temp.max}°C`
  },

  // 辅助函数：格式化 pH 范围
  formatPh(ph?: { min: number; max: number }): string {
    if (!ph) return '-'
    return `${ph.min}-${ph.max}`
  },

  // 辅助函数：格式化体型
  formatSize(size?: { min: number; max: number }): string {
    if (!size) return '-'
    return `${size.min}-${size.max} cm`
  },

  // 辅助函数：获取难度标签
  getDifficultyLabel(difficulty?: string): string {
    const map: Record<string, string> = {
      easy: '容易',
      medium: '中等',
      hard: '困难'
    }
    return map[difficulty || ''] || '-'
  },

  // 辅助函数：获取性格标签
  getTemperamentLabel(temperament?: string): string {
    const map: Record<string, string> = {
      peaceful: '温和',
      'semi-aggressive': '半攻击性',
      aggressive: '攻击性'
    }
    return map[temperament || ''] || '-'
  }
})
