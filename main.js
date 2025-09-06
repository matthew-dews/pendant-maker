import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- DOM Elements ---
const profileCanvas = document.getElementById('profileCanvas');
const sceneCanvas = document.getElementById('sceneCanvas');
const profileCtx = profileCanvas.getContext('2d');
const wireframeCheckbox = document.getElementById('wireframeToggle');
const normalCheckbox = document.getElementById('normalToggle');

// --- 2D Profile State ---
let points = [
    new THREE.Vector2(0.5, 2),
    new THREE.Vector2(1.5, 1),
    new THREE.Vector2(1.5, -1),
    new THREE.Vector2(0.5, -2),
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
const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 7.5);
scene.add(mainLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(-5, -5, -7.5);
scene.add(fillLight);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Materials ---
const standardMaterial = new THREE.MeshStandardMaterial({ color: 0xD8D8D8, side: THREE.DoubleSide, metalness: 0.9, roughness: 0.3 });
const normalMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
const wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true });

// --- Core 3D Objects ---
let pendantMesh;
let wireframeMesh;

function updateWireframeAppearance() {
    if (!wireframeMaterial) return;

    if (normalCheckbox.checked) {
        wireframeMaterial.color.set(0x000000); // Black for normal material
        wireframeMaterial.opacity = 0.15;
    } else {
        wireframeMaterial.color.set(0x0077ff); // Blue for standard material
        wireframeMaterial.opacity = 0.25;
    }
}

function update3DModel() {
    if (pendantMesh) {
        scene.remove(pendantMesh);
        pendantMesh.geometry.dispose();
    }
    if (wireframeMesh) {
        scene.remove(wireframeMesh);
        wireframeMesh.geometry.dispose();
    }

    if (points.length < 2) return;

    // Use the points in the user-defined order, creating a copy.
    const userProfile = [...points];

    // Add a cap at the start of the line.
    const firstPoint = userProfile[0];
    if (firstPoint.x > 0) {
        userProfile.unshift(new THREE.Vector2(0, firstPoint.y));
    }

    // Add a cap at the end of the line.
    const lastPoint = userProfile[userProfile.length - 1];
    if (lastPoint.x > 0) {
        userProfile.push(new THREE.Vector2(0, lastPoint.y));
    }

    const finalProfilePoints = userProfile.map(p => {
        const pClone = p.clone();
        pClone.x = Math.max(0.01, pClone.x);
        return pClone;
    });

    const geometry = new THREE.LatheGeometry(finalProfilePoints, 32);

    pendantMesh = new THREE.Mesh(geometry, normalCheckbox.checked ? normalMaterial : standardMaterial);
    scene.add(pendantMesh);

    updateWireframeAppearance();
    wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    wireframeMesh.visible = wireframeCheckbox.checked;
    scene.add(wireframeMesh);
}


// --- 2D Canvas Drawing ---
function drawProfile() {
    profileCtx.clearRect(0, 0, profileCanvas.width, profileCanvas.height);
    
    profileCtx.beginPath();
    profileCtx.moveTo(profileCanvas.width / 2, 0);
    profileCtx.lineTo(profileCanvas.width / 2, profileCanvas.height);
    profileCtx.strokeStyle = '#e0e0e0';
    profileCtx.stroke();

    if (points.length < 2) return;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    profileCtx.save();
    profileCtx.setLineDash([4, 4]);
    profileCtx.strokeStyle = '#aaa';
    profileCtx.lineWidth = 1;

    if (firstPoint.x > 0) {
        const firstCanvasPoint = toCanvasCoords(firstPoint);
        profileCtx.beginPath();
        profileCtx.moveTo(profileCanvas.width / 2, firstCanvasPoint.y);
        profileCtx.lineTo(firstCanvasPoint.x, firstCanvasPoint.y);
        profileCtx.stroke();
    }

    if (lastPoint.x > 0) {
        const lastCanvasPoint = toCanvasCoords(lastPoint);
        profileCtx.beginPath();
        profileCtx.moveTo(profileCanvas.width / 2, lastCanvasPoint.y);
        profileCtx.lineTo(lastCanvasPoint.x, lastCanvasPoint.y);
        profileCtx.stroke();
    }
    profileCtx.restore();

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
const worldScale = 50;
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


// --- Event Handlers ---
wireframeCheckbox.addEventListener('change', () => {
    if (wireframeMesh) {
        wireframeMesh.visible = wireframeCheckbox.checked;
    }
});

normalCheckbox.addEventListener('change', () => {
    if (pendantMesh) {
        pendantMesh.material = normalCheckbox.checked ? normalMaterial : standardMaterial;
    }
    updateWireframeAppearance();
});

function handleMouseMove(event) {
    if (!isDragging || selectedPoint === null) return;

    const rect = profileCanvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    mouseX = Math.max(0, Math.min(profileCanvas.width, mouseX));
    mouseY = Math.max(0, Math.min(profileCanvas.height, mouseY));

    const worldPos = toWorldCoords({ x: mouseX, y: mouseY });
    worldPos.x = Math.max(0, worldPos.x);

    points[selectedPoint] = worldPos;
    drawProfile();
    update3DModel();
}

function handleMouseUp() {
    isDragging = false;
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
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            break;
        }
    }

    if (!pointFound) {
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

function distanceToSegment(p, v, w) {
    const l2 = v.distanceToSquared(w);
    if (l2 === 0) return p.distanceTo(v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = new THREE.Vector2(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
    return p.distanceTo(projection);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- Initial Run ---
drawProfile();
update3DModel();
animate();
