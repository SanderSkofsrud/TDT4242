import { StrictMode } from 'react'

import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadMain() {
  vi.resetModules()

  const render = vi.fn()
  const createRoot = vi.fn(() => ({
    render,
  }))
  const MockApp = () => <div>app</div>

  vi.doMock('react-dom/client', () => ({
    createRoot,
  }))

  vi.doMock('../App', () => ({
    default: MockApp,
  }))

  await import('../main.tsx')

  return { MockApp, createRoot, render }
}

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('main bootstrap', () => {
  it('creates a root for #root and renders App inside StrictMode', async () => {
    document.body.innerHTML = '<div id="root"></div>'

    const { MockApp, createRoot, render } = await loadMain()

    const rootElement = document.getElementById('root')

    expect(createRoot).toHaveBeenCalledWith(rootElement)
    expect(render).toHaveBeenCalledTimes(1)

    const renderedTree = render.mock.calls[0]?.[0] as {
      props: { children: { type: unknown } }
      type: unknown
    }

    expect(renderedTree.type).toBe(StrictMode)
    expect(renderedTree.props.children.type).toBe(MockApp)
  })
})
