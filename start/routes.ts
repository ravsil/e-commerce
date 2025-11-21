import router from '@adonisjs/core/services/router'
import ProductsController from '../app/controllers/products_controller.js'
import UsersController from '#controllers/users_controller'
import ImagesController from '#controllers/images_controller'
import StocksController from '#controllers/stocks_controller'
import Product from '#models/product'
import { isAdmin } from '#abilities/main'
import CartsController from '#controllers/carts_controller'

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
router.resource('stocks', StocksController)
router.put('/products/:id/add-stock/:quantity', [StocksController, 'addStock']).as('stocks.addStock')
router.put('/products/:id/reduce-stock/:quantity', [StocksController, 'reduceStock']).as('stocks.reduceStock')
router.get('/products/:id/detail', [ProductsController, 'detail']).as('products.detail')
// Admin dashboard route
router.get('/admin', async ({ view, response, bouncer }) => {
  if (!(await bouncer.allows(isAdmin))) {
    return response.status(403).send('Not authorized')
  }
  return view.render('pages/admin')
}).as('admin')

// Home route
router.get('/', async ({ view, request }) => {
  const page = request.input('page', 1)
  const limit = 12

  const products = await Product.query()
    .preload('images')
    .orderBy('id', 'desc')
    .paginate(page, limit)

  products.baseUrl('/')

  return view.render('pages/home', { products })
}).as('home')

router.get('/cart', [CartsController, 'index']).as('cart.index')
router.post('/cart/add', [CartsController, 'add']).as('cart.add')
router.put('/cart/:id', [CartsController, 'update']).as('cart.update')
router.delete('/cart/:id', [CartsController, 'remove']).as('cart.remove')
router.get('/api/products/:id', [ProductsController, 'get']).as('api.products.get')
