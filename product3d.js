import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * AETHER 3D Multi-Product Studio Engine
 * Photorealistic PBR 3D showcase using authentic CAD/PBR GLB models:
 * 1. Aura Max 2 — Over-Ear Titanium Studio Headphones
 * 2. Aura Pods Pro — Spatial Wireless Earbuds & Open Case
 * 3. Aura Kinetic Watch Ultra — Luxury Chronograph Timepiece with Sapphire Crystal
 * 4. Kinetic Aero Runner — Official High-Performance Carbon Plate Running Sneaker
 */

const PRODUCT_SPECS = {
  'aura-max': {
    url: '/assets/headphones.glb',
    targetSize: 2.35,
    offsetY: 0.05,
    cameraPos: [1.3, 0.25, 4.8],
    rotation: [0.06, 0.40, 0],
    minDistance: 2.4,
    maxDistance: 7.2
  },
  'aura-pods': {
    url: '/assets/airpods.glb',
    targetSize: 2.7,
    offsetY: -0.05,
    cameraPos: [1.8, 0.5, 4.2],
    rotation: [0.12, 0.35, 0],
    minDistance: 2.5,
    maxDistance: 6.5
  },
  'aura-watch': {
    url: '/assets/chronograph.glb',
    targetSize: 3.1,
    offsetY: 0.0,
    cameraPos: [1.2, 0.4, 4.2],
    rotation: [-0.05, 0.35, 0.05],
    minDistance: 2.5,
    maxDistance: 6.8
  },
  'aura-runner': {
    url: '/assets/shoe.glb',
    targetSize: 3.3,
    offsetY: 0.05,
    cameraPos: [2.2, 0.5, 4.6],
    rotation: [0.12, -0.65, 0.08],
    minDistance: 2.6,
    maxDistance: 7.2
  }
};

export class Product3DViewer {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.currentModelKey = 'aura-max';
    this.currentColor = 'black';
    this.isAutoRotating = true;

    // Cache & state
    this.models = {};
    this.activeGroup = null;
    this.loader = null;
    this.dracoLoader = null;
    this.loadingIndicator = null;
    this.originalMaterials = new Map();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    this.camera.position.set(2.0, 0.4, 4.6);

    // 3. Renderer with ACES Filmic tone mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.createLoadingIndicator();

    // 4. Studio Environment Lighting (PMREM Room Environment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enableZoom = true;
    this.controls.minDistance = 2.6;
    this.controls.maxDistance = 7.2;
    this.controls.maxPolarAngle = Math.PI / 1.6;
    this.controls.minPolarAngle = Math.PI / 4.8;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.85;
    this.controls.target.set(0, 0, 0);

    // 6. Lights
    this.setupLighting();

    // 7. Ground Contact Shadow
    this.createContactShadow();

    // 8. GLTF & Draco Loaders
    this.setupLoaders();

    // 9. Resize & Events
    window.addEventListener('resize', () => this.onWindowResize());

    this.controls.addEventListener('start', () => {
      this.isAutoRotating = false;
      this.controls.autoRotate = false;
      const spinBtn = document.getElementById('toggle3dSpinBtn');
      if (spinBtn) spinBtn.classList.remove('active');
    });

    // 10. Load Initial Model
    this.loadAndDisplayProduct('aura-max');

    // 11. Animation Loop
    this.animate();
  }

  createLoadingIndicator() {
    this.loadingIndicator = document.createElement('div');
    this.loadingIndicator.className = 'studio-3d-loader';
    this.loadingIndicator.innerHTML = `
      <div class="loader-pulse-ring"></div>
      <span class="loader-label">Rendering Photorealistic PBR...</span>
    `;
    this.loadingIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      pointer-events: none;
      z-index: 20;
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(this.loadingIndicator);
  }

  showLoader(show) {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = show ? 'flex' : 'none';
    }
  }

  setupLighting() {
    // Balanced studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4.0, 5.5, 4.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd6e5fa, 0.9);
    fillLight.position.set(-4.0, 2.5, 3.0);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x75b8ff, 1.4);
    rimLight.position.set(-2.0, 4.5, -4.0);
    this.scene.add(rimLight);

    const bounceLight = new THREE.DirectionalLight(0xffffff, 0.5);
    bounceLight.position.set(0, -3.0, 2.0);
    this.scene.add(bounceLight);
  }

  createContactShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.16)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTexture = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(4.4, 4.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.68;
    this.scene.add(shadowMesh);
  }

  setupLoaders() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  loadAndDisplayProduct(productKey) {
    const spec = PRODUCT_SPECS[productKey];
    if (!spec) return;

    this.currentModelKey = productKey;

    if (this.models[productKey]) {
      this.activateModel(productKey);
      return;
    }

    this.showLoader(true);

    this.loader.load(
      spec.url,
      (gltf) => {
        const rawModel = gltf.scene;

        // 1. Hide stand / non-product nodes
        if (spec.hideNodes) {
          rawModel.traverse((child) => {
            const name = (child.name || '').toLowerCase();
            if (spec.hideNodes.some((h) => name.includes(h))) {
              child.visible = false;
            }
          });
        }

        // 2. Specific material styling for Headphones & Watch
        if (productKey === 'aura-max') {
          rawModel.traverse((child) => {
            if (child.isMesh && child.material) {
              const mName = (child.name || '').toLowerCase();
              const matName = (child.material.name || '').toLowerCase();
              const mat = child.material;

              // Turn off any glTF fabric sheen that washes out dark acoustic cloth into white
              mat.sheen = 0;
              if (mat.sheenColor) mat.sheenColor.setHex(0x000000);

              if (mName.includes('stand') || matName.includes('titanium') || matName.includes('stand')) {
                // Telescoping extension arms & metal hinges
                mat.color.setHex(0x32353c);
                mat.metalness = 0.96;
                mat.roughness = 0.16;
                mat.envMapIntensity = 1.4;
              } else if (mName.includes('fabric') || mName === 'head_band' || matName.includes('cushion') || matName.includes('leather')) {
                // Memory foam ear cushions & inner suspension canopy padding
                mat.color.setHex(0x18191d);
                mat.roughness = 0.92;
                mat.metalness = 0.02;
                mat.envMapIntensity = 0.15;
              } else if (mName.includes('top_band') || matName.includes('composite')) {
                // Outer headband arch
                mat.color.setHex(0x16171a);
                mat.metalness = 0.35;
                mat.roughness = 0.32;
                mat.envMapIntensity = 1.1;
              } else if (mName.includes('plustic') || mName.includes('back') || matName.includes('rear') || matName.includes('ear_cover')) {
                // Outer acoustic earcups
                mat.color.setHex(0x141518);
                mat.metalness = 0.78;
                mat.roughness = 0.24;
                mat.envMapIntensity = 1.15;
              } else if (mName.includes('button') || matName.includes('button')) {
                // Tactile physical buttons
                mat.color.setHex(0x101114);
                mat.metalness = 0.92;
                mat.roughness = 0.18;
                mat.envMapIntensity = 1.2;
              } else {
                mat.color.setHex(0x16171b);
                mat.metalness = 0.55;
                mat.roughness = 0.35;
                mat.envMapIntensity = 1.0;
              }
              mat.needsUpdate = true;
            }
          });
        } else if (productKey === 'aura-watch') {
          rawModel.traverse((child) => {
            if (child.isMesh && child.material) {
              const name = (child.material.name || child.name || '').toLowerCase();
              if (name.includes('glass')) {
                child.material.transparent = true;
                child.material.opacity = 0.28;
                child.material.roughness = 0.04;
                child.material.metalness = 0.1;
                child.material.transmission = 0.92;
                child.material.ior = 1.5;
                child.material.depthWrite = false;
                child.material.needsUpdate = true;
              } else if (name.includes('face') || name.includes('dial')) {
                child.material.roughness = 0.3;
                child.material.metalness = 0.65;
                child.material.needsUpdate = true;
              }
            }
          });
        }

        // 3. Compute accurate bounding box of visible meshes
        rawModel.updateMatrixWorld(true);
        const box = new THREE.Box3();
        rawModel.traverse((child) => {
          if (child.isMesh && child.visible) {
            box.expandByObject(child);
          }
        });

        if (box.isEmpty()) {
          box.setFromObject(rawModel);
        }

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetScale = (spec.targetSize || 3.0) / maxDim;

        // 4. Uniform scale & re-center at origin
        rawModel.scale.setScalar(targetScale);
        rawModel.position.set(
          -center.x * targetScale,
          -center.y * targetScale + (spec.offsetY || 0),
          -center.z * targetScale
        );

        const pivotGroup = new THREE.Group();
        pivotGroup.name = `pivot-${productKey}`;
        pivotGroup.add(rawModel);

        if (spec.rotation) {
          pivotGroup.rotation.set(...spec.rotation);
        }

        // 5. Enhance reflections & save original material colors
        rawModel.traverse((child) => {
          if (child.isMesh && child.visible) {
            child.castShadow = true;
            child.receiveShadow = true;

            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              if (mat) {
                if (!this.originalMaterials.has(mat)) {
                  this.originalMaterials.set(mat, {
                    color: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
                    roughness: mat.roughness !== undefined ? mat.roughness : 0.5,
                    metalness: mat.metalness !== undefined ? mat.metalness : 0.5
                  });
                }

                if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                  const mName = (mat.name || child.name || '').toLowerCase();
                  if (mName.includes('cushion') || mName.includes('leather') || mName.includes('fabric') || mName.includes('head_band')) {
                    mat.envMapIntensity = 0.2;
                  } else {
                    mat.envMapIntensity = 1.35;
                  }
                  mat.needsUpdate = true;
                }
              }
            });
          }
        });

        this.models[productKey] = pivotGroup;
        this.showLoader(false);

        if (this.currentModelKey === productKey) {
          this.activateModel(productKey);
        }
      },
      undefined,
      (error) => {
        console.error(`Error loading 3D asset ${spec.url}:`, error);
        this.showLoader(false);
      }
    );
  }

  activateModel(productKey) {
    const spec = PRODUCT_SPECS[productKey];
    const newGroup = this.models[productKey];
    if (!newGroup) return;

    if (this.activeGroup) {
      this.scene.remove(this.activeGroup);
    }

    this.activeGroup = newGroup;
    this.scene.add(this.activeGroup);

    if (spec.cameraPos) {
      this.camera.position.set(...spec.cameraPos);
    }
    if (spec.minDistance) {
      this.controls.minDistance = spec.minDistance;
    }
    if (spec.maxDistance) {
      this.controls.maxDistance = spec.maxDistance;
    }

    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.applyCurrentColorway();
  }

  switchProduct(productKey) {
    if (!PRODUCT_SPECS[productKey]) return;
    this.loadAndDisplayProduct(productKey);
  }

  setColorway(colorKey) {
    this.currentColor = colorKey;
    this.applyCurrentColorway();
  }

  applyCurrentColorway() {
    if (!this.activeGroup) return;

    this.activeGroup.traverse((child) => {
      if (child.isMesh && child.material && child.visible) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          const original = this.originalMaterials.get(mat);
          if (!original) return;

          const mName = (child.name || '').toLowerCase();
          const matName = (mat.name || '').toLowerCase();

          // Ensure glTF sheen is disabled so dark acoustic fabric does not reflect white
          mat.sheen = 0;
          if (mat.sheenColor) mat.sheenColor.setHex(0x000000);

          if (this.currentColor === 'black') {
            if (this.currentModelKey === 'aura-max') {
              if (mName.includes('stand') || matName.includes('titanium') || matName.includes('stand')) {
                // Telescoping extension arms & metal hinges
                mat.color.setHex(0x32353c);
                mat.metalness = 0.96;
                mat.roughness = 0.16;
                mat.envMapIntensity = 1.4;
              } else if (mName.includes('fabric') || mName === 'head_band' || matName.includes('cushion') || matName.includes('leather')) {
                // Memory foam ear cushions & inner canopy fabric
                mat.color.setHex(0x18191d);
                mat.roughness = 0.92;
                mat.metalness = 0.02;
                mat.envMapIntensity = 0.15;
              } else if (mName.includes('top_band') || matName.includes('composite')) {
                // Outer headband arch
                mat.color.setHex(0x16171a);
                mat.metalness = 0.35;
                mat.roughness = 0.32;
                mat.envMapIntensity = 1.1;
              } else if (mName.includes('plustic') || mName.includes('back') || matName.includes('rear') || matName.includes('ear_cover')) {
                // Outer acoustic earcups
                mat.color.setHex(0x141518);
                mat.metalness = 0.78;
                mat.roughness = 0.24;
                mat.envMapIntensity = 1.15;
              } else if (mName.includes('button') || matName.includes('button')) {
                // Controls / Buttons
                mat.color.setHex(0x101114);
                mat.metalness = 0.92;
                mat.roughness = 0.18;
                mat.envMapIntensity = 1.2;
              } else {
                mat.color.setHex(0x16171b);
                mat.metalness = 0.55;
                mat.roughness = 0.35;
                mat.envMapIntensity = 1.0;
              }
            } else if (this.currentModelKey === 'aura-pods') {
              if (mat.color) mat.color.setHex(0x18191c);
              mat.roughness = 0.32;
              mat.metalness = 0.15;
            } else if (this.currentModelKey === 'aura-watch') {
              if (mat.color) mat.color.setHex(0x22242a);
            } else if (this.currentModelKey === 'aura-runner') {
              if (mat.color) mat.color.setHex(0x22242a);
            }
          } else if (this.currentColor === 'silver') {
            if (this.currentModelKey === 'aura-max') {
              if (mName.includes('stand') || matName.includes('titanium') || matName.includes('stand')) {
                // Polished stainless steel / chrome extension arms
                mat.color.setHex(0xe8edf5);
                mat.metalness = 0.98;
                mat.roughness = 0.12;
                mat.envMapIntensity = 1.5;
              } else if (mName.includes('fabric') || mName === 'head_band' || matName.includes('cushion') || matName.includes('leather')) {
                // Premium light acoustic mesh cushions
                mat.color.setHex(0xd4d8e0);
                mat.roughness = 0.88;
                mat.metalness = 0.02;
                mat.envMapIntensity = 0.35;
              } else if (mName.includes('top_band') || matName.includes('composite')) {
                // Crisp white headband arch
                mat.color.setHex(0xd8dce4);
                mat.metalness = 0.35;
                mat.roughness = 0.30;
                mat.envMapIntensity = 1.2;
              } else if (mName.includes('plustic') || mName.includes('back') || matName.includes('rear') || matName.includes('ear_cover')) {
                // Anodized silver aluminum earcups
                mat.color.setHex(0xd4d8e2);
                mat.metalness = 0.82;
                mat.roughness = 0.22;
                mat.envMapIntensity = 1.35;
              } else if (mName.includes('button') || matName.includes('button')) {
                mat.color.setHex(0xe0e4ec);
                mat.metalness = 0.95;
                mat.roughness = 0.15;
                mat.envMapIntensity = 1.4;
              } else {
                mat.color.setHex(0xd8dce4);
                mat.metalness = 0.65;
                mat.roughness = 0.28;
                mat.envMapIntensity = 1.2;
              }
            } else if (this.currentModelKey === 'aura-pods') {
              if (mat.color) mat.color.setHex(0xffffff);
              mat.roughness = 0.14;
              mat.metalness = 0.05;
            } else if (this.currentModelKey === 'aura-watch') {
              if (mat.color) mat.color.setHex(0xf0f3f8);
            } else if (this.currentModelKey === 'aura-runner') {
              if (mat.color) mat.color.setHex(0xf0f2f6);
            }
          } else if (this.currentColor === 'midnight') {
            if (this.currentModelKey === 'aura-max') {
              if (mName.includes('stand') || matName.includes('titanium') || matName.includes('stand')) {
                // Dark polished steel arms
                mat.color.setHex(0x28344c);
                mat.metalness = 0.96;
                mat.roughness = 0.16;
                mat.envMapIntensity = 1.4;
              } else if (mName.includes('fabric') || mName === 'head_band' || matName.includes('cushion') || matName.includes('leather')) {
                // Deep navy acoustic mesh
                mat.color.setHex(0x182236);
                mat.roughness = 0.90;
                mat.metalness = 0.02;
                mat.envMapIntensity = 0.20;
              } else if (mName.includes('top_band') || matName.includes('composite')) {
                // Midnight headband arch
                mat.color.setHex(0x182030);
                mat.metalness = 0.35;
                mat.roughness = 0.32;
                mat.envMapIntensity = 1.1;
              } else if (mName.includes('plustic') || mName.includes('back') || matName.includes('rear') || matName.includes('ear_cover')) {
                // Midnight anodized aluminum earcups
                mat.color.setHex(0x152033);
                mat.metalness = 0.82;
                mat.roughness = 0.24;
                mat.envMapIntensity = 1.25;
              } else if (mName.includes('button') || matName.includes('button')) {
                mat.color.setHex(0x202a3e);
                mat.metalness = 0.92;
                mat.roughness = 0.18;
                mat.envMapIntensity = 1.2;
              } else {
                mat.color.setHex(0x192235);
                mat.metalness = 0.65;
                mat.roughness = 0.28;
                mat.envMapIntensity = 1.1;
              }
            } else if (this.currentModelKey === 'aura-pods') {
              if (mat.color) mat.color.setHex(0x162238);
              mat.roughness = 0.22;
              mat.metalness = 0.2;
            } else if (this.currentModelKey === 'aura-watch') {
              if (mat.color) mat.color.setHex(0x18243c);
            } else if (this.currentModelKey === 'aura-runner') {
              if (mat.color) mat.color.setHex(0x182338);
            }
          }

          mat.needsUpdate = true;
        });
      }
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
    const spec = PRODUCT_SPECS[this.currentModelKey];
    if (spec && spec.cameraPos) {
      this.camera.position.set(...spec.cameraPos);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
    this.isAutoRotating = true;
    this.controls.autoRotate = true;
    const spinBtn = document.getElementById('toggle3dSpinBtn');
    if (spinBtn) spinBtn.classList.add('active');
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

    if (this.activeGroup) {
      const time = performance.now() * 0.0016;
      const baseOffset = PRODUCT_SPECS[this.currentModelKey]?.offsetY || 0;
      this.activeGroup.position.y = baseOffset + Math.sin(time) * 0.035;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
