// methods from the matter-js library
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// global vars, functions & methods
const cellsHorizontal = 4;
const cellsVertical = 3;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = width / cellsVertical;

//  +++ setting up matter -js +++
// using the Engine method to create an engine var.
const engine = Engine.create();
engine.world.gravity.y = 0;
// engine.world.gravity.x = 0;

// with the engine var we created we have acces to a world method
const { world } = engine;

// using the Render method to create a render var
// the render var holds several preperties that will help us structure the elements inside of our world.
const render = Render.create({
  // location in the html document we are going to render
  element: document.body,
  // the engigne we are going to use
  engine: engine,
  // opstions object that holds the width and height of our element
  options: {
    wireframes: true,
    width,
    height,
  },
});

// use Render method to display our world and pass the render var we created
Render.run(render);

// use Runner, this will coordinate the changes that occur inside of the world
Runner.run(Runner.create(), engine);
// +++ finishing setting up matter js +++

// walls (margin) (creating elements that will frame for our world)
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];

// adding the margin elements to the world for rendering
World.add(world, walls);

// maze generation

// function to randomly generate neighbors options. we will use this function in the maze generation function
const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }
  return arr;
};

// variables we need in our maze generation function
//grid
const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

// verticals
const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

// horizontals
const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

// variables that will help to randomize starting point.
// start row
const startRow = Math.floor(Math.random() * cellsVertical);
// start column
const startColumn = Math.floor(Math.random() * cellsHorizontal);

// Maze generation function

const stepThroughCell = (row, column) => {
  // if I have visited the cell at [row, column], then return
  if (grid[row][column]) {
    return;
  }
  // mark this cell as being visited
  grid[row][column] = true;

  // assemble randomly-ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "rihgt"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);

  // for loop
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;

    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue;
    }
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "rihgt") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }
    // recursion
    stepThroughCell(nextRow, nextColumn);
  }
};

// calling the maze generation function that will provide the parameters for rendering the maze to the world
stepThroughCell(startRow, startColumn);

//with the data we obtanied from the maze generation function we ...
// adding horizontal walls to the world
horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        label: "wall",
        isStatic: true,
      }
    );
    World.add(world, wall);
  });
});

// adding vertical walls to the world
verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        label: "wall",
        isStatic: true,
      }
    );
    World.add(world, wall);
  });
});

// adding the goal

// goal var
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    label: "goal",
    isStatic: true,
  }
);

// adding goal to the wold
World.add(world, goal);

// creating & addint the ball the user will be manipulating to the world

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
});

World.add(world, ball);

// getting to manipulate the the ball with keyboar

// adding event listener

document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;

  if (event.keyCode === 38) {
    Body.setVelocity(ball, { x, y: y - 5 });
  }

  if (event.keyCode === 39) {
    Body.setVelocity(ball, { x: x + 5, y });
  }

  if (event.keyCode === 40) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }

  if (event.keyCode === 37) {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

// win condition

Events.on(engine, "collisionStart", (e) => {
  e.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
