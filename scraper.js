var request = require('request'),
    debug   = require('debug')('scraper'),
    async   = require('async'),
    x       = require('x-ray');


var previousUrls;
var count = 0;
var completion = 0;

module.exports = {};

/** Module contains a function to be called to scrape,
 * passing in inputs
 * @param {string} currentUrl The URL in which to scrape
 * @param {string} targetDomain The domain to scrape (ensures scraper does not leave domain)
 * @param {Object} previousUrls A list of all previous Urls
 * @param {Function} callback a callback procedure to be called once finished. Takes in two arguments,
 *                   (err, res)
 */
module.exports.scrape = function(currentUrl, targetDomain, depthLimit, callback) {
  previousUrls = [];


  //A non-blocking while loop running to keep the user updated on % complete
  async.whilst(function() {
      return completion != 1;
    }, function (callback) {
      setTimeout(function() {
        process.stdout.write('Currently ' + (completion*100) + '% complete (done ' + count + ' sites).\r');
        callback(null);
      }, 1000);
    }, function (err) {
      if (err) console.log('Unexpected error in while loop: ' + err);
      console.log('FIN');
  });

  //Call the helper function, which recurses through each site
  scrape(currentUrl, targetDomain, depthLimit, 1.0, function(err, res) {
    completion = 1;
    process.stdout.write('Currently ' + (1.0*100) + '% complete (done ' + count + ' sites).\r');
    console.log();
    callback(err, res);
  });
};




/** Scrape function scrapes a given URL **/
var scrape = function(currentUrl, targetDomain, depthLimit, percentAllowance, callback) {
  count++;
  //A negative depthLimit means no limit
  if(depthLimit > 0 || depthLimit <= -1) {
    previousUrls.push(currentUrl);
    //Request ONLY the headers. We want to check the content type is html before actually getting it!
    request.head(currentUrl, function(err, res) {
      if(err || !res.headers || !res.headers['content-type']) {
        debug('Error retrieving url: ' + currentUrl + '. ' + err);
        completion += percentAllowance;
        return callback(null, {url: currentUrl, mimetype: 'N/A', children: null});
      } else {
        //If successfully recieved, match on content type (without additional parameters):
        var mimetype = res.headers['content-type'].split(';')[0];
        switch(res.headers['content-type'].split(';')[0]) {
          //If target is html, download the html, then scrape and recurse
          case 'text/html':
            debug(currentUrl);
            request(currentUrl, function(err, res, body) {
              if(err) {
                debug('Error retrieving body for url: ' + currentUrl + '. ' + err);
                completion += percentAllowance;
                return callback(null, {url: currentUrl, mimetype: 'N/A', children: null});
              } else {
                var urlList = parseHtml(body, currentUrl, targetDomain);
                //Remove any previously visited URLs
                urlList = urlList.filter(function(e) {
                  return previousUrls.indexOf(e) == -1;
                });
                //If there are no URLs to process, need to update the percent value
                if(urlList.length == 0) {
                  completion += percentAllowance;
                }
                //For each URL, recurse, then compile into JSON and return
                //Using async as request NPM is IO non blocking - can download in parallel
                async.map(urlList, function(e, cb) {
                  process.nextTick(function() {
                    scrape(e, targetDomain, depthLimit-1, percentAllowance/urlList.length, cb)
                  });
                }, function(err, results) {
                  if(err) {
                    debug('Unexpected error: ' + err);
                    return callback(err, null);
                  } else {
                    return callback(null, {
                      url: currentUrl,
                      mimetype: mimetype,
                      children: results
                    });
                  }
                });
              }
            });
            break;
          //If mime type is not html, return just the url, mime type and children
          default:
            debug(currentUrl + ' ' + count);
            debug(mimetype);
            completion += percentAllowance;
            return callback(null, {url: currentUrl, mimetype: mimetype, children: null});
        }
      }
    });
  } else {
    debug('Depth limit reached at: ' + currentUrl);
    completion += percentAllowance;
    return callback(null, null);
  }
};

/**
 * Function which extracts any links from given html
 *
 * @param {string} html A full body of html
 * @param {string} calledUrl the URL of the function which called it
 * @param {string} targetDomain The domain to scrape
 *
 */
var parseHtml = function(html, calledUrl, targetDomain) {
  //Regex filters according to any href or src locations
  var listOfUrls = html.match(/(href|src)="[^> #"]+/g);
  //If there exists any urls
  if(listOfUrls) {
    listOfUrls = filterHtml(listOfUrls, calledUrl, targetDomain);
  } else {
    listOfUrls = [];
  }
  return listOfUrls;
};

var filterHtml = function(listOfUrls, calledUrl, targetDomain) {
  //Remove any query parameters
  calledUrl = calledUrl.replace(/\?[^/]*$/, '');
  //filter input calledUrl to ensure it has no trailing slash and if it's last is a .html, ., asp, aspx .xml or .php, remove it
  calledUrl = calledUrl.replace(/(\/)?(|[^/]*\.html|[^/]*\.css|[^/]*\.xml|[^/]*\.php|[^/]*\.aspx?)$/, '');
  //Remove anchor links from url
  calledUrl = calledUrl.replace(/#/, '');
  listOfUrls = listOfUrls.map(function(e) {
    //URLs are case inspecific, but regex isn't
    e = e.toLowerCase();
    //On absolute link, get the entire absolute link
    if(e.match(/https?:\/\/[^/]*/)) {
      return e.replace(/(href|src)="/, '');
    //Two slashes at the start generally means it is sourced from a CDN and thus should be treated as an absolute link
    } else if(e.match(/^(href|src)="\/\//)) {
      return 'http:' + e.replace(/(href|src)="/, '');
    //A single slash at the start of a path always dictates 'relative to the root'
    } else if(e.match(/^(href|src)="\//)) {
      return 'http://' + targetDomain + e.replace(/(href|src)="/, '');
    } else {
      //On relative link starting without a /, it is assumed that it is relative to the current location, and so is added to the current location
      return calledUrl + '/' + e.replace(/(href|src)="/, '');
    }
  });
  console.log(listOfUrls);
  //Remove any non target domain entries
  var targetRegex = new RegExp('^https?://[a-zA-Z0-9.]*'+targetDomain);
  listOfUrls = listOfUrls.filter(function(e) {
    return e.match(targetRegex);
  });
  //Remove any mailto/tel links
  listOfUrls = listOfUrls.filter(function(e) {
    return !e.match(/(mailto:|tel:)/);
  });
  //Remove any missing trailing slashes and set all to http (?)
  listOfUrls = listOfUrls.map(function(e) {
    return e.replace(/\/$/,'');//.replace(/https?/,'http');
  });
  //Filter out duplicate terms
  listOfUrls = listOfUrls.filter(function(e, i) {
    return listOfUrls.indexOf(e) == i;
  });

  //Finally, remove any '.' and '..' references
  // a URL such as /hello/world/../../index.html
  // should produce /index.html
  //Must be done with a loop, as regex cannot model
  // the actions of a pushdown automata
  listOfUrls = listOfUrls.map(function(e) {
    //While there is still a /.. remove it
    while(e.match(/\/\.\./)) {
      //If the previous URL segment contains a .html,
      //remove that aswell
      e = e.replace(/\/[^/]*(\/[^/]*.html)?\/\.\./, '');
    }
    //After removing all /.. we remove all /.
    return e.replace(/\/\./, '');
  });

  return listOfUrls;

};

var urlIsPage = function (url){
  // check mimetype
  // check for basic html
  x(url, 'body', 'title')(console.log)
}


/**
 * exported function wrapper for filterHtml for testing parts of the parseHtml function
 */
module.exports.testParseHtml = function(listOfUrls, calledUrl, targetDomain) {
  return filterHtml(listOfUrls, calledUrl, targetDomain);
};
