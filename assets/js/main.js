document.addEventListener('DOMContentLoaded', async () => {

  // ------------------- Load projects JSON -------------------
  let PROJECTS = [];
  try {
    const res = await fetch('assets/data/projects.json');
    PROJECTS = await res.json();

    const s = new URLSearchParams(location.search);
    const q = s.get('q');
    const cat = s.get('cat');
    if(q) PROJECTS = PROJECTS.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
    if(cat) PROJECTS = PROJECTS.filter(p => p.category === cat);

    window.PROJECTS = PROJECTS; // make global for modal

  } catch(err) {
    console.error('Failed to load projects.json', err);
  }

  // ------------------- Build project cards -------------------
  const list = document.getElementById('projects-list');
  if(PROJECTS.length && list){
    list.innerHTML = '';
    PROJECTS.forEach(p => {
      const el = document.createElement('article');
      el.className = 'card';
      el.style.minWidth = '300px';
      el.style.flex = '0 0 auto';
      el.style.border = '1px solid #ddd';
      el.style.borderRadius = '10px';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      el.style.overflow = 'hidden';
      el.innerHTML = `
        <img src="${p.images[0]}.jpg" alt="${p.title}" style="width:100%;height:200px;object-fit:cover;">
        <div class="card-body" style="padding:12px;">
          <h4>${p.title}</h4>
          <p class="mt-2">${p.subtitle || ''}</p>
          <div class="card-actions" style="margin-top:8px; display:flex;justify-content:space-between;align-items:center;">
            <span style="color:var(--muted)">Categorie: ${p.category}</span>
            <button class="btn" data-open-modal="${p.id}" style="padding:6px 12px;border-radius:6px;background:#0ea5a4;color:#fff;border:none;cursor:pointer;">Vezi mai mult</button>
          </div>
        </div>
      `;
      list.appendChild(el);
    });
  }

  // ------------------- Dropdowns -------------------
  document.querySelectorAll('.dropdown').forEach(drop => {
    const btn = drop.querySelector('.drop-btn');
    const menu = drop.querySelector('.dropdown-menu');

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    menu.addEventListener('click', e => e.stopPropagation());
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
  });

  // ------------------- Modal -------------------
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.openModal;
      const modal = document.getElementById('project-modal');
      const project = window.PROJECTS?.find(p => String(p.id) === String(id));
      if(project){
        const galleryImg = modal.querySelector('.gallery img');
        const techEl = modal.querySelector('.tech');

        // Load all images from folder
        const images = await loadProjectImages(project.images[0]);
        project.images = images;

        let pos = 0;
        galleryImg.src = project.images[pos];
        techEl.innerHTML = generateTable(project.tech || {});
        modal.style.display = 'flex';

        function show(i){
          pos = (i + project.images.length) % project.images.length;
          galleryImg.src = project.images[pos];
        }

        modal.querySelector('.modal-prev').onclick = () => show(pos-1);
        modal.querySelector('.modal-next').onclick = () => show(pos+1);
      }
    });
  });

  document.querySelectorAll('.modal-close').forEach(b => {
    b.addEventListener('click', () => document.getElementById('project-modal').style.display='none');
  });

  // ------------------- Search -------------------
  const searchForm = document.getElementById('site-search');
  if(searchForm){
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchForm.querySelector('input').value.trim();
      if(!q) return;
      window.location.href = 'proiecte.html?q=' + encodeURIComponent(q);
    });
  }

  // ------------------- Carousel (if any) -------------------
  document.querySelectorAll('.carousel-track').forEach(t => {
    const slides = t.querySelectorAll('.slide');
    let index = 0;

    function go(i){
      index = (i + slides.length) % slides.length;
      t.style.transform = `translateX(${-index*100}%)`;
      slides.forEach((s,si)=>s.style.transform = `translateX(${(si-index)*100}%)`);
    }

    let timer = setInterval(()=>go(index+1), 3000);
    t.addEventListener('mouseenter', ()=>clearInterval(timer));
    t.addEventListener('mouseleave', ()=>timer = setInterval(()=>go(index+1), 3000));
  });

  // ------------------- Helpers -------------------
  function generateTable(obj){
    if(!obj || Object.keys(obj).length === 0)
      return '<em style="color:#6b7280;padding:12px;display:block">Nicio descriere tehnica disponibila.</em>';
    return '<table style="width:100%;border-collapse:collapse">' +
      Object.entries(obj).map(([k,v]) => `<tr><td style="padding:8px 12px;border-top:1px solid #f1f5f9;font-weight:600">${k}</td><td style="padding:8px 12px;border-top:1px solid #f1f5f9">${v}</td></tr>`).join('') +
      '</table>';
  }

  async function loadProjectImages(firstImagePath){
    const folder = firstImagePath.substring(0, firstImagePath.lastIndexOf('/'));
    const images = [];
    let i = 1;
    while(true){
      const path = `${folder}/${i}.jpg`;
      try{
        const res = await fetch(path, {method:'HEAD'});
        if(res.ok){ images.push(path); i++; } else break;
      } catch(e){ break; }
    }
    return images.length ? images : [firstImagePath];
  }

});
