Template.iotDevice.helpers({
  device: function() {
/*    var devs = judevs.find().fetch();
    if(devs) {
      _.each(devs,function(dev) {
        dev.properties = juhome.find({devid:dev.devid});
      });
    }

    return devs;
    */
  console.log('get device by id:',Session.get('iotDeviceID'));
  return judevs.findOne({"devid":Session.get('iotDeviceID')});
  }
});

Template.iotDevice.rendered = function() {
  var device, devid,properties, arcs, now, delta, color;

  arcs = [];
  devid = Session.get('iotDeviceID');
  now = new Date().getTime();
  delta = clip2bars(now - (new Date(device.updated).getTime()), 0, 86400 * 1000);
  device = judevs.find({'devid':devid});

  if(device.status === 'stop') {
    arcs.push({
      name : 'status', 
      raw : device.status,
      color : statusColor, 
      label : 'STATUS', 
      cooked : device.status,
      value : 0.0, 
      index  : 0.60
    });

    drawArcs(arcs);
    return;
  }

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
  _.each(properties,function(property) {
    arcs.push({
      name : property.name, 
      raw : property.value, 
      label : property.label, 
      cooked : property.value, 
      ratio : d3.ratio(property.value), 
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

var clip2bars = function(v, min, max) {
  if (v < min) v = min;
  else if (v > max) v = max;

  return ((v - min) / ((max -min) * 2));
};

var drawArcs = function(arcs) {
  var MAXARCS = 8;
  var arcs = [
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
    var result = "";
    switch (labelText.toLowerCase()) {
      case "distance":
      case "location":
        result += "<span class='clickable-text' onclick='javascript:showLocation(event)'>" + labelText + "</span>";
        break;
      default:
        result += labelText;
        break;
    }
    return (result + "<br/>");
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


d3.timestamp = d3.timestamp || {};
// http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
d3.timestamp.ago = function(time, agoP) {
  if (!time) return '';
  switch (typeof time) {
    case 'number':
      break;

    case 'string':
      time = +new Date(time);
      break;

    case 'object':
      if (time.constructor === Date) time = time.getTime();
      break;

    default:
      time = +new Date();
      break;
  }
  var time_formats = [
    [         60, 's'      ,                   1], // 60
    [        120, '1m',            '1m from now'], // 60*2
    [       3600, 'm',                        60], // 60*60, 60
    [       7200, '1h',            '1h from now'], // 60*60*2
    [      86400, 'h',                      3600], // 60*60*24, 60*60
    [     172800, 'yesterday',        'tomorrow'], // 60*60*24*2
    [     604800, 'd',                     86400], // 60*60*24*7, 60*60*24
    [    1209600, 'last week',       'next week'], // 60*60*24*7*4*2
    [    2419200, 'w',                    604800], // 60*60*24*7*4, 60*60*24*7
    [    4838400, 'last month',     'next month'], // 60*60*24*7*4*2
    [   29030400, 'months',              2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [   58060800, 'last year',       'next year'], // 60*60*24*7*4*12*2
    [ 2903040000, 'years',              29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [ 5806080000, 'last century', 'next century'], // 60*60*24*7*4*12*100*2
    [58060800000, 'centuries',        2903040000]  // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
  ];
  var seconds = (+new Date() - time) / 1000
    , token = agoP ? 'ago' : ''
    , list_choice = 1;

  if (seconds < 0) {
    seconds = Math.abs(seconds);
    token = 'from now';
    list_choice = 2;
  }
  if (seconds < 1) return 'now';

  var i = 0
    , format;
  while (!!(format = time_formats[i++]))
    if (seconds < format[0]) {
      if (typeof format[2] == 'string') return format[list_choice];
      return Math.floor(seconds / format[2]) + format[1] + ' ' + token;
    }
  return time;
};
