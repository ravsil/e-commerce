import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import Product from '#models/product'

export default class StocksController {
  public async addStock({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const quantity = Number(params.quantity)

    if (quantity <= 0) {
      return response.status(400).send('Quantidade inválida')
    }

    product.stock += quantity
    await product.save()

    return response.redirect().toRoute('products.show', { id: product.id })
  }
  
  public async reduceStock({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const quantity = Number(params.quantity)

    if (quantity <= 0) {
      return response.status(400).send('Quantidade inválida')
    }

    product.stock -= quantity
    if (product.stock < 0) {
      product.stock = 0
    }
    await product.save()

    return response.redirect().toRoute('products.show', { id: product.id })
  }
}