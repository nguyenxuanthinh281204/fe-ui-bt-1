import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * AETHER 3D Studio Engine (High-Fidelity)
 * Ultra-smooth procedural 3D Headphone with Apple AirPods Max styling,
 * PBR materials with RoomEnvironment reflections, 360 OrbitControls,
 * and real-time colorway transitions.
 */

export class Headphone3DViewer {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.headphoneGroup = null;
    this.isAutoRotating = true;
    this.materials = {
      earcups: [],
      cushions: [],
      frame: [],
      canopy: [],
      accents: []
    };

    // Color definitions for Apple-grade finishes
    this.colorways = {
      black: {
        earcup: 0x18191c,
        cushion: 0x222327,
        frame: 0x16171a,
        canopy: 0x141518,
        metalness: 0.94,
        roughness: 0.22,
        clearcoat: 0.5
      },
      silver: {
        earcup: 0xdde0e5,
        cushion: 0xf1f3f7,
        frame: 0xc8ccd2,
        canopy: 0xe8ebef,
        metalness: 0.92,
        roughness: 0.18,
        clearcoat: 0.6
      },
      midnight: {
        earcup: 0x192338,
        cushion: 0x222e47,
        frame: 0x171f30,
        canopy: 0x182236,
        metalness: 0.94,
        roughness: 0.2,
        clearcoat: 0.5
      }
    };

    this.currentColor = 'black';
    this.init();
  }

  init() {
    const width = this.container.clientWidth || 580;
    const height = this.container.clientHeight || 520;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera with 3/4 hero angle (Apple Keynote perspective)
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(2.4, 0.8, 5.4);

    // 3. Renderer with transparent background & tone mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Lighting via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableZoom = true;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 8.5;
    this.controls.maxPolarAngle = Math.PI / 1.6;
    this.controls.minPolarAngle = Math.PI / 4.5;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.0;
    this.controls.target.set(0, 0, 0);

    // 6. Direct Directional & Rim Lights
    this.setupLighting();

    // 7. Build Headphone Model
    this.buildHeadphone();

    // 8. Ground soft shadow
    this.createContactShadow();

    // 9. Resize & Drag handlers
    window.addEventListener('resize', () => this.onWindowResize());

    this.controls.addEventListener('start', () => {
      this.isAutoRotating = false;
      this.controls.autoRotate = false;
      const spinBtn = document.getElementById('toggle3dSpinBtn');
      if (spinBtn) spinBtn.classList.remove('active');
    });

    // 10. Start Animation Loop
    this.animate();
  }

  setupLighting() {
    // Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    // Key Light (Main soft light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    // Fill Light (Cool fill)
    const fillLight = new THREE.DirectionalLight(0xbad7f2, 1.2);
    fillLight.position.set(-4, 2, 3);
    this.scene.add(fillLight);

    // Rim Light (Sharp edge highlights)
    const rimLight = new THREE.DirectionalLight(0x70b5ff, 2.0);
    rimLight.position.set(-2, 4, -4);
    this.scene.add(rimLight);
  }

  // Mathematically smooth rounded rectangle using absarc
  createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(x + w, y + h - r);
    shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    shape.lineTo(x + r, y + h);
    shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(x, y + r);
    shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return shape;
  }

  buildHeadphone() {
    this.headphoneGroup = new THREE.Group();
    const colorDef = this.colorways[this.currentColor];

    // Shared Materials
    const earcupMat = new THREE.MeshPhysicalMaterial({
      color: colorDef.earcup,
      metalness: colorDef.metalness,
      roughness: colorDef.roughness,
      clearcoat: colorDef.clearcoat,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95
    });
    this.materials.earcups.push(earcupMat);

    const cushionMat = new THREE.MeshPhysicalMaterial({
      color: colorDef.cushion,
      roughness: 0.88,
      metalness: 0.04,
      clearcoat: 0.05
    });
    this.materials.cushions.push(cushionMat);

    const frameMat = new THREE.MeshPhysicalMaterial({
      color: colorDef.frame,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.4
    });
    this.materials.frame.push(frameMat);

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: colorDef.canopy,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });
    this.materials.canopy.push(canopyMat);

    const chromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0e0e0,
      metalness: 0.98,
      roughness: 0.05,
      clearcoat: 0.9
    });
    this.materials.accents.push(chromeMat);

    // --- Build Smooth Sculpted Earcups ---
    const earcupShape = this.createRoundedRectShape(1.5, 2.15, 0.62);
    const extrudeSettings = {
      depth: 0.38,
      bevelEnabled: true,
      bevelSegments: 16,
      curveSegments: 36,
      steps: 2,
      bevelSize: 0.24,
      bevelThickness: 0.25
    };

    const earcupGeo = new THREE.ExtrudeGeometry(earcupShape, extrudeSettings);
    earcupGeo.center();
    earcupGeo.computeVertexNormals();

    // Cushion Geometry
    const cushionShape = this.createRoundedRectShape(1.42, 2.05, 0.58);
    const cushionExtrude = {
      depth: 0.26,
      bevelEnabled: true,
      bevelSegments: 14,
      curveSegments: 36,
      steps: 1,
      bevelSize: 0.18,
      bevelThickness: 0.18
    };
    const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, cushionExtrude);
    cushionGeo.center();
    cushionGeo.computeVertexNormals();

    // Inner Acoustic Cavity Geometry (dark speaker cloth)
    const cavityShape = this.createRoundedRectShape(0.75, 1.3, 0.35);
    const cavityGeo = new THREE.ExtrudeGeometry(cavityShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 6,
      curveSegments: 24,
      bevelSize: 0.05,
      bevelThickness: 0.05
    });
    cavityGeo.center();
    const cavityMat = new THREE.MeshBasicMaterial({ color: 0x08080a });

    // Left Earcup Group
    const leftEarcupGroup = new THREE.Group();
    const leftShell = new THREE.Mesh(earcupGeo, earcupMat);
    leftShell.castShadow = true;
    leftEarcupGroup.add(leftShell);

    const leftCushion = new THREE.Mesh(cushionGeo, cushionMat);
    leftCushion.position.z = 0.32;
    leftEarcupGroup.add(leftCushion);

    const leftCavity = new THREE.Mesh(cavityGeo, cavityMat);
    leftCavity.position.z = 0.44;
    leftEarcupGroup.add(leftCavity);

    // Right Earcup Group
    const rightEarcupGroup = new THREE.Group();
    const rightShell = new THREE.Mesh(earcupGeo, earcupMat);
    rightShell.castShadow = true;
    rightEarcupGroup.add(rightShell);

    const rightCushion = new THREE.Mesh(cushionGeo, cushionMat);
    rightCushion.position.z = 0.32;
    rightEarcupGroup.add(rightCushion);

    const rightCavity = new THREE.Mesh(cavityGeo, cavityMat);
    rightCavity.position.z = 0.44;
    rightEarcupGroup.add(rightCavity);

    // Digital Crown and Noise button on Right Earcup
    const crownGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.09, 24);
    const crownMesh = new THREE.Mesh(crownGeo, chromeMat);
    crownMesh.rotation.z = Math.PI / 2;
    crownMesh.position.set(0.68, 0.78, -0.1);
    rightEarcupGroup.add(crownMesh);

    const buttonGeo = new THREE.CapsuleGeometry(0.04, 0.12, 8, 16);
    const buttonMesh = new THREE.Mesh(buttonGeo, chromeMat);
    buttonMesh.rotation.z = Math.PI / 4;
    buttonMesh.position.set(0.72, 0.46, -0.1);
    rightEarcupGroup.add(buttonMesh);

    // Ergonomic Inward Tilt & Distance
    const earcupDistance = 1.35;
    leftEarcupGroup.position.set(-earcupDistance, -0.4, 0);
    leftEarcupGroup.rotation.y = Math.PI / 2 - 0.1;
    leftEarcupGroup.rotation.z = -0.05;

    rightEarcupGroup.position.set(earcupDistance, -0.4, 0);
    rightEarcupGroup.rotation.y = -Math.PI / 2 + 0.1;
    rightEarcupGroup.rotation.z = 0.05;

    this.headphoneGroup.add(leftEarcupGroup);
    this.headphoneGroup.add(rightEarcupGroup);

    // --- Telescoping Stems (Polished Chrome Hinges) ---
    const stemGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.85, 24);
    
    const leftStem = new THREE.Mesh(stemGeo, chromeMat);
    leftStem.position.set(-1.28, 0.42, 0);
    leftStem.rotation.z = -0.15;
    this.headphoneGroup.add(leftStem);

    const rightStem = new THREE.Mesh(stemGeo, chromeMat);
    rightStem.position.set(1.28, 0.42, 0);
    rightStem.rotation.z = 0.15;
    this.headphoneGroup.add(rightStem);

    // Stem Hinge Collars
    const collarGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.15, 24);
    const leftCollar = new THREE.Mesh(collarGeo, frameMat);
    leftCollar.position.copy(leftStem.position).add(new THREE.Vector3(0, -0.38, 0));
    leftCollar.rotation.z = -0.15;
    this.headphoneGroup.add(leftCollar);

    const rightCollar = new THREE.Mesh(collarGeo, frameMat);
    rightCollar.position.copy(rightStem.position).add(new THREE.Vector3(0, -0.38, 0));
    rightCollar.rotation.z = 0.15;
    this.headphoneGroup.add(rightCollar);

    // --- Headband Frame Arch ---
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.22, 0.78, 0),
      new THREE.Vector3(-1.0, 1.45, 0),
      new THREE.Vector3(-0.55, 1.85, 0),
      new THREE.Vector3(0, 1.95, 0),
      new THREE.Vector3(0.55, 1.85, 0),
      new THREE.Vector3(1.0, 1.45, 0),
      new THREE.Vector3(1.22, 0.78, 0),
    ]);

    const archGeo = new THREE.TubeGeometry(archCurve, 80, 0.065, 20, false);
    archGeo.computeVertexNormals();
    const archMesh = new THREE.Mesh(archGeo, frameMat);
    this.headphoneGroup.add(archMesh);

    // --- AeroKnit Breathable Mesh Canopy ---
    const canopyWidth = 0.42;
    const canopySegments = 36;
    const canopyPoints = [];

    for (let i = 0; i <= canopySegments; i++) {
      const t = i / canopySegments;
      const pt = archCurve.getPoint(t);
      canopyPoints.push(new THREE.Vector3(pt.x, pt.y - 0.038, pt.z));
    }

    const canopyGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= canopySegments; i++) {
      const pt = canopyPoints[i];
      const zOffset = canopyWidth / 2;
      positions.push(pt.x, pt.y, pt.z - zOffset);
      positions.push(pt.x, pt.y, pt.z + zOffset);

      const u = i / canopySegments;
      uvs.push(u, 0);
      uvs.push(u, 1);
    }

    for (let i = 0; i < canopySegments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    canopyGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    canopyGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    canopyGeo.setIndex(indices);
    canopyGeo.computeVertexNormals();

    const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
    this.headphoneGroup.add(canopyMesh);

    // Initial positioning & elevation
    this.headphoneGroup.position.set(0, -0.15, 0);
    this.scene.add(this.headphoneGroup);
  }

  createContactShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTexture = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.65;
    this.scene.add(shadowMesh);
  }

  setColorway(colorKey) {
    if (!this.colorways[colorKey]) return;
    this.currentColor = colorKey;
    const colorDef = this.colorways[colorKey];

    // Smoothly update materials
    this.materials.earcups.forEach((mat) => {
      mat.color.setHex(colorDef.earcup);
      mat.metalness = colorDef.metalness;
      mat.roughness = colorDef.roughness;
      mat.clearcoat = colorDef.clearcoat;
    });

    this.materials.cushions.forEach((mat) => {
      mat.color.setHex(colorDef.cushion);
    });

    this.materials.frame.forEach((mat) => {
      mat.color.setHex(colorDef.frame);
    });

    this.materials.canopy.forEach((mat) => {
      mat.color.setHex(colorDef.canopy);
    });
  }

  toggleAutoRotate(forceState) {
    if (typeof forceState === 'boolean') {
      this.isAutoRotating = forceState;
    } else {
      this.isAutoRotating = !this.isAutoRotating;
    }
    this.controls.autoRotate = this.isAutoRotating;
    return this.isAutoRotating;
  }

  resetView() {
    this.camera.position.set(2.4, 0.8, 5.4);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Gentle breathing hover bob
    if (this.headphoneGroup) {
      const time = performance.now() * 0.0015;
      this.headphoneGroup.position.y = -0.15 + Math.sin(time) * 0.04;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
