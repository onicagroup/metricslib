
import 'proxy-polyfill'

export default function(object, cb) {
  return new Proxy(object, {
    get: function(target, name) {
      const val = target[name]

      if (val === undefined && name === '__is_a_proxy__')
        return true

      if (typeof val === 'function')
        return cb(target, name, val)

      return val
    }
  })
}
