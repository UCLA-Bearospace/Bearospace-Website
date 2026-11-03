import { Component } from 'react'

/** Catches a failed scene chunk or engine so the rest of the page keeps working. */
export default class SceneBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('[scene] 3D view failed; showing the static poster', error)
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
