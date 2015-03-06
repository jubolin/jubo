Template.iotDevice.helpers({
  device: function() {
    return judevs.findOne({"devid":Session.get('iotDeviceID')});
  }
});

Template.iotDevice.rendered = function() {
  var device, devid,properties, arcs, now, delta, color;

  arcs = [];
  devid = Session.get('iotDeviceID');
  device = judevs.findOne({'devid':devid});
  console.log('device:',device);

  if(device.status === 'stop') 
    return;

  now = new Date().getTime();
  delta = d3.ratio.clip2bars(now - (new Date(device.start).getTime()), 0, 86400 * 1000);
  // running time
  arcs.push({ 
    name : 'start', 
    raw : device.start, 
    label : 'TIME', 
    cooked : d3.timestamp.ago(device.start), 
    ratio : delta, 
    index : 0.70
  });

  properties = juhome.find({'devid':devid});
  properties.forEach(function(property) {
    console.log('property:',property);
    arcs.push({
      name : property.name, 
      raw : property.value, 
      label : property.label, 
      cooked : property.value, 
      ratio : d3.ratio.translate(property.name,property.value), 
      index  : 0.60
    });
  });
   
  drawArcs(arcs);
}

Template.iotDeviceNav.helpers({
  devices: function() {
    return judevs.find();
  }
});

var drawArcs = function(arcs) {
  var MAXARCS = 8;
/*  var arcs = [
    { 
      name   : 'updated'
            , raw    : 1
            , label  : 'TIME'
            , cooked : d3.timestamp.ago(1.1)
            , ratio  : 0.20
            , index  : 0.70
    },
    {
      name   : 'status', 
      raw    : 'ondadfdadfadfdafdadad', 
      color  : d3.rgb('#00ba00'), 
      label  : 'STATUS', 
      cooked : 'on', 
      ratio  : 0.10, 
      index  : 0.60         
    },
    { 
      name   : 'updated'
            , raw    : 1
            , label  : 'COLOR'
            , cooked : '白色' 
            , ratio  : 0.30
            , index  : 0.70
    }
  ];
  */
  var arcText, arcz, chart, div, i, index, limit, labels, trayLeft, values;

  chart = document.getElementById("chart");
  div = document.createElement('div');
  div.setAttribute('id', 'labels');
  div.setAttribute('style',
                   'position: absolute; top: 52px; left: 178px; width: 200px; height: 240px; text-align: right; font-weight: normal;');
  labels = '';
  arcz = [];
  if (!arcs) arcs = multiple_arcs;
  if (arcs.length > MAXARCS) arcs = arcs.slice(0, MAXARCS - 1);
  
  trayLeft = (document.getElementById("image-tray")) ? parseInt(d3.select("#image-tray").style("left"), 10) : null;
  if ((trayLeft == null) || (arcs.length < 5)) {
    i = 0;
	limit = arcs.length;
  } else {
    i = Math.abs(trayLeft) / 50;
    limit = ((i + 5) > arcs.length) ? arcs.length : (i + 5);
  }

  index = 0.7; // Reassign index values for arcs subset
  for (; i < limit; i++) {
    labels += arcLabelHTML(arcs[i].label);
    arcs[i].index = index;
    arcz.push(arcs[i]);
    index -= 0.1;
  }
  arcs = arcz;

  console.log('draw arcs:',arcs);
  div.innerHTML = '<div class="labels" style="white-space: nowrap; width: 190px; overflow: hidden; -o-text-overflow: ellipsis; text-overflow: ellipsis; ">' + labels + '</div>';
chart.appendChild(div);

// Based on http://vis.stanford.edu/protovis/ex/chart.html
// with an assist from arctween.js

  var w = 758,
      h = 758,
      r = Math.min(w, h) / 1.8,
      s = 0.09,
      color = d3.scale.ordinal()                // based on Status Board palette
      .range(["#9b00c1", "#006be6", "#009e99", "#00ba00", "#fc6a00", "#ffc600", "#ff3000"]);

  
  var arc = d3.svg.arc()
      .startAngle(0)
      .endAngle(function(d) { return d.ratio * 2 * Math.PI; })
      .innerRadius(function(d) { return d.index * r; })
      .outerRadius(function(d) { return (d.index + s) * r; });

  var arc2 = d3.svg.arc()
      .startAngle(0)
      .endAngle(function(d) { return 1.9999 * Math.PI; })
      .innerRadius(function(d) { return d.index * r; })
      .outerRadius(function(d) { return (d.index + s) * r; });

  var vis = d3.select("#chart").append("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("id", "arcCanvas")
        .append("g")
      .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

  var g = vis.selectAll("g")
      .data(function() { return arcs; })
    .enter().append("g");

  var arcColor = []; // save to calc contrasting overlaid text color
  
  g.append("path")
      .style("fill", function(d, i) { arcColor[i] = ((!!d.color) ? d.color : color(i)); return arcColor[i]; })
      .attr("id", function(d, i) {return "arcPath" + i;})
      .classed("arc-path-spec", true)
      .attr("d", arc);
  
  var g2 = g.append("path")
      .style("fill", "none")
      .style("stroke", "none")
      .attr("id", function(d,i){return "a"+i;})
      .attr("d", arc2);  
    
    // readings
	var text = g.append("text")
		.attr("text-anchor", "start")
		.attr("dx", 4)
		.attr("dy", 24)
		.style("font-family", "Roadgeek 2005 Series D")
		.style("font-size", "12px")
		.style("color", "#fff")
		.classed("readings-text", true);
		
	text.append("textPath")
		.attr("stroke", "none")
		.attr("fill",function(d,i){return textColor(arcColor[i], arcs[i].value);})
		.attr("xlink:href",function(d,i){return "#a"+i;})
		.attr("id", function(d,i){return "arcTextPath" + i})
		.text(function(d,i){ return convertSymbol(d.cooked); });
           
  function convertSymbol(txt) {
    if (txt) {
      var re = /\&deg;/gi;
      txt = txt.replace(re, "°");
      re = /\<sup\>2\<\/sup\>/gi;
      txt = txt.replace(re, "²");
      re = /\<sub\>2\<\/sub\>/gi;
      txt = txt.replace(re, "₂");
      re = /\&sigma;/gi;
      txt = txt.replace(re, "σ");
      re = /\&plusmn;/gi;
      txt = txt.replace(re, "±");
    }
    return txt;
  }
  
  function arcLabelHTML(labelText) {
    return (labelText + "<br/>");
  }
}

// Adapted from http://stackoverflow.com/questions/4726344/
// To work with d3_Color type
function textColor(bgColor, arcVal) {
   var bgDelta, components, nThreshold = 105;
   if (typeof bgColor === "string") {
     components = getRGBComponents(bgColor);
   } else {
     components = bgColor;
   }
   bgDelta = (components.r * 0.299) + (components.g * 0.587) + (components.b * 0.114);
   return (((255 - bgDelta) < nThreshold) && (arcVal > 0.015)) ? "#000000" : "#ffffff"; 
   
   function getRGBComponents(color) {       
     var r = color.substring(1, 3);
     var g = color.substring(3, 5);
     var b = color.substring(5, 7);

     return {
       "r": parseInt(r, 16),
       "g": parseInt(g, 16),
       "b": parseInt(b, 16)
     };
   }
}



