import axios from 'axios'

const TOKEN_KEY = 'pings_token'

function createInstance() {
  const instance = axios.create({ baseURL: import.meta.env.VITE_API_URL })

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('pings_user_id')
        import('@/router').then(({ default: router }) => {
          if (router.currentRoute.value.name !== 'Login') {
            router.push('/login')
          }
        })
      }
      return Promise.reject(error)
    }
  )

  return instance
}

// Both services are behind the same Nginx reverse proxy at VITE_API_URL
export const userApi = createInstance()
export const chatApi = createInstance()
