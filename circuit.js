function getComponents(components, types){
    var found = [];
    for(var i = 0; i < components.length; i++){
        if(types.indexOf(components[i].type) !== -1){
            found.push(components[i]);
        }
    }
    return found;
}

function getCurrents(){
    var graph = generateGraph(pins, lines, components);
    var loops = getCycleBasis(graph);
    for(var edgeID in graph.edges){
        if(edgeID.includes("idc") || edgeID.includes("iac")){
            graph.removeEdge(edgeID, graph.edges[edgeID]);
        }
    }
    var loops2 = getCycleBasis(graph);
    var impComponents = getComponents(components, ["res", "cap", "ind"]);
    var init = voltageVector(loops2, components);
    var curMatrix = groupMatrix(loops, impComponents, "loop");
    var voltMatrix = lawMatrix(loops2, impComponents, "loop");
    var kvlMatrix = multiplyM(voltMatrix, curMatrix);
    var currentComponents = getComponents(components, ["idc", "iac"]);
    var curMatrix2 = groupMatrix(loops, currentComponents, "loop");
    kvlMatrix = kvlMatrix.concat(curMatrix2);

    var loopCurrents = QRSolve(kvlMatrix, init);
    var componentCurrents = multiplyM(curMatrix, transpose([loopCurrents]));
    var infoStr = "";
    for(var i = 0; i < impComponents.length; i++){
        infoStr += impComponents[i].type + "_" + impComponents[i].id + ": " + printComplex(componentCurrents[i][0]) + "A <br/>";
    }
    return infoStr;
}

function printComplex(z){
    if(z[1] !== 0){
        return roundNum(z[0], 8) + " + " + roundNum(z[1], 8) + "j";
    }else{
        return roundNum(z[0], 8);
    }
}

function getVoltages(){
    var graph = generateGraph(pins, lines, components);
    var nodes = getNodeGroups(graph);
    var edge;
    var count = 0;
    for(var edgeID in graph.edges){
        if(edgeID.includes("vdc") || edgeID.includes("vac")){
            edge = graph.edges[edgeID];
            graph.removeEdge(edgeID, edge);
            graph.addEdge("lin-x" + (components.length + count), edge);
            count++;
        }
    }
    var nodes2 = getNodeGroups(graph);
    nodes2.pop();
    var impComponents = getComponents(components, ["res", "cap", "ind"]);
    var init = currentVector(nodes2, components);
    var voltMatrix = groupMatrix(nodes, impComponents, "node");
    var curMatrix = lawMatrix(nodes2, impComponents, "node");
    var kclMatrix = multiplyM(curMatrix, voltMatrix);
    var voltageComponents = getComponents(components, ["vdc", "vac"]);
    var voltMatrix2 = groupMatrix(nodes, voltageComponents, "node");
    for(var i = 0; i < voltMatrix2.length; i++){
        kclMatrix.push(voltMatrix2[i]);
    }
    var groundNodes = [1];
    for(var i = 1; i < nodes.length; i++){
        groundNodes.push(0);
    }
    kclMatrix.push(groundNodes);
    var nodeVoltages = QRSolve(kclMatrix, init);
    var componentVoltages = multiplyM(voltMatrix, transpose([nodeVoltages]));
    var infoStr = "";
    for(var i = 0; i < impComponents.length; i++){
        infoStr += impComponents[i].type + "_" + impComponents[i].id + ": " + printComplex(componentVoltages[i][0]) + "V<br/>";
    }
    return infoStr;
}

function voltageVector(loops2, components){
    var voltageSum;
    var init = [];
    var voltageComponents = getComponents(components, ["vdc", "vac"]);
    var currentComponents = getComponents(components, ["idc", "iac"]);
    for(var i = 0; i < loops2.length; i++){
        voltageSum = 0;
        for(var j = 0; j < voltageComponents.length; j++){
            voltageSum -= direction(voltageComponents[j], loops2[i], "loop") * voltageComponents[j].value;
        }
        init.push(voltageSum);
    }
    for(var i = 0; i < currentComponents.length; i++){
        init.push(-currentComponents[i].value);
    }
    return init;
}

function currentVector(nodes2, components){
    var currentSum;
    var init = [];
    var voltageComponents = getComponents(components, ["vdc", "vac"]);
    var currentComponents = getComponents(components, ["idc", "iac"]);
    for(var i = 0; i < nodes2.length; i++){
        currentSum = 0;
        for(var j = 0; j < currentComponents.length; j++){
            currentSum -= direction(currentComponents[j], nodes2[i], "node") * currentComponents[j].value;
        }
        init.push(currentSum);
    }
    for(var i = 0; i < voltageComponents.length; i++){
        init.push(-voltageComponents[i].value);
    }
    init.push(0);
    return init;
}

function lawMatrix(groups2, impComponents, type){
    var matrix = [];
    var compDirection;
    for(var i = 0; i < groups2.length; i++){
        matrix[i] = [];
        for(var k = 0; k < impComponents.length; k++){
            compDirection = direction(impComponents[k], groups2[i], type);
            if(type === "loop"){
                matrix[i][k] = multiplyC(compDirection, impedance(impComponents[k]));
            }else if(type === "node"){
                matrix[i][k] = divideC(compDirection, impedance(impComponents[k]));
            }
        }
    }
    return matrix;
}

function impedance(component){
    var value = component.value;
    var freq = hertz * Math.PI * 2;
    if(component.type === "res"){
        return [parseFloat(value), 0];
    }else if(component.type === "cap"){
        return [0, -Math.pow(10, 6) / (value * freq)];
    }else if(component.type === "ind"){
        return [0, Math.pow(10, -3) * value * freq];
    }else{
        return [0, 0];
    }
}

function groupMatrix(groups, impComponents, type){
    var compMatrix = [];
    for(var j = 0; j < impComponents.length; j++){
        compMatrix[j] = [];
        for(var k = 0; k < groups.length; k++){
            compMatrix[j].push(direction(impComponents[j], groups[k], type));
        }
    }
    return compMatrix;
}

function direction(component, group, type){
    if(type === "loop"){
        return loopDirection(component, group);
    }else{
        return nodeDirection(component, group);
    }
}

function loopDirection(component, loop){
    var pin1 = loop.indexOf(component.pins[0]);
    var pin2 = loop.indexOf(component.pins[1]);
    if(pin2 === -1 || pin1 === -1){
        return 0;
    }else if(pin2 - pin1 === 1 || (pin1 === loop.length - 1 && pin2 === 0)){
        return 1;
    }else if(pin1 - pin2 === 1 || (pin1 === 0 && pin2 === loop.length - 1)){
        return -1;
    }else{
        return 0;
    }
}

function nodeDirection(component, node){
    var pin1 = node.indexOf(component.pins[0]);
    var pin2 = node.indexOf(component.pins[1]);

    if(pin1 !== -1 && pin2 === -1){
        return -1;
    }else if(pin2 !== -1 && pin1 === -1){
        return 1;
    }else{
        return 0;
    }
}
