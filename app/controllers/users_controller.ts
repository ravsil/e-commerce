import type { HttpContext } from '@adonisjs/core/http'
import User from '../models/user.js'
import { createUserValidator } from '../validators/user.js'
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

      return response.redirect().toRoute('products.index')
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
    if(!(await bouncer.allows(isAdmin))) {
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

    return response.redirect().toRoute('users.index')
  }

  /**
   * Show individual record
   */
  async show({ params, view }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return view.render('pages/users/show', { user })
  }

  /**
   * Edit individual record
   */
  async edit({ params, view }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return view.render('pages/users/create', { user })
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const data = request.only(['username', 'email', 'age'])
    user.merge(data)
    await user.save()
    return
  }

  /**
   * Delete record
   */
  // async destroy({ params }: HttpContext) { }
}