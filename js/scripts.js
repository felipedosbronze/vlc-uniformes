// Mobile Nav
const hamburger = document.getElementById('hamburgerBtn');
const navMobile = document.getElementById('navMobile');
const navOverlay = document.getElementById('navOverlay');
const navClose = document.getElementById('navClose');

const WHATSAPP_PHONE = '5500000000000';
const ORDER_STORAGE_KEY = 'vlc_order_cart_v1';
const ORDER_CUSTOMER_KEY = 'vlc_order_customer_v1';
const ORDER_DEFAULT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'];

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

function parseBRL(priceText) {
    if (!priceText) return null;
    const raw = String(priceText).trim();
    const match = raw.match(/-?\d[\d.\s]*,\d{2}/);
    if (!match) return null;
    const normalized = match[0].replace(/\./g, '').replace(/\s/g, '').replace(',', '.');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
}

function formatBRL(value) {
    if (!Number.isFinite(value)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function loadOrderCart() {
    try {
        const raw = localStorage.getItem(ORDER_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : [];
        let changed = false;
        const normalized = list
            .filter(Boolean)
            .map(item => {
                const next = { ...item };
                if (!ORDER_DEFAULT_SIZES.includes(next.size)) {
                    next.size = 'M';
                    changed = true;
                }
                const expectedKey = `${next.category}|${next.sector}|${next.name}|${next.size}`;
                if (next.key !== expectedKey) {
                    next.key = expectedKey;
                    changed = true;
                }
                return next;
            });
        if (changed) saveOrderCart(normalized);
        return normalized;
    } catch {
        return [];
    }
}

function getOrderQuantity(cart) {
    return cart.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
}

function updateOrderCountBadges(cartOverride) {
    const cart = Array.isArray(cartOverride) ? cartOverride : loadOrderCart();
    const count = getOrderQuantity(cart);
    document.querySelectorAll('[data-order-count]').forEach(el => {
        if (count > 0) {
            el.textContent = String(count);
            el.classList.add('show');
        } else {
            el.textContent = '';
            el.classList.remove('show');
        }
    });
}

function saveOrderCart(cart) {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(cart));
    updateOrderCountBadges(cart);
}

function loadOrderCustomer() {
    try {
        const raw = localStorage.getItem(ORDER_CUSTOMER_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

function saveOrderCustomer(customer) {
    localStorage.setItem(ORDER_CUSTOMER_KEY, JSON.stringify(customer));
}

function showToast(message, action) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message"></span>
            ${action ? `<a class="toast-action" href="${action.href}">${action.label}</a>` : ''}
        </div>
    `;
    const msgEl = toast.querySelector('.toast-message');
    if (msgEl) msgEl.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    window.setTimeout(() => {
        toast.classList.remove('show');
        window.setTimeout(() => toast.remove(), 200);
    }, 2600);
}

function openAddToOrderModal(payload) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-header">
            <div class="modal-title">Adicionar ao pedido</div>
            <button type="button" class="modal-close" aria-label="Fechar">&#10005;</button>
        </div>
        <div class="modal-body">
            <div class="modal-product">
                <div class="modal-product-name"></div>
                <div class="modal-product-meta"></div>
            </div>
            <div class="modal-grid">
                <div class="form-group">
                    <label for="orderAddSize">Tamanho</label>
                    <select id="orderAddSize"></select>
                </div>
                <div class="form-group">
                    <label for="orderAddQty">Quantidade</label>
                    <input id="orderAddQty" type="number" min="1" step="1" value="1">
                </div>
            </div>
        </div>
        <div class="modal-actions">
            <button type="button" class="btn btn-outline-dark modal-secondary">Cancelar</button>
            <button type="button" class="btn btn-dark modal-primary">Adicionar</button>
        </div>
    `;

    const nameEl = modal.querySelector('.modal-product-name');
    if (nameEl) nameEl.textContent = payload.name;
    const metaEl = modal.querySelector('.modal-product-meta');
    if (metaEl) metaEl.textContent = payload.price ? `${payload.sector} • ${payload.price}` : payload.sector;

    const sizeSelect = modal.querySelector('#orderAddSize');
    const sizes = ORDER_DEFAULT_SIZES.slice();
    sizes.forEach(size => {
        const opt = document.createElement('option');
        opt.value = size;
        opt.textContent = size;
        if (size === 'M') opt.selected = true;
        sizeSelect.appendChild(opt);
    });

    const close = () => overlay.remove();
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => {
        if (e.target === overlay) close();
    });
    const cancelBtn = modal.querySelector('.modal-secondary');
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    const addBtn = modal.querySelector('.modal-primary');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const size = sizeSelect.value || 'M';
            const qtyInput = modal.querySelector('#orderAddQty');
            const qtyValue = qtyInput ? Number(qtyInput.value) : 1;
            const quantity = Number.isFinite(qtyValue) && qtyValue > 0 ? Math.floor(qtyValue) : 1;

            const cart = loadOrderCart();
            const key = `${payload.category}|${payload.sector}|${payload.name}|${size}`;
            const existing = cart.find(i => i && i.key === key);
            const priceValue = parseBRL(payload.price);

            if (existing) {
                existing.quantity = (Number(existing.quantity) || 0) + quantity;
            } else {
                cart.push({
                    key,
                    category: payload.category,
                    sector: payload.sector,
                    name: payload.name,
                    priceText: payload.price || '',
                    priceValue,
                    size,
                    quantity
                });
            }

            saveOrderCart(cart);
            close();
            showToast('Item adicionado ao pedido', { href: 'pedidos.html', label: 'Ver pedido' });
        });
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function parseOrderPayloadFromEl(el) {
    const raw = el.getAttribute('data-order');
    if (!raw) return null;
    try {
        return JSON.parse(decodeURIComponent(raw));
    } catch {
        return null;
    }
}

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
        const url = new URL('assets/products.json', window.location.href);
        const buildId = document.querySelector('meta[name="build"]')?.content;
        url.searchParams.set('v', buildId || '1');
        const response = await fetch(url.toString(), { cache: 'no-store' });
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
                                <th>Peça</th>
                                <th style="width:130px;">Valor Unit.</th>
                                <th style="width:160px;">Pedido</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sector.items.map(item => `
                                <tr>
                                    <td class="col-img"><div class="product-img-placeholder">foto</div></td>
                                    <td class="product-name">${item.name}</td>
                                    <td class="product-price">${item.price}</td>
                                    <td>
                                        <button type="button" class="btn btn-dark btn-sm add-to-order-btn" data-order="${encodeURIComponent(JSON.stringify({ category: categoryId, sector: sector.sector, name: item.name, price: item.price }))}">
                                            Adicionar
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        panel.appendChild(sectorBlock);

        sectorBlock.querySelectorAll('.add-to-order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const payload = parseOrderPayloadFromEl(btn);
                if (!payload) return;
                openAddToOrderModal(payload);
            });
        });
    });

    // We no longer set maxHeight on load, keeping them collapsed.
}

function applyPhoneMask(input) {
    if (!input) return;
    input.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
        else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
        else if (v.length > 0) v = `(${v}`;
        e.target.value = v;
    });
}

function computeOrderSummary(cart) {
    const totals = {
        lines: cart.length,
        quantity: 0,
        withPrice: 0,
        withoutPrice: 0,
        totalValue: 0
    };
    cart.forEach(i => {
        const qty = Number(i.quantity) || 0;
        totals.quantity += qty;
        if (Number.isFinite(i.priceValue)) {
            totals.withPrice += 1;
            totals.totalValue += i.priceValue * qty;
        } else {
            totals.withoutPrice += 1;
        }
    });
    return totals;
}

function renderOrderCart() {
    const container = document.getElementById('orderCartContainer');
    if (!container) return;

    const cart = loadOrderCart();
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="placeholder-panel order-empty">
                <h3>Seu pedido está <strong>vazio</strong></h3>
                <p>Vá no catálogo e clique em <strong>Adicionar</strong> para montar seu pedido.</p>
                <a href="catalogo.html" class="btn btn-dark">Ir para o Catálogo</a>
            </div>
        `;
        return;
    }

    const summary = computeOrderSummary(cart);
    container.innerHTML = `
        <div class="order-table-wrapper">
            <table class="order-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="width:140px;">Tamanho</th>
                        <th style="width:120px;">Qtd</th>
                        <th style="width:140px;">Valor</th>
                        <th style="width:140px;">Subtotal</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${cart.map(i => {
                        const valueText = i.priceText ? i.priceText : 'Sob consulta';
                        const hasValue = Number.isFinite(i.priceValue);
                        const subtotal = hasValue ? formatBRL(i.priceValue * (Number(i.quantity) || 0)) : '—';
                        return `
                            <tr data-key="${i.key}">
                                <td>
                                    <div class="order-item-name">${i.name}</div>
                                    <div class="order-item-meta">${i.sector}</div>
                                </td>
                                <td>
                                    <select class="order-size">
                                        ${ORDER_DEFAULT_SIZES.map(s => `<option value="${s}" ${s === i.size ? 'selected' : ''}>${s}</option>`).join('')}
                                    </select>
                                </td>
                                <td><input class="order-qty" type="number" min="1" step="1" value="${Number(i.quantity) || 1}"></td>
                                <td class="order-price">${valueText}</td>
                                <td class="order-subtotal">${subtotal}</td>
                                <td><button type="button" class="order-remove" aria-label="Remover">&#10005;</button></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div class="order-summary">
            <div class="order-summary-row">
                <span>Itens</span>
                <strong>${summary.quantity}</strong>
            </div>
            <div class="order-summary-row">
                <span>Total (com valores)</span>
                <strong>${formatBRL(summary.totalValue)}</strong>
            </div>
            ${summary.withoutPrice > 0 ? `<div class="order-summary-note">${summary.withoutPrice} item(ns) sem valor (sob consulta)</div>` : ''}
        </div>
    `;

    container.querySelectorAll('.order-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            if (!row) return;
            const key = row.getAttribute('data-key');
            const next = loadOrderCart().filter(i => i && i.key !== key);
            saveOrderCart(next);
            renderOrderCart();
        });
    });

    container.querySelectorAll('.order-size').forEach(select => {
        select.addEventListener('change', () => {
            const row = select.closest('tr');
            if (!row) return;
            const key = row.getAttribute('data-key');
            const cart = loadOrderCart();
            const item = cart.find(i => i && i.key === key);
            if (!item) return;
            const nextSize = select.value || 'M';
            const nextKey = `${item.category}|${item.sector}|${item.name}|${nextSize}`;
            const existing = cart.find(i => i && i.key === nextKey);
            if (existing && existing !== item) {
                existing.quantity = (Number(existing.quantity) || 0) + (Number(item.quantity) || 0);
                const filtered = cart.filter(i => i && i.key !== key);
                saveOrderCart(filtered);
                renderOrderCart();
                return;
            }
            item.size = nextSize;
            item.key = nextKey;
            saveOrderCart(cart);
            renderOrderCart();
        });
    });

    container.querySelectorAll('.order-qty').forEach(input => {
        input.addEventListener('change', () => {
            const row = input.closest('tr');
            if (!row) return;
            const key = row.getAttribute('data-key');
            const cart = loadOrderCart();
            const item = cart.find(i => i && i.key === key);
            if (!item) return;
            const qtyValue = Number(input.value);
            const qty = Number.isFinite(qtyValue) && qtyValue > 0 ? Math.floor(qtyValue) : 1;
            item.quantity = qty;
            saveOrderCart(cart);
            renderOrderCart();
        });
    });
}

function initOrdersPage() {
    const page = document.getElementById('ordersPage');
    if (!page) return;

    const customer = loadOrderCustomer();
    const nameInput = document.getElementById('orderName');
    const companyInput = document.getElementById('orderCompany');
    const phoneInput = document.getElementById('orderPhone');
    const segmentInput = document.getElementById('orderSegment');
    const notesInput = document.getElementById('orderNotes');

    if (customer) {
        if (nameInput) nameInput.value = customer.name || '';
        if (companyInput) companyInput.value = customer.company || '';
        if (phoneInput) phoneInput.value = customer.phone || '';
        if (segmentInput) segmentInput.value = customer.segment || '';
        if (notesInput) notesInput.value = customer.notes || '';
    }

    applyPhoneMask(phoneInput);

    const form = document.getElementById('orderCustomerForm');
    if (form) {
        form.addEventListener('input', () => {
            saveOrderCustomer({
                name: nameInput ? nameInput.value : '',
                company: companyInput ? companyInput.value : '',
                phone: phoneInput ? phoneInput.value : '',
                segment: segmentInput ? segmentInput.value : '',
                notes: notesInput ? notesInput.value : ''
            });
        });
    }

    const clearBtn = document.getElementById('orderClearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            saveOrderCart([]);
            renderOrderCart();
            showToast('Pedido limpo');
        });
    }

    const finalizeBtn = document.getElementById('orderFinalizeBtn');
    if (finalizeBtn) {
        finalizeBtn.addEventListener('click', () => {
            const cart = loadOrderCart();
            if (cart.length === 0) {
                showToast('Adicione itens no catálogo para finalizar', { href: 'catalogo.html', label: 'Ir ao catálogo' });
                return;
            }
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) {
                showToast('Informe seu nome para finalizar');
                if (nameInput) nameInput.focus();
                return;
            }

            const company = companyInput ? companyInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const segment = segmentInput ? segmentInput.value : '';
            const notes = notesInput ? notesInput.value.trim() : '';
            const summary = computeOrderSummary(cart);

            let msg = `*Pedido - VLC Uniformes*\n\n`;
            msg += `*Nome:* ${name}\n`;
            if (company) msg += `*Empresa:* ${company}\n`;
            if (phone) msg += `*Telefone:* ${phone}\n`;
            if (segment) msg += `*Segmento:* ${segment}\n`;
            msg += `\n*Itens:*\n`;

            cart.forEach((i, idx) => {
                const qty = Number(i.quantity) || 0;
                const size = i.size || 'M';
                const priceText = i.priceText ? i.priceText : 'Sob consulta';
                const hasValue = Number.isFinite(i.priceValue);
                const subtotal = hasValue ? formatBRL(i.priceValue * qty) : '—';
                msg += `${idx + 1}. ${i.name}\n   Setor: ${i.sector}\n   Tam: ${size} | Qtd: ${qty} | Valor: ${priceText} | Subtotal: ${subtotal}\n`;
            });

            msg += `\n*Resumo:*\n`;
            msg += `Itens: ${summary.quantity}\n`;
            msg += `Total (com valores): ${formatBRL(summary.totalValue)}\n`;
            if (summary.withoutPrice > 0) msg += `Sem valor (sob consulta): ${summary.withoutPrice}\n`;
            if (notes) msg += `\n*Observações:*\n${notes}\n`;

            window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
        });
    }

    renderOrderCart();
}

// Init everything
document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        await loadProducts();

        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) switchCatalog(tab);

        initOrdersPage();
        updateOrderCountBadges();
    })();
});

// Active nav on scroll
const sections = document.querySelectorAll('section[id], .catalog-section[id]');
const navLinks = document.querySelectorAll('.nav-desktop a');
const isSinglePageNav = Array.from(navLinks).some(l => l.getAttribute('href') === '#inicio');

window.addEventListener('scroll', () => {
    let current = '';
    if (isSinglePageNav) {
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 150) current = s.getAttribute('id');
        });
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
    }

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
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, '_blank');
}

// Phone mask
applyPhoneMask(document.getElementById('telefone'));

// Resize fix
window.addEventListener('resize', () => {
    document.querySelectorAll('.sector-content:not(.collapsed)').forEach(c => {
        c.style.maxHeight = c.scrollHeight + 'px';
    });
});
