import MetricsSender from 'sender'
import interceptor from 'interceptor'

export default class MetricsExecutor {
  constructor(metric) {
    this.metric = metric
  }

  run(block) {
    this.start = Date.now()
    this.calledFunctions = [];

    const args = this._wrapObjects(this.metric.objects)
    const res = block(...args)

    this.name = this.metric.name ? this.metric.name : this.calledFunctions.join('-')

    if (res && typeof res.then === 'function') {
      return res
        .then(r => { this._completion(); return r })
        .catch(e => { this._completion(); throw e })
    } else {
      this._completion()
      return res
    }
  }

  _completion() {
    const diff = Date.now()-this.start
    MetricsSender.queue({
      Dimensions: this.metric.dimensions,
      MetricName: this.name,
      Unit: 'Milliseconds',
      Timestamp: this.start/1000,
      Value: diff
    })
  }

  _wrapObjects(objects) {
    const outer = this
    return objects.map(object =>
      interceptor(object, (target, name, func) =>
        function(...args){
          return outer._wrapMethodCall(this, name, func, ...args)
        }
      )
    )
  }

  _wrapMethodCall(target, name, func, ...args) {
    this.calledFunctions.push(name)

    if (args.length && typeof args[args.length-1] === 'function') {
      const originalCb = args.pop()
      return this._promisify(func).apply(target, args)
        .then(res => { originalCb(null, res); return res })
        .catch(e => { originalCb(e); throw e })
    } else {
      return func.apply(target, args)
    }
  }

  _promisify(func) {
    return function(...args) {
      return new Promise((resolve, reject) => {
        return func.call(this, ...args, (err, data) => {
          if (err)
            reject(err)
          else
            resolve(data)
        })
      })
    }
  }
}
