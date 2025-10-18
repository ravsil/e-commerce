import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'

import Product from '#models/product'
import app from '@adonisjs/core/services/app'
import { isAdmin } from '#abilities/main'
import Image from '#models/image' 

import { createProductValidator } from '#validators/product'

export default class ProductsController {
  public async index({ view, bouncer, response }: HttpContext) {
    if(!(await bouncer.allows(isAdmin))) {
      return response.status(403).send('Not authorized')
    }
    const products = await Product.all()
    for (const product of products) {
      await product.load('images')
    }
    
    return view.render('pages/products/index', { products })
  }

  public async show({ params, view }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const image = await product.load('images')
    return view.render('pages/products/show', { product, image })
  }

  public async create({ view, bouncer, response}: HttpContext) {
    if(!(await bouncer.allows(isAdmin))) {
      return response.status(403).send('Not authorized')
    }
    return view.render('pages/products/create')
  }

  public async edit({ params, view, bouncer, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)

    if(!(await bouncer.allows(isAdmin))) {
      return response.status(403).send('Not authorized')
    }

    return view.render('pages/products/create', { product })
  }

  public async store({ request, response, bouncer }: HttpContext) {
    if(!(await bouncer.allows(isAdmin))) {
      return response.status(403).send('Not authorized')
    }

    const payload = await request.validateUsing(createProductValidator)
    console.log(payload, "validated")
    const product = await Product.create({
      name: payload.name,
      description: payload.description,
      price: payload.price,
    })

    const image = new Image()
    image.name = `${cuid()}.${payload.image.extname}`
    image.productId = product.id

    await payload.image.move(app.makePath('tmp/uploads'), {
      name: image.name,
    })

    await image.save()

    return response.redirect().toRoute('products.show', { id: product.id })
  }

  public async update({ params, request, response, bouncer }: HttpContext) {
    if(!(await bouncer.allows(isAdmin))) {
      return response.status(403).send('Not authorized')
    }
    const product = await Product.findOrFail(params.id)

    const payload = await request.validateUsing(createProductValidator)

    product.merge(payload)
    await product.save()

    return response.redirect().toRoute('products.show', { id: product.id })
  }

  public async destroy({ params, response, bouncer }: HttpContext) {
    if(!(await bouncer.allows(isAdmin))) {
      return response.status(403).send('Not authorized')
    }
    const product = await Product.findOrFail(params.id)

    await product.delete()

    return response.redirect().toRoute('products.index')
  }
}