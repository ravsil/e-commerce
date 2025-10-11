import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import Image from '#models/image'

export default class ImagesController {
  public async show({ params, response }: HttpContext) {
    const image = await Image.query().where('name', params.id)

    if (image) {
      const imagePath = app.makePath('tmp/uploads', params.id)
      return response.download(imagePath)
    }

    return response.status(404)
  }
}