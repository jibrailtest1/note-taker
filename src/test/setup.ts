import '@testing-library/jest-dom/vitest'
import { act } from 'react'
import { configure } from '@testing-library/react'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

configure({
  asyncWrapper: act,
  eventWrapper: act,
})
