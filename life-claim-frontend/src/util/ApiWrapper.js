import { API_URL } from './config'

const baseUrl = `${API_URL || ''}/api`

const addTokenToRequest = (options) => {
  if (!options) options = {}
  if (!options.headers) options.headers = {}

  const token = sessionStorage.getItem('token')
  if (token) {
    options.headers.Authorization = `Bearer ${token}`
  }
  return options
}

const wrapper = {
  fetchWithToken: async (url, options) => {
    const modifiedOptions = addTokenToRequest(options)
    const response = await fetch(`${baseUrl}${url}`, modifiedOptions)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Error fetching data: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response
  },
}

export default wrapper
