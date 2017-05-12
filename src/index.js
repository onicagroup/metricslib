
import AWS from 'aws-sdk';
import MetricsBuilder from 'builder'
import MetricsSender from 'sender'
import interceptor from 'interceptor'

module.exports = function(...args) {
  return new MetricsBuilder(...args)
}

module.exports.wrap = function(object) {
  const metrics = new MetricsBuilder().with(object)

  let proxy =  interceptor(object, (target, name, func) => {
    return function(...args) {
      // We can't use the func passed-in here, because we actually
      // need to make sure we get the proxy created by MetricsBuilder
      // and that'll only happen if we look for [name] inside of the
      // wrapped object passed into execute.

      return metrics.execute(o => o[name].bind(this)(...args))
    }
  })

  return proxy
}

module.exports.flush = function() {
  MetricsSender.flush()
}

module.exports.namespace = function(namespace) {
  MetricsSender.namespace = namespace
}
