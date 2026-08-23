import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreePassport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const passportGroup = new THREE.Group();

    // Deep blue, saffron and cream
    const deepBlue = 0x010766;
    const saffron = 0xfe9832;
    const cream = 0xfff9ec;

    // Back cover
    const backCoverGeom = new THREE.BoxGeometry(2.5, 3.5, 0.05);
    const backCoverMat = new THREE.MeshPhongMaterial({
      color: deepBlue,
      shininess: 80,
      specular: 0x222244,
    });
    const backCover = new THREE.Mesh(backCoverGeom, backCoverMat);
    backCover.position.z = -0.15;
    passportGroup.add(backCover);

    // Front Cover Group (Pivot at spine)
    const frontCoverGroup = new THREE.Group();
    const frontCoverGeom = new THREE.BoxGeometry(2.5, 3.5, 0.05);
    const frontCoverMat = new THREE.MeshPhongMaterial({
      color: deepBlue,
      shininess: 80,
      specular: 0x222244,
    });
    const frontCover = new THREE.Mesh(frontCoverGeom, frontCoverMat);
    frontCover.position.x = 1.25;

    // Emblem on Front Cover — with glow
    const emblemGeom = new THREE.BoxGeometry(0.8, 0.8, 0.02);
    const emblemMat = new THREE.MeshPhongMaterial({
      color: saffron,
      emissive: saffron,
      emissiveIntensity: 0.4,
      shininess: 100,
    });
    const emblem = new THREE.Mesh(emblemGeom, emblemMat);
    emblem.position.set(1.25, 0.5, 0.04);
    frontCoverGroup.add(emblem);
    frontCoverGroup.add(frontCover);

    frontCoverGroup.position.x = -1.25;
    passportGroup.add(frontCoverGroup);

    // Turning Pages — with subtle horizontal line texture
    const pages: THREE.Group[] = [];
    for (let i = 0; i < 5; i++) {
      const pageGroup = new THREE.Group();
      const pageGeom = new THREE.BoxGeometry(2.4, 3.4, 0.01);
      const pageMat = new THREE.MeshPhongMaterial({
        color: cream,
        side: THREE.DoubleSide,
        shininess: 20,
        specular: 0x333322,
      });
      const page = new THREE.Mesh(pageGeom, pageMat);
      page.position.x = 1.2;

      // Add subtle line decorations
      const lineGeom = new THREE.BoxGeometry(1.8, 0.015, 0.001);
      const lineMat = new THREE.MeshPhongMaterial({ color: 0xddddcc, transparent: true, opacity: 0.3 });
      for (let l = 0; l < 6; l++) {
        const line = new THREE.Mesh(lineGeom, lineMat);
        line.position.set(1.2, 0.6 - l * 0.35, 0.006);
        pageGroup.add(line);
      }

      pageGroup.add(page);
      pageGroup.position.x = -1.2;
      pageGroup.position.z = -0.1 + i * 0.02;
      passportGroup.add(pageGroup);
      pages.push(pageGroup);
    }

    scene.add(passportGroup);

    // Warm ambient + key light + rim light
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.3);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x00e5ff, 0.25);
    rimLight.position.set(-5, -3, 2);
    scene.add(rimLight);

    camera.position.z = 7.5;

    const clock = new THREE.Clock();

    // Smoothstep easing — no mechanical snaps, every motion eases in/out
    const smoothstep = (x: number) => {
      const t = Math.max(0, Math.min(1, x));
      return t * t * (3 - 2 * t);
    };

    // Gentle drift using separate frequencies for organic feel
    const driftX = (time: number) => Math.sin(time * 0.3) * 0.08 + Math.sin(time * 0.17) * 0.03;
    const driftY = (time: number) => Math.sin(time * 0.5) * 0.05 + Math.cos(time * 0.23) * 0.02;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Gentle ambient float & tilt (organic drift)
      passportGroup.position.y = driftY(time);
      passportGroup.rotation.y = driftX(time);
      passportGroup.rotation.x = 0.18 + Math.sin(time * 0.25) * 0.04;

      // Emblem glow pulsing
      emblemMat.emissiveIntensity = 0.3 + Math.sin(time * 1.2) * 0.15;

      // Open/close cycle: ease open → hold open → ease shut
      const t = (Math.sin(time * 0.5) + 1) / 2; // 0 → 1 → 0
      const openCycle = smoothstep(Math.min(1, t * 1.5));

      // Front cover — eases open, holds, eases shut
      frontCoverGroup.rotation.y = -openCycle * Math.PI * 0.85;

      // Pages — cascading flip, each page eased with its own stagger
      pages.forEach((p, index) => {
        const delay = index * 0.14;
        const pageOpenAmount = smoothstep(Math.min(1, openCycle * 1.8 - delay));
        p.rotation.y = -pageOpenAmount * Math.PI * 0.8;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 200;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[190px] flex items-center justify-center cursor-grab active:cursor-grabbing"
    />
  );
};
