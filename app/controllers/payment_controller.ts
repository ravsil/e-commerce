import type { HttpContext } from '@adonisjs/core/http'
import Env from '#start/env'
import Stripe from 'stripe'
import Cart from '#models/cart'

const stripe = new Stripe(Env.get('STRIPE_SECRET') || '', { apiVersion: '2022-11-15' })

export default class PaymentController {
    public async createCheckout({ auth, response, session }: HttpContext) {
        const user = auth.user!

        const items = await Cart.query()
            .where('user_id', user.id)
            .preload('product')

        if (!items.length) {
            session.flash('error', 'Seu carrinho está vazio')
            return response.redirect().toRoute('cart.index')
        }

        const line_items = [] as any[]

        for (const item of items) {
            if (!item.product) continue
            // ensure stock
            if (item.quantity > item.product.stock) {
                session.flash('error', `Quantidade insuficiente para ${item.product.name}`)
                return response.redirect().toRoute('cart.index')
            }

            line_items.push({
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: item.product.name,
                        description: item.product.description || undefined
                    },
                    unit_amount: Math.round(Number(item.product.price) * 100)
                },
                quantity: item.quantity
            })
        }

        if (!line_items.length) {
            session.flash('error', 'Nenhum item válido no carrinho')
            return response.redirect().toRoute('cart.index')
        }

        // Create Stripe Checkout session
        const sessionObj = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            success_url: `http://${process.env.HOST || ''}:${process.env.PORT || ''}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://${process.env.HOST || ''}:${process.env.PORT || ''}/checkout/cancel`,
            metadata: { user_id: String(user.id) }
        })

        return response.redirect().toPath(sessionObj.url || '/')
    }

    public async success({ request, view }: HttpContext) {
        const sessionId = request.input('session_id')
        // Render simple success page. Clearing cart and stock update happens via webhook or explicit flow.
        return view.render('pages/checkout_success', { sessionId })
    }

    public async cancel({ view }: HttpContext) {
        return view.render('pages/checkout_cancel')
    }
}
