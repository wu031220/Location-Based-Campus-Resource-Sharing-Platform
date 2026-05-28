import axios from 'axios'

const request = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器：多用户自动带 token
request.interceptors.request.use(
    config => {
        const token = sessionStorage.getItem('token')
        if (token) {
                config.headers['Authorization'] = 'Bearer ' + token
        }
        return config
    },
    error => Promise.reject(error)
)

// ✅ 响应拦截器：自动剥离 data
request.interceptors.response.use(
    response => {
        // 直接返回后端的 data，以后直接用 res.code / res.data
        return response.data
    },
    error => {
        // 🔥 核心：401 自动处理
        if (error.response && error.response.status === 401) {
            // 清空无效 token
            sessionStorage.removeItem('token')

            // 跳转到登录页（和你路由一致）
            window.location.href = '/'

            // 提示用户
            alert('登录已过期，请重新登录')
        }
        else if (error.response?.status === 500) {
            alert('服务器繁忙，请稍后重试')
        }
        return Promise.reject(error)
    }
)
export default request