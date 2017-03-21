var Xray = require("x-ray");
var x = Xray();
var site = 'http://www.google.com';

x(site, 'a', ['@href'])(function(err,result){console.log(result)});