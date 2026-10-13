import * as THREE from 'three';
import { TASKS } from './tasks.js';

function grimeTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  let seed = 19;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (const [x, y, rx, ry, angle] of [[70, 79, 49, 63, -.3], [158, 132, 38, 70, .22], [99, 185, 55, 26, -.15]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(rx, ry);
    const haze = ctx.createRadialGradient(-.1, -.15, .04, 0, 0, 1);
    haze.addColorStop(0, 'rgba(62,59,41,.43)');
    haze.addColorStop(.45, 'rgba(75,73,51,.23)');
    haze.addColorStop(1, 'rgba(86,83,59,0)');
    ctx.fillStyle = haze; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  for (let i = 0; i < 130; i++) {
    const x = 24 + random() * 208, y = 22 + random() * 210;
    const r = .4 + random() * (i % 8 ? 2.2 : 4.8);
    ctx.fillStyle = `rgba(55,52,37,${.06 + random() * .25})`;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (.3 + random()), random() * 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const x = 35 + random() * 180, y = 25 + random() * 160;
    const length = 10 + random() * 54;
    ctx.strokeStyle = `rgba(65,62,44,${.06 + random() * .14})`;
    ctx.lineWidth = 1 + random() * 4;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - 4, y + length * .3, x + 5, y + length * .7, x + random() * 8 - 4, y + length);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 18; i++) {
    const x = 30 + random() * 190, y = 25 + random() * 205;
    ctx.strokeStyle = `rgba(0,0,0,${.08 + random() * .25})`;
    ctx.lineWidth = 1 + random() * 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5 + random() * 24, y - 4 + random() * 12); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Work stays in the house: every station visibly changes as tasks progress.
export function buildTaskObjects() {
  const root = new THREE.Group(), stations = new Map(); let painter = null, mirrorGrime = null;
  const mat = color => new THREE.MeshStandardMaterial({ color, roughness: .8 });
  const wood = mat(0x98663c), green = mat(0x6aaf36), pale = mat(0xb3ce74), paper = mat(0xe7dcc3), brass = mat(0xb79550);
  const box = (g, w, h, d, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  for (const task of TASKS.filter(t => t.id !== 'pool')) {
    const g = new THREE.Group(); g.position.set(task.x, task.y, task.z); root.add(g);
    const parts = []; let update = () => {}, paint = null;
    if (task.id === 'lettuce') {
      box(g, .76, .035, .5, wood, 0, -.055);
      for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 7), i % 2 ? green : pale); m.scale.set(1, .75, .75); m.position.set(Math.cos(i * 2.4) * .09, .035 + i * .008, Math.sin(i * 2.4) * .065); g.add(m); parts.push(m); }
      const chopped = [];
      for (let i = 0; i < 18; i++) chopped.push(box(g, .065, .025, .035, i % 2 ? green : pale, -.28 + i % 6 * .1, -.02, -.13 + Math.floor(i / 6) * .12));
      update = p => { parts.forEach((m, i) => m.visible = i >= Math.floor(p * 6)); chopped.forEach((m, i) => m.visible = i < Math.floor(p * 18)); };
    } else if (task.id === 'books') {
      for (let i = 0; i < 4; i++) parts.push(box(g, .25, .055, .32, mat([0x704334, 0x365b47, 0x304863, 0x8c7441][i]), (i - 1.5) * .25, i * .025, 0));
      update = p => parts.forEach((m, i) => { const done = i < Math.round(p * 4); m.position.set(done ? -.3 + i * .12 : (i - 1.5) * .25, done ? .125 : i * .025, 0); m.rotation.set(0, done ? 0 : i * .65, done ? Math.PI / 2 : 0); });
    } else if (task.id === 'papers') {
      for (let i = 0; i < 4; i++) parts.push(box(g, .22, .006, .3, paper, (i - 1.5) * .19, i * .008));
      update = p => parts.forEach((m, i) => { const done = i < Math.round(p * 4); m.position.x = done ? 0 : (i - 1.5) * .19; m.rotation.y = done ? 0 : (i - 1) * .45; });
    } else if (task.id === 'darts') {
      for (let i = 0; i < 3; i++) {
        const d = new THREE.Group(); g.add(d); parts.push(d);
        const a = i * 2.1 + 0.4, r = 0.05 + i * 0.06; d.position.set(0.02, Math.sin(a) * r, Math.cos(a) * r);
        const shaft = box(d, 0.15, 0.012, 0.012, mat(0x9a9a9a), 0.075); shaft.castShadow = false;
        box(d, 0.05, 0.05, 0.004, mat([0xc7372f, 0x2e7d4f, 0xe8c547][i]), 0.15, 0, 0); box(d, 0.05, 0.004, 0.05, mat([0xc7372f, 0x2e7d4f, 0xe8c547][i]), 0.15, 0, 0);
      }
      update = p => parts.forEach((m, i) => m.visible = i < Math.floor(p * 3 + 1e-6));
    } else if (task.id === 'paint') {
      g.rotation.y = -0.3;
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.71, 0.96), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
      pic.position.z = 0.045; pic.visible = false; g.add(pic);
      let url = null; const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
      paint = (u) => {
        if (u === url) return; url = u;
        if (!u) { pic.visible = false; return; }
        loader.load(u, (t) => { if (url !== u) return; t.colorSpace = THREE.SRGBColorSpace; pic.material.map?.dispose(); pic.material.map = t; pic.material.needsUpdate = true; pic.visible = true; });
      };
    } else if (task.id === 'bathroom') {
      const grime = new THREE.MeshBasicMaterial({ map: grimeTexture(), transparent: true, opacity: .95, depthWrite: false, side: THREE.DoubleSide });
      mirrorGrime = new THREE.Group(); g.add(mirrorGrime);
      const smear = (w, h, x, y, z, floor = false, angle = 0, parent = g) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), grime);
        m.position.set(x, y, z);
        m.rotation.set(floor ? -Math.PI / 2 : 0, 0, angle);
        m.renderOrder = 2;
        parent.add(m);
      };
      // A few streaks on the left mirror, in front of the live reflection.
      smear(.31, .45, -1.09, .96, -.325, false, -.16, mirrorGrime);
      smear(.22, .38, -.61, 1.12, -.325, false, .13, mirrorGrime);
      smear(.26, .24, -.86, .58, -.325, false, .35, mirrorGrime);
      // Remaining grime sits on the basins and floor tiles.
      smear(.23, .16, -.5, .006, .05, true, -.2);
      smear(.19, .15, .35, .006, -.05, true, .25);
      smear(.17, .13, .8, .006, .08, true, -.4);
      for (let i = 0; i < 5; i++) smear(.34 + (i % 2) * .12, .28, -1.2 + i * .6, -.885, .9 + (i * 37 % 5) * .15, true, i * .43);
      update = (p, state) => { g.visible = !!state?.active && p < 1; grime.opacity = (1 - p) * .95; };
    } else if (task.id === 'defrag') {
      g.rotation.y = Math.PI;
      const beige = mat(0xd8cfb4), dark = mat(0x2b2b2b);
      box(g, .44, .38, .4, beige, 0, .2, .05); box(g, .3, .05, .26, beige, 0, .025, .05);
      box(g, .2, .46, .44, beige, .62, .23, .05); box(g, .5, .03, .17, dark, 0, .015, .34);
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const cg = cv.getContext('2d');
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(.34, .26), new THREE.MeshBasicMaterial({ map: tex })); screen.position.set(0, .22, .252); g.add(screen);
      let last = -1;
      update = p => {
        if (p === last) return; last = p;
        cg.fillStyle = '#0000a8'; cg.fillRect(0, 0, 128, 96);
        for (let i = 0; i < 60; i++) { cg.fillStyle = i / 60 < p ? '#55ffff' : (i * 7) % 5 === 0 ? '#ff5555' : '#aaaaaa'; cg.fillRect(8 + (i % 12) * 9.5, 10 + Math.floor(i / 12) * 11, 8, 9); }
        cg.fillStyle = '#000060'; cg.fillRect(8, 74, 112, 10); cg.fillStyle = '#55ffff'; cg.fillRect(8, 74, 112 * p, 10);
        tex.needsUpdate = true;
      };
    } else {
      const crank = new THREE.Group(); g.add(crank);
      if (task.id === 'clock') g.rotation.y = Math.PI / 2;
      box(crank, .18, .028, .028, brass); box(crank, .03, .085, .035, brass, .075, .03);
      if (task.id === 'music') crank.position.set(.25, -.16, 0);
      update = p => { crank.rotation.z = p * Math.PI * 8; };
    }
    update(0); stations.set(task.id, update); if (paint) painter = paint;
  }
  return { root, mirrorGrime, update(scene = {}, painting = null) { for (const [id, update] of stations) update(scene[id]?.progress || 0, scene[id]); painter?.(painting); } };
}

export function skullBallTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
  const g = canvas.getContext('2d'); g.fillStyle = '#e6dfc8'; g.fillRect(0, 0, 256, 128);
  // Two painted skulls stay legible as the ball turns.
  for (const x of [64, 192]) {
    g.fillStyle = '#22251d'; g.beginPath(); g.ellipse(x - 13, 56, 9, 12, -.25, 0, Math.PI * 2); g.ellipse(x + 13, 56, 9, 12, .25, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(x, 66); g.lineTo(x - 5, 78); g.lineTo(x + 5, 78); g.fill();
    for (let i = -2; i <= 2; i++) g.fillRect(x + i * 7 - 2, 84, 4, 11);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
