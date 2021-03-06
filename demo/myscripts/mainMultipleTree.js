
innerRadius = 10

var bundle = d3.layout.bundle();

var lineBundle = d3.svg.line()
      .interpolate("bundle")
      .tension(0.96)
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

var width = 1500,
    height = 850,
    root;

/*var force = d3.layout.force()
    .linkDistance(50)
    .charge(-120)
    .gravity(.15)
    .size([width, height])
    .on("tick", tick);*/
     


  
var nodeEnter;
var nodes
var time = 0;
var newNodes; 


var i=0,
    duration = 750,
    rootSearch;
var treeSearch;
var diagonal;



var treeLayout = d3.layout.tree().size([ width, height ]);
var scaleCircle = 1;  // The scale to update node size, defined by sliderScale.js
var scaleRate=1;
var scaleRadius = 0.78;//0.43;  // The scale betweeb parent and children nodes, defined by sliderRadius.js
 
var maxDepth=1;
var setIntervalFunction;


var nodeDFSCount = 0;  // this global variable is used to set the DFS ids for nodes

//var file = "data/0_RAF_Dot.json";

//var file = "data/1_Activation of Pro-caspase 8 Pathway.json";
//var file = "data/2_ERBB2 Pathway orginal.json";
//var file = "data/3_Signaling to GPCR Pathway.json";
//var file = "data/flare package.json";

//var file = "data/MultiplePathway_PaificVis2016.json";
var file = "data/pathway.json";
//var file = "data/AllDesease_Dot.json";

//var file = "data/carnivoraWithRelationships.json";
//var file = "data/mammalsWithRelationships.json";

//var file = "data/1_RAF-Cascade Pathway.json";
//var file = "data/54_DAG Pathway.json";
//var file = "data/3_NGF Pathway teaser.json";
//var file = "data/3_NGF_Dot.json";

//var file = "data/HIV Infection_Dot.json";

//var file = "data/3_Innate Immune System_Dot.json";

//var file = "data2016/flare figure2.json";


var svgControl = d3.select('.overviewHolder').append('svg')
    .attr("width", 520)
    .attr("height", 34);


var treeOnly = false;

var zoom = d3.behavior.zoom().scaleExtent([0.5, 8]).on("zoom", zoomed);
 
var svg = d3.select("body").append("svg")
    .attr("id", "SVGmain")
    .attr("width", width)
    .attr("height", height)
    .call(zoom)
    .append("g");

var relationship_selection = svg.selectAll(".link");
var linkTree_selection = svg.selectAll(".link"),
    node_selection = svg.selectAll(".node1"); // Empty selection at first


function zoomed() {
  console.log("zoom="+zoom);
    svg.attr("transform",
        "translate(" + zoom.translate() + ")" +
        "scale(" + zoom.scale() + ")"
    );
}




d3.json(file, function(error, classes) {
  var cluster = d3.layout.cluster()
    .size([360, innerRadius])
    .sort(null)
    .value(function(d) { return d.size; });

  nodes = cluster.nodes(packageHierarchy(classes));

  //nodes = nodes.filter(function(d) {
  //  return (d.depth<4);
  //});

  nodes.splice(0, 1);  // remove the first element (which is created by the reading process)
  links = packageImports(nodes);
  linkTree = d3.layout.tree().links(nodes);
  


  nodes.forEach(function(d) {
    if (d.depth == 1){
    //if (d.name == "flare.vis.data"){
      root = d;
    } 
  });
 


  treeLayout.sort(comparator);
  
  function comparator(a, b) {
    return b.order2 - a.order2;
  }
  
  childDepth1(root); 
  count1 = childCount1(0, root); 
  count2 = childCount2(0, root);  // DFS id of nodes are also set in this function
  root.idDFS = nodeDFSCount++; 
  root.order1 =0;

  //Assign id to each node, root id = 0
  nodes.forEach(function(d,i) {
    d.id =i;
  });
 // dfs(root);

  setupTree();
  drawNodeAndLink();
  update();
  //addSearchBox();

  setupSliderScale(svgControl);
  setupSliderRadius(svgControl);


  /*svg.append("text")
    .attr("class", "nodeLegend3")
    .attr("x", width/2-80)
    .attr("y", height+30)
    .text("CactusTree")
    //.text("Prey-predator relationships")
    .attr("dy", ".21em")
    .attr("font-family", "sans-serif")
    .attr("font-size", "30px")
    .style("text-anchor", "middle")
    .style("fill", "#000")
    .style("font-weight", "bold");       */
});


function getLeaves(d) {
  var list = [];
  d.children.forEach(function(child,i2) {
    if (child.children){
      var list2 = getLeaves(child);
      list2.forEach(function(d) {
        list.push(d);
      });  
    }
    else{
      list.push(child);
    }
  });
  return list;   
}  

function setupTree() {
  var disFactor = 2;
  var minY = height*100;   // used to compute the best scale for the input tree
  newNodes = treeLayout(root).map(function(d,i) {
    if (d.depth==0){
       d.treeX = 610; 
       d.treeY = height-getRadius(root);
       d.alpha = -Math.PI/12; 
    }
    if (d.children){
      var totalRadius = 0;
      var totalAngle = Math.PI*1.2;
     // if (d.depth==0){
     //   totalAngle = Math.PI*2;
     // }  
      var numChild =  d.children.length;
      d.children.forEach(function(child) {
        totalRadius+=getBranchingAngle1(getRadius(child), numChild);
      });  

      var begin=d.alpha-totalAngle/2;


      if (d.closed){
        list=getLeaves(d);
        list.forEach(function(d2) {

          totalRadius = 0;
          var numChild =  list.length;
          list.forEach(function(child) {
            totalRadius+=getBranchingAngle1(getRadius(child), numChild);
          }); 

          xC =  d.treeX;
          yC =  d.treeY;
          rC = getRadius(d)+getRadius(d2)/disFactor;
          d2.treeRC = rC;

          var additional = totalAngle*getBranchingAngle1(getRadius(d2), numChild)/totalRadius;
          d2.alpha = begin+additional/2;
          d2.treeX = xC+rC*Math.cos(d2.alpha); 
          d2.treeY = yC+rC*Math.sin(d2.alpha); 
          
            begin +=additional;
        });
      }  

      d.children.forEach(function(child,i2) {
        var parent = child.parent;
        var closedAncester;
        while (parent){
          if (parent.closed){
            closedAncester = parent;
          }
          parent = parent.parent;
        }
        if (closedAncester){
          if (child.children){
            child.alpha = closedAncester.alpha;
            child.treeX = closedAncester.treeX; 
            child.treeY = closedAncester.treeY; 
          }
        }
        else{
          xC =  d.treeX;
          yC =  d.treeY;
          rC = getRadius(d)+getRadius(child)/disFactor;
          child.treeRC = rC;

          var additional = totalAngle*getBranchingAngle1(getRadius(child), numChild)/totalRadius;
          child.alpha = begin+additional/2;
          child.treeX = xC+rC*Math.cos(child.alpha); 
          child.treeY = yC+rC*Math.sin(child.alpha); 
          if (d.depth==0){
            child.alpha = -Math.PI/2; 
            if (i2==0)
             child.treeX = 180;
            else if (i2==1)
             child.treeX = 360;
            else if (i2==2)
             child.treeX = 600;
           else if (i2==3)
             child.treeX = 850;
           else if (i2==4)
             child.treeX = 1050;
              
            child.treeY = child.parent.treeY-300;      
          }
                    
          if (child.treeY-rC<minY) {
            minY = child.treeY-rC;
          };
          if (child.depth>maxDepth){
            maxDepth = child.depth;
          }
          begin +=additional;
        }
      });
    }
    scaleRate = height/(height-minY);
    return d;
  });
}  





function clickNode(d) {
  if (d.closed==undefined)
    d.closed = true;
  else
    d.closed = !d.closed;
  console.log("Click on: "+ d.name);
  setupTree();
  updateNodeAndLink();
  //update();
}  


function drawNodeAndLink() {
// Update links of hierarchy.
  linkTree_selection = linkTree_selection.data(linkTree, function(d) { return d.target.id; });
  linkTree_selection.exit().remove();
  linkTree_selection.enter().append("line")
      .attr("class", "linkTree");

  // Update nodes.
  svg.selectAll(".node1").remove();
  node_selection = svg.selectAll(".node1").data(nodes);
  nodeEnter = node_selection.enter().append("g")
    .attr("class", "nodeG")
    .on("click", click);
 //   .call(force.drag);
  

  // Draw nodes *****************************************************
  nodeEnter.append("circle")
    .attr("class", "node1")
    .attr("id", function(d) { return d.idDFS; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .style("stroke", function(d) { 
        if (listSelected1[d.name] || listSelected2[d.name] || listSelected3[d.name] || listSelected4[d.name])
                return "#000";
      })        
      .style("stroke-width", function(d) { 
        if (listSelected1[d.name] || listSelected2[d.name] || listSelected3[d.name] || listSelected4[d.name])
                return 1.5;        
    })
   ;// .on("dbclick", clickNode); 

/*
 nodeEnter.append("image")
    .attr("class", "nodeImage3")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("height", getRadius)
    .attr("width", getRadius)
    .attr("fill", "#ff0000")
    .attr("xlink:href", function(d) { 
    var nodeName = d.key;
    
      // LOAD image from google
    var url = "https://www.google.com/search?q="+nodeName+"&es_sm=91&source=lnms&tbm=isch&sa=X&ved=0CAcQ_AUoAWoVChMIjdeehPSAxwIVgigeCh3dNQJ3&biw=1432&bih=761";
    if (nodeName!="0" && nodeName!="1"){
      resolver.resolve(url, function( result ){
          if (result) {
            d.image =  result.image ;
            //  $('body').css('background-image', 'url(' + result.image + ')');
          } else {
            d.image = "http://www.fnordware.com/superpng/pngtest8rgba.png";  
          }
      });
    }  
  });*/
  

  nodeEnter.append("text")
    .attr("class", "nodeText")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("dy", ".21em")
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .style("text-anchor", "middle")
    .text(function(d) {   
      if (d.key=="0" || d.key=="1")
            return "";
      else 
        return d.key; });

   nodeEnter.on('mouseover', mouseovered)
      .on("mouseout", mouseouted);

}

function updateNodeAndLink() {
  var durationTime = 2000;

  d3.selectAll(".node1").each(function(d) {
      d.x = (d.treeX ); //*event.alpha;
      d.y = d.treeY ; })
    .transition().duration(durationTime)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

  d3.selectAll(".nodeText").transition().duration(durationTime)
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; });

      
  linkTree_selection.transition().duration(durationTime)
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return Math.round(d.source.y); })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return Math.round(d.target.y); });
  
  svg.selectAll("path.link").transition().duration(durationTime)
    .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
    .attr("d", lineBundle);
}


function update() {
    d3.selectAll(".node1").each(function(d) {
        d.x = (d.treeX ); //*event.alpha;
        d.y = d.treeY ; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d){ 
        if (d.depth==0)
          return 0;
         else 
      if ((listSelected1[d.name] || listSelected2[d.name] || listSelected3[d.name] || listSelected4[d.name])
        && !d.children)
        return 1.4*getRadius(d);
      else
         return getRadius(d);
      })
      .style("fill", function(d,i) { 
        /*
        var defs = svg.append("defs").attr("id", "imgdefs")
        var catpattern = defs.append("pattern")
                                .attr("id", "catpattern"+i)
                                .attr("height", 1)
                                .attr("width", 1)
                                .attr("x", "0")
                                .attr("y", "0")

        catpattern.append("image")
             .attr("class", "nodeImage2")
             .attr("x", -getRadius(d)*0.25)
             .attr("y", -getRadius(d)*0.25)
             .attr("height", getRadius(d)*2.5)
             .attr("width", getRadius(d)*2.5)
             .attr("xlink:href", d.image )

         //    console.log(d.image);
         if (d.key=="0" || d.key=="1" || d.depth<1 || !document.getElementById("checkbox12").checked)
            return color(d);
         else{
             return "url(#catpattern"+i+")"; 
         }*/
         return color(d);
   });

      /*
    svg.selectAll(".nodeNamesText")
       .data(nodes.filter(function(n){
          if (n.depth<2)
            return true;
       })).enter()
       .append("text")
        .attr("class", "nodeNamesText")
        .attr("x", function(d2){return d2.x+8;})
        .attr("y", function(d2){return d2.y-20;})
        .text(function(d2){
          var a = d2.name.split(".");

          return a[a.length-1];
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .style("text-anchor", "middle")
        .style("fill", "#000")
        .style("font-weight", "bold");
     // drawColorLegend();  */


    d3.selectAll(".nodeText")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .text(function(d) {   
        if (d.key=="0" || d.key=="1" || !document.getElementById("checkbox11").checked)
              return "";
        else 
          return d.key; 
      });
      
    linkTree_selection.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return Math.round(d.source.y); })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return Math.round(d.target.y); });

  // Draw relationship links *******************************************************
  var displayLinks;
  if (!document.getElementById("checkbox4").checked 
    && !document.getElementById("checkbox5").checked){
      displayLinks = new Array(0);
  }  
  else if (document.getElementById("checkbox4").checked 
    && document.getElementById("checkbox5").checked){
     displayLinks = links;
  }
  else{
    var count1 = 0;
    for (var i=0; i< links.length;i++){
      if (links[i].source.parent == links[i].target.parent)
        count1++;
    } 
    if (document.getElementById("checkbox4").checked){
      displayLinks = new Array(count1);
      var count2 =0;
      for (var i=0; i< links.length;i++){
        if (links[i].source.parent == links[i].target.parent){
          displayLinks[count2] = links[i];  
          count2++;
        }
      } 
    } 
    else if (document.getElementById("checkbox5").checked){
      displayLinks = new Array(links.length-count1);
      var count2 =0;
      for (var i=0; i< links.length;i++){
        if (links[i].source.parent != links[i].target.parent){
          displayLinks[count2] = links[i];  
          count2++;
        }
      } 
    } 
    else{
      console.log("ERROR: THe program should never get here!!!");
    }
  }

  if (document.getElementById("checkbox3").checked){ //directed
    var aa = bundle(links);
    svg.selectAll("path.link").remove();
    for (var i=0; i< aa.length;i++){
      var points =  new Array(aa[i].length);;
      for (var j=0; j< aa[i].length;j++){
        var a = new Array(2);
        a[0] = aa[i][j].treeX;
        a[1] = aa[i][j].treeY;
        points[j] = a;
      }  
      //console.log(points);
      var color2 = d3.interpolateLab("#008000", "#c83a22");
      var line2 = d3.svg.line()
          .interpolate("basis");

      svg.selectAll("path"+i)
          .data(quad(sample(line2(points), 10)))
        .enter().append("path")
          .style("fill", function(d) { return color2(d.t); })
          .style("stroke", function(d) { return color2(d.t); })
          .attr("class", "link")
          .attr("d", function(d) { return lineJoin(d[0], d[1], d[2], d[3], 0.1); });
    }
  }
  else {  // Update Undirected links of relationships

    if (!treeOnly){
      svg.selectAll("path.link").remove();
      relationship_selection 
          .data(bundle(displayLinks))
        .enter().append("path")
          .attr("class", "link")
          .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
          .attr("d", lineBundle);
     }   
  }
}

// Collision ***********************************************************
var currentNode=1;
function startCollisionTimer() {
  setIntervalFunction = setInterval(function () {
    console.log("currentNode**** "+currentNode);
    // Compute collision
    var results = getCollisionOfSubtree(nodes[currentNode],0);
    var sumOverlapWithGreaterDFSid=results[1];
    var sumOverlapWithSmallerDFSid=results[0];
     
    //console.log("current="+currentNode+"  Smaller = "+sumOverlapWithSmallerDFSid
    //  +"  Greater = "+sumOverlapWithGreaterDFSid);
   

    d3.selectAll(".node1").each(function(d) {
        if (d.parent && d.treeRC){
          if (d.id==currentNode){
            if (sumOverlapWithGreaterDFSid>sumOverlapWithSmallerDFSid)
              d.alpha += 0.05;
            if (sumOverlapWithGreaterDFSid<sumOverlapWithSmallerDFSid)
              d.alpha -= 0.05;
          }  
          d.treeX = d.parent.treeX+d.treeRC*Math.cos(d.alpha); 
          d.treeY = d.parent.treeY+d.treeRC*Math.sin(d.alpha); 
          d.x = d.treeX; 
          d.y = d.treeY; 
        }
      })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", getRadius)
      .style("fill", color)
      ;

    currentNode++;
    if (currentNode==nodes.length)
      currentNode=1;
    while (!nodes[currentNode].children){   // skip all leaf nodes
      currentNode++;
      if (currentNode==nodes.length)
        currentNode=1;
    }
  }, 1);
} 

function getCollisionOfSubtree(node1, deep) {
  var results = getCollisionOfNode(node1);
  if (node1.children && deep<0) {  // do not go more than 10 levels
    for (var i=0; i<node1.children.length; i++){
      var results2 = getCollisionOfSubtree(node1.children[i],deep+1)
      results[0] += results2[0];
      results[1] += results2[1];
    }
  }
  return results;
}


function getCollisionOfNode(node1) {
  var results = new Array(2);
  var x1 = node1.x; 
  var y1 = node1.y; 
  var r1 = getRadius(node1);
  var sumOverlapWithGreaterDFSid=0;
  var sumOverlapWithSmallerDFSid=0;
  for (var i=0; i<nodes.length;i++){
    if (nodes[i]==node1 || nodes[i]==node1.parent || isAChildOf(nodes[i], node1)) continue;
    var x2 = nodes[i].x; 
    var y2 = nodes[i].y; 
    var r2 = getRadius(nodes[i]); 
    var dis = (x2-x1)*(x2-x1)+(y2-y1)*(y2-y1);
    dis = Math.sqrt(dis);
    if (dis<r1+r2){
      if (nodes[i].idDFS>node1.idDFS)
        sumOverlapWithGreaterDFSid += (r1+r2)-dis;
      else 
        sumOverlapWithSmallerDFSid += (r1+r2)-dis;
    }   
  }
  results[0] = sumOverlapWithSmallerDFSid;
  results[1] = sumOverlapWithGreaterDFSid;
  return results;
}

function isAChildOf(node1, node2) {
  if (!node2.children) return false;
  for (var i=0; i<node2.children.length;i++){
    if (node1==node2.children[i])
      return true;
  } 
  return false;
}



// Fisheye Lensing ************************************************
var fisheye = d3.fisheye.circular()
      .radius(200);

svg.on("mousemove", function() {
  if (document.getElementById("checkbox2").checked)
     fisheye.focus(d3.mouse(this));
  d3.selectAll(".node1").each(function(d) { d.fisheye = fisheye(d); })
      .attr("cx", function(d) { return d.fisheye.x; })
      .attr("cy", function(d) { return Math.round(d.fisheye.y); });
     // .attr("r", function(d) { return d.fisheye.z * 8; });
  linkTree_selection.attr("x1", function(d) { return d.source.fisheye.x; })
      .attr("y1", function(d) { return Math.round(d.source.fisheye.y); })
      .attr("x2", function(d) { return d.target.fisheye.x; })
      .attr("y2", function(d) { return Math.round(d.target.fisheye.y); });
   

  node_selection
    .each(function(d) {
      d.x = d.fisheye.x; //*event.alpha;
      d.y = d.fisheye.y; //*event.alpha;
    });
d3.selectAll(".nodeText")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y-getRadius(d)-2; }); 


  
 if (!document.getElementById("checkbox3").checked){  // no lensing on directed relationships
   svg.selectAll("path.link")
      .each(function(d) { })
      .attr("d", lineBundle); 
  }    
  var force_influence = 0.5;
  node_selection
    .each(function(d) {
      d.x += (d.treeX - d.x) * (force_influence); //*event.alpha;
      d.y += (d.treeY - d.y) * (force_influence); //*event.alpha;
    });
});

function mouseovered(d) {

  if (!d.children){
    node_selection
       .each(function(n) { n.target = n.source = false; });
    svg.selectAll("path.link")
      .classed("link--faded", function(l) { if (l) return true;  })
      .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
      .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
      .filter(function(l) { return l.target === d || l.source === d; })
      .each(function() { this.parentNode.appendChild(this); });
     ;
     
     d3.selectAll(".node1")
       .style("fill-opacity" , function(n) {   
        if (n.key=="0" || n.key=="1" || n.depth<1  || !document.getElementById("checkbox12").checked)
          return 1;
        else{
           if (n==d)
              return 1;
            if (n.target) 
              return 1;
            else if (n.source)
              return 1;
            else
              return 0.1;
        }  
          
      });

     /*  svg.selectAll(".nodeNames")
       .data(nodes.filter(function(n){
          if (n==d || n.target || n.source)
            return true;

       })).enter()
       .append("text")
        .attr("class", "nodeNames")
        .attr("x", function(d2){return d2.x;})
        .attr("y", function(d2){return d2.y-d2.treeRC/2;})
        .text(function(d2){
          var a = d2.name.split(".");

          return a[a.length-1];
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .style("text-anchor", "middle")
        .style("fill", "#000")
        .style("font-weight", "bold");*/
     // drawColorLegend();  
  }    
  else{
    svg.append("text")
      .attr("class", "nodeTextBrushing")
      .attr("x", d.x)
      .attr("y", d.y)
      .text(""+d.name)
      .attr("dy", ".21em")
      .attr("font-family", "sans-serif")
      .attr("font-size", "10px")
      .style("text-anchor", "middle")
      .style("fill", "#000")
      .style("font-weight", "bold");
   } 
  //.classed("node--target", function(n) {   return n.target; })
  //.classed("node--source", function(n) { return n.source; });  
}

function mouseouted(d) {
  d3.selectAll(".nodeNames").remove();

  svg.selectAll("path.link")
      .classed("link--faded", false)
      .classed("link--target", false)
      .classed("link--source", false);

  d3.selectAll(".node1")
      .style("fill" , function(n,i) {   
          if (n.key=="0" || n.key=="1" || n.depth<1  || !document.getElementById("checkbox12").checked)
            return color(n);
          else
            return "url(#catpattern"+i+")"; 
       })
      .style("fill-opacity", 1);

  removeColorLegend();    
  svg.selectAll(".nodeTextBrushing").remove();  
  
  //node_selection
  //    .classed("node--target", false)
  //    .classed("node--source", false);
}



