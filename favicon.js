var sys = require("sys")
  , fs = require("fs")
  , pd = require("parse-domain")
  , request = require('request');

var hostname = "www.wiprodigital.com";
var sUrl = "http://www.google.com/s2/favicons?domain_url="+hostname;
var parsedDomain = pd(hostname,{});
request(sUrl).pipe(fs.createWriteStream('data/fav/'+parsedDomain.domain+".png"));