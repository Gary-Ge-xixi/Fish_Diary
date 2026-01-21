/**
 * 图片上传工具
 * 使用微信云存储直传，无需额外配置 COS
 */

/**
 * 生成唯一文件名
 */
function generateFileName(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * 获取文件扩展名
 */
function getExtension(filePath: string): string {
  const match = filePath.match(/\.(\w+)$/)
  return match ? match[1].toLowerCase() : 'jpg'
}

/**
 * 上传图片到云存储
 * @param filePath 本地临时文件路径
 * @param folder 云存储目录名（如 'feeding', 'tank', 'water-quality'）
 * @param tankId 可选的鱼缸 ID，用于组织路径
 * @returns 云存储文件 ID
 */
export async function uploadImage(
  filePath: string,
  folder: string,
  tankId?: string
): Promise<string> {
  const ext = getExtension(filePath)
  const fileName = `${generateFileName()}.${ext}`

  // 路径结构：{folder}/{tankId?}/{fileName}
  // 例如：feeding/abc123/1704812345678-x8k2m.jpg
  const cloudPath = tankId
    ? `${folder}/${tankId}/${fileName}`
    : `${folder}/${fileName}`

  const res = await wx.cloud.uploadFile({
    cloudPath,
    filePath
  })
  return res.fileID
}

/**
 * 批量上传图片
 * @param filePaths 本地临时文件路径数组
 * @param folder 云存储目录名
 * @param tankId 可选的鱼缸 ID
 * @returns 云存储文件 ID 数组
 */
export async function uploadImages(
  filePaths: string[],
  folder: string,
  tankId?: string
): Promise<string[]> {
  const results = await Promise.all(
    filePaths.map(filePath => uploadImage(filePath, folder, tankId))
  )
  return results
}

/**
 * 删除云存储文件
 * @param fileIDs 文件 ID 数组
 */
export async function deleteFiles(fileIDs: string[]): Promise<void> {
  if (fileIDs.length === 0) return
  await wx.cloud.deleteFile({ fileList: fileIDs })
}
