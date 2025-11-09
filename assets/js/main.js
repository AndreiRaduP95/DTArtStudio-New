document.addEventListener('DOMContentLoaded', async () => {
  // ------------------- Load projects JSON -------------------
  let PROJECTS = [];
  try {
    const res = await fetch('assets/data/projects.json');
    PROJECTS = await res.json();

    const s = new URLSearchParams(location.search);
    const q = s.get('q');
    let cat = s.get('cat');

    // Filter by search query
    if (q) {
      PROJECTS = PROJECTS.filter(p =>
        p.title.toLowerCase().includes(q.toLowerCase())
      );
    }
    
    // Filter by category
    if (cat) {
      cat = decodeURIComponent(cat).trim().toLowerCase();
      PROJECTS = PROJECTS.filter(
        p => p.category && p.category.trim().toLowerCase() === cat
      );
    }

    window.PROJECTS = PROJECTS; // make global for modal
  } catch (err) {
    console.error('Failed to load projects.json', err);
  }

  // ------------------- Pagination Setup -------------------
  const list = document.getElementById('projects-list');
  const pagination = document.getElementById('pagination');
  const perPage = 10;
  let currentPage = 1;

  function renderProjects() {
    if (!list || !PROJECTS.length) return;
    list.innerHTML = '';

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageProjects = PROJECTS.slice(start, end);

    pageProjects.forEach(p => {
      const el = document.createElement('article');
      el.className = 'card';
      el.innerHTML = `
        <img src="${p.images[0]}.jpg" alt="${p.title}" />
        <div class="card-body">
          <h4>${p.title}</h4>
          <p class="mt-2">${p.subtitle || ''}</p>
          <div class="card-actions">
            <span style="color:var(--muted)">Categorie: ${p.category}</span>
            <button class="btn" data-open-modal="${p.id}">Vezi mai mult</button>
          </div>
        </div>
      `;
      list.appendChild(el);
    });

    renderPaginationButtons();
    setupModalTriggers();
  }

  function renderPaginationButtons() {
    if (!pagination) return;
    const totalPages = Math.ceil(PROJECTS.length / perPage);
    pagination.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹ Înapoi';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      currentPage--;
      renderProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.disabled = true;
      btn.onclick = () => {
        currentPage = i;
        renderProjects();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      pagination.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Înainte ›';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      currentPage++;
      renderProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    pagination.appendChild(nextBtn);
  }

  // ------------------- Dropdowns -------------------
  // document.querySelectorAll('.dropdown').forEach(drop => {
  //   const btn = drop.querySelector('.drop-btn');
  //   const menu = drop.querySelector('.dropdown-menu');

  //   btn.addEventListener('click', e => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     menu.classList.toggle('show');
  //   });
  //   menu.addEventListener('click', e => e.stopPropagation());
  // });
  document.querySelectorAll('.dropdown').forEach(drop => {
  const btn = drop.querySelector('.drop-btn');
  const menu = drop.querySelector('.dropdown-menu');

  btn.addEventListener('click', e => {
    // Only toggle dropdown if the user holds Alt/Shift (or you can remove this entirely)
    // Otherwise, let the link navigate normally
    // e.preventDefault(); <-- REMOVE this line to allow full projects to load
    menu.classList.toggle('show');
  });

  menu.addEventListener('click', e => e.stopPropagation());
});

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
});

 // ------------------- Modal Logic -------------------
function setupModalTriggers() {
  const modal = document.getElementById('project-modal');
  const galleryImg = modal.querySelector('.gallery img');
  const techEl = modal.querySelector('.tech');
  let projectImages = [];
  let pos = 0;

  // Swipe variables
  let touchStartX = 0;
  let touchEndX = 0;

  // Show image at position
  function show(i) {
    pos = (i + projectImages.length) % projectImages.length;
    galleryImg.src = projectImages[pos];
  }

  // Open modal
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.openModal;
      const project = window.PROJECTS?.find(p => String(p.id) === String(id));
      if (!project) return;

      // Load all images from folder
      projectImages = await loadProjectImages(project.images[0]);
      pos = 0;
      galleryImg.src = projectImages[pos];
      techEl.innerHTML = generateTable(project.tech || {});
      modal.style.display = 'flex';
    });
  });

  // Prev/Next buttons
  modal.querySelector('.modal-prev').onclick = () => show(pos - 1);
  modal.querySelector('.modal-next').onclick = () => show(pos + 1);

  // Close modal
  modal.querySelector('.modal-close').onclick = () => (modal.style.display = 'none');

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (modal.style.display === 'flex') {
      if (e.key === 'ArrowLeft') show(pos - 1);
      if (e.key === 'ArrowRight') show(pos + 1);
      if (e.key === 'Escape') modal.style.display = 'none';
    }
  });

  // Click outside modal to close
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // ---------------- Touch Swipe ----------------
  galleryImg.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  });

  galleryImg.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    const minSwipe = 50; // minimum px for a swipe

    if (swipeDistance > minSwipe) {
      show(pos - 1); // swipe right -> previous image
    } else if (swipeDistance < -minSwipe) {
      show(pos + 1); // swipe left -> next image
    }
  }
}

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', setupModalTriggers);


  // ------------------- Search -------------------
  const searchForm = document.getElementById('site-search');
  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const q = searchForm.querySelector('input').value.trim();
      if (!q) return;
      window.location.href = 'proiecte.html?q=' + encodeURIComponent(q);
    });
  }

  // ------------------- Carousel (if any) -------------------
  document.querySelectorAll('.carousel-track').forEach(t => {
    const slides = t.querySelectorAll('.slide');
    let index = 0;

    function go(i) {
      index = (i + slides.length) % slides.length;
      t.style.transform = `translateX(${-index * 100}%)`;
      slides.forEach((s, si) => (s.style.transform = `translateX(${(si - index) * 100}%)`));
    }

    let timer = setInterval(() => go(index + 1), 3000);
    t.addEventListener('mouseenter', () => clearInterval(timer));
    t.addEventListener('mouseleave', () => (timer = setInterval(() => go(index + 1), 3000)));
  });

  // ------------------- Helpers -------------------
  function generateTable(obj) {
    if (!obj || Object.keys(obj).length === 0)
      return '<em style="color:#6b7280;padding:12px;display:block">Nicio descriere tehnica disponibila.</em>';
    return (
      '<table style="width:100%;border-collapse:collapse">' +
      Object.entries(obj)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 12px;border-top:1px solid #f1f5f9;font-weight:600">${k}</td><td style="padding:8px 12px;border-top:1px solid #f1f5f9">${v}</td></tr>`
        )
        .join('') +
      '</table>'
    );
  }

  async function loadProjectImages(firstImagePath) {
    const folder = firstImagePath.substring(0, firstImagePath.lastIndexOf('/'));
    const images = [];
    let i = 1;
    while (true) {
      const path = `${folder}/${i}.jpg`;
      try {
        const res = await fetch(path, { method: 'HEAD' });
        if (res.ok) {
          images.push(path);
          i++;
        } else break;
      } catch (e) {
        break;
      }
    }
    return images.length ? images : [firstImagePath];
  }

  // ------------------- Initial Render -------------------
  renderProjects();
});
