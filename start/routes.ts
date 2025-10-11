import router from '@adonisjs/core/services/router'
import ProductsController from '../app/controllers/products_controller.js'
import UsersController from '#controllers/users_controller'
import ImagesController from '#controllers/images_controller'

// Authentication routes
router.get('/login', [UsersController, 'showLogin']).as('auth.login')
router.post('/login', [UsersController, 'login'])
router.post('/logout', [UsersController, 'logout']).as('auth.logout')

// Resource routes
router.resource('products', ProductsController)
router.resource('users', UsersController)
router.resource('images', ImagesController)

// Home route
router.on('/').render('pages/home').as('home')
