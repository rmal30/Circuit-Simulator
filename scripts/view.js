class View {
    constructor(_doc, _window) {
        this.doc = _doc;
        this.window = _window;
        this.schematic = new Schematic(_doc);
        this.svg = this.doc.getElementById("svg");
        this.simulate = this.doc.getElementById("simulate");
        this.chooseMode = this.doc.getElementById("mode");
        this.freq = this.doc.getElementById("freq");
        this.freq2 = this.doc.getElementById("freq2");
        this.header = this.doc.getElementById("header");
        this.info = this.doc.getElementById("info");
        this.compList = this.doc.getElementById("newComp");
        this.newCompDirection = this.doc.getElementById("newCompDir");
    }

    bindFreqChange(onFreqChange) {
        this.freq.addEventListener("click", () => {
            onFreqChange(this.freq.value);
        });
    }

    bindSimulate(onSimulate) {
        this.simulate.addEventListener("click", () => {
            onSimulate();
        });
    }

    bindChooseMode(onChooseMode) {
        this.chooseMode.addEventListener("click", () => {
            onChooseMode(this.chooseMode.value);
        });
    }

    bindCanvasMouseMove(onCanvasMouseMove) {
        const headerHeight = this.header.clientHeight;

        // Drag component or node
        this.svg.addEventListener("mousemove", (event) => {
            const pos = new Position(event.clientX, event.clientY).offset(0, -headerHeight);
            const alignedPos = pos.offset(-pos.x % GRID_SIZE, -pos.y % GRID_SIZE);
            onCanvasMouseMove(alignedPos);
        });
    }

    bindKeyPress(onKeyPress) {
        // Detect keys to rotate and delete components
        this.doc.addEventListener("keydown", (event) => {
            onKeyPress(event.key);
        });
    }

    bindCanvasMouseUp(onCanvasMouseUp) {
        this.svg.addEventListener("mouseup", () => {
            onCanvasMouseUp();
        });
    }

    bindCanvasClick(onCanvasClick) {
        const headerHeight = this.header.clientHeight;
        this.svg.addEventListener("click", (event) => {
            const pos = new Position(event.clientX, event.clientY).offset(0, -headerHeight);
            const alignedPos = pos.offset(-pos.x % GRID_SIZE, -pos.y % GRID_SIZE);
            onCanvasClick(alignedPos);
        });
    }

    bindLabelClick(id, onLabelClick) {
        const elementId = getElementId(id, ELEMENT_TYPES.LABEL);
        const label = this.doc.getElementById(elementId);
        label.addEventListener("click", () => {
            onLabelClick(id);
        });
    }

    bindComponentClick(id, onComponentClick) {
        const elementId = getElementId(id, ELEMENT_TYPES.IMAGE);
        const image = this.doc.getElementById(elementId);
        image.addEventListener("click", () => {
            onComponentClick(id);
        });
    }

    bindComponentMouseDown(id, onComponentMouseDown) {
        const elementId = getElementId(id, ELEMENT_TYPES.IMAGE);
        const image = this.doc.getElementById(elementId);
        image.addEventListener("mousedown", (event) => {
            event.preventDefault();
            onComponentMouseDown(id);
        });
    }

    bindPinClick(id, onPinClick) {
        const elementId = getElementId(id, ELEMENT_TYPES.PIN);
        const pin = this.doc.getElementById(elementId);
        pin.addEventListener("click", () => {
            onPinClick(id);
        });
    }

    bindNodeMouseDown(id, onNodeMouseDown) {
        const elementId = getElementId(id, ELEMENT_TYPES.PIN);
        const node = this.doc.getElementById(elementId);
        node.addEventListener("mousedown", (event) => {
            event.preventDefault();
            onNodeMouseDown(id);
        });
    }

    bindLineClick(id, onLineClick) {
        const headerHeight = this.header.clientHeight;
        const elementId = getElementId(id, ELEMENT_TYPES.LINE);
        const line = this.doc.getElementById(elementId);
        line.addEventListener("click", (event) => {
            const pos = new Position(event.clientX, event.clientY).offset(0, -headerHeight);
            const alignedPos = pos.offset(-pos.x % GRID_SIZE, -pos.y % GRID_SIZE);
            onLineClick(id, alignedPos);
        });
    }

    setFrequencyEnabled(enabled) {
        const disabledClassName = "is-disabled";

        if (enabled) {
            this.freq2.classList.remove(disabledClassName);
        } else {
            this.freq2.classList.add(disabledClassName);
        }

        this.freq.disabled = !enabled;
    }

    setInformation(info) {
        this.info.textContent = info;
    }

    setComponentOptions(componentOptions) {
        this.compList.options.length = 1;
        for (const component of Object.keys(COMPONENTS_LIST.both)) {
            this.compList.options[this.compList.options.length] = new Option(COMPONENTS_LIST.both[component], component);
        }
        for (const component of Object.keys(componentOptions)) {
            this.compList.options[this.compList.options.length] = new Option(componentOptions[component], component);
        }
    }

    showSolution(currentSets, voltageSets, impComponents, valid, validIndex) {
        let solutionOutput = null;
        if (valid) {
            solutionOutput = [
                [
                    "Nodal analysis:",
                    ...impComponents.
                        map((component, index) => {
                            const fullId = `${component.type}_${component.id}`;
                            return `${fullId}: ${Complex.print(voltageSets[validIndex][index][0])}V`;
                        })
                ],
                [
                    "Mesh analysis:",
                    ...impComponents.
                        map((component, index) => {
                            const fullId = `${component.type}_${component.id}`;
                            return `${fullId}: ${Complex.print(currentSets[validIndex][index][0])}A`;
                        })
                ],
                [
                    "Component list:",
                    ...impComponents.map((component) => {
                        return `${component.type}_${component.id}: ${JSON.stringify(component, (_, value) => {
                            return value instanceof Array ? JSON.stringify(value) : value;
                        }, 4)}`;
                    })
                ]
            ].map((section) => section.join("\r\n")).join("\r\n\r\n");

        } else {
            solutionOutput = "No solution found";
        }
        this.setInformation(solutionOutput);
    }

    isNearImage(componentId, position, range) {
        const elementId = getElementId(componentId, ELEMENT_TYPES.IMAGE);
        const image = this.doc.getElementById(elementId);
        const dx = Math.abs(position.x - image.x.baseVal.value - IMAGE_SIZE / 2);
        const dy = Math.abs(position.y - image.y.baseVal.value - IMAGE_SIZE / 2);
        return dx < range * IMAGE_SIZE && dy < range * IMAGE_SIZE;
    }

    isNearPin(pinId, position, range) {
        const elementId = getElementId(pinId, ELEMENT_TYPES.PIN);
        const pin = this.doc.getElementById(elementId);
        const dx = Math.abs(position.x - pin.cx.baseVal.value);
        const dy = Math.abs(position.y - pin.cy.baseVal.value);
        return dx < range * DOT_SIZE && dy < range * DOT_SIZE;
    }

    isNearPolyLine(lineId, position, range) {
        const elementId = getElementId(lineId, ELEMENT_TYPES.LINE);
        const line = this.doc.getElementById(elementId);
        return getLines(CircuitXML.getPolyStr(line)).some((linePoints) => isNearLine(linePoints, position, range));
    }

    isNearSchematic(circuit, position) {
        const {pins, lines, components} = circuit;
        const isNearPins = Object.keys(pins).some((pinId) => this.isNearPin(pinId, position, PIN_RANGE));
        const isNearComponents = Object.keys(components).some((id) => this.isNearImage(id, position, COMPONENT_RANGE));
        const isNearLines = Object.keys(lines).some((id) => this.isNearPolyLine(id, position, LINE_RANGE));
        return [isNearLines, isNearComponents, isNearPins].some((near) => near);
    }

    setElementSelected(selected, id, type) {
        const elementId = getElementId(id, type);
        const element = this.doc.getElementById(elementId);

        if (element) {
            const style = selected ? STYLES.select[type] : STYLES.deselect[type];
            Object.assign(element.style, style);
        }
    }

    // Select or deselect component, node or line
    setSelectedItem(item) {
        if (item) {
            this.setElementSelected(true, item.id, item.type);
        }
    }

    clearSelectedItem(item) {
        if (item) {
            this.setElementSelected(false, item.id, item.type);
        }
    }

    // Prompt value from user
    promptComponentValue(info) {
        const promptStr = `Please enter a ${info.prop} for a ${info.name} in ${info.unit}`;
        let value = null;
        let invalid = true;
        do {
            value = this.window.prompt(promptStr);
            invalid = value === "";
            if (invalid) {
                this.window.alert("Please enter a valid value");
            }
        } while (invalid);
        return value;
    }

    getNewComponentDirection() {
        return this.newCompDirection.value;
    }

    getNewComponentType() {
        return this.compList.value;
    }
}
