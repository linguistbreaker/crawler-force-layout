

# Web Crawler
Generates a site map of unique pages linked within the same domain, along with their mime-type - may use x-ray to scrape more. Places JSON jsonTrees in sitemaps/ folder.
 - Web Crawler Code app.js and scraper.js from https://github.com/Casper-Oakley/web-scraper . 

# Favicon Grabber
Started as a scraper - now uses google service - expects a png for now... Places images in data/fav/

# Visualization
D3 force directed graph. Some munging required to get the data in the correct format - run 'node treeToGraph.js' to generate the treeGraph.json as the data set for vis.html. Serve visualizations via : 'node serve.js' then hit localhost:8080/force.html , vis.html etc. Various JSON fixtures in data/ folder for d3 experimentation.

## Prerequisites
NodeJS (recommended 6+) and NPM
## Installation
Normally, to install:
`npm install`

But this repository currently has all the dependencies in node_modules so it should just work if cloned.

## Usage
Simply run with `nodejs app.js` and put in the URL of the website you want to target. This currently only
supports URLs in the format 'http://www.lmgtfy.com' and may err otherwise. The app scrapes the site, then runs the favicon grabber and the treeToGraph.js script on the sitemap to generate a graph for D3. Then a simple webserver is launched. You can access the visualization at
      localhost:8080/gravity?file=filename
      localhost:8080/force4?file=filename
      localhost:8080/force3?file=filename
      localhost:8080/force2?file=filename
      localhost:8080/force?file=filename
where filename is the name returned by the script in the console. I haven't been able to exercise strict control over the async processes - I'd like to use queue for that. If the program crashes, try setting the depth limit from 3 to 2 on line 28 of app.js .




