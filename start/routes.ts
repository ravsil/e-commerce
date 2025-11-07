import router from '@adonisjs/core/services/router'
import ProductsController from '../app/controllers/products_controller.js'
import UsersController from '#controllers/users_controller'
import ImagesController from '#controllers/images_controller'
import Product from '#models/product'
import { isAdmin } from '#abilities/main'

// Authentication routes
router.get('/login', [UsersController, 'showLogin']).as('auth.login')
router.post('/login', [UsersController, 'login'])
router.post('/logout', [UsersController, 'logout']).as('auth.logout')
router.get('/profile/edit', [UsersController, 'edit']).as('profile.edit')
router.post('/profile/update', [UsersController, 'update']).as('profile.update')

// Resource routes
router.resource('products', ProductsController)
router.resource('users', UsersController)
router.resource('images', ImagesController)

// Admin dashboard route
router.get('/admin', async ({ view, response, bouncer }) => {
  if(!(await bouncer.allows(isAdmin))) {
        return response.status(403).send('Not authorized')
      }
  return view.render('pages/admin')
}).as('admin')

// Home route
router.get('/', async ({ view }) => {
  const products = await Product.all()
  for (const product of products) {
      await product.load('images')
    }
  console.log(products, "products in home route")
  return view.render('pages/home', { products })
}).as('home')
