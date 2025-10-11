import router from '@adonisjs/core/services/router'
import ProductsController from '../app/controllers/products_controller.js'
import UsersController from '#controllers/users_controller'
import ImagesController from '#controllers/images_controller'

router.resource('products', ProductsController)
router.resource('users', UsersController)
router.resource('images', ImagesController)
router.on('/').render('pages/home')
