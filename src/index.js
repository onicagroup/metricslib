
import AWS from 'aws-sdk';
import MetricsBuilder from 'builder'
import MetricsSender from 'sender'
import interceptor from 'interceptor'

module.exports = function(...args) {
  return new MetricsBuilder(...args)
}

module.exports.wrap = function(object) {
  const metrics = new MetricsBuilder().with(object)

  return interceptor(object, (target, name, func) => {
    return function(...args) {
      console.log('execute', args)
      return metrics.execute(o => func.apply(o, args))
    }
  })
}

module.exports.flush = function() {
  MetricsSender.flush()
}
