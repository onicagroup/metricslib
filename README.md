
Metricslib
====

Metricslib is designed to collect key metrics (timing, invocation counts, etc) from an application and transmit the resulting metrics to AWS CloudWatch.


API
----

The API has two forms, the *builder* form:

```javascript
Metrics('listBuckets')
  .execute(_ => s3.listBuckets())
```

and the *shorthand* form:

```javascript
Metrics('listBuckets', _ => s3.listBuckets())
```

In the shorthand form, the first argument is treated as the metrics name (only if it's a string) and the last argument is treated as the function to execute (only if it's a function) while all other arguments are treated as call to `with()` (see below for details).

In both cases, the duration of s3.listBuckets() is timed and transmitted to CloudWatch as a metric named 'listBuckets'.

Automatic Naming & Asynchronous Functions
----
Metricslib properly handles timing for asynchronous functions, detecting them automatically wherever possible. This feature is particularly useful for the AWS SDK, in case you need timing around calls to AWS services (for example, the average query time for DynamoDB).

Asynchronous functions require Metricslib to be aware of the asynchronous operation. This is achieved in any one of a number of ways, described below.

### Return a Promise
If the function passed to execute() returns a Promise, the Metrics call will also return a Promise. This outer-promise will wrap the original promise and intercept it to add metrics behavior.

```javascript
// Builder form:
Metrics('listBuckets')
  .execute(_ => s3.listBuckets().promise())

// Shorthand form:
Metrics('listBuckets', _ => s3.listBuckets().promise())
```

### Explicitly Declare Objects
When returning a Promise from execute() isn't an option, you can use the `with()` method to explicitly declare the objects on which you'll call async methods. These objects are then passed back into your function in wrapped-form, where the wrapper proxy can intercept all method calls. In such cases, any wrapped-method that takes a callback argument (assumed if function is the last argument) is treated as asynchronous and the callback is wrapped.

```javascript
// Builder form:
Metrics('listBuckets')
  .with(s3)
  .execute(s3 => s3.listBuckets(callback))

// Shorthand form:
Metrics('listBuckets', s3, s3 => s3.listBuckets(callback))
```

Note that the proxy-wrapping is very simplistic. The wrapped object must have all of its properties defined before its wrapped; dynamically added functions/properties will not work.

Wrap an Entire Object
====
In cases where every method call to an object should be timed (with reasonable defaults around naming, etc) use the `wrap()` method. This uses the same proxying behavior described above in the *Asynchronous Functions* section, with all the same features and limitations.

```javascript
let s3 = Metrics.wrap(new AWS.S3())
s3.listBuckets().promise()
```

Unnamed Metrics
===
If a name is not provided for a metric, and the `with()` method is used to wrap objects, then the name will be inferred:

```javascript
Metrics() // Note the lack of a name
  .with(s3)
  .execute((s3) => s3.listBuckets().promise())
```

The above example results in a metric named `listBuckets` based on the call to `listBuckets()` on the `s3` object.

This behavior is the same when using fully-wrapped objects, with the following example leading to the same metric:

```javascript
let s3 = Metrics.wrap(new AWS.S3())
s3.listBuckets().promise()
```

In the case of an object wrapped via Metrics.wrap(), the name of the metrics cannot be customized.

There's also the option of wrapping an object and have metrics on all the object's subsequent method calls that the first method calls:

```javascript
let s3 = Metrics.wrap(new AWS.S3(), { recursive: true })
s3.listBuckets().promise()
```

With the `recursive` option set to `true` it'll send metrics for every method call made on that object during the execution of the first method call.
Default is `recursive: false`.

Manual Metrics
===
Sometimes a metric other than the duration of a function is needed. In these cases, Metriclib is a convenient wrapper around the CloudWatch API:

```javascript
Metrics('recordsProcessed').count(records.length) // Sends a metric with unit=Count
```

Dimensions
===
Setting global dimensions for metrics is also supported:

```javascript
Metrics.dimensions({ dimensionName1: 'dimensionValue1', dimensionName2: 'dimensionValue2' })
```

This makes every metric sent to Cloudwatch have both dimensions with the set values.

Namespace
===
In order to set a namespace for the metrics:

```javascript
Metrics.namespace('MyCustomNamespace')
```

This will group metrics in that specific namespace, if no namespace is set then the default `Metrics` namespace is used.

Metrics Queuing
===
Metrics are queued and transmitted in batches. Currently, a batch is only transmitted
on exit, upon completion of an AWS Lambda execution, or manually by calling flush().

Disable or Enable metrics
===
There's an option for completely disabling sending the metrics to Cloudwatch with:

```javascript
Metrics.disable()
```

While disabled no metrics will be sent to Cloudwatch if `Metrics.flush()` is called.
A good use case is if you're running unit tests for your code and don't want to send any metrics to Cloudwatch.

You can also enable it back using:

```javascript
Metrics.enable()
```

Custom Logger
===
Metricslib uses a simple console logger in order to output some debug information.
You can add your own custom logger with:

```javascript
const logger = new Logger() // Instantiate or use your own custom logger
Metrics.logger(logger)
```

Your own custom logger must implement the usual logging methods (`error`, `info`, `debug`, etc..).

There's also the option of removing all the logging output from the Metricslib with:

```javascript
Metrics.logger(null) // Any other falsy value will also work
```

This will set a `NullLogger` to Metricslib and no output will be seen.
