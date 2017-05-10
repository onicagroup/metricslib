// node.js doesn't have the debug method on console so we alias it to the log method instead
if (!console.debug) {
  console.debug = console.log
}

export default console
