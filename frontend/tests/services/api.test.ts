import { afterEach, describe, expect, it, vi } from 'vitest'

type RequestInterceptor = (config: {
  headers?: Record<string, string>
}) => { headers?: Record<string, string> }

type ResponseSuccessInterceptor = <T>(response: T) => T
type ResponseErrorInterceptor = (error: {
  response?: { status?: number }
}) => Promise<never>

async function loadApiModule() {
  vi.resetModules()

  let requestInterceptor: RequestInterceptor | undefined
  let responseSuccessInterceptor: ResponseSuccessInterceptor | undefined
  let responseErrorInterceptor: ResponseErrorInterceptor | undefined

  const apiInstance = {
    interceptors: {
      request: {
        use: vi.fn((handler: RequestInterceptor) => {
          requestInterceptor = handler
          return 0
        }),
      },
      response: {
        use: vi.fn((
          successHandler: ResponseSuccessInterceptor,
          errorHandler: ResponseErrorInterceptor,
        ) => {
          responseSuccessInterceptor = successHandler
          responseErrorInterceptor = errorHandler
          return 0
        }),
      },
    },
  }

  const create = vi.fn(() => apiInstance)

  vi.doMock('axios', () => ({
    default: { create },
  }))

  const apiModule = await import('../../services/api')

  return {
    ...apiModule,
    create,
    apiInstance,
    getRequestInterceptor: () => requestInterceptor,
    getResponseSuccessInterceptor: () => responseSuccessInterceptor,
    getResponseErrorInterceptor: () => responseErrorInterceptor,
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('api service', () => {
  it('creates the axios instance and registers both interceptors', async () => {
    const apiModule = await loadApiModule()

    expect(apiModule.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000',
    })
    expect(apiModule.apiInstance.interceptors.request.use).toHaveBeenCalledTimes(1)
    expect(apiModule.apiInstance.interceptors.response.use).toHaveBeenCalledTimes(1)
  })

  it('adds the bearer token to outgoing requests when a token is set', async () => {
    const apiModule = await loadApiModule()
    apiModule.setAuthToken('token-123')

    const interceptor = apiModule.getRequestInterceptor()

    expect(interceptor).toBeTypeOf('function')
    expect(interceptor!({})).toEqual({
      headers: {
        Authorization: 'Bearer token-123',
      },
    })
  })

  it('preserves existing headers when no token is set', async () => {
    const apiModule = await loadApiModule()
    apiModule.setAuthToken(null)

    const config = { headers: { 'X-Test': '1' } }

    expect(apiModule.getRequestInterceptor()!(config)).toEqual(config)
  })

  it('passes successful responses through unchanged', async () => {
    const apiModule = await loadApiModule()
    const response = { data: { ok: true } }

    expect(apiModule.getResponseSuccessInterceptor()!(response)).toBe(response)
  })

  it('calls the unauthorised handler for 401 responses and rethrows the error', async () => {
    const apiModule = await loadApiModule()
    const handler = vi.fn()
    const error = { response: { status: 401 } }

    apiModule.registerUnauthorisedHandler(handler)

    await expect(apiModule.getResponseErrorInterceptor()!(error)).rejects.toBe(error)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call the unauthorised handler for non-401 responses', async () => {
    const apiModule = await loadApiModule()
    const handler = vi.fn()
    const error = { response: { status: 500 } }

    apiModule.registerUnauthorisedHandler(handler)

    await expect(apiModule.getResponseErrorInterceptor()!(error)).rejects.toBe(error)
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not fail when a 401 response occurs without a registered handler', async () => {
    const apiModule = await loadApiModule()
    const error = { response: { status: 401 } }

    await expect(apiModule.getResponseErrorInterceptor()!(error)).rejects.toBe(error)
  })
})
