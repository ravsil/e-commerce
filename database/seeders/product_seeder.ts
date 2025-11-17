import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'

export default class extends BaseSeeder {
  async run() {
    const filePath = app.makePath('seedContent/products.json')
    
    const fileExists = await fs.stat(filePath).catch(() => false)
    if (!fileExists) return

    const fileContent = await fs.readFile(filePath, 'utf-8')
    const productsData = JSON.parse(fileContent)

    console.log(`Inserindo ${productsData.length} produtos com múltiplas imagens...`)

    for (const item of productsData) {
      const product = await Product.create({
        name: item.name,
        description: item.description,
        price: item.price,
      })

      if (item.images && item.images.length > 0) {
        for (const url of item.images) {
          await product.related('images').create({
            url: url,
            name: null
          })
        }
      }
    }
    
    console.log('Seeder finalizado!')
  }
}