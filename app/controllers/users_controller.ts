import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import User from '../models/user.js'
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
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createUserValidator)
    await User.create(data)

    return response.redirect().toRoute('/')
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