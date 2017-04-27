
import 'proxy-polyfill'

export default function(object, cb) {
  return new Proxy(object, {
    get: function(target, name) {
      const val = target[name]

      if (typeof val === 'function')
        return cb(target, name, val)

      return val
    }
  })
}
