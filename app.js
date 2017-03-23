var scraper  = require('./scraper'),
    debug    = require('debug')('app'),
    jsonfile = require('jsonfile'),
    path     = require('path'),
    readline = require('readline'),
    pd       = require('parse-domain'),
    fork     = require('child_process').fork,
    spawn    = require('child_process').spawn,
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
    console.log("Give it a minute, but if this crashes try changing the depth limit from 3 to 2 in the line following this console.log statement in app.js.");
    scraper.scrape(startingUrl, domain, 3, function(err, res) {
      if(err) {
        debug('Unexpected Error: ' + err);
      } else {
        console.log(res);
        var filename = path.resolve(__dirname, 'sitemaps/' + domain + '.json');
        jsonfile.writeFile(filename, res, {spaces: 2}, function(err) {
          console.log('Sitemap successfully written to ' + path.resolve(__dirname, 'sitemaps/' + domain + '.json'));
          var child = fork('treeToGraph.js',[filename,domain]);
          child.on('exit', (code) => {
              console.log(`$$$$$$$$$$$$child process exited with code ${code}`);
              console.log(`$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`);
              console.log("Open http://localhost:8080/gravity.html?file="+domain+".json to see a visualization of the site map.");
              var favProc = fork('favicon.js',[domain]);
              favProc.on('exit', (code) => {var serveProc = fork('serve.js',[filename]);});
            });
        });
      }
    });
  }
});


