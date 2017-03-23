var sys = require("sys")
  , fs = require("fs")
  , pd = require("parse-domain")
  , request = require('request');
var hostname = process.argv[2];
var sUrl = "http://www.google.com/s2/favicons?domain_url="+hostname;
var parsedDomain = pd(hostname,{});
var ws = fs.createWriteStream('data/fav/'+parsedDomain.domain+".png");
request(sUrl).pipe(ws);
ws.end(function(){process.exit(0);});