import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    username: vine.string().minLength(3).maxLength(30),
    age: vine.number().min(1).max(120),
    email: vine.string().email(),
    password: vine.string().minLength(3),
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    username: vine.string().minLength(3).maxLength(30),
    age: vine.number().min(1).max(120),
    email: vine.string().email(),
    pfp: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    }).optional(),
  })
)