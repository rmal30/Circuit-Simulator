const IMAGE_SIZE = 48;
const DOT_SIZE = 4;
const GRID_SIZE = 6;

const PIN_POSITION_TEMPLATE = {
    1: [0, 0],
    2: [[0.5, 0], [-0.5, 0]],
    4: [[0.5, 0.25], [0.5, -0.25], [-0.5, 0.25], [-0.5, -0.25]]
};

const DIRECTION_TEMPLATE = {
    2: [[1, 0], [-1, 0]],
    4: [[1, 0], [1, 0], [-1, 0], [-1, 0]]
};

const LABEL_POSITIONS = {
    V: [IMAGE_SIZE / 2 + 12, 5],
    H: [0, IMAGE_SIZE / 2 + 8]
};
