// lib/*.ts を Node から直接読み込むための設定（拡張子なしの相対 import を .ts に解決する）
import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context)
      } catch {
        // 拡張子なしのまま解決を続ける
      }
    }
    return nextResolve(specifier, context)
  },
})
