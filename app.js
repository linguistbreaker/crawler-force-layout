var scraper  = require('./scraper'),
    debug    = require('debug')('app'),
    jsonfile = require('jsonfile'),
    path     = require('path'),
    readline = require('readline'),
    pd       = require('parse-domain');
    util     = require('util');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Please enter the URL you wish to scan:');
rl.on('line', function(line) {
  startingUrl = line;
  console.log(line);
  var parsedDomain = pd(line,{});
  if(!parsedDomain) {
    console.log('Invalid URL: ' + startingUrl + '. Exiting...');
    process.exit(1);
  } else {
    domain = parsedDomain.domain + '.' + parsedDomain.tld;
    console.log(domain);
    scraper.scrape(startingUrl, domain, 2, function(err, res) {
      if(err) {
        debug('Unexpected Error: ' + err);
      } else {
        console.log(res);
        jsonfile.writeFile(path.resolve(__dirname, 'sitemaps/' + domain + '.json'), res, {spaces: 2}, function(err) {
          console.log('Sitemap successfully written to ' + path.resolve(__dirname, 'sitemaps/' + domain + '.json'));
          process.exit(0);
        });
      }
    });
  }
});


