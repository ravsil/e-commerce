import type { HttpContext } from '@adonisjs/core/http'
import Env from '#start/env'
import Stripe from 'stripe'
import Cart from '#models/cart'
import Product from '#models/product'

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

    public async success({ request, view, auth, session }: HttpContext) {
        const sessionId = request.input('session_id')

        if (!sessionId) {
            return view.render('pages/checkout_success', { sessionId })
        }

        try {
            const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)

            // Ensure payment was completed
            if (stripeSession.payment_status !== 'paid') {
                session.flash('error', 'Pagamento não confirmado ainda')
                return view.render('pages/checkout_success', { sessionId })
            }

            const user = auth.user!
            if (!user) {
                session.flash('error', 'Usuário não autenticado')
                return view.render('pages/checkout_success', { sessionId })
            }

            // If metadata contains a user id, ensure it matches the logged in user
            const metaUserId = stripeSession.metadata?.user_id
            if (metaUserId && String(metaUserId) !== String(user.id)) {
                session.flash('error', 'Usuário inconsistente com pagamento')
                return view.render('pages/checkout_success', { sessionId })
            }

            // Load cart items and decrement stock for each product, then clear cart
            const items = await Cart.query()
                .where('user_id', user.id)
                .preload('product')

            if (items.length) {
                for (const item of items) {
                    if (!item.product) continue
                    const product = await Product.findOrFail(item.product.id)
                    product.stock -= item.quantity
                    if (product.stock < 0) product.stock = 0
                    await product.save()
                }

                await Cart.query().where('user_id', user.id).delete()
                session.flash('success', 'Pagamento confirmado — estoque atualizado e carrinho limpo')
            }
        } catch (error) {
            console.error('Error verifying Stripe session:', error)
            session.flash('error', 'Erro ao verificar pagamento')
        }

        return view.render('pages/checkout_success', { sessionId })
    }

    public async cancel({ view }: HttpContext) {
        return view.render('pages/checkout_cancel')
    }
}
