import type { HttpContext } from '@adonisjs/core/http'

import Cart from '#models/cart'
import Product from '#models/product'

export default class CartsController {
    public async index({ view, auth }: HttpContext) {
        const user = auth.user!
        if (!user) {
            return view.render('pages/cart', { itens: [], total: -1 })
        }

        const itens = await Cart.query()
            .where('user_id', user.id)
            .preload('product', (q) => q.preload('images'))

        let total = 0;
        for (const item of itens) {
            if (item.product) {
                total += Number(item.product.price) * item.quantity;
            }
        }

        return view.render('pages/cart', { itens, total })
    }

    public async add({ request, response, auth, session }: HttpContext) {
        const user = auth.user!
        const productId = request.input('product_id')
        const quantity = request.input('quantity', 1)

        const product = await Product.find(productId)
        if (!product) {
            session.flash('error', 'Produto não encontrado')
            return response.redirect().back()
        }

        if (product.stock < quantity) {
            session.flash('error', 'Quantidade indisponível no estoque')
            return response.redirect().back()
        }

        const exiting = await Cart.query()
            .where('user_id', user.id)
            .andWhere('product_id', productId)
            .first()

        if (exiting) {
            exiting.quantity += quantity
            await exiting.save()
        } else {
            const cart = new Cart()
            cart.userId = user.id
            cart.productId = productId
            cart.quantity = quantity
            await cart.save()
        }

        return response.redirect().back()
    }

    public async update({ params, request, response, auth, session }: HttpContext) {
        const user = auth.user!
        const cartId = params.id
        const quantity = Number(request.input('quantity', 1))

        const item = await Cart.find(cartId)

        if (!item || item.userId !== user.id) {
            session.flash('error', 'Item não encontrado')
            return response.redirect().back()
        }

        const product = await Product.find(item.productId)
        if (!product) {
            session.flash('error', 'Produto não encontrado')
            return response.redirect().back()
        }

        if (quantity <= 0) {
            await item.delete()
            return response.redirect().toRoute('cart.index')
        }

        if (product.stock < quantity) {
            session.flash('error', 'Quantidade indisponível no estoque')
            return response.redirect().back()
        }

        item.quantity = quantity
        await item.save()

        return response.redirect().toRoute('cart.index')
    }

    public async remove({ params, response, auth, session }: HttpContext) {
        const user = auth.user!
        const cartId = params.id

        const item = await Cart.find(cartId)
        if (!item || item.userId !== user.id) {
            session.flash('error', 'Item não encontrado')
            return response.redirect().back()
        }

        await item.delete()
        return response.redirect().toRoute('cart.index')
    }
}