import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- DOM Elements ---
const profileCanvas = document.getElementById('profileCanvas');
const sceneCanvas = document.getElementById('sceneCanvas');
const profileCtx = profileCanvas.getContext('2d');

// --- 2D Profile State ---
let points = [
    new THREE.Vector2(0, 3),
    new THREE.Vector2(1, 3),
    new THREE.Vector2(1, -3),
    new THREE.Vector2(0, -3),
];
let selectedPoint = null;
let isDragging = false;

// --- 3D Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
const camera = new THREE.PerspectiveCamera(75, sceneCanvas.width / sceneCanvas.height, 0.1, 1000);
camera.position.set(5, 2, 5);

const renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true });
renderer.setSize(sceneCanvas.width, sceneCanvas.height);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Core 3D Object ---
let pendantMesh;

function update3DModel() {
    if (pendantMesh) {
        scene.remove(pendantMesh);
        pendantMesh.geometry.dispose();
        pendantMesh.material.dispose();
    }

    // Prevent creating a shape with no volume
    const profilePoints = points.map(p => new THREE.Vector2(Math.max(0.01, p.x), p.y * 2));

    if (profilePoints.length < 2) return;

    const geometry = new THREE.LatheGeometry(profilePoints, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, side: THREE.DoubleSide, metalness: 0.8, roughness: 0.4 });
    pendantMesh = new THREE.Mesh(geometry, material);
    scene.add(pendantMesh);
}


// --- 2D Canvas Drawing ---
function drawProfile() {
    profileCtx.clearRect(0, 0, profileCanvas.width, profileCanvas.height);
    
    // Draw the center line
    profileCtx.beginPath();
    profileCtx.moveTo(profileCanvas.width / 2, 0);
    profileCtx.lineTo(profileCanvas.width / 2, profileCanvas.height);
    profileCtx.strokeStyle = '#e0e0e0';
    profileCtx.stroke();

    if (points.length < 2) return;

    profileCtx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const canvasPoint = toCanvasCoords(points[i]);
        if (i === 0) {
            profileCtx.moveTo(canvasPoint.x, canvasPoint.y);
        } else {
            profileCtx.lineTo(canvasPoint.x, canvasPoint.y);
        }
    }
    profileCtx.strokeStyle = '#333';
    profileCtx.lineWidth = 2;
    profileCtx.stroke();

    // Draw points
    points.forEach((point, index) => {
        const canvasPoint = toCanvasCoords(point);
        profileCtx.beginPath();
        profileCtx.arc(canvasPoint.x, canvasPoint.y, 5, 0, 2 * Math.PI);
        profileCtx.fillStyle = (index === selectedPoint) ? 'dodgerblue' : 'white';
        profileCtx.strokeStyle = 'dodgerblue';
        profileCtx.lineWidth = 2;
        profileCtx.fill();
        profileCtx.stroke();
    });
}

// --- Coordinate Conversion ---
const worldScale = 50; // 50 pixels = 1 world unit
function toCanvasCoords(worldPoint) {
    const x = (profileCanvas.width / 2) + worldPoint.x * worldScale;
    const y = (profileCanvas.height / 2) - worldPoint.y * worldScale;
    return { x, y };
}

function toWorldCoords(canvasPoint) {
    const x = (canvasPoint.x - profileCanvas.width / 2) / worldScale;
    const y = (profileCanvas.height / 2 - canvasPoint.y) / worldScale;
    return new THREE.Vector2(x, y);
}


// --- 2D Canvas Event Handlers ---
function handleMouseMove(event) {
    // This function is called when the mouse moves, only if we are dragging.
    if (!isDragging || selectedPoint === null) return;

    const rect = profileCanvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    // Clamp mouse coordinates to be within the canvas bounds
    mouseX = Math.max(0, Math.min(profileCanvas.width, mouseX));
    mouseY = Math.max(0, Math.min(profileCanvas.height, mouseY));

    const worldPos = toWorldCoords({ x: mouseX, y: mouseY });

    // We still need to enforce the "no negative x" rule for the pendant shape itself,
    // even though the clamping above handles the canvas boundary.
    worldPos.x = Math.max(0, worldPos.x);

    points[selectedPoint] = worldPos;
    drawProfile();
    update3DModel();
}

function handleMouseUp() {
    // This function is called when the mouse button is released, ending the drag.
    isDragging = false;
    // Clean up the global event listeners.
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
}

profileCanvas.addEventListener('mousedown', (event) => {
    const rect = profileCanvas.getBoundingClientRect();
    const mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const worldPos = toWorldCoords(mousePos);

    selectedPoint = null;
    let pointFound = false;
    for (let i = 0; i < points.length; i++) {
        const canvasPoint = toCanvasCoords(points[i]);
        const dist = Math.sqrt(Math.pow(canvasPoint.x - mousePos.x, 2) + Math.pow(canvasPoint.y - mousePos.y, 2));
        if (dist < 6) {
            selectedPoint = i;
            pointFound = true;
            isDragging = true;
            // A point was clicked, so start the drag operation by listening to the whole window.
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            break;
        }
    }

    if (!pointFound) {
        // If no point was clicked, insert a new one.
        let closestDist = Infinity;
        let insertionIndex = points.length;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            const dist = distanceToSegment(worldPos, p1, p2);
            if (dist < closestDist) {
                closestDist = dist;
                insertionIndex = i + 1;
            }
        }
        points.splice(insertionIndex, 0, worldPos);
        selectedPoint = insertionIndex;
    }
    
    drawProfile();
    update3DModel();
});

profileCanvas.addEventListener('dblclick', (event) => {
    const rect = profileCanvas.getBoundingClientRect();
    const mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    for (let i = 0; i < points.length; i++) {
        const canvasPoint = toCanvasCoords(points[i]);
        const dist = Math.sqrt(Math.pow(canvasPoint.x - mousePos.x, 2) + Math.pow(canvasPoint.y - mousePos.y, 2));
        if (dist < 6) {
            // Prevent deleting the last two points
            if (points.length > 2) {
                points.splice(i, 1);
                selectedPoint = null;
                drawProfile();
                update3DModel();
                break;
            }
        }
    }
});


// --- Helper function for point insertion ---
function distanceToSegment(p, v, w) {
    const l2 = v.distanceToSquared(w);
    if (l2 === 0) return p.distanceTo(v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = new THREE.Vector2(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
    return p.distanceTo(projection);
}


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- Initial Run ---
drawProfile();
update3DModel();
animate();
