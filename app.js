import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ตั้งค่า Firebase ของโปรเจกต์ YearBook31
const firebaseConfig = {
  apiKey: "AIzaSyDdpVxMwDCL9-Ca8_h-MyryEFm1Rz6GG84",
  authDomain: "yearbook31-bf954.firebaseapp.com",
  databaseURL: "https://yearbook31-bf954-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "yearbook31-bf954",
  storageBucket: "yearbook31-bf954.firebasestorage.app",
  messagingSenderId: "360210883966",
  appId: "1:360210883966:web:8568aac8e11e618d27bf2f",
  measurementId: "G-XB8HJMQBGD"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const dataRef = ref(db, "yearbook");

const defaultData = { site: { school: 'โรงเรียนของเรา', year: '2026', mainColor: '#7c4dff', title: 'ความทรงจำ\nไม่เคยจบ', heroText: 'พื้นที่สำหรับเก็บเรื่องราว รอยยิ้ม และมิตรภาพของพวกเรา', coverImage: '', footer: 'สร้างด้วยความทรงจำของพวกเรา' }, students: [{ name: 'พิมพ์ชนก วัฒนชัย', detail: 'มินท์ · 6/1', quote: 'ทุกความทรงจำมีความหมาย' }, { name: 'ธนกฤต ศรีสุข', detail: 'นนท์ · 6/1', quote: 'เจอกันใหม่ในวันที่ฝันเป็นจริง' }, { name: 'ณิชาภา บุญมี', detail: 'ฟ้า · 6/2', quote: 'ยิ้มให้กับทุกวัน' }, { name: 'ณัฐวุฒิ เจริญผล', detail: 'บอส · 6/2', quote: 'มิตรภาพไม่มีวันจบ' }], gallery: [{ caption: 'วันปัจฉิมนิเทศ', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80' }, { caption: 'มิตรภาพของพวกเรา', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80' }, { caption: 'กีฬาสีของเรา', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80' }] };

let data = structuredClone(defaultData);
const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function normalize(d) {
  d = d || structuredClone(defaultData);
  d.site = d.site || structuredClone(defaultData.site);
  d.students = Array.isArray(d.students) ? d.students : Object.values(d.students || {});
  d.gallery = Array.isArray(d.gallery) ? d.gallery : Object.values(d.gallery || {});
  return d;
}

function saveData() {
  return set(dataRef, data);
}

// ---------- หน้าเว็บสาธารณะ (index.html) ----------
function publicPage() {
  if (!$('studentGrid')) return;
  onValue(dataRef, snapshot => {
    data = normalize(snapshot.val());
    renderPublic();
  });
}

function renderPublic() {
  let s = data.site;
  document.documentElement.style.setProperty('--accent', s.mainColor || '#7c4dff');
  $('yearLabel').textContent = `CLASS OF ${s.year}`;
  $('schoolCover').textContent = s.school;
  $('yearCover').textContent = s.year;
  $('heroTitle').innerHTML = escape(s.title).replace('\n', '<br>');
  $('heroText').textContent = s.heroText;
  $('footerText').textContent = s.footer;
  const cover = document.querySelector('.book');
  cover.style.backgroundImage = s.coverImage ? `linear-gradient(#0003,#0003),url('${s.coverImage}')` : '';
  cover.classList.toggle('image-cover', Boolean(s.coverImage));
  const show = () => {
    $('studentGrid').innerHTML = data.students.filter(x => (x.name + x.detail).toLowerCase().includes($('search').value.toLowerCase())).map(x => `<article class="student">${x.image ? `<img class="student-photo" src="${escape(x.image)}" alt="รูปของ ${escape(x.name)}">` : `<div class="student-placeholder">${escape(x.name.charAt(0))}</div>`}<h3>${escape(x.name)}</h3><p>${escape(x.detail)}</p>${x.quote ? `<blockquote>“${escape(x.quote)}”</blockquote>` : ''}</article>`).join('');
  };
  $('search').oninput = show;
  show();
  $('galleryGrid').innerHTML = data.gallery.map(x => `<div class="gallery-item" style="background-image:url('${escape(x.image)}')">${escape(x.caption)}</div>`).join('');
}

// ---------- หน้าแอดมิน (admin.html) ----------
function adminPage() {
  if (!$('loginCard')) return;

  onAuthStateChanged(auth, user => {
    if (user) loadDataAndShowDashboard();
    else { $('loginCard').hidden = false; $('dashboard').hidden = true; }
  });

  $('loginForm').onsubmit = async e => {
    e.preventDefault();
    const email = $('email').value, password = $('password').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert('เข้าสู่ระบบไม่สำเร็จ: อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      btn.disabled = false;
    }
  };

  $('logout').onclick = () => signOut(auth);

  $('siteForm').onsubmit = async e => {
    e.preventDefault();
    data.site = Object.fromEntries(new FormData(e.target));
    await saveData();
    alert('บันทึกแล้ว');
  };

  $('studentForm').onsubmit = async e => {
    e.preventDefault();
    data.students.unshift(Object.fromEntries(new FormData(e.target)));
    await saveData();
    e.target.reset();
    renderAdminLists();
  };

  $('galleryForm').onsubmit = async e => {
    e.preventDefault();
    data.gallery.unshift(Object.fromEntries(new FormData(e.target)));
    await saveData();
    e.target.reset();
    renderAdminLists();
  };

  $('dashboard').onclick = async e => {
    const button = e.target.closest('[data-delete]');
    if (!button) return;
    data[button.dataset.delete].splice(Number(button.dataset.index), 1);
    await saveData();
    renderAdminLists();
  };
}

async function loadDataAndShowDashboard() {
  const snapshot = await get(dataRef);
  if (snapshot.exists()) {
    data = normalize(snapshot.val());
  } else {
    data = structuredClone(defaultData);
    await saveData();
  }
  showDashboard();
}

function showDashboard() {
  $('loginCard').hidden = true;
  $('dashboard').hidden = false;
  Object.entries(data.site).forEach(([key, value]) => { if ($('siteForm').elements[key]) $('siteForm').elements[key].value = value; });
  $('siteForm').elements.mainColor.value = data.site.mainColor || '#7c4dff';
  renderAdminLists();
}

function renderAdminLists() {
  $('studentList').innerHTML = data.students.map((x, i) => `<div class="list-row">${escape(x.name)}<button class="delete" data-delete="students" data-index="${i}">ลบ</button></div>`).join('');
  $('galleryList').innerHTML = data.gallery.map((x, i) => `<div class="list-row">${escape(x.caption)}<button class="delete" data-delete="gallery" data-index="${i}">ลบ</button></div>`).join('');
}

if ($('coverFile')) $('coverFile').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) return alert('กรุณาเลือกไฟล์ขนาดไม่เกิน 3 MB');
  const reader = new FileReader();
  reader.onload = () => { $('siteForm').elements.coverImage.value = reader.result; };
  reader.readAsDataURL(file);
});

if ($('studentFile')) $('studentFile').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) return alert('กรุณาเลือกไฟล์ขนาดไม่เกิน 3 MB');
  const reader = new FileReader();
  reader.onload = () => { $('studentForm').elements.image.value = reader.result; };
  reader.readAsDataURL(file);
});

publicPage();
adminPage();
