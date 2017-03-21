

# Web Crawler
Generates a site map of unique pages linked within the same domain, along with their mime-type - may use x-ray to scrape more. Places JSON jsonTrees in sitemaps/ folder.

# Favicon Grabber
Started as a scraper - now uses google service - expects a png for now... Places images in data/fav/

# Visualization
D3 force directed graph. Some munging required to get the data in the correct format - run 'node treeToGraph.js' to generate the treeGraph.json as the data set for vis.html. Serve visualizations via : 'node serve.js' then hit localhost:8080/force.html , vis.html etc. Various JSON fixtures in data/ folder for d3 experimentation.

## Prerequisites
NodeJS (recommended 6+) and NPM
## Installation
To install:
`npm install`

## Usage
Simply run with `nodejs app.js` and put in the URL of the website you want a site map of.
Once the program has finished execution, a JSON site map will have been generated in the sitemaps/ folder, with the name of the domain you had entered.




