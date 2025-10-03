import type { HttpContext } from '@adonisjs/core/http'
import User from '../models/user.js'
import { createUserValidator } from '../validators/user.js'
import router from '@adonisjs/core/services/router'

export default class UsersController {
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {}

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
  async show({ params }: HttpContext) {}

  /**
   * Edit individual record
   */
  async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request }: HttpContext) {}

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {}
}