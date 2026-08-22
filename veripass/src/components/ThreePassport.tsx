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
    const backCoverMat = new THREE.MeshPhongMaterial({ color: deepBlue });
    const backCover = new THREE.Mesh(backCoverGeom, backCoverMat);
    backCover.position.z = -0.15;
    passportGroup.add(backCover);

    // Front Cover Group (Pivot at spine)
    const frontCoverGroup = new THREE.Group();
    const frontCoverGeom = new THREE.BoxGeometry(2.5, 3.5, 0.05);
    const frontCoverMat = new THREE.MeshPhongMaterial({ color: deepBlue });
    const frontCover = new THREE.Mesh(frontCoverGeom, frontCoverMat);
    frontCover.position.x = 1.25;

    // Emblem on Front Cover
    const emblemGeom = new THREE.BoxGeometry(0.8, 0.8, 0.02);
    const emblemMat = new THREE.MeshPhongMaterial({ color: saffron });
    const emblem = new THREE.Mesh(emblemGeom, emblemMat);
    emblem.position.set(1.25, 0.5, 0.04);
    frontCoverGroup.add(emblem);
    frontCoverGroup.add(frontCover);

    frontCoverGroup.position.x = -1.25;
    passportGroup.add(frontCoverGroup);

    // Turning Pages
    const pages: THREE.Group[] = [];
    for (let i = 0; i < 5; i++) {
      const pageGroup = new THREE.Group();
      const pageGeom = new THREE.BoxGeometry(2.4, 3.4, 0.01);
      const pageMat = new THREE.MeshPhongMaterial({ color: cream, side: THREE.DoubleSide });
      const page = new THREE.Mesh(pageGeom, pageMat);
      page.position.x = 1.2;
      pageGroup.add(page);
      pageGroup.position.x = -1.2;
      pageGroup.position.z = -0.1 + i * 0.02;
      passportGroup.add(pageGroup);
      pages.push(pageGroup);
    }

    scene.add(passportGroup);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x00e5ff, 0.4);
    pointLight2.position.set(-5, -5, 2);
    scene.add(pointLight2);

    camera.position.z = 7.5;

    const clock = new THREE.Clock();

    // Smoothstep easing — no mechanical snaps, every motion eases in/out
    const smoothstep = (x: number) => {
      const t = Math.max(0, Math.min(1, x));
      return t * t * (3 - 2 * t);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Gentle ambient float & tilt (slow, eased)
      passportGroup.position.y = Math.sin(time * 0.7) * 0.06;
      passportGroup.rotation.y = Math.sin(time * 0.35) * 0.12;
      passportGroup.rotation.x = 0.18 + Math.sin(time * 0.25) * 0.04;

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
