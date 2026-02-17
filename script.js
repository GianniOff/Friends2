const API = "https://economically-pseudoetymological-serenity.ngrok-free.dev";
let ADMIN_CODE = "";
let currentId = "";

// Headers par défaut pour passer Ngrok et le CORS
const getHeaders = () => ({
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json"
});

function toggleTheme() {
    const body = document.documentElement;
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-btn').innerText = isDark ? '🌙' : '☀️';
}

async function loadPublic() {
    try {
        const r = await fetch(`${API}/public_list`, { headers: getHeaders() });
        const ids = await r.json();
        document.getElementById('main-grid').innerHTML = ids.map(id => `
            <div class="public-card" onclick="openProfile('${id}')">
                <h3>${id}</h3>
                <p style="font-size:12px; color:var(--muted)">DOSSIER SÉCURISÉ</p>
            </div>`).join('');
    } catch(e) { console.error("Erreur de chargement", e); }
}

async function openProfile(id) {
    currentId = id;
    let pass = ADMIN_CODE ? "" : prompt("Mot de passe :");
    if(!ADMIN_CODE && !pass) return;

    try {
        const r = await fetch(`${API}/get_details`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({id: id, password: pass, admin_code: ADMIN_CODE})
        });
        if(r.ok) renderProfile(await r.json());
        else alert("Accès refusé.");
    } catch(e) { alert("Erreur serveur."); }
}

function renderProfile(d) {
    document.getElementById('profile-page').style.display = "block";
    const fmt = (t) => t ? t.replace(/██████████/g, '<span class="redacted">CONFIDENTIEL</span>') : "";
    
    document.getElementById('v-avatar').src = d.avatar || "https://ui-avatars.com/api/?name="+d.id;
    document.getElementById('v-name').innerHTML = `${fmt(d.prenom)} ${fmt(d.nom)}`;
    document.getElementById('v-job').innerHTML = fmt(d.profession);
    document.getElementById('v-bio').innerHTML = fmt(d.bio);
    document.getElementById('v-badges').innerHTML = d.badges.split(',').map(b => b.trim() ? `<span class="badge">${b.trim()}</span>` : '').join('');
    document.getElementById('v-rapports').innerHTML = d.rapports.map(r => `
        <div class="card" style="border-left: 4px solid ${r.importance < 0 ? 'var(--danger)' : 'var(--accent)'}">
            <small>${r.date}</small><br>${r.texte}
        </div>`).join('') || "Aucun incident.";

    if(ADMIN_CODE) {
        document.getElementById('admin-editor').classList.remove('hidden');
        document.getElementById('ed-id').value = d.id;
        document.getElementById('ed-id').disabled = (d.id !== "");
        document.getElementById('ed-prenom').value = d.prenom || "";
        document.getElementById('ed-nom').value = d.nom || "";
        document.getElementById('ed-pass').value = (d.password !== "****") ? d.password : "";
        document.getElementById('ed-job').value = d.profession || "";
        document.getElementById('ed-loc').value = d.localisation || "";
        document.getElementById('ed-bio').value = d.bio || "";
        document.getElementById('ed-badges').value = d.badges || "";
    }
}

async function save() {
    const p = {
        id: document.getElementById('ed-id').value,
        prenom: document.getElementById('ed-prenom').value,
        nom: document.getElementById('ed-nom').value,
        bio: document.getElementById('ed-bio').value,
        avatar: "", profile_pass: document.getElementById('ed-pass').value || "1234",
        profession: document.getElementById('ed-job').value,
        localisation: document.getElementById('ed-loc').value,
        badges: document.getElementById('ed-badges').value,
        admin_code: ADMIN_CODE
    };
    await fetch(`${API}/update`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(p)});
    alert("Mis à jour !");
    closeProfile(); loadPublic();
}

async function remove() {
    if(!confirm("Supprimer ?")) return;
    await fetch(`${API}/delete`, { method: 'POST', headers: getHeaders(), 
        body: JSON.stringify({id: document.getElementById('ed-id').value, code: ADMIN_CODE})});
    closeProfile(); loadPublic();
}

async function addReport() {
    const data = { id: currentId, texte: document.getElementById('rep-texte').value, 
                   importance: parseInt(document.getElementById('rep-imp').value), admin_code: ADMIN_CODE };
    await fetch(`${API}/add_rapport`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data)});
    document.getElementById('rep-texte').value = "";
    openProfile(currentId);
}

function askAdmin() {
    const p = prompt("Code :");
    if(p === "ExpA22") {
        ADMIN_CODE = p;
        document.getElementById('btn-new').classList.remove('hidden');
        document.getElementById('admin-btn').innerText = "ADMIN ON";
        if(currentId) openProfile(currentId);
    }
}

function openNew() {
    currentId = "";
    renderProfile({id:"", prenom:"", nom:"", bio:"", avatar:"", profession:"", localisation:"", badges:"", rapports:[], password:""});
    document.getElementById('ed-id').disabled = false;
}

function closeProfile() { document.getElementById('profile-page').style.display = "none"; }

loadPublic();
