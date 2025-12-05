import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import User from '../models/user.js'
import Cart from '#models/cart'
import Product from '#models/product'
import { createUserValidator, updateProfileValidator } from '../validators/user.js'
import { isAdmin } from '#abilities/main'
// import router from '@adonisjs/core/services/router'

export default class UsersController {
  /**
   * Show login form
   */
  async showLogin({ view }: HttpContext) {
    return view.render('pages/users/login')
  }

  /**
   * Handle login attempt
   */
  async login({ request, response, auth, session }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)

      // Merge guest cart cookie into user cart if present
      const merged = await this.mergeGuestCart(request, response, user)
      if (merged && session) {
        session.flash('cart_merged', '1')
      }

      return response.redirect().toRoute('/')
    } catch {
      session.flash('error', 'Email ou senha inválidos')
      return response.redirect().back()
    }
  }

  /**
   * Handle logout
   */
  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('auth.login')
  }

  /**
   * Display a list of resource
   */
  async index({ view, bouncer, response }: HttpContext) {
    if (!(await bouncer.allows(isAdmin))) {
      return response.status(403).send('Not authorized')
    }
    const users = await User.all()
    return view.render('pages/users/index', { users })
  }

  /**
   * Display form to create a new record
   */
  async create({ view }: HttpContext) {
    return view.render('pages/users/create')
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth, session }: HttpContext) {
    const data = await request.validateUsing(createUserValidator)
    const user = await User.create(data)

    try {
      await auth.use('web').login(user)
      session.flash('success', 'Conta criada e logado')
    } catch (error) {
      session.flash('error', 'Conta criada, mas não foi possível efetuar login automático')
    }

    // Merge guest cart cookie into user cart if present
    const merged = await this.mergeGuestCart(request, response, user)
    if (merged && session) {
      session.flash('cart_merged', '1')
    }

    return response.redirect().toRoute('/')
  }

  /**
   * Merge guest cart stored in a cookie `guestCart` into the authenticated user's cart
   */
  private async mergeGuestCart(request: HttpContext['request'], response: HttpContext['response'], user: User) {
    try {
      const cookieHeader = request.header('cookie') || ''
      const parts = cookieHeader.split(';').map((s) => s.trim())
      const guest = parts.find((p) => p.startsWith('guestCart='))
      if (!guest) {
        return false
      }

      const raw = guest.split('=')[1] || ''
      const decoded = decodeURIComponent(raw)
      const items = JSON.parse(decoded || '[]')
      if (!Array.isArray(items) || items.length === 0) return

      for (const it of items) {
        const productId = it.id
        let qty = Number(it.quantity || 1)
        if (isNaN(qty) || qty < 1) qty = 1

        const product = await Product.find(productId)
        if (!product) continue

        // respect stock
        if (product.stock < qty) {
          // cap to available stock
          qty = Number(product.stock)
          if (qty <= 0) continue
        }

        const existing = await Cart.query().where('user_id', user.id).andWhere('product_id', productId).first()
        if (existing) {
          existing.quantity = Number(existing.quantity) + qty
          await existing.save()
        } else {
          const cart = new Cart()
          // assume column names match model fields
          cart.userId = user.id
          cart.productId = productId
          cart.quantity = qty
          await cart.save()
        }
      }

      // Clear the guestCart cookie by setting expired Set-Cookie header
      response.header('Set-Cookie', 'guestCart=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
      // Also set a temporary cookie to instruct client to clear localStorage
      response.header('Set-Cookie', 'clearGuestCart=1; Path=/')
      return true
    } catch (e) {
      // swallow errors — merging is best-effort
      return false
    }
  }

  /**
   * Show individual record
   */
  async show({ params, view }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return view.render('pages/users/show', { user })
  }

  /**
     * Show profile edit form for the current logged-in user
     */
  async edit({ view, auth, response }: HttpContext) {
    if (!auth.user) {
      return response.redirect().toRoute('auth.login')
    }

    const user = auth.user
    return view.render('pages/users/profile', { user })
  }

  /**
   * Update profile for the current logged-in user
   */
  async update({ request, response, auth }: HttpContext) {
    if (!auth.user) {
      return response.redirect().toRoute('auth.login')
    }

    const user = auth.user
    const payload = await request.validateUsing(updateProfileValidator)

    // Handle profile picture upload if provided
    if (payload.pfp) {
      const pfpName = `${cuid()}.${payload.pfp.extname}`

      await payload.pfp.move(app.makePath('tmp/uploads'), {
        name: pfpName,
      })

      user.pfp = pfpName
    }

    // Update other fields
    user.username = payload.username
    user.age = payload.age
    user.email = payload.email

    await user.save()

    return response.redirect().toRoute('profile.edit')
  }
}

/**
 * Delete record
 */
// async destroy({ params }: HttpContext) { }