var cubePositions = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 1.25, z: 0 },
  { x: 1.25, y: 0, z: 0 },
  { x: 1.25, y: 1.25, z: 0 },
  { x: 0, y: 0, z: 1.25 },
  { x: 0, y: 1.25, z: 1.25 },
  { x: 1.25, y: 0, z: 1.25 },
  { x: 1.25, y: 1.25, z: 1.25 },
];

// Setup scene, camera, and renderer
var scene = new THREE.Scene();

// Set default camera position and rotation
const size = 5;
const width = window.innerWidth / 2;
const height = window.innerHeight - 75; // -75px for top bar
const aspectRatio = width / height;
var camera = new THREE.OrthographicCamera(
  (-size * aspectRatio) / 2,
  (size * aspectRatio) / 2,
  size / 2,
  -size / 2,
  0.1,
  100
);
camera.position.set(7, 7, 10);
camera.lookAt(0, 0, 0);

var renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable transparency
renderer.setSize(width, height);
renderer.setClearColor(0x000000, 0); // Set background to transparent
document.getElementById("container").appendChild(renderer.domElement);

// Add raycaster and mouse vector
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var INTERSECTED; // Currently hovered cube
var targetRotation = Math.PI / 8; // Target 45-degree rotation in radians
var rotationSpeed = 0.04; // Speed of rotation

// Create array to store cubes and their rotation states
var cubes = [];
var rotationStates = []; // Track rotation state of each cube

// Create and render cubes
for (var i = 0; i < 8; i++) {
  var cubeSize = 1;
  var borderThickness = 0.1; // Set the border thickness

  // Create the original colored cube
  var geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  var material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
  var cube = new THREE.Mesh(geometry, material);

  // Create a slightly larger transparent cube for the border
  var borderGeometry = new THREE.BoxGeometry(
    cubeSize + borderThickness, // X dimension with extra thickness
    cubeSize + borderThickness, // Y dimension with extra thickness
    cubeSize + borderThickness // Z dimension with extra thickness
  );
  var borderMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, // Black color for the border
    side: THREE.BackSide, // Render only the inside to simulate a border
  });
  var border = new THREE.Mesh(borderGeometry, borderMaterial);

  // Add the border around the cube
  cube.add(border);

  // Position each cube at corresponding spot
  cube.position.set(cubePositions[i].x, cubePositions[i].y, cubePositions[i].z);

  scene.add(cube);
  cubes.push(cube); // Add cube to the cubes array

  // Initialize rotation state for each cube
  rotationStates.push({ rotatingTo45: false, rotatingBackTo0: false });
}

// Handle mouse movement and update the color of hovered cubes
window.addEventListener("mousemove", onMouseMove, false);

// Handle mouse leave to reset the last hovered cube's color
renderer.domElement.addEventListener("mouseleave", onMouseLeave, false);

function onMouseMove(event) {
  // Convert mouse coordinates to normalized device coordinates (-1 to +1)
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

// Handle mouse leave (when cursor exits the canvas)
function onMouseLeave() {
  if (INTERSECTED) {
    INTERSECTED.material.color.set(0x1a1a1a); // Reset color to orange
    INTERSECTED = null; // Ensure no cube is marked as hovered
  }
}

// Animate and render the scene
var animate = function () {
  requestAnimationFrame(animate);

  // Update the raycaster to check for intersections
  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(cubes);

  // Reset rotation states for all cubes
  cubes.forEach((cube, index) => {
    rotationStates[index].rotatingTo45 = false;
  });

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        INTERSECTED.material.color.set(0x1a1a1a); // Reset previous cube color
      }
      INTERSECTED = intersects[0].object;
      INTERSECTED.material.color.set(0xff6600); // Change color of hovered cube
    }

    // Set the rotation state of the currently hovered cube to rotate to 45 degrees
    var intersectedIndex = cubes.indexOf(INTERSECTED);
    rotationStates[intersectedIndex].rotatingTo45 = true;
    rotationStates[intersectedIndex].rotatingBackTo0 = false;
  } else {
    if (INTERSECTED) {
      INTERSECTED.material.color.set(0x1a1a1a); // Reset last hovered cube to orange
    }
    INTERSECTED = null; // Reset hover state
  }

  // Apply rotation to each cube based on its state
  cubes.forEach((cube, index) => {
    if (rotationStates[index].rotatingTo45) {
      if (cube.rotation.y < targetRotation) {
        cube.rotation.y = Math.min(
          cube.rotation.y + rotationSpeed,
          targetRotation
        );
      }
    } else {
      // Rotate back to 0 when not hovered
      if (cube.rotation.y > 0) {
        cube.rotation.y = Math.max(cube.rotation.y - rotationSpeed, 0);
      }
    }
  });

  renderer.render(scene, camera);
};

animate();

// Handle window resizing
window.addEventListener("resize", function () {
  const width = window.innerWidth / 2;
  const height = window.innerHeight - 75; // -75px for top bar
  const aspectRatio = width / height;

  // Update the camera's frustum based on the new aspect ratio
  camera.left = (-size * aspectRatio) / 2;
  camera.right = (size * aspectRatio) / 2;
  camera.top = size / 2;
  camera.bottom = -size / 2;

  // Update the camera's projection matrix
  camera.updateProjectionMatrix();

  // Resize the renderer
  renderer.setSize(width, height);
});

const body = document.body;
let wheelY = 0;
let scrollTop = 0;
window.addEventListener("scroll", () => {
  scrollTop = window.scrollY || document.documentElement.scrollTop;
});

window.addEventListener("wheel", (event) => {
  wheelY += event.deltaY;

  body.style.overflow = wheelY < 2000 && scrollTop === 0 ? "hidden" : "auto";

  wheelY = Math.max(0, Math.min(wheelY, 2000));

  console.log(wheelY);

  cubes.forEach((cube, index) => {
    if (index === 1 || index === 3 || index === 5 || index === 7) {
      cube.position.y = 1.25 + wheelY / 1000;
      renderer.render(scene, camera);
    }
  });
});

