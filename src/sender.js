import AWS from 'aws-sdk';

export default class MetricsSender {

  static hookInstalled = false
  static metrics = []
  static enabled = true

  static queue(metric) {
    if (!this.hookInstalled) {
      this._installHooks()
      this.hookInstalled = true
    }

    this.metrics.push(metric)
  }

  static flush() {
    console.log(`Transmit ${this.metrics.length} metrics`)

    if (!this.metrics.length || !this.enabled)
      return

    console.log(this.metrics)

    try {
      this._cloudwatch().putMetricData({
        Namespace: this.namespace,
        MetricData: this.metrics
      }).promise()
    } catch (e) {
      console.error('Exception while transmitting metrics (ignored)', e)
    }

    this.metrics = []
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
    if (!this.cloudwatch)
     this.cloudwatch = new AWS.CloudWatch()

    return this.cloudwatch
  }

  static set namespace(namespace) {
    this._namespace = namespace
  }

  static get namespace() {
    return this._namespace || 'Metrics'
  }
}
