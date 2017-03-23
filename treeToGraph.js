var fs = require("fs");
var infile = require(process.argv[2]);
var domain = process.argv[3];

var myGraph = {"nodes":[],"links":[]};
var groups = [];
var count = 0;
var mts =[];

console.log(process.argv[2]);
console.log("##############################################################");
console.log("Parsing graph from infile :: : " + infile);
var createNode = function(name, group, mt, graph){
  var newNode = {'id':name,'group':group,'mt':mt};
  if (!graph.nodes.filter(function(e) { return (e.id == name); }).length > 0) {
    graph.nodes.push(newNode);
  }
  return graph;
};
var createLink = function(source, target, value, graph){
  var newLink = {'source':source,'target':target,'value':value};
  if (!graph.links.filter(function(e) { return (e.source == source && e.value == value && e.target == target); }).length > 0) {
    graph.links.push(newLink);
  }
  return graph;
};

var parseTree = function(node,graph){
  var url = node.url;
  var mt = node.mimetype;
  var kids = node.children;
  //create the node (non-duplicative), all children, and links
  if(mts.indexOf(mt)<0){mts.push(mt);}
  count+=1;
  parentC = count-1;
  graph = createNode(url,mts.indexOf(mt)+1,mt,graph);
  if(kids && kids.length>0){
// console.log(kids.length+" children.");
    for(i in kids){
      var c = kids[i];
      if(c && mts.indexOf(c.mimetype)<0){mts.push(c.mimetype);}
      if(c){
      count+=1;
      graph = createNode(c.url,mts.indexOf(c.mimetype)+1,c.mimetype,graph);
      graph = createLink(url,c.url,1,graph);
      graph = parseTree(c,graph);
      }
    }
  }
  return graph;
}
var graph = parseTree(infile,myGraph);
var ws = fs.createWriteStream("data/"+domain+".json");
setTimeout(function(){

  ws.write(JSON.stringify(graph));
  ws.end(function () {
    console.log(graph);
    console.log("Mimetypes ::  ");
    console.log(mts);
    console.log('done');
    console.log(graph.nodes.length+" NODES.");
    console.log(graph.links.length+" LINKS.");
    console.log(mts.length+" Different Mimetypes.");
    console.log("Graph file written to : "+"data/"+domain+".json");
    process.exit(0);
    });
  }
  ,2000);


