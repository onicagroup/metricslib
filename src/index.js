import 'source-map-support/register'

import AWS from 'aws-sdk';
import MetricsBuilder from 'builder'
import MetricsSender from 'sender'
import interceptor from 'interceptor'
import NullLogger from 'null_logger'

module.exports = function(...args) {
  return new MetricsBuilder(...args)
}

module.exports.wrap = function(object, config = {}) {
  const metrics = new MetricsBuilder().with(object)._recursive()

  let proxy =  interceptor(object, (target, name, func) => {
    return function(...args) {
      // We can't use the func passed-in here, because we actually
      // need to make sure we get the proxy created by MetricsBuilder
      // and that'll only happen if we look for [name] inside of the
      // wrapped object passed into execute.

      return metrics.execute(o => o[name].bind(config.recursive ? this : target)(...args))
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

module.exports.enable = function() {
  MetricsSender.enabled = true
}

module.exports.disable = function() {
  MetricsSender.enabled = false
}

module.exports.logger = function(logger) {
  MetricsSender.logger = logger ? logger : NullLogger
}

module.exports.configure = function(config) {
  MetricsSender.config = config
}

module.exports.dimensions = function(dimensions) {
  MetricsBuilder.dimensions = dimensions
}

