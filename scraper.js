var request = require('request'),
    debug   = require('debug')('scraper'),
    async   = require('async'),
    x       = require('x-ray');


var previousUrls;
var count = 0;
var completion = 0;

module.exports = {};

/** scrape
 * Inputs
 * @param {string} currentUrl The URL in which to scrape
 * @param {string} targetDomain The domain to scrape (ensures scraper does not leave domain)
 * @param {Object} previousUrls A list of all previous Urls
 * @param {Function} callback a callback procedure to be called once finished. Takes in two arguments,
 *                   (err, res)
 */
module.exports.scrape = function(currentUrl, targetDomain, depthLimit, callback) {
  previousUrls = [];
//Non-blocking timeout loop to update % complete
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
    // console.log();
    callback(err, res);
  });
};

var scrape = function(currentUrl, targetDomain, depthLimit, percentAllowance, callback) {
  count++;
  //A negative depthLimit means no limit
  if(depthLimit > 0 || depthLimit <= -1) {
    previousUrls.push(currentUrl);
    //Request ONLY headers.
    request.head(currentUrl, function(err, res) {
      if(err || !res.headers || !res.headers['content-type']) {
        debug('Error retrieving : ' + currentUrl + '. ' + err);
        completion += percentAllowance;
        return callback(null, {url: currentUrl, mimetype: 'N/A', children: null});
      } else {
        var mimetype = res.headers['content-type'].split(';')[0];
        switch(res.headers['content-type'].split(';')[0]) {
          case 'text/html':
            debug(currentUrl);
            request(currentUrl, function(err, res, body) {
              if(err) {
                debug('Error retrieving body for : ' + currentUrl + '. ' + err);
                completion += percentAllowance;
                return callback(null, {url: currentUrl, mimetype: 'N/A', children: null});
              } else {
                var urlList = parseHtml(body, currentUrl, targetDomain);
                //Remove previously visited URLs
                urlList = urlList.filter(function(e) {
                  return previousUrls.indexOf(e) == -1;
                });
                //If URLs to process, update the percent value
                if(urlList.length == 0) {
                  completion += percentAllowance;
                }
                //For each URL, recurse,  compile to JSON and return
                //Using async should allow thread control/limiting so as not to crash.
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
          //If not html, return just the url, mt, children
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
 * links from html
 *
 * @param {string} html A body of html
 * @param {string} calledUrl the URL
 * @param {string} targetDomain The domain
 *
 */
var parseHtml = function(html, calledUrl, targetDomain) {
  //Regex filters according to any href or src
  var listOfUrls = html.match(/(href|src)="[^> #"]+/g);
  //If any urls
  if(listOfUrls) {
    listOfUrls = filterHtml(listOfUrls, calledUrl, targetDomain);
  } else {
    listOfUrls = [];
  }
  return listOfUrls;
};

var filterHtml = function(listOfUrls, calledUrl, targetDomain) {
  //Remove  query parameters
  calledUrl = calledUrl.replace(/\?[^/]*$/, '');
  //filter input calledUrl to remove trailing slash, .html, ., asp, aspx .xml or .php - could add asp etc.
  calledUrl = calledUrl.replace(/(\/)?(|[^/]*\.html|[^/]*\.css|[^/]*\.xml|[^/]*\.php|[^/]*\.aspx?)$/, '');
  //Remove anchor links from url
  calledUrl = calledUrl.replace(/#/, '');
  listOfUrls = listOfUrls.map(function(e) {
    e = e.toLowerCase();
    //get  entire absolute link
    if(e.match(/https?:\/\/[^/]*/)) {
      return e.replace(/(href|src)="/, '');
    //Treat two slashes (CDN) as  absolute link
    } else if(e.match(/^(href|src)="\/\//)) {
      return 'http:' + e.replace(/(href|src)="/, '');
    //absolute relative paths
    } else if(e.match(/^(href|src)="\//)) {
      return 'http://' + targetDomain + e.replace(/(href|src)="/, '');
    } else {
      //fix relative links
      return calledUrl + '/' + e.replace(/(href|src)="/, '');
    }
  });
  // console.log(listOfUrls);
  //remove entries not on domain
  var targetRegex = new RegExp('^https?://[a-zA-Z0-9.]*'+targetDomain);
  listOfUrls = listOfUrls.filter(function(e) {
    return e.match(targetRegex);
  });
  //Remove mailto/tel
  // listOfUrls = listOfUrls.filter(function(e) {
  //   return !e.match(/(mailto:|tel:)/);
  // });
  //Remove trailing slashes and set all to http
  listOfUrls = listOfUrls.map(function(e) {
    return e.replace(/\/$/,'');//.replace(/https?/,'http');
  });
  //Filter out duplicate terms
  listOfUrls = listOfUrls.filter(function(e, i) {
    return listOfUrls.indexOf(e) == i;
  });

  //remove relative '.' and '..' references
  listOfUrls = listOfUrls.map(function(e) {
    //While there is still a /.. remove it
    while(e.match(/\/\.\./)) {
      //remove .html,
      e = e.replace(/\/[^/]*(\/[^/]*.html)?\/\.\./, '');
    }
    //remove all /.
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
