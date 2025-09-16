/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const users = [
    { id: 1, name: 'Rafael' },
    { id: 2, name: 'Helcio' },
    { id: 3, name: 'Maria' },
]
// router.on('/').render('pages/home')

router.get('/get-user/:id?', async ({ params }) => {
    if (!params.id) {
        return users;
    } else {
        const user = users.find(user => user.id === parseInt(params.id))
        return user || { message: 'User not found' }
    }
})

router.post('/create-user', async ({ request }) => {
    const { name } = request.body()
    users.push({
        id: users.length + 1,
        name: name || `User ${users.length + 1}`,
    })

    return users[users.length - 1]
})