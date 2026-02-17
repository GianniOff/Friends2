// ⚠️ CHANGE CETTE URL AVEC TON LIEN NGROK
const API = "https://economically-pseudoetymological-serenity.ngrok-free.dev";
let ADMIN_CODE = "";

// Charger la liste au démarrage
async function loadPublic() {
    try {
        const r = await fetch(`${API}/public_list`, { headers: {"ngrok-skip-browser-warning":"1"} });
        const ids = await r.json();
        const grid = document.getElementById('main-grid');
        grid.innerHTML = ids.map(id => `
            <div class="public-card" onclick="openProfile('${id}')">
                <div style="font-weight:bold; color:var(--accent); font-size:1.2rem;">${id}</div>
                <div style="font-size:10px; color:var(--muted); margin-top:8px;">FICHIER SCELLÉ</div>
            </div>
        `).join('');
    } catch(e) { console.error("API déconnectée"); }
}

// Ouvrir un dossier
async function openProfile(id) {
    let pass = ADMIN_CODE ? "" : prompt("IDENTIFICATION : Mot de passe du dossier :");
    if(!ADMIN_CODE && !pass) return;

    const r = await fetch(`${API}/get_details`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', "ngrok-skip-browser-warning":"1"},
        body: JSON.stringify({id: id, password: pass, admin_code: ADMIN_CODE})
    });

    if(r.ok) {
        renderProfile(await r.json());
    } else {
        alert("ACCÈS RÉVOQUÉ : Identifiants invalides.");
    }
}

// Affichage des données
function renderProfile(d) {
    document.getElementById('profile-page').style.display = "block";
    
    // Fonction de rendu de la censure
    const fmt = (t) => t ? t.replace(/██████████/g, '<span class="redacted">CONFIDENTIEL</span>') : "";
    
    document.getElementById('v-avatar').src = d.avatar || "https://via.placeholder.com/150/0d1117/ffffff?text=X";
    document.getElementById('v-name').innerHTML = `${fmt(d.prenom)} ${fmt(d.nom)}`;
    document.getElementById('v-job').innerHTML = fmt(d.profession);
    document.getElementById('v-loc').innerHTML = `DERNIÈRE POSITION : ${fmt(d.localisation)}`;
    document.getElementById('v-bio').innerHTML = fmt(d.bio);

    // Badges
    const badgeContainer = document.getElementById('v-badges');
    badgeContainer.innerHTML = d.badges.split(',').map(b => {
        if(!b.trim()) return '';
        const isVIP = b.toLowerCase().includes('vip');
        return `<span class="badge ${isVIP ? 'badge-vip' : ''}">${b.trim()}</span>`;
    }).join('');

    // Casier
    const rapContainer = document.getElementById('v-rapports');
    rapContainer.innerHTML = d.rapports.map(r => {
        let type = r.importance > 0 ? "rap-pos" : (r.importance < 0 ? "rap-neg" : "");
        return `<div class="rapport-item ${type}"><strong>[${r.date}] (Niveau ${r.importance})</strong><br>${r.texte}</div>`;
    }).join('') || "Casier vierge.";

    // Mode Admin
    if(ADMIN_CODE) {
        document.getElementById('admin-editor').classList.remove('hidden');
        document.getElementById('ed-id').value = d.id;
        document.getElementById('ed-prenom').value = d.prenom;
        document.getElementById('ed-nom').value = d.nom;
        
        // CORRECTION BUG : On injecte la valeur reçue, ou rien si c'est une création
        document.getElementById('ed-pass').value = (d.password === "****") ? "" : d.password;
        
        document.getElementById('ed-job').value = d.profession;
        document.getElementById('ed-loc').value = d.localisation;
        document.getElementById('ed-bio').value = d.bio;
        document.getElementById('ed-badges').value = d.badges;
    } else {
        document.getElementById('admin-editor').classList.add('hidden');
    }
}

// Ajouter un rapport
async function addReport() {
    const data = {
        id: document.getElementById('ed-id').value,
        texte: document.getElementById('rep-texte').value,
        importance: parseInt(document.getElementById('rep-imp').value),
        admin_code: ADMIN_CODE
    };
    if(!data.texte) return alert("Texte vide !");
    await fetch(`${API}/add_rapport`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    document.getElementById('rep-texte').value = "";
    openProfile(data.id); // Refresh
}

// Sauvegarder
async function save() {
    const p = {
        id: document.getElementById('ed-id').value,
        prenom: document.getElementById('ed-prenom').value,
        nom: document.getElementById('ed-nom').value,
        categories: ["User"], status: "Actif",
        bio: document.getElementById('ed-bio').value,
        avatar: "", stats: {}, 
        profile_pass: document.getElementById('ed-pass').value || "1234",
        profession: document.getElementById('ed-job').value,
        localisation: document.getElementById('ed-loc').value,
        niveau: "Alpha", admin_code: ADMIN_CODE, censored: [],
        badges: document.getElementById('ed-badges').value
    };
    await fetch(`${API}/update`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(p)});
    alert("Dossier mis à jour.");
    closeProfile(); loadPublic();
}

function askAdmin() {
    const p = prompt("CODE D'ACCÈS ADMINISTRATEUR :");
    if(p === "ExpA22") {
        ADMIN_CODE = p;
        document.getElementById('btn-new').classList.remove('hidden');
        document.getElementById('admin-btn').innerText = "ADMIN ✅";
        alert("IDENTIFICATION RÉUSSIE.");
    }
}

function openNew() {
    const empty = {id:"", prenom:"", nom:"", bio:"", avatar:"", profession:"", localisation:"", badges:"", rapports:[], is_admin:true, password:""};
    renderProfile(empty);
    document.getElementById('ed-id').disabled = false;
}

function closeProfile() { document.getElementById('profile-page').style.display = "none"; }

loadPublic();
