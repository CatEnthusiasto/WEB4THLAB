const API_URL = "https://69e5a13bce4e908a155e3105.mockapi.io/products";

let products = [];
let deviceId = null;
let syncInterval = null;

// DOM элементы
const statusText = document.getElementById('statusText');
const deviceIcon = document.getElementById('deviceIcon');
const deviceName = document.getElementById('deviceName');
const productName = document.getElementById('productName');
const price = document.getElementById('price');
const sales = document.getElementById('sales');
const category = document.getElementById('category');
const addBtn = document.getElementById('addBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const refreshBtn = document.getElementById('refreshBtn');
const tableBody = document.getElementById('tableBody');
const totalCount = document.getElementById('totalCount');
const avgPrice = document.getElementById('avgPrice');
const totalSales = document.getElementById('totalSales');
const logDiv = document.getElementById('log');

function addLog(msg, isError = false) {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.style.color = isError ? '#ef4444' : '#94a3b8';
    div.textContent = `[${time}] ${msg}`;
    logDiv.insertBefore(div, logDiv.firstChild);
    while (logDiv.children.length > 20) logDiv.removeChild(logDiv.lastChild);
}

function detectDevice() {
    const isMobile = /android|iPad|iPhone|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        deviceIcon.textContent = '📱';
        deviceName.textContent = /iPhone|iPad/i.test(navigator.userAgent) ? 'iPhone' : 'Android';
    } else {
        deviceIcon.textContent = '💻';
        deviceName.textContent = 'Компьютер';
    }
    deviceId = deviceName.textContent;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderTable() {
    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty">Нет данных. Добавьте первый товар!</td></tr>';
        updateStats();
        return;
    }
    
    let html = '';
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        html += `
            <tr>
                <td>${escapeHtml(p.name)}</td>
                <td>${p.price.toLocaleString()} ₽</td>
                <td>${p.sales.toLocaleString()}</td>
                <td>${escapeHtml(p.category)}</td>
                <td><button class="delete-btn" data-id="${p.id}">Удалить</button></td>
            </tr>
        `;
    }
    tableBody.innerHTML = html;
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => deleteProduct(btn.dataset.id);
    });
    
    updateStats();
}

function updateStats() {
    const total = products.length;
    let sumPrice = 0, sumSales = 0;
    for (let i = 0; i < products.length; i++) {
        sumPrice += products[i].price;
        sumSales += products[i].sales;
    }
    totalCount.textContent = total;
    avgPrice.textContent = total > 0 ? (sumPrice / total).toFixed(0) : 0;
    totalSales.textContent = sumSales;
}

// ========== РАБОТА С MOCKAPI ==========
async function loadFromAPI() {
    try {
        statusText.textContent = 'Загрузка...';
        addLog(`📡 Запрос к API...`);
        
        const response = await fetch(API_URL);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        products = data || [];
        renderTable();
        
        addLog(`✅ Загружено ${products.length} товаров`);
        statusText.textContent = 'Онлайн';
        
    } catch (error) {
        addLog(`❌ Ошибка загрузки: ${error.message}`, true);
        statusText.textContent = 'Ошибка';
    }
}

async function addToAPI(product) {
    try {
        addLog(`📤 Отправка: "${product.name}"...`);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        addLog(`✅ Добавлен: "${product.name}"`);
        await loadFromAPI();
        
    } catch (error) {
        addLog(`❌ Ошибка добавления: ${error.message}`, true);
    }
}

async function deleteFromAPI(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        addLog(`🗑️ Удален товар`);
        await loadFromAPI();
        
    } catch (error) {
        addLog(`❌ Ошибка удаления: ${error.message}`, true);
    }
}

async function clearAll() {
    if (!confirm('Удалить ВСЕ товары на ВСЕХ устройствах?')) return;
    
    try {
        addLog(`📤 Очистка всех данных...`);
        
        // Удаляем каждый товар по отдельности
        for (let i = 0; i < products.length; i++) {
            await fetch(`${API_URL}/${products[i].id}`, { method: 'DELETE' });
        }
        
        addLog(`🗑️ Все данные очищены`);
        await loadFromAPI();
        
    } catch (error) {
        addLog(`❌ Ошибка очистки: ${error.message}`, true);
    }
}

// ========== ДЕЙСТВИЯ ==========
function addProduct() {
    const name = productName.value.trim();
    const priceVal = parseFloat(price.value);
    const salesVal = parseInt(sales.value);
    const categoryVal = category.value;
    
    if (!name) { alert('Введите название товара'); return; }
    if (isNaN(priceVal) || priceVal <= 0) { alert('Введите цену > 0'); return; }
    if (isNaN(salesVal) || salesVal < 0) { alert('Введите количество продаж'); return; }
    
    addToAPI({
        name: name,
        price: priceVal,
        sales: salesVal,
        category: categoryVal,
        device: deviceId,
        created_at: new Date().toISOString()
    });
    
    productName.value = '';
    price.value = '';
    sales.value = '';
    productName.focus();
}

function deleteProduct(id) {
    deleteFromAPI(id);
}

function loadSample() {
    if (products.length > 0 && !confirm('Заменить текущие данные на примерные?')) return;
    
    const samples = [
        { name: 'Платье летнее цветочное', price: 2500, sales: 45, category: 'Платья', device: deviceId, created_at: new Date().toISOString() },
        { name: 'Футболка белая хлопок', price: 1200, sales: 120, category: 'Футболки', device: deviceId, created_at: new Date().toISOString() },
        { name: 'Куртка зимняя пуховик', price: 8500, sales: 8, category: 'Куртки', device: deviceId, created_at: new Date().toISOString() },
        { name: 'Джинсы скинни синие', price: 3500, sales: 65, category: 'Джинсы', device: deviceId, created_at: new Date().toISOString() },
        { name: 'Свитер шерстяной', price: 3200, sales: 35, category: 'Свитера', device: deviceId, created_at: new Date().toISOString() }
    ];
    
    (async () => {
        for (let i = 0; i < samples.length; i++) {
            await addToAPI(samples[i]);
        }
    })();
}

// ========== АВТООБНОВЛЕНИЕ ==========
function startAutoRefresh() {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(loadFromAPI, 3000);
    addLog(`📡 Автообновление каждые 3 секунды`);
}

// ========== ЗАПУСК ==========
async function init() {
    detectDevice();
    addLog(`🚀 Запуск на ${deviceName.textContent}`);
    addLog(`📡 API: ${API_URL}`);
    
    await loadFromAPI();
    startAutoRefresh();
    
    addBtn.onclick = addProduct;
    clearBtn.onclick = clearAll;
    sampleBtn.onclick = loadSample;
    refreshBtn.onclick = loadFromAPI;
    
    productName.onkeypress = (e) => { if (e.key === 'Enter') addProduct(); };
    price.onkeypress = (e) => { if (e.key === 'Enter') addProduct(); };
    sales.onkeypress = (e) => { if (e.key === 'Enter') addProduct(); };
}

init();