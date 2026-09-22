import Axios from 'axios'

// console.log(process.env.NODE_ENV);

const BASE_URL =
  import.meta.env.PROD ? '/api/' : (import.meta.env.VITE_API_BASE_URL || '/api/')

const axios = Axios.create({
  withCredentials: true,
})

export const httpService = {
  get(endpoint, data) {
    return ajax(endpoint, 'GET', data)
  },
  post(endpoint, data) {
    return ajax(endpoint, 'POST', data)
  },
  put(endpoint, data) {
    return ajax(endpoint, 'PUT', data)
  },
  delete(endpoint, data) {
    return ajax(endpoint, 'DELETE', data)
  },
}

async function ajax(endpoint, method = 'GET', data = null) {
  try {
    const res = await axios({
      url: `${BASE_URL}${endpoint}`,
      method,
      data,
      params: method === 'GET' ? data : null,
    })
    return res.data
  } catch (err) {
    // Never log the request body — it can contain passwords and other credentials.
    console.error(
      `Request failed: ${method} ${endpoint} → ${err.response?.status ?? 'network error'}`
    )
    if (err.response && err.response.status === 401) {
      sessionStorage.clear()
    }
    throw err
  }
}
