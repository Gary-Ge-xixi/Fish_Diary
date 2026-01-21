/**
 * 表单验证工具函数
 */

import { TankForm, FishForm, FeedingForm, WaterChangeForm, EquipmentForm, WaterQualityForm } from '../../../utils/types'

/**
 * 验证鱼缸表单
 */
export function validateTankForm(form: TankForm): { valid: boolean; errors: { name: boolean; sizeKey: boolean; coverUrl: boolean } } {
  const errors = {
    name: !form.name.trim(),
    sizeKey: !form.sizeKey,
    coverUrl: false // 封面图不是必填
  }

  return {
    valid: !errors.name && !errors.sizeKey,
    errors
  }
}

/**
 * 验证鱼类表单
 */
export function validateFishForm(form: FishForm): { valid: boolean; message: string } {
  if (!form.customName.trim()) {
    return { valid: false, message: '请输入鱼的名称' }
  }
  if (!form.quantity || form.quantity < 1) {
    return { valid: false, message: '数量至少为1' }
  }
  return { valid: true, message: '' }
}

/**
 * 验证喂养表单
 */
export function validateFeedingForm(form: FeedingForm): { valid: boolean; message: string } {
  if (form.foodType === 'other' && !form.customFood?.trim()) {
    return { valid: false, message: '请输入食物名称' }
  }
  return { valid: true, message: '' }
}

/**
 * 验证换水表单
 */
export function validateWaterChangeForm(form: WaterChangeForm): { valid: boolean; message: string } {
  if (!form.percentage || form.percentage <= 0 || form.percentage > 100) {
    return { valid: false, message: '换水比例需在1-100之间' }
  }
  return { valid: true, message: '' }
}

/**
 * 验证设备表单
 */
export function validateEquipmentForm(form: EquipmentForm): { valid: boolean; message: string } {
  if (!form.type) {
    return { valid: false, message: '请选择设备类型' }
  }
  return { valid: true, message: '' }
}

/**
 * 验证水质表单
 */
export function validateWaterQualityForm(form: WaterQualityForm): { valid: boolean; message: string } {
  // 至少填一项数据
  const hasData = form.ph || form.temperature || form.ammonia || form.nitrite || form.nitrate
  if (!hasData) {
    return { valid: false, message: '请至少填写一项水质数据' }
  }

  // 验证数值范围
  if (form.ph) {
    const ph = parseFloat(form.ph)
    if (isNaN(ph) || ph < 0 || ph > 14) {
      return { valid: false, message: 'pH值应在0-14之间' }
    }
  }

  if (form.temperature) {
    const temp = parseFloat(form.temperature)
    if (isNaN(temp) || temp < 0 || temp > 50) {
      return { valid: false, message: '温度应在0-50°C之间' }
    }
  }

  return { valid: true, message: '' }
}

/**
 * 验证正整数
 */
export function isPositiveInt(value: string | number | undefined | null): boolean {
  if (value === undefined || value === null || value === '') return false
  const num = parseInt(String(value))
  return !isNaN(num) && num > 0 && Number.isInteger(Number(value))
}

/**
 * 验证非负数
 */
export function isNonNegative(value: string | number | undefined | null): boolean {
  if (value === undefined || value === null || value === '') return false
  const num = parseFloat(String(value))
  return !isNaN(num) && num >= 0
}
