var imgSize = 48;
var dotSize = 4;

var res = {name: "Resistor", init: "res", prop: "Resistance", unit: "\u03A9"};
var cap = {name: "Capacitor", init: "cap", prop: "Capacitance", unit: "\u00B5F"};
var ind = {name: "Inductor", init: "ind", prop: "Inductance", unit: "mH"};
var dio = {name: "Diode", init: "dio"};
var vdc = {name: "DC Voltage source", init: "vdc", prop: "Voltage", unit: "V"};
var vac = {name: "AC voltage source", init: "vac", prop: "Phasor voltage", unit: "V"};
var idc = {name: "DC Current source", init: "idc", prop: "Current", unit: "A"};
var iac = {name: "AC Current source", init: "iac", prop: "Phasor Current", unit: "A"};
var info = {res: res, cap: cap, ind: ind, vdc: vdc, vac: vac, idc: idc, iac: iac, dio: dio};

// Prompt value from user
function promptValue(info){
    var promptStr = "Please enter a " + info.prop + " for a " + info.name + " in " + info.unit;
    var value = prompt(promptStr);
    while(value === ""){
        alert("Please enter a valid value");
        value = prompt(promptStr);
    }
    return value;
}

function adjustLine(pins, lineId){
    var line = document.getElementById(lineId);
    var linePins = lineId.split("_");
    line.setAttribute("points", findPolyStr(pins, linePins[0], linePins[1]));
}

function getLabelPinPos(pos, direction){
    var pos0, pos1, pos2;
    var halfImgSize = imgSize / 2;
    var leftPos = pos.offset(-halfImgSize, -halfImgSize);
    var rightPos = pos.offset(halfImgSize, -halfImgSize);
    var topPos = pos.offset(0, -imgSize);
    var bottomPos = pos;

    if(direction[0] === 0){
        if(direction[1] === 1){
            pos0 = topPos;
            pos1 = bottomPos;
        }else{
            pos0 = bottomPos;
            pos1 = topPos;
        }
        pos2 = rightPos.offset(8, 5);
    }else if(direction[1] === 0){
        if(direction[0] === 1){
            pos0 = leftPos;
            pos1 = rightPos;
        }else{
            pos0 = rightPos;
            pos1 = leftPos;
        }
        pos2 = bottomPos;
    }
    return [pos0, pos1, pos2];
}

// Position class
function Position(x, y){
    this.x = x;
    this.y = y;
    this.show = function(){
        return this.x + " " + this.y;
    };
    this.coords = function(){
        return [this.x, this.y];
    };
    this.offset = function(x, y){
        var pos = new Position(this.x, this.y);
        pos.x += x;
        pos.y += y;
        return pos;
    };
}

function getPinPositions(pos, direction){
    var leftPos = pos.offset(-24, -imgSize / 2);
    var rightPos = pos.offset(24, -imgSize / 2);
    var topPos = pos.offset(0, -imgSize);
    var bottomPos = pos;

    if(direction === "H"){
        return [leftPos, rightPos];
    }else{
        return [topPos, bottomPos];
    }
}

function getPinDirections(direction){
    if(direction === "H"){
        return [[-1, 0], [1, 0]];
    }else{
        return [[0, -1], [0, 1]];
    }
}

function getAngleFromDirection(direction){
    var angle = 0;
    switch(direction.toString()){
        case "0,1": angle = 90; break;
        case "0,-1": angle = -90; break;
        case "1,0": angle = 0; break;
        case "-1,0": angle = 180; break;
        default: throw new Error("Invalid direction");
    }
    return angle;
}

function drawPolyLine(lineID, points){
    var style = "fill:none;stroke:black;stroke-width:2;";
    return generateXML("polyline", {id: lineID, points: points, style: style, onclick: `drawLine('${lineID}', true)`}, null);
}

function drawComponent(id, newCompInfo, direction, value, pos, pinCount){
    var adjustedPos = pos.offset(-imgSize / 2, -imgSize);
    var leftPos = pos.offset(-24, -imgSize / 2);
    var rightPos = pos.offset(24, -imgSize / 2);
    var topPos = pos.offset(0, -imgSize);
    var cPos = pos.offset(0, -imgSize / 2);
    var bottomPos = pos;
    var pos1, pos2, pos3;
    var angle;

    if(direction === "H"){
        pos1 = leftPos;
        pos2 = rightPos;
        pos3 = bottomPos;
        angle = 0;
    }else{
        pos1 = topPos;
        pos2 = bottomPos;
        pos3 = rightPos.offset(8, 5);
        angle = 90;
    }

    var compStr = "";
    compStr += generateXML("image", {
        id: "img" + id,
        "xlink:href": "images/" + newCompInfo.init + ".png",
        x: adjustedPos.x,
        y: adjustedPos.y,
        height: imgSize,
        width: imgSize,
        onmousedown: `startMove('${id}')`,
        onmouseup: "stopMove()",
        transform: "rotate(" + angle + " " + cPos.coords() + ")"
    }, null);
    compStr += generateXML("text", {
        x: pos3.x,
        y: pos3.y,
        id: "txt" + id,
        "text-anchor": "middle",
        style: "user-select:none;",
        onclick: "updateValue('" + id + "')"
    }, value ? (value + " " + newCompInfo.unit) : "");

    compStr += generateXML("circle", {id: "pin-" + pinCount, cx: pos1.x, cy: pos1.y, r: dotSize, fill: "black", onclick: "drawLine('" + pinCount + "', false)"}, null);
    compStr += generateXML("circle", {id: "pin-" + (pinCount + 1), cx: pos2.x, cy: pos2.y, r: dotSize, fill: "black", onclick: "drawLine('" + (pinCount + 1) + "', false)"}, null);
    return compStr;
}

function generateXML(tag, properties, value){
    var xml = `<${tag}`;
    for(var prop in properties){
        xml += " " + prop + "=\"" + properties[prop] + "\"";
    }
    if(value){
        xml += ">" + value + `</${tag}>`;
    }else{
        xml += "/>";
    }
    return xml;
}

function drawNode(id, pos){
    return generateXML("circle", {id: `pin-${id}`, cx: pos.x, cy: pos.y, r: 4, fill: "black", onmousedown: `handleNode('${id}')`, onmouseup: "stopMove()"}, null);
}

// Plan a line which can connect two components
function findPolyStr(pins, pinId0, pinId1){
    var polyStr = "";
    var pin0 = pins[pinId0];
    var pin1 = pins[pinId1];
    var origin = pin0.pos;
    var dest = pin1.pos;
    var dir0 = pin0.direction;
    var dir1 = pin1.direction;
    var dx = dest.x - origin.x;
    var dy = dest.y - origin.y;
    var mid = origin.offset(dx * 0.5, dy * 0.5);
    var min = new Position(Math.min(origin.x, dest.x), Math.min(origin.y, dest.y));
    var max = new Position(Math.max(origin.x, dest.x), Math.max(origin.y, dest.y));
    var polyLinePoints = [];
    var midPoints = [];
    var halfImgSize = imgSize / 2;
    if(!dir0){ dir0 = [dx * Math.abs(dir1[1]), dy * Math.abs(dir1[0])]; }
    if(!dir1){ dir1 = [-dx * Math.abs(dir0[1]), -dy * Math.abs(dir0[0])]; }
    var kx = dx * dir0[0] > 0 && dx * dir1[0] < 0;
    var sx = dir1[0] * dir0[0] > 0;
    if(dir0 && dir1){
        if(dir0[1] === 0 && dir1[1] === 0){
            if(sx){
                if(Math.abs(dy) > halfImgSize){
                    if(dir1[0] < 0){
                        midPoints.push([min.x - halfImgSize, origin.y]);
                        midPoints.push([min.x - halfImgSize, dest.y]);
                    }else{
                        midPoints.push([max.x + halfImgSize, origin.y]);
                        midPoints.push([max.x + halfImgSize, dest.y]);
                    }
                }else if(Math.abs(dy) < imgSize){
                    midPoints.push([origin.x + dir0[0] * halfImgSize, origin.y]);
                    if(dy * dx * dir1[0] >= 0){
                        midPoints.push([origin.x + dir0[0] * halfImgSize, max.y - halfImgSize]);
                        midPoints.push([dest.x + dir1[0] * halfImgSize, max.y - halfImgSize]);
                    }else{
                        midPoints.push([origin.x + dir0[0] * halfImgSize, min.y + halfImgSize]);
                        midPoints.push([dest.x + dir1[0] * halfImgSize, min.y + halfImgSize]);
                    }
                    midPoints.push([dest.x + dir1[0] * halfImgSize, dest.y]);
                }else{
                    midPoints.push([mid.x, origin.y]);
                    midPoints.push([mid.x, dest.y]);
                }
            }else{
                if(dx * dir0[0] >= 0 && (Math.abs(dx) > imgSize || Math.abs(dy) < imgSize)){
                    midPoints.push([mid.x, origin.y]);
                    midPoints.push([mid.x, dest.y]);
                }else{
                    midPoints.push([origin.x + dir0[0] * halfImgSize, origin.y]);
                    if(Math.abs(dy) >= imgSize){
                        midPoints.push([origin.x + dir0[0] * halfImgSize, mid.y]);
                        midPoints.push([dest.x + dir1[0] * halfImgSize, mid.y]);
                    }else{
                        midPoints.push([origin.x + dir0[0] * halfImgSize, min.y - halfImgSize]);
                        midPoints.push([dest.x + dir1[0] * halfImgSize, min.y - halfImgSize]);
                    }
                    midPoints.push([dest.x + dir1[0] * halfImgSize, dest.y]);
                }
            }
        }else if(dir0[0] === 0 && dir1[0] === 0){
            if(dy * dir0[1] > 0 && dy * dir1[1] < 0 && Math.abs(dy) > imgSize){
                midPoints.push([origin.x, mid.y]);
                midPoints.push([dest.x, mid.y]);
            }else if(dir1[1] * dir0[1] > 0 && Math.abs(dx) > halfImgSize){
                if(dir1[1] < 0){
                    midPoints.push([origin.x, min.y - imgSize]);
                    midPoints.push([dest.x, min.y - imgSize]);
                }else{
                    midPoints.push([origin.x, max.y + imgSize]);
                    midPoints.push([dest.x, max.y + imgSize]);
                }
            }else if(Math.abs(dx) > imgSize){
                midPoints.push([origin.x, origin.y + dir0[1] * halfImgSize]);
                midPoints.push([mid.x, origin.y + dir0[1] * halfImgSize]);
                midPoints.push([mid.x, dest.y + dir1[1] * halfImgSize]);
                midPoints.push([dest.x, dest.y + dir1[1] * halfImgSize]);
            }else if(dy * dir0[1] < 0 || dy * dir1[1] > 0){
                midPoints.push([origin.x, origin.y + dir0[1] * halfImgSize]);
                if(dir1[1] * dir0[1] > 0){
                    if(dx * dy * dir1[1] >= 0){
                        midPoints.push([max.x - halfImgSize, origin.y + dir0[1] * halfImgSize]);
                        midPoints.push([max.x - halfImgSize, dest.y + dir1[1] * halfImgSize]);
                    }else{
                        midPoints.push([min.x + halfImgSize, origin.y + dir0[1] * halfImgSize]);
                        midPoints.push([min.x + halfImgSize, dest.y + dir0[1] * halfImgSize]);
                    }
                }else{
                    midPoints.push([min.x - halfImgSize, origin.y + dir0[1] * halfImgSize]);
                    midPoints.push([min.x - halfImgSize, dest.y + dir1[1] * halfImgSize]);
                }
                midPoints.push([dest.x, dest.y + dir1[1] * halfImgSize]);
            }else{
                midPoints.push([origin.x, mid.y]);
                midPoints.push([dest.x, mid.y]);
            }
        }else if(dir0[0] === 0 && dir1[1] === 0){
            if(dy * dir0[1] > 0 && dx * dir1[0] < 0){
                midPoints.push([origin.x, dest.y]);
            }else{
                midPoints.push([dest.x, origin.y]);
            }
        }else{
            if(dx * dir0[0] > 0 && dy * dir1[1] < 0){
                midPoints.push([dest.x, origin.y]);
            }else{
                midPoints.push([origin.x, dest.y]);
            }
        }
    }

    polyLinePoints.push(origin.coords());
    polyLinePoints = polyLinePoints.concat(midPoints);
    polyLinePoints.push(dest.coords());
    for(var i = 0; i < polyLinePoints.length; i++){
        polyStr += polyLinePoints[i][0] + ", " + polyLinePoints[i][1] + " ";
    }
    return polyStr;
}

function changeComponentPosition(comp, id, pos, pplPos){
    var halfImgSize = imgSize / 2;
    var adjustedPos = pos.offset(-halfImgSize, -imgSize);
    var cPos = pos.offset(0, -halfImgSize);

    movePin(comp.pins[0], pplPos[0]);
    movePin(comp.pins[1], pplPos[1]);

    var text = document.getElementById("txt" + id);
    text.setAttribute("x", pplPos[2].x);
    text.setAttribute("y", pplPos[2].y);

    var img = document.getElementById("img" + id);
    img.setAttribute("x", adjustedPos.x);
    img.setAttribute("y", adjustedPos.y);

    var angle = getAngleFromDirection(comp.direction);
    img.setAttribute("transform", 'rotate(' + angle + ' ' + cPos.coords() + ')');
}

function getElement(id, type){
    var prefixes = {
        Line: "",
        Component: "img",
        Node: "pin-"
    };
    return document.getElementById(prefixes[type] + id);
}

// Deselect component or line
function deselect(id, type){
    var element = getElement(id, type);
    switch(type){
        case "Line":
            element.style.stroke = "black";
            break;
        case "Component":
            element.removeAttribute("opacity");
            break;
        case "Node":
            element.setAttribute("fill", "black");
            break;
    }
}

// Select component or line
function select(id, type){
    var element = getElement(id, type);
    switch(type){
        case "Line":
            element.style.stroke = "blue";
            break;
        case "Component":
            element.setAttribute("opacity", "0.7");
            break;
        case "Node":
            element.setAttribute("fill", "blue");
            break;
    }
}

function movePin(pinID, pos){
    var dot0 = getElement(pinID, "Node");
    dot0.setAttribute("cx", pos.x);
    dot0.setAttribute("cy", pos.y);
}
