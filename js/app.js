import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Utility to create WA link
export function waLink(number, text){
  // number without + or spaces
  const clean = (number || '').replace(/[^0-9]/g,'');
  return `https://wa.me/${clean}?text=${encodeURIComponent(text||'')}`;
}

// List books on index
export async function listBooks(){
  const grid = document.querySelector('#books-grid');
  if(!grid) return;
  grid.innerHTML = '<p class="small">Cargando libros…</p>';
  try{
    const q = query(collection(db,'books'), orderBy('created_at','desc'));
    const snap = await getDocs(q);
    let html = '';
    snap.forEach(docu => {
      const b = docu.data();
      const id = docu.id;
      html += `
      <div class="card">
        <img src="${b.cover || 'https://via.placeholder.com/800x500?text=Portada'}" alt="Portada ${b.title||''}"/>
        <h3>${b.title || 'Sin título'}</h3>
        <p>${b.description || ''}</p>
        <div class="actions">
          ${b.price ? `<span class="badge">Precio: ${b.currency || 'USD'} ${b.price}</span>`:''}
          ${b.paypal ? `<a class="btn" href="${b.paypal}" target="_blank">Comprar con PayPal</a>`:''}
          <a class="btn" href="comprar.html?book=${id}">Verificar pago / Enviar comprobante</a>
        </div>
      </div>`;
    });
    grid.innerHTML = html || '<p class="small">No hay libros publicados aún.</p>';
  }catch(err){
    grid.innerHTML = '<p class="small">Error al cargar libros.</p>';
    console.error(err);
  }
}

// Admin helpers
export function show(el){el.style.display='block'}
export function hide(el){el.style.display='none'}

export async function addBook(data){
  const ref = await addDoc(collection(db,'books'), {
    ...data,
    created_at: serverTimestamp()
  });
  return ref.id;
}

export async function deleteBook(id){
  await deleteDoc(doc(db,'books',id));
}

export async function updateBook(id, data){
  await updateDoc(doc(db,'books',id), data);
}

// Auth flows
export function initAuthUI(){
  const loginForm = document.getElementById('login-form');
  const adminUI = document.getElementById('admin-ui');
  const logoutBtn = document.getElementById('logout-btn');
  const email = document.getElementById('email');
  const password = document.getElementById('password');

  if(loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
      }catch(err){
        alert('Error al iniciar sesión: '+err.message);
      }
    });
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=> signOut(auth));
  }

  onAuthStateChanged(auth, (user)=>{
    if(user){
      hide(loginForm);
      show(adminUI);
      document.getElementById('admin-email').textContent = user.email;
      loadAdminBooks();
    }else{
      show(loginForm);
      hide(adminUI);
    }
  });
}

export async function loadAdminBooks(){
  const list = document.getElementById('admin-book-list');
  if(!list) return;
  list.innerHTML = '<p class="small">Cargando…</p>';
  try{
    const q = query(collection(db,'books'), orderBy('created_at','desc'));
    const snap = await getDocs(q);
    let html='';
    snap.forEach(d=>{
      const b = d.data();
      html += `<div class="box" style="margin:.5rem 0">
        <strong>${b.title}</strong> — ${b.currency||'USD'} ${b.price || '-'}
        <div class="small">${(b.description||'').slice(0,140)}</div>
        <div class="actions">
          <a class="btn" href="comprar.html?book=${d.id}" target="_blank">Ver formulario</a>
          <button class="btn" data-del="${d.id}" style="background:#b02a37">Eliminar</button>
        </div>
      </div>`
    });
    list.innerHTML = html || '<p class="small">No hay libros.</p>';
    list.querySelectorAll('button[data-del]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(confirm('¿Eliminar este libro?')){
          await deleteBook(btn.getAttribute('data-del'));
          loadAdminBooks();
        }
      });
    });
  }catch(err){
    list.innerHTML = '<p class="small">Error cargando libros.</p>';
    console.error(err);
  }
}
