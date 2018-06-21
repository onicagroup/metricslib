import AWS from 'aws-sdk';

import ConsoleLogger from 'console_logger'

export default class MetricsSender {

  static hookInstalled = false
  static metrics = []
  static enabled = true
  static logger = ConsoleLogger
  static config = {}

  static queue(metric) {
    if (!this.hookInstalled) {
      this._installHooks()
      this.hookInstalled = true
    }

    this.metrics.push(metric)
  }

  static flush() {
    this.logger.debug(`Transmit ${this.metrics.length} metrics`)

    if (!this.metrics.length || !this.enabled)
      return

    this.logger.debug(this.metrics)

    while(this.metrics.length > 0) {
      this._cloudwatch().putMetricData({
        Namespace: this.namespace,
        MetricData: this.metrics.splice(0, 20)
      }).promise()
      .catch((error) => {
        this.logger.error('Exception while transmitting metrics (ignored)', error)
      })
    }
  }

  static _installHooks() {
    ['beforeExit', 'uncaughtException'].forEach((event) => {
      this._prependListener(process, event, this.flush.bind(this))
    })
  }

  // Node 4.x doesn't have prependListener, so we do this craziness
  static _prependListener(object, event, listener) {
    if (object.prependListener) {
      object.prependListener(event, listener)
    } else {
      const oldListeners = object.listeners(event);
      object.removeAllListeners(event);
      object.on(event, listener);
      oldListeners.forEach(l => object.on(event, l));
    }
  }

  static _cloudwatch() {
    if (!this.cloudwatch) {
      const awsConfig = new AWS.Config(this.config);
      this.cloudwatch = new AWS.CloudWatch(awsConfig);
    }
    return this.cloudwatch
  }

  static set namespace(namespace) {
    this._namespace = namespace
  }

  static get namespace() {
    return this._namespace || 'Metrics'
  }
}
