// Mobile Nav
const hamburger = document.getElementById('hamburgerBtn');
const navMobile = document.getElementById('navMobile');
const navOverlay = document.getElementById('navOverlay');
const navClose = document.getElementById('navClose');

function openMobile() {
    if (!navMobile || !navOverlay || !hamburger) return;
    navMobile.classList.add('open');
    navOverlay.classList.add('show');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobile() {
    if (!navMobile || !navOverlay || !hamburger) return;
    navMobile.classList.remove('open');
    navOverlay.classList.remove('show');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
}

if (hamburger && navMobile) {
    hamburger.addEventListener('click', () => {
        navMobile.classList.contains('open') ? closeMobile() : openMobile();
    });
}
if (navClose) navClose.addEventListener('click', closeMobile);
if (navOverlay) navOverlay.addEventListener('click', closeMobile);

// Catalog Tabs
function switchCatalog(tab) {
    const catalog = document.getElementById('catalogo');
    
    // If we are not on a page with the catalog, redirect to catalogo.html with the tab param
    if (!catalog) {
        window.location.href = `catalogo.html?tab=${encodeURIComponent(tab)}`;
        return;
    }

    document.querySelectorAll('.catalog-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.catalog-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const target = document.getElementById('panel-' + tab);
    if (target) target.classList.add('active');

    const rect = catalog.getBoundingClientRect();
    if (rect.top < -100 || rect.top > window.innerHeight) {
        const header = document.querySelector('.header');
        const offset = header ? header.offsetHeight + 10 : 70;
        window.scrollTo({ top: catalog.offsetTop - offset, behavior: 'smooth' });
    }
}

// Sector Accordion
function toggleSector(headerEl) {
    const content = headerEl.nextElementSibling;
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
        headerEl.classList.remove('collapsed');
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        requestAnimationFrame(() => {
            content.classList.add('collapsed');
            headerEl.classList.add('collapsed');
        });
    }
}

// Dynamic Catalog Loading
async function loadProducts() {
    try {
        if (window.location.protocol === 'file:') {
            throw new Error('FILE_PROTOCOL_BLOCK');
        }
        const url = new URL('assets/products.json', window.location.href).toString();
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Falha ao carregar products.json (HTTP ${response.status})`);
        }
        const data = await response.json();
        renderCategory('hospital', data.hospitalar);
        renderCategory('hotel', data.hotelaria);
        renderCategory('empresa', data.empresas);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        const panelHospital = document.getElementById('panel-hospital');
        if (panelHospital) {
            if (error instanceof Error && error.message === 'FILE_PROTOCOL_BLOCK') {
                panelHospital.innerHTML = `
                    <div class="placeholder-panel">
                        <h3>Abra o site por um <strong>link</strong></h3>
                        <p>Você abriu o arquivo direto do computador (file://). Nesse modo, o navegador bloqueia o carregamento do <strong>assets/products.json</strong>.</p>
                        <a href="index.html" class="btn btn-dark">Voltar</a>
                    </div>
                `;
                return;
            }
            panelHospital.innerHTML = `
                <div class="placeholder-panel">
                    <h3>Não foi possível carregar o <strong>Catálogo</strong></h3>
                    <p>Isso normalmente acontece quando o arquivo <strong>assets/products.json</strong> não está disponível no servidor ou foi publicado incompleto.</p>
                    <a href="catalogo.html" class="btn btn-dark">Recarregar</a>
                </div>
            `;
        }
    }
}

function renderCategory(categoryId, sectors) {
    const panel = document.getElementById('panel-' + categoryId);
    if (!panel || !sectors || sectors.length === 0) return;

    panel.innerHTML = ''; // Clear placeholder or existing content

    sectors.forEach(sector => {
        const sectorBlock = document.createElement('div');
        sectorBlock.className = 'sector-block';

        sectorBlock.innerHTML = `
            <div class="sector-header collapsed" onclick="toggleSector(this)">
                <h3>${sector.sector} <span class="sector-item-count">${sector.items.length} itens</span></h3>
                <span class="sector-toggle">&#9650;</span>
            </div>
            <div class="sector-content collapsed">
                <div class="product-table-wrapper">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th class="col-img" style="width:120px;">Foto</th>
                                <th>Peca</th>
                                <th style="width:130px;">Valor Unit.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sector.items.map(item => `
                                <tr>
                                    <td class="col-img"><div class="product-img-placeholder">foto</div></td>
                                    <td class="product-name">${item.name}</td>
                                    <td class="product-price">${item.price}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        panel.appendChild(sectorBlock);
    });

    // We no longer set maxHeight on load, keeping them collapsed.
}

// Init everything
document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        await loadProducts();

        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) switchCatalog(tab);
    })();
});

// Active nav on scroll
const sections = document.querySelectorAll('section[id], .catalog-section[id]');
const navLinks = document.querySelectorAll('.nav-desktop a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 150) current = s.getAttribute('id');
    });
    navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });

    // Back to top
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    }

    // Header shadow
    const header = document.getElementById('header');
    if (header) {
        header.style.boxShadow =
            window.scrollY > 10 ? '0 2px 10px rgba(0,0,0,0.08)' : 'none';
    }
});

// Smooth scroll offset
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const header = document.querySelector('.header');
            const offset = header ? header.offsetHeight + 10 : 70;
            window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
            
            // Close mobile menu if open
            if (navMobile && navMobile.classList.contains('open')) {
                closeMobile();
            }
        }
    });
});

// Form
function handleFormSubmit(e) {
    e.preventDefault();
    const d = id => document.getElementById(id).value;
    let msg = `*Solicitacao de Orcamento - VLC Uniformes*%0A%0A`;
    msg += `*Nome:* ${d('nome')}%0A`;
    if (d('empresa')) msg += `*Empresa:* ${d('empresa')}%0A`;
    msg += `*E-mail:* ${d('email')}%0A`;
    msg += `*Telefone:* ${d('telefone')}%0A`;
    if (d('segmento')) msg += `*Segmento:* ${d('segmento')}%0A`;
    if (d('mensagem')) msg += `*Mensagem:* ${d('mensagem')}%0A`;
    window.open(`https://wa.me/5500000000000?text=${msg}`, '_blank');
}

// Phone mask
const phoneInput = document.getElementById('telefone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
        else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
        else if (v.length > 0) v = `(${v}`;
        e.target.value = v;
    });
}

// Resize fix
window.addEventListener('resize', () => {
    document.querySelectorAll('.sector-content:not(.collapsed)').forEach(c => {
        c.style.maxHeight = c.scrollHeight + 'px';
    });
});
