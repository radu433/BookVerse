const express = require("express");
const fs = require("fs");
const path = require("path");
const sass = require("sass");
const sharp = require("sharp");

const app = express();
app.set("view engine", "ejs");

obGlobal = {                                                  
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
}

function verificaErori() {
    const caleErori = path.join(__dirname, "resurse/json/erori.json");

    if (!fs.existsSync(caleErori)) {
        console.error("Eroare Critică: Nu există fișierul erori.json la calea " + caleErori);
        process.exit();
    }

    const continut = fs.readFileSync(caleErori, "utf-8");
    let eroriObj;
    try {
        eroriObj = JSON.parse(continut);
    } catch (e) {
        console.error("Eroare la parsare erori.json:", e.message);
        return;
    }
    
    if (!eroriObj.info_erori || !eroriObj.cale_baza || !eroriObj.eroare_default) {
        console.error("Eroare: Lipsesc una sau mai multe proprietăți esențiale (info_erori, cale_baza, eroare_default) din erori.json.");
    }

    if (eroriObj.eroare_default) {
        let errDef = eroriObj.eroare_default;
        if (!errDef.titlu || !errDef.text || !errDef.imagine) {
            console.error("Eroare: Pentru eroarea default lipseste una dintre proprietățile obligatorii: titlu, text sau imagine.");
        }
    }

    let rawCaleBaza = eroriObj.cale_baza ? (eroriObj.cale_baza.startsWith("/") ? eroriObj.cale_baza.substring(1) : eroriObj.cale_baza) : "";
    let caleBazaAbs = path.join(__dirname, rawCaleBaza);
    if (!fs.existsSync(caleBazaAbs)) {
        console.error(`Eroare: Folderul specificat în "cale_baza" (${eroriObj.cale_baza}) nu există în sistemul de fișiere.`);
    } else {
        if (eroriObj.eroare_default && eroriObj.eroare_default.imagine && !fs.existsSync(path.join(caleBazaAbs, eroriObj.eroare_default.imagine))) {
            console.error(`Eroare: Fisierul imagine pentru eroarea default (${eroriObj.eroare_default.imagine}) nu există fizic în ${caleBazaAbs}.`);
        }
        if (eroriObj.info_erori) {
            for (let err of eroriObj.info_erori) {
                if (err.imagine && !fs.existsSync(path.join(caleBazaAbs, err.imagine))) {
                    console.error(`Eroare: Fisierul imagine pentru eroarea ${err.identificator} (${err.imagine}) nu există fizic în ${caleBazaAbs}.`);
                }
            }
        }
    }

    if (eroriObj.info_erori) {
        let idCount = {};
        for (let err of eroriObj.info_erori) {
            idCount[err.identificator] = (idCount[err.identificator] || 0) + 1;
        }
        for (let id in idCount) {
            if (idCount[id] > 1) {
                let duplicates = eroriObj.info_erori.filter(e => e.identificator == id);
                let props = duplicates.map(d => {
                    let clone = { ...d };
                    delete clone.identificator; 
                    return JSON.stringify(clone);
                }).join(" | ");
                console.error(`Eroare: Există mai multe erori cu identificatorul [${id}]. Proprietățile acestora sunt: ${props}`);
            }
        }
    }

    const matchObiecte = continut.match(/\{[^{}]*\}/g);
    if (matchObiecte) {
        for (let obiectString of matchObiecte) {
            let chei = [...obiectString.matchAll(/"([^"]+)"\s*:/g)].map(m => m[1]);
            let vazute = new Set();
            for (let cheie of chei) {
                if (vazute.has(cheie)) {
                    console.error(`Eroare JSON: Proprietatea '${cheie}' este specificată de mai multe ori în același obiect!`);
                }
                vazute.add(cheie);
            }
        }
    }
}
verificaErori();

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut);
    let err_default = erori.eroare_default;
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine);
    for (let eroare of erori.info_erori){
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine);
    }
}
initErori();

function compileazaScss(caleScss, caleCss) {
    // BONUS 4: Gestionare nume fișiere cu puncte (ex: stil.frumos.scss)
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        // Folosim lastIndexOf pentru a tăia doar ultima extensie, 
        // păstrând punctele din interiorul numelui
        let pozitieUltimulPunct = numeFisExt.lastIndexOf(".");
        let numeFis = (pozitieUltimulPunct !== -1) ? numeFisExt.substring(0, pozitieUltimulPunct) : numeFisExt;
        caleCss = numeFis + ".css";
    }

    // Stabilire căi absolute
    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss);

    // Pregătire folder backup
    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }

    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        try {
            // BONUS 4: Extragem numele corect chiar dacă are puncte
            let ultimulPunctCss = numeFisCss.lastIndexOf(".");
            let numeFisFaraExt = (ultimulPunctCss !== -1) ? numeFisCss.substring(0, ultimulPunctCss) : numeFisCss;

            // BONUS 3: Adăugare timestamp în numele fișierului de backup
            let timestamp = Date.now(); // Mai scurt decât new Date().getTime()
            let numeBackup = `${numeFisFaraExt}_${timestamp}.css`;

            fs.copyFileSync(caleCss, path.join(caleBackup, numeBackup));
        } catch (err) {
            console.error("Eroare la crearea fișierului de backup:", err.message);
        }
    }

    // Compilare efectivă
    try {
        let rez = sass.compile(caleScss, { "sourceMap": true });
        fs.writeFileSync(caleCss, rez.css);
        // console.log(`Compilat cu succes: ${path.basename(caleCss)}`);
    } catch (e) {
        console.error("Eroare la compilare SASS:", e.message);
    }
}

function initImagini(){
    let caleaCatreGalerie = path.join(__dirname,"resurse/json/galerie.json");
    if(!fs.existsSync(caleaCatreGalerie)) {
        console.log("Fișierul galerie.json nu există încă. Va fi ignorat momentan.");
        return; 
    }

    var continut = fs.readFileSync(caleaCatreGalerie).toString("utf-8");

    try {
        obGlobal.obImagini = JSON.parse(continut);
    } catch (err) {
        console.error("Eroare la parsarea 'galerie.json': Fisierul are un format JSON invalid.");
        obGlobal.obImagini = { imagini: [], cale_galerie: "" };
        return;
    }
    
    let vImagini = obGlobal.obImagini.imagini;
    let caleGalerie = obGlobal.obImagini.cale_galerie;

    let caleAbs = path.join(__dirname, caleGalerie);
    let caleAbsMedii = path.join(caleAbs, "medii");
    let caleAbsMici = path.join(caleAbs, "mici");
    
    // Creăm folderele pentru imagini redimensionate dacă nu există
    if (!fs.existsSync(caleAbsMedii)) fs.mkdirSync(caleAbsMedii, {recursive: true});
    if (!fs.existsSync(caleAbsMici)) fs.mkdirSync(caleAbsMici, {recursive: true});
    
    for (let imag of vImagini){
        // Conform cerinței, cheia se numește "cale_imagine"
        let numeFisExt = imag.cale_imagine;
        let [numeFis, ext] = numeFisExt.split("."); 
        
        let caleFisAbs = path.join(caleAbs, numeFisExt);
        let caleFisMediuAbs = path.join(caleAbsMedii, numeFis + ".webp"); // Convertim în webp pentru optimizare
        let caleFisMicAbs = path.join(caleAbsMici, numeFis + ".webp");
        
        if(fs.existsSync(caleFisAbs)) {
            // Dacă nu există varianta medie, o generăm cu sharp (latime 400px cf. cerinței)
            if(!fs.existsSync(caleFisMediuAbs)){
                sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
            }
            // Dacă nu există varianta mică, o generăm cu sharp (latime 200px)
            if(!fs.existsSync(caleFisMicAbs)){
                sharp(caleFisAbs).resize(200).toFile(caleFisMicAbs);
            }
        } else {
            console.error(`Eroare: Imaginea ${numeFisExt} nu a fost găsită fizic în ${caleAbs}!`);
        }
        
        // Salvăm căile gata pregătite în obiect ca să ne fie super ușor în EJS
        imag.fisier_mare = "/" + caleGalerie + "/" + numeFisExt;
        imag.fisier_mediu = "/" + caleGalerie + "/medii/" + numeFis + ".webp";
        imag.fisier_mic = "/" + caleGalerie + "/mici/" + numeFis + ".webp";
    }
}
initImagini();

function afisareaEroare(res, identificator, titlu, text, imagine){
    let eroare = obGlobal.obErori.info_erori.find((elem) => elem.identificator == identificator);
    let errDefault = obGlobal.obErori.eroare_default;
    
    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text
    });
}

app.get("/eroare", function(req,res){
    afisareaEroare(res,"404");
});

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

let vector_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for(let folder of vector_foldere){
    let caleFolder = path.join(__dirname, folder);
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }
}``

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});

app.get(["/", "/index", "/home"], function(req,res){
    let imaginiDeTrimis = [];

    // Verificăm dacă avem imagini încărcate din galerie.json
    if (obGlobal.obImagini && obGlobal.obImagini.imagini) {
        
        // 1. Aflăm minutul curent
        let minutCurent = new Date().getMinutes();
        
        // 2. Calculăm în ce sfert de oră suntem (1, 2, 3 sau 4)
        let sfertCurent;
        if (minutCurent >= 0 && minutCurent < 15) {
            sfertCurent = 1;
        } else if (minutCurent >= 15 && minutCurent < 30) {
            sfertCurent = 2;
        } else if (minutCurent >= 30 && minutCurent < 45) {
            sfertCurent = 3;
        } else {
            sfertCurent = 4;
        }
        
        // 3. Filtrăm imaginile: le păstrăm doar pe cele care au sfert_ora potrivit
        imaginiDeTrimis = obGlobal.obImagini.imagini.filter(function(imag) {
            // Folosim == ca să funcționeze chiar dacă în JSON sfertul e scris ca string ("1") sau număr (1)
            return imag.sfert_ora == sfertCurent; 
        });
        
        // 4. Cerința zice: "numărul de imagini afișate se va trunchia la 10"
        if (imaginiDeTrimis.length > 10) {
            imaginiDeTrimis = imaginiDeTrimis.slice(0, 10);
        }
    }

    // Trimitem către EJS doar imaginile filtrate
    res.render("pagini/index", {
        ip: req.ip,
        imagine: imaginiDeTrimis
    });
});

// AICI ESTE REPARAȚIA CRITICĂ: Am lăsat doar "/*"
app.get("/*", function(req,res){
    console.log("Cale pagina ceruta:", req.url);
    
    if(req.url.startsWith("/resurse") && path.extname(req.url) == ""){
        afisareaEroare(res, 403);
        return;
    }
    if(req.url.endsWith(".ejs")){
        afisareaEroare(res, 400);
        return;
    }
    
    try {
        res.render("pagini" + req.url, function(err, rezRandare){
            if(err){
                if(err.message.startsWith("Failed to lookup view")){
                    afisareaEroare(res, 404);
                    return;
                }
                afisareaEroare(res);
                return;
            }
            res.send(rezRandare);
        });
    } catch(err) {
        if(err.message.includes("Cannot find modules")){
            afisareaEroare(res, 404);
            return;
        }
        afisareaEroare(res);
        return;
    }
});

function verificaImaginiGalerie(caleJsonImagini) {
    console.log("--- Verificare integritate galerie ---");
    
    // 1. Citim fișierul JSON
    let dateGalerie;
    try {
        let continutJson = fs.readFileSync(caleJsonImagini, "utf8");
        dateGalerie = JSON.parse(continutJson);
    } catch (err) {
        console.error(`[EROARE CRITICĂ] Nu s-a putut citi JSON-ul de galerie: ${err.message}`);
        return;
    }

    // 2. Bonus 5a: Verificăm dacă folderul specificat în "cale_galerie" există
    // Presupunem că folderul este relativ la rădăcina proiectului
    let folderGalerie = path.join(__dirname, dateGalerie.cale_galerie);
    if (!fs.existsSync(folderGalerie)) {
        console.error(`[EROARE CONFIGURARE] Folderul specificat în JSON ("${dateGalerie.cale_galerie}") NU există în sistem la calea: ${folderGalerie}`);
    } else {
        console.log(`[OK] Folderul galeriei a fost găsit.`);
    }

    // 3. Bonus 5b: Verificăm fiecare imagine din listă
    dateGalerie.imagini.forEach((img, index) => {
        // Construim calea către imaginea curentă (ex: resurse/imagini/galerie/nume.jpg)
        let caleImagine = path.join(__dirname, dateGalerie.cale_galerie, img.fisier);
        
        if (!fs.existsSync(caleImagine)) {
            console.error(`[EROARE IMAGINE] Imaginea de la indexul ${index} cu numele "${img.fisier}" lipsește din folderul "${dateGalerie.cale_galerie}"!`);
            console.error(`        Calea căutată a fost: ${caleImagine}`);
        }
    });

    console.log("--- Finalizare verificare galerie ---\n");
}

app.listen(8080, () => {
    console.log("Serverul a pornit pe portul 8080!");
});

app.get("/produse")