import { Component } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

// Without this, ANY uncaught error in the render tree — a failed dynamic
// import for a lazy route after a new deploy, a bad API response shape, a
// null-ref somewhere — unmounts the entire React tree and leaves the
// visitor staring at a blank white page with no way forward except
// guessing to hit refresh. This catches that and shows a real screen with
// a way out, and auto-recovers on its own for the single most common
// cause: a stale chunk reference from before the latest deploy.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    const msg = String(error?.message || '');
    const isChunkError = /dynamically imported module|Loading chunk|Failed to fetch/i.test(msg);
    if (isChunkError) {
      // The build the browser has loaded is stale — the JS chunk it's
      // trying to fetch was replaced by a newer deploy. A single
      // full-page reload picks up the new index.html + fresh chunk map
      // and fixes it silently. Guard with sessionStorage so a *real*,
      // persistent error can't trigger an infinite reload loop.
      const key = 'presence_reloaded_for_chunk_error';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: 'var(--bg, #0A0D18)', minHeight: '100vh' }} className="flex items-center justify-center px-5">
          <div className="max-w-sm text-center">
            <span
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,92,119,0.12)', color: '#FF5C77' }}
            >
              <TriangleAlert size={26} />
            </span>
            <h1 className="font-semibold text-lg mb-2" style={{ color: 'var(--text, #F3F5FB)' }}>Something went wrong</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-dim, #8D93B2)' }}>
              This page hit an unexpected error. Reloading usually fixes it — especially if the site was updated recently.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg"
              style={{ background: '#22D3A6', color: '#04140f' }}
            >
              <RefreshCw size={15} /> Reload page
            </button>

            {/* Surfaces the real error text so it can be copied and sent
                back for a fix, instead of a diagnosis-by-screenshot round
                trip — expand it, tap "Copy", paste it to support/dev. */}
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs font-medium cursor-pointer" style={{ color: 'var(--text-dim, #8D93B2)' }}>
                  Show technical details
                </summary>
                <pre
                  className="mt-2 text-[11px] leading-relaxed whitespace-pre-wrap break-words rounded-lg p-3 max-h-48 overflow-y-auto"
                  style={{ background: 'rgba(0,0,0,0.25)', color: 'var(--text-dim, #8D93B2)' }}
                >
                  {String(this.state.error?.message || this.state.error)}
                  {this.state.error?.stack ? `\n\n${this.state.error.stack}` : ''}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
