import AnalysisUtils from "./utils.js";

export default class CircuitAnalysis {
    constructor (circuit, graph) {
        this.hertz = circuit.hertz;
        this.graph = graph;
    }

    /**
     * Get component directions for all groups
     * @param {Object<string, number>[]} groups - Groups
     * @param {string} edgeId - Component id
     * @returns {number[]} - Directions
     */
    static getComponentDirections(groups, edgeId) {
        return groups.map((group) => AnalysisUtils.getDirection(group, edgeId));
    }

    /**
     * Get group directions for all components
     * @param {Object<string, number>} group - Groups
     * @param {string[]} edges - Component ids
     * @returns {number[]} - Directions
     */
    static getGroupDirections(group, edges) {
        return edges.map((edgeId) => AnalysisUtils.getDirection(group, edgeId));
    }

    getGroupImpedances(group, edges, func) {
        const coeffs = [];
        for (const edgeId of edges) {
            const component = this.graph.edges[edgeId];
            const direction = AnalysisUtils.getDirection(group, edgeId);
            const impedance = AnalysisUtils.getImpedance(this.hertz, component.info.type, component.info.value);
            coeffs.push(func(direction, impedance));
        }
        return coeffs;
    }

    getGroupMultipliers(group, edges) {
        const meterCoeffs = {};
        for (const edgeId of edges) {
            const edge = this.graph.edges[edgeId];
            const direction = AnalysisUtils.getDirection(group, edgeId);
            meterCoeffs[edge.info.meter] = edge.info.value * direction;
        }
        return meterCoeffs;
    }

    getGroupTotal(group, edges) {
        let total = 0;
        for (const edgeId of edges) {
            const edgeValue = this.graph.edges[edgeId].info.value;
            const direction = AnalysisUtils.getDirection(group, edgeId);
            total += direction * edgeValue;
        }
        return total;
    }
}
