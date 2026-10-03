<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import api from './api/api'
import { products as mockProducts, categories as mockCategories } from './data/products'
import {
  Cpu, Monitor, CircuitBoard, MemoryStick, HardDrive, Zap, Box, Fan,
  Search, Trash2, Save, Moon, Sun, Menu, X, CheckCircle2, AlertTriangle,
  ChevronDown, Plus, Minus, RotateCcw, Gauge, Wallet, Sparkles,
  PackageCheck, ArrowRight, GitCompare, Bookmark, LayoutDashboard,
  Settings, Tag, ChevronLeft, Pencil, Percent,
  ExternalLink, Clock3, LogIn, LogOut
} from 'lucide-vue-next'

const iconMap = { Cpu, Monitor, CircuitBoard, MemoryStick, HardDrive, Zap, Box, Fan }
const emptyBuild = () => ({ cpu:null, gpu:null, motherboard:null, ram:null, storage:null, psu:null, case:null, cooler:null })

const activePage = ref('builder')
const activeCategory = ref('all')
const search = ref('')
const budget = ref(60000)
const maxBudget = 150000
const sortBy = ref('recommended')
const showMobileMenu = ref(false)
const showProductModal = ref(false)
const modalCategory = ref('cpu')
const dark = ref(false)
const compare = ref([])
const savedBuilds = ref([])
const toast = ref('')
const selected = ref(emptyBuild())
const quantity = ref({ ram: 1, storage: 1 })

const dbCategories = ref([])
const catalogProducts = ref([])
const selectedProduct = ref(null)
const adminMode = ref(false)
const adminAuthenticated = ref(localStorage.getItem('pc-builder-admin-authenticated') === 'true')
const adminUsername = ref(localStorage.getItem('pc-builder-admin-user') || '')
const adminLogin = ref({ username:'admin', password:'' })
const adminLoggingIn = ref(false)
const editingProductId = ref(null)
const adminSaving = ref(false)
const adminSearch = ref('')
const adminCategory = ref('all')
const adminForm = ref({
  id:'', category:'cpu', brand:'', name:'', price:0, rating:5,
  socket:'', watts:'', tier:'กลาง', specs:'', color:'#6366f1',
  image_url:'', change_note:''
})

const categories = computed(() => dbCategories.value.length ? dbCategories.value : mockCategories)
const products = computed(() => catalogProducts.value.length ? catalogProducts.value : mockProducts)
const categoryLabels = computed(() => Object.fromEntries(categories.value.map(c => [c.id, c.name])))
const money = n => new Intl.NumberFormat('th-TH').format(Number(n || 0))
const categoryIcon = category => iconMap[categories.value.find(c => c.id === category)?.icon || 'Box']

const total = computed(() => Object.entries(selected.value).reduce((sum, [key, p]) => sum + (p ? Number(p.price) * (quantity.value[key] || 1) : 0), 0))
const selectedCount = computed(() => Object.values(selected.value).filter(Boolean).length)
const estimatedWatts = computed(() => Math.ceil(((selected.value.cpu?.watts || 0) + (selected.value.gpu?.watts || 0) + 100) * 1.35))
const budgetLeft = computed(() => budget.value - total.value)
const budgetPercent = computed(() => Math.min(100, Math.round((total.value / budget.value) * 100)))

const filteredProducts = computed(() => {
  let list = products.value.filter(p => activeCategory.value === 'all' || p.category === activeCategory.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(p => `${p.brand} ${p.name} ${p.specs}`.toLowerCase().includes(q))
  if (showProductModal.value) list = list.filter(p => p.category === modalCategory.value)
  list = [...list]
  if (sortBy.value === 'priceAsc') list.sort((a,b) => Number(a.price)-Number(b.price))
  if (sortBy.value === 'priceDesc') list.sort((a,b) => Number(b.price)-Number(a.price))
  if (sortBy.value === 'rating') list.sort((a,b) => Number(b.rating || 0)-Number(a.rating || 0))
  return list
})

const adminProducts = computed(() => {
  let list = products.value
  if (adminCategory.value !== 'all') list = list.filter(p => p.category === adminCategory.value)
  const q = adminSearch.value.trim().toLowerCase()
  if (q) list = list.filter(p => `${p.id} ${p.brand} ${p.name}`.toLowerCase().includes(q))
  return list
})

const compatibility = computed(() => {
  const c = selected.value
  const issues = []
  if (c.cpu && c.motherboard && c.cpu.socket && c.motherboard.socket && c.cpu.socket !== c.motherboard.socket)
    issues.push(`CPU ${c.cpu.socket} ไม่ตรงกับเมนบอร์ด ${c.motherboard.socket}`)
  if (c.motherboard && c.ram && c.motherboard.ramType && c.ram.ramType && c.motherboard.ramType !== c.ram.ramType)
    issues.push(`RAM ${c.ram.ramType} ไม่ตรงกับเมนบอร์ดที่รองรับ ${c.motherboard.ramType}`)
  if (c.motherboard && c.case && c.motherboard.form === 'ATX' && c.case.form && c.case.form !== 'ATX')
    issues.push('เมนบอร์ด ATX ต้องใช้เคสที่รองรับ ATX')
  if (c.psu && c.gpu && c.psu.watts && c.gpu.watts && c.psu.watts < (c.gpu.watts + 250))
    issues.push(`PSU ${c.psu.watts}W อาจไม่เหมาะกับ GPU ที่กินไฟ ${c.gpu.watts}W`)
  if (c.psu && estimatedWatts.value > c.psu.watts) issues.push(`กำลังไฟโดยประมาณ ${estimatedWatts.value}W สูงกว่า PSU ${c.psu.watts}W`)
  return issues
})
const isCompatible = computed(() => compatibility.value.length === 0)
const performanceScore = computed(() => {
  const cpu = selected.value.cpu, gpu = selected.value.gpu
  if (!cpu && !gpu) return 0
  const cpuScore = cpu ? (cpu.tier === 'สูง' ? 85 : 62) : 0
  const gpuScore = gpu ? (gpu.tier === 'สูง' ? 92 : 68) : 0
  return Math.min(99, Math.round((cpuScore + gpuScore) / ((cpu ? 1 : 0) + (gpu ? 1 : 0))))
})

function notify(msg) { toast.value = msg; setTimeout(() => toast.value = '', 2400) }
function goPage(page) { activePage.value = page; showMobileMenu.value = false }
function selectProduct(product) { selected.value[product.category] = product; showProductModal.value = false; notify(`เลือก ${product.name} แล้ว`) }
function openPicker(category) { modalCategory.value = category; search.value = ''; showProductModal.value = true }
function removePart(category) { selected.value[category] = null }
function changeQty(category, delta) { quantity.value[category] = Math.max(1, Math.min(4, (quantity.value[category] || 1) + delta)) }
function toggleCompare(product) {
  const index = compare.value.findIndex(p => p.id === product.id)
  if (index >= 0) compare.value.splice(index, 1)
  else if (compare.value.length < 4) compare.value.push(product)
  else notify('เปรียบเทียบได้สูงสุด 4 ชิ้น')
}
function saveBuild() {
  const item = { id: Date.now(), name: `สเปค #${savedBuilds.value.length + 1}`, date: new Date().toLocaleString('th-TH'), total: total.value, parts: JSON.parse(JSON.stringify(selected.value)) }
  savedBuilds.value.unshift(item)
  localStorage.setItem('pc-builder-saved', JSON.stringify(savedBuilds.value))
  notify('บันทึกสเปคเรียบร้อย')
}
function loadBuild(build) { selected.value = JSON.parse(JSON.stringify(build.parts)); activePage.value = 'builder'; notify('โหลดสเปคเรียบร้อย') }
function deleteBuild(id) { savedBuilds.value = savedBuilds.value.filter(b => b.id !== id); localStorage.setItem('pc-builder-saved', JSON.stringify(savedBuilds.value)) }
function resetBuild() { selected.value = emptyBuild(); quantity.value = { ram:1, storage:1 }; notify('รีเซ็ตสเปคแล้ว') }
function recommendBuild() {
  const target = budget.value, pool = cat => products.value.filter(p => p.category === cat)
  const pick = (cat, condition) => pool(cat).filter(condition).sort((a,b) => Number(b.rating || 0)-Number(a.rating || 0))[0]
  const cpu = target >= 50000 ? pick('cpu', p => p.tier === 'สูง') : pick('cpu', p => Number(p.price) <= 7000)
  const gpu = target >= 70000 ? pick('gpu', p => p.tier === 'สูง') : pick('gpu', p => Number(p.price) <= Math.max(10000, target*0.22))
  if (!cpu || !gpu) return notify('ข้อมูลสินค้าไม่พอสำหรับสร้างสเปคแนะนำ')
  const mb = products.value.find(p => p.category==='motherboard' && p.socket===cpu.socket && p.ramType==='DDR5') || pool('motherboard')[0]
  const ram = pool('ram').find(p => p.ramType===mb?.ramType && p.capacity==='32GB') || pool('ram')[0]
  const storage = pool('storage').find(p => p.capacity==='1TB') || pool('storage')[0]
  const psu = pool('psu').find(p => p.watts >= (gpu.watts+250)) || pool('psu')[0]
  const cooler = pool('cooler')[0]
  const pcCase = pool('case').find(p => p.form===mb?.form) || pool('case')[0]
  selected.value = { cpu, gpu, motherboard:mb, ram, storage, psu, case:pcCase, cooler }
  notify('สร้างสเปคแนะนำให้แล้ว')
}

async function loadCatalog() {
  try {
    const [catRes, productRes] = await Promise.all([api.get('/categories'), api.get('/products')])
    dbCategories.value = catRes.data
    catalogProducts.value = productRes.data
  } catch (error) {
    catalogProducts.value = []
  }
}

function openProductDetail(product) { selectedProduct.value = product; activePage.value = 'product-detail' }
function openAdminEdit(product) {
  editingProductId.value = product.id
  adminForm.value = {
    id: product.id, category: product.category, brand: product.brand || '', name: product.name,
    price: Number(product.price || 0), rating: Number(product.rating || 0), socket: product.socket || '',
    watts: product.watts ?? '', tier: product.tier || 'กลาง', specs: product.specs || '', color: product.color || '#6366f1',
    image_url: product.image_url || '', change_note: product.change_note || ''
  }
  document.querySelector('.admin-form-card')?.scrollIntoView({ behavior:'smooth', block:'start' })
}
function resetAdminForm() {
  editingProductId.value = null
  adminForm.value = { id:'', category:categories.value[0]?.id || 'cpu', brand:'', name:'', price:0, rating:5, socket:'', watts:'', tier:'กลาง', specs:'', color:'#6366f1', image_url:'', change_note:'' }
}
async function saveAdminProduct() {
  if (!adminForm.value.id || !adminForm.value.name || Number(adminForm.value.price) < 0) return notify('กรอก ID, ชื่อสินค้า และราคาให้ถูกต้อง')
  adminSaving.value = true
  try {
    const payload = {
      ...adminForm.value,
      price: Number(adminForm.value.price),
      rating: Number(adminForm.value.rating || 0),
      watts: adminForm.value.watts === '' ? null : Number(adminForm.value.watts)
    }
    const wasEditing = Boolean(editingProductId.value)
    if (wasEditing) await api.put(`/products/${editingProductId.value}`, payload)
    else await api.post('/products', payload)
    await loadCatalog()
    resetAdminForm()
    notify(wasEditing ? 'แก้ไขสินค้าแล้ว' : 'เพิ่มสินค้าแล้ว')
  } catch (error) {
    if (error?.response?.status === 401) logoutAdmin()
    else notify(error?.response?.data?.message || 'บันทึกสินค้าไม่สำเร็จ')
  } finally { adminSaving.value = false }
}
async function deleteProduct(product) {
  if (!confirm(`ลบ ${product.name} ใช่หรือไม่?`)) return
  try { await api.delete(`/products/${product.id}`); await loadCatalog(); notify('ลบสินค้าแล้ว') }
  catch (error) { notify(error?.response?.data?.message || 'ลบสินค้าไม่สำเร็จ') }
}
function openAdmin() {
  if (!adminAuthenticated.value) { activePage.value = 'admin-login'; showMobileMenu.value = false; return }
  adminMode.value = true; activePage.value = 'admin'; resetAdminForm(); loadCatalog()
}
function loginAdmin() {
  const username = adminLogin.value.username.trim()
  const password = adminLogin.value.password
  if (!username || !password) return notify('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
  if (username !== 'admin' || password !== 'admin123') return notify('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
  adminAuthenticated.value = true
  adminUsername.value = username
  localStorage.setItem('pc-builder-admin-authenticated', 'true')
  localStorage.setItem('pc-builder-admin-user', username)
  adminLogin.value.password = ''
  activePage.value = 'admin'
  resetAdminForm()
  loadCatalog()
  notify('เข้าสู่ระบบ Admin สำเร็จ')
}

function logoutAdmin() {
  localStorage.removeItem('pc-builder-admin-authenticated')
  localStorage.removeItem('pc-builder-admin-user')
  adminAuthenticated.value = false
  adminUsername.value = ''
  activePage.value = 'builder'
  notify('ออกจากระบบ Admin แล้ว')
}

function verifyAdminSession() {
  const authenticated = localStorage.getItem('pc-builder-admin-authenticated') === 'true'
  adminAuthenticated.value = authenticated
  adminUsername.value = authenticated ? (localStorage.getItem('pc-builder-admin-user') || 'admin') : ''
}


watch(dark, v => document.documentElement.classList.toggle('dark', v))
verifyAdminSession()
onMounted(() => {
  const saved = localStorage.getItem('pc-builder-saved')
  if (saved) { try { savedBuilds.value = JSON.parse(saved) } catch {} }
  loadCatalog()
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="container topbar-inner">
        <button class="brand" @click="goPage('builder')"><span class="brand-mark"><Cpu :size="22"/></span><span>Build<span>Forge</span></span></button>
        <nav class="desktop-nav">
          <button :class="{active:activePage==='builder'}" @click="goPage('builder')">จัดสเปค</button>
          <button :class="{active:activePage==='products'||activePage==='product-detail'}" @click="goPage('products')">สินค้า</button>
          <button :class="{active:activePage==='saved'}" @click="goPage('saved')">สเปคที่บันทึก</button>
          <button :class="{active:activePage==='admin'||activePage==='admin-login'}" @click="openAdmin"><Settings :size="15"/> Admin</button>
        </nav>
        <div class="top-actions">
          <button class="icon-btn" @click="dark=!dark" :title="dark?'โหมดสว่าง':'โหมดมืด'"><Sun v-if="dark" :size="19"/><Moon v-else :size="19"/></button>
          <button class="compare-btn" @click="goPage('compare')"><GitCompare :size="18"/> เปรียบเทียบ <b>{{compare.length}}</b></button>
          <button class="icon-btn mobile-only" @click="showMobileMenu=!showMobileMenu"><Menu :size="21"/></button>
        </div>
      </div>
    </header>

    <div v-if="showMobileMenu" class="mobile-nav">
      <button @click="goPage('builder')">จัดสเปค</button><button @click="goPage('products')">สินค้า</button><button @click="goPage('saved')">สเปคที่บันทึก</button><button @click="goPage('compare')">เปรียบเทียบ</button><button @click="openAdmin">Admin</button>
    </div>

    <main class="container main">
      <template v-if="activePage==='builder'">
        <section class="hero">
          <div><div class="eyebrow"><Sparkles :size="15"/> SMART PC BUILDER</div><h1>จัดสเปคคอมให้ตรงกับ<br><span>งบและการใช้งาน</span></h1><p>เลือกชิ้นส่วนทีละรายการ พร้อมตรวจสอบความเข้ากันได้ ราคา และกำลังไฟแบบเรียลไทม์</p><div class="hero-actions"><button class="btn primary" @click="recommendBuild"><Sparkles :size="17"/> ให้ AI ช่วยจัดสเปค</button><button class="btn secondary" @click="resetBuild"><RotateCcw :size="17"/> เริ่มใหม่</button></div></div>
          <div class="hero-card"><div class="mini-title">งบประมาณ</div><div class="budget-number">฿{{money(budget)}}</div><input v-model.number="budget" type="range" min="15000" :max="maxBudget" step="1000"/><div class="range-labels"><span>฿15,000</span><span>฿150,000</span></div><div class="budget-stats"><div><small>ใช้ไป</small><strong>฿{{money(total)}}</strong></div><div><small>เหลือ</small><strong :class="{danger:budgetLeft<0}">฿{{money(budgetLeft)}}</strong></div></div></div>
        </section>
        <div class="builder-layout">
          <section><div class="section-heading"><div><h2>เลือกชิ้นส่วน</h2><p>{{selectedCount}} / {{categories.length}} รายการถูกเลือก</p></div><button class="btn small secondary" @click="goPage('products')">ดูสินค้าทั้งหมด <ArrowRight :size="15"/></button></div>
            <div class="parts-list"><div v-for="cat in categories" :key="cat.id" class="part-row"><div class="part-icon" :style="{background:(selected[cat.id]?.color || '#64748b')+'18',color:selected[cat.id]?.color || '#64748b'}"><component :is="iconMap[cat.icon]" :size="22"/></div><div class="part-info"><div class="part-name">{{cat.name}}</div><div v-if="selected[cat.id]" class="selected-name">{{selected[cat.id].brand}} {{selected[cat.id].name}}</div><div v-else class="muted">ยังไม่ได้เลือก</div></div><div v-if="selected[cat.id]" class="part-price">฿{{money(selected[cat.id].price * (quantity[cat.id] || 1))}}<div v-if="quantity[cat.id]" class="qty"><button @click="changeQty(cat.id,-1)"><Minus :size="13"/></button>{{quantity[cat.id]}}<button @click="changeQty(cat.id,1)"><Plus :size="13"/></button></div></div><button v-if="selected[cat.id]" class="remove-btn" @click="removePart(cat.id)" title="ลบ"><Trash2 :size="17"/></button><button class="select-btn" @click="openPicker(cat.id)">{{selected[cat.id] ? 'เปลี่ยน' : 'เลือก'}} <ChevronDown :size="15"/></button></div></div>
            <div class="save-bar"><div class="save-hint"><Bookmark :size="18"/><span>บันทึกสเปคปัจจุบันไว้ในเครื่อง</span></div><div class="save-actions"><button class="btn primary" @click="saveBuild"><Save :size="16"/> บันทึกสเปค</button></div></div>
          </section>
          <aside class="side-panel"><div class="panel-card compatibility"><div class="panel-title"><span><PackageCheck :size="19"/> ตรวจสอบความเข้ากันได้</span></div><div v-if="isCompatible" class="compat-ok"><CheckCircle2 :size="20"/><div><strong>พร้อมประกอบ</strong><p>ไม่พบปัญหาความเข้ากันได้</p></div></div><div v-else class="compat-warning"><AlertTriangle :size="20"/><div><strong>พบ {{compatibility.length}} ปัญหา</strong><p v-for="issue in compatibility" :key="issue">{{issue}}</p></div></div></div>
            <div class="panel-card"><div class="panel-title"><span><Gauge :size="19"/> ภาพรวมสเปค</span></div><div class="score-wrap"><div class="score-ring" :style="{'--score':performanceScore*3.6+'deg'}"><strong>{{performanceScore || '—'}}</strong><small>คะแนน</small></div><div class="score-text"><b>Performance</b><span>{{performanceScore >= 80 ? 'เหมาะสำหรับเกมระดับสูง' : performanceScore ? 'เหมาะสำหรับใช้งานทั่วไปและเกม' : 'เลือก CPU + GPU เพื่อประเมิน'}}</span></div></div><div class="power-row"><span>Estimated Power</span><b>{{estimatedWatts}}W</b></div><div class="power-bar"><span :style="{width:Math.min(100,estimatedWatts/10)+'%'}"></span></div></div>
            <div class="panel-card summary"><div class="panel-title"><span><Wallet :size="19"/> สรุปราคา</span></div><div class="summary-line"><span>ราคาชิ้นส่วน</span><b>฿{{money(total)}}</b></div><div class="summary-line"><span>งบประมาณ</span><b>฿{{money(budget)}}</b></div><div class="summary-total"><span>รวมทั้งหมด</span><strong>฿{{money(total)}}</strong></div><div class="budget-progress"><span :style="{width:budgetPercent+'%'}"></span></div><small>{{budgetPercent}}% ของงบประมาณ</small></div>
          </aside>
        </div>
      </template>

      <template v-else-if="activePage==='products'">
        <section class="page-head"><div><div class="eyebrow"><PackageCheck :size="15"/> COMPONENT CATALOG</div><h1>สินค้าทั้งหมด</h1><p>คลิกสินค้าเพื่อดูรายละเอียดและจุดเปลี่ยนล่าสุดของราคา</p></div></section>
        <div class="catalog-toolbar"><div class="searchbox"><Search :size="18"/><input v-model="search" placeholder="ค้นหาชื่อ รุ่น แบรนด์ หรือสเปค..."/></div><select v-model="sortBy"><option value="recommended">แนะนำ</option><option value="priceAsc">ราคาต่ำ → สูง</option><option value="priceDesc">ราคาสูง → ต่ำ</option><option value="rating">คะแนนรีวิว</option></select></div>
        <div class="category-tabs"><button :class="{active:activeCategory==='all'}" @click="activeCategory='all'">ทั้งหมด</button><button v-for="cat in categories" :key="cat.id" :class="{active:activeCategory===cat.id}" @click="activeCategory=cat.id"><component :is="iconMap[cat.icon]" :size="15"/> {{cat.name}}</button></div>
        <div class="product-grid"><article v-for="p in filteredProducts" :key="p.id" class="product-card clickable" @click="openProductDetail(p)"><div class="product-image" :style="{background:`linear-gradient(135deg, ${p.color || '#64748b'}18, transparent)`}"><component :is="categoryIcon(p.category)" :size="48" :style="{color:p.color || '#64748b'}"/><span class="category-pill">{{categoryLabels[p.category]}}</span><button class="heart" @click.stop="toggleCompare(p)"><GitCompare :size="15"/></button></div><div class="product-body"><small class="brand">{{p.brand}}</small><h3>{{p.name}}</h3><div class="stars">★ {{p.rating || '—'}} <span>• {{p.specs || 'ไม่มีรายละเอียด'}}</span></div><div v-if="p.previous_price && Number(p.previous_price)!==Number(p.price)" class="price-change"><Tag :size="13"/> ราคาปัจจุบันลดจาก ฿{{money(p.previous_price)}}</div><div class="product-bottom"><strong>฿{{money(p.price)}}</strong><button class="btn primary small" @click.stop="selectProduct(p)">เลือก</button></div><div v-if="compare.some(x=>x.id===p.id)" class="compare-selected"><CheckCircle2 :size="14"/> อยู่ในรายการเปรียบเทียบ</div></div></article></div>
        <div v-if="!filteredProducts.length" class="empty"><Search :size="32"/><h3>ไม่พบสินค้า</h3><p>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p></div>
      </template>

      <template v-else-if="activePage==='product-detail' && selectedProduct">
        <section class="page-head detail-head"><button class="btn small secondary" @click="goPage('products')"><ChevronLeft :size="16"/> กลับไปสินค้าทั้งหมด</button><div class="eyebrow"><PackageCheck :size="15"/> PRODUCT DETAIL</div><h1>{{selectedProduct.name}}</h1><p>{{selectedProduct.brand}} • {{categoryLabels[selectedProduct.category]}}</p></section>
        <div class="detail-layout"><div class="detail-visual" :style="{background:`linear-gradient(135deg, ${selectedProduct.color || '#64748b'}18, transparent)`}"><component :is="categoryIcon(selectedProduct.category)" :size="110" :style="{color:selectedProduct.color || '#64748b'}"/></div><section class="panel-card detail-card"><div class="detail-price">฿{{money(selectedProduct.price)}}</div><div v-if="selectedProduct.previous_price && Number(selectedProduct.previous_price)!==Number(selectedProduct.price)" class="change-box"><Tag :size="18"/><div><strong>จุดเปลี่ยนราคา</strong><p>จาก ฿{{money(selectedProduct.previous_price)}} → ฿{{money(selectedProduct.price)}} (ลด ฿{{money(Number(selectedProduct.previous_price)-Number(selectedProduct.price))}})</p><small v-if="selectedProduct.change_note">{{selectedProduct.change_note}}</small></div></div><div class="detail-actions"><button class="btn primary" @click="selectProduct(selectedProduct)">เลือกเข้าจัดสเปค</button><button class="btn secondary" @click="toggleCompare(selectedProduct)"><GitCompare :size="16"/> เปรียบเทียบ</button></div><div class="detail-spec-grid"><div><small>แบรนด์</small><b>{{selectedProduct.brand || '—'}}</b></div><div><small>คะแนน</small><b>★ {{selectedProduct.rating || '—'}}</b></div><div><small>กำลังไฟ</small><b>{{selectedProduct.watts ? selectedProduct.watts+'W' : '—'}}</b></div><div><small>Tier</small><b>{{selectedProduct.tier || '—'}}</b></div></div><div class="detail-section"><h3>รายละเอียดสินค้า</h3><p>{{selectedProduct.specs || 'ไม่มีรายละเอียดเพิ่มเติม'}}</p><p v-if="selectedProduct.socket">Socket: <b>{{selectedProduct.socket}}</b></p><p v-if="selectedProduct.ramType">RAM: <b>{{selectedProduct.ramType}}</b></p><p v-if="selectedProduct.capacity">ความจุ: <b>{{selectedProduct.capacity}}</b></p></div><div v-if="selectedProduct.updated_at" class="updated-note"><Clock3 :size="15"/> อัปเดตล่าสุด {{new Date(selectedProduct.updated_at).toLocaleString('th-TH')}}</div></section></div>
      </template>

      <template v-else-if="activePage==='saved'">
        <section class="page-head"><div><div class="eyebrow"><Bookmark :size="15"/> SAVED BUILDS</div><h1>สเปคที่บันทึก</h1><p>เก็บสเปคที่ชอบไว้ แล้วกลับมาแก้ไขได้ทุกเมื่อ</p></div></section>
        <div v-if="savedBuilds.length" class="saved-grid"><article v-for="b in savedBuilds" :key="b.id" class="saved-card"><div class="saved-head"><div class="saved-icon"><LayoutDashboard :size="21"/></div><button class="remove-btn" @click="deleteBuild(b.id)"><Trash2 :size="17"/></button></div><h3>{{b.name}}</h3><small>{{b.date}}</small><div class="saved-price">฿{{money(b.total)}}</div><div class="saved-parts"><span v-for="(p,k) in b.parts" :key="k" v-show="p">{{categoryLabels[k]}}</span></div><button class="btn primary full" @click="loadBuild(b)">โหลดสเปค</button></article></div>
        <div v-else class="empty"><Bookmark :size="40"/><h3>ยังไม่มีสเปคที่บันทึก</h3><p>กลับไปจัดสเปค แล้วกด “บันทึกสเปค”</p><button class="btn primary" @click="goPage('builder')">เริ่มจัดสเปค</button></div>
      </template>

      <template v-else-if="activePage==='admin-login'">
        <section class="admin-login-page">
          <div class="admin-login-card panel-card">
            <div class="admin-login-icon"><Settings :size="28"/></div>
            <div class="eyebrow"><LogIn :size="15"/> ADMIN LOGIN</div>
            <h1>เข้าสู่ระบบ Admin</h1>
            <p>เข้าสู่ระบบเพื่อเพิ่ม แก้ไข หรือลบสินค้า</p><small class="login-hint">บัญชีเริ่มต้น: admin / admin123</small>
            <form @submit.prevent="loginAdmin" class="admin-login-form">
              <label>ชื่อผู้ใช้<input v-model="adminLogin.username" autocomplete="username" placeholder="admin"/></label>
              <label>รหัสผ่าน<input v-model="adminLogin.password" type="password" autocomplete="current-password" placeholder="รหัสผ่าน"/></label>
              <button class="btn primary full" :disabled="adminLoggingIn"><LogIn :size="17"/> {{adminLoggingIn?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}}</button>
            </form>
            <button class="btn secondary full" @click="goPage('builder')">กลับหน้าหลัก</button>
          </div>
        </section>
      </template>

      <template v-else-if="activePage==='admin' && adminAuthenticated">
        <section class="page-head admin-head"><div><div class="eyebrow"><Settings :size="15"/> ADMIN PRODUCT MANAGEMENT</div><h1>จัดการสินค้า</h1><p>เพิ่มสินค้า ลดราคา และตรวจสอบ Categories จาก Database</p></div><button class="btn secondary small" @click="logoutAdmin"><LogOut :size="15"/> ออกจากระบบ {{adminUsername}}</button></section>
        <div class="admin-grid"><section class="panel-card admin-form-card"><div class="panel-title"><span><Plus v-if="!editingProductId" :size="19"/><Pencil v-else :size="19"/> {{editingProductId?'แก้ไขสินค้า':'เพิ่มสินค้า'}}</span><button v-if="editingProductId" class="btn small secondary" @click="resetAdminForm">ยกเลิก</button></div><div class="form-grid"><label>Product ID<input v-model="adminForm.id" :disabled="!!editingProductId" placeholder="เช่น cpu-7600"/></label><label>Category<select v-model="adminForm.category"><option v-for="cat in categories" :key="cat.id" :value="cat.id">{{cat.name}}</option></select></label><label>Brand<input v-model="adminForm.brand"/></label><label>ชื่อสินค้า<input v-model="adminForm.name"/></label><label>ราคา (บาท)<input v-model.number="adminForm.price" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="เช่น 15990"/></label><label>คะแนน<input v-model.number="adminForm.rating" type="number" min="0" max="5" step="0.1"/></label><label>Socket<input v-model="adminForm.socket"/></label><label>Watts<input v-model="adminForm.watts" type="number" min="0"/></label><label>Tier<select v-model="adminForm.tier"><option>กลาง</option><option>สูง</option></select></label><label>สี<input v-model="adminForm.color"/></label><label class="wide">Specs<input v-model="adminForm.specs"/></label><label class="wide">หมายเหตุการเปลี่ยนราคา<input v-model="adminForm.change_note" placeholder="เช่น ลดราคาโปรโมชั่นเดือนนี้"/></label></div><button class="btn primary full" :disabled="adminSaving" @click="saveAdminProduct">{{adminSaving?'กำลังบันทึก...':editingProductId?'บันทึกการแก้ไข':'เพิ่มสินค้า'}}</button></section>
          <section class="panel-card"><div class="panel-title"><span><Tag :size="19"/> สินค้าใน Database</span><span class="muted">{{adminProducts.length}} รายการ</span></div><div class="admin-filters"><div class="searchbox"><Search :size="16"/><input v-model="adminSearch" placeholder="ค้นหาสินค้า..."/></div><select v-model="adminCategory"><option value="all">ทุกหมวด</option><option v-for="cat in categories" :key="cat.id" :value="cat.id">{{cat.name}}</option></select></div><div class="admin-product-list"><article v-for="p in adminProducts" :key="p.id" class="admin-product-row"><div class="admin-product-icon" :style="{color:p.color || '#64748b'}"><component :is="categoryIcon(p.category)" :size="22"/></div><div class="admin-product-info"><b>{{p.name}}</b><small>{{p.brand}} • {{categoryLabels[p.category]}}</small><span v-if="p.previous_price && Number(p.previous_price)!==Number(p.price)" class="price-change">ลดจาก ฿{{money(p.previous_price)}} → ฿{{money(p.price)}}</span></div><strong>฿{{money(p.price)}}</strong><button class="icon-btn" @click="openProductDetail(p)" title="รายละเอียด"><ExternalLink :size="16"/></button><button class="icon-btn" @click="openAdminEdit(p)" title="แก้ไข"><Pencil :size="16"/></button><button class="icon-btn danger-icon" @click="deleteProduct(p)" title="ลบ"><Trash2 :size="16"/></button></article></div></section></div>
      </template>

      <template v-else>
        <section class="page-head"><div><div class="eyebrow"><GitCompare :size="15"/> COMPARE</div><h1>เปรียบเทียบสินค้า</h1><p>เลือกสินค้าได้สูงสุด 4 รายการเพื่อดูความแตกต่าง</p></div></section>
        <div v-if="compare.length" class="compare-table-wrap"><table class="compare-table"><thead><tr><th>รายละเอียด</th><th v-for="p in compare" :key="p.id"><button class="close-compare" @click="toggleCompare(p)"><X :size="14"/></button><div class="compare-img" :style="{color:p.color}"><component :is="categoryIcon(p.category)" :size="35"/></div><b>{{p.name}}</b></th></tr></thead><tbody><tr><td>หมวดหมู่</td><td v-for="p in compare" :key="p.id">{{categoryLabels[p.category]}}</td></tr><tr><td>แบรนด์</td><td v-for="p in compare" :key="p.id">{{p.brand}}</td></tr><tr><td>ราคา</td><td v-for="p in compare" :key="p.id"><strong>฿{{money(p.price)}}</strong></td></tr><tr><td>คะแนน</td><td v-for="p in compare" :key="p.id">★ {{p.rating || '—'}}</td></tr><tr><td>สเปค</td><td v-for="p in compare" :key="p.id">{{p.specs}}</td></tr><tr v-if="compare.some(p=>p.socket)"><td>Socket</td><td v-for="p in compare" :key="p.id">{{p.socket || '—'}}</td></tr><tr v-if="compare.some(p=>p.watts)"><td>กำลังไฟ</td><td v-for="p in compare" :key="p.id">{{p.watts}}W</td></tr></tbody></table></div>
        <div v-else class="empty"><GitCompare :size="40"/><h3>ยังไม่มีสินค้าให้เปรียบเทียบ</h3><p>ไปที่ “สินค้า” แล้วกดไอคอนเปรียบเทียบบนสินค้าที่ต้องการ</p><button class="btn primary" @click="goPage('products')">เลือกสินค้า</button></div>
      </template>
    </main>

    <div v-if="showProductModal" class="modal-backdrop" @click.self="showProductModal=false"><div class="modal"><div class="modal-head"><div><h2>เลือก{{categoryLabels[modalCategory]}}</h2><p>เลือกชิ้นส่วนที่ต้องการติดตั้ง</p></div><button class="icon-btn" @click="showProductModal=false"><X :size="20"/></button></div><div class="modal-search"><Search :size="17"/><input v-model="search" placeholder="ค้นหา..."/></div><div class="modal-products"><button v-for="p in filteredProducts" :key="p.id" class="modal-product" @click="selectProduct(p)"><div class="modal-product-icon" :style="{color:p.color,background:(p.color || '#64748b')+'15'}"><component :is="categoryIcon(p.category)" :size="25"/></div><div class="modal-product-info"><b>{{p.name}}</b><small>{{p.brand}} • {{p.specs}}</small></div><strong>฿{{money(p.price)}}</strong><ArrowRight :size="17"/></button></div></div></div>
    <div v-if="toast" class="toast"><CheckCircle2 :size="18"/> {{toast}}</div>
    <footer><div class="container"><span>BuildForge</span><span>PC Builder • Vue 3 + Vite • DB Categories</span></div></footer>
  </div>
</template>
