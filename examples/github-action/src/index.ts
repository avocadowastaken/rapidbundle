import isObject = require('isobject');

if (isObject(process)) {
  console.log(process.env);
}