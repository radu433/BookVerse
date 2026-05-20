document.addEventListener("DOMContentLoaded", function() {

    let rngMin = document.getElementById("inp-pret-min");
    let rngMax = document.getElementById("inp-pret-max");
    let valMin = document.getElementById("val-pret-min");
    let valMax = document.getElementById("val-pret-max");

    // Atașăm evenimentele pentru range (afișare live și filtrare live)
    rngMin.oninput = function() { valMin.innerHTML = `(${this.value})`; aplicaFiltre(); }
    rngMax.oninput = function() { valMax.innerHTML = `(${this.value})`; aplicaFiltre(); }

    let inpDesc = document.getElementById("inp-descriere");
    inpDesc.oninput = function() {
        let val = this.value.trim();
        if(val && /[<>]/.test(val)){
            this.classList.add("is-invalid");
        } else {
            this.classList.remove("is-invalid");
        }
        aplicaFiltre();
    };

    let inpNume = document.getElementById("inp-nume");
    inpNume.oninput = aplicaFiltre;

    let radioGrup = document.getElementsByName("gr_radio");
    for(let r of radioGrup) r.onchange = aplicaFiltre;

    document.getElementById("inp-datalist").oninput = aplicaFiltre;
    document.getElementById("inp-culoare").onchange = aplicaFiltre;
    document.getElementById("inp-limbi").onchange = aplicaFiltre;
    document.getElementById("inp-semn").onchange = aplicaFiltre;
    document.getElementById("inp-fara-semn").onchange = aplicaFiltre;

    const containerGrid = document.getElementById("produse-grid");
    const mesajFaraProduse = document.getElementById("mesaj-fara-produse");
    const containerPaginare = document.getElementById("paginare-produse");
    
    // Salvam lista initiala completa
    const articoleInitial = Array.from(document.getElementsByClassName("produs"));
    let articoleFiltrate = [...articoleInitial];
    
    let paginaCurenta = 1;
    const PRODUSE_PER_PAGINA = 6;

    // Randează articolele pe pagina curentă
    function renderPagina() {
        // Ascunde toate din DOM
        articoleInitial.forEach(art => art.style.display = "none");
        
        if (articoleFiltrate.length === 0) {
            mesajFaraProduse.style.display = "block";
            containerPaginare.innerHTML = "";
            return;
        } else {
            mesajFaraProduse.style.display = "none";
        }

        let startIndex = (paginaCurenta - 1) * PRODUSE_PER_PAGINA;
        let endIndex = startIndex + PRODUSE_PER_PAGINA;
        let paginatedItems = articoleFiltrate.slice(startIndex, endIndex);

        // Afiseaza doar subsetul
        paginatedItems.forEach(art => {
            art.style.display = "block";
            containerGrid.appendChild(art); // Pentru a mentine ordinea (daca s-a sortat)
        });

        // Construire butoane paginare
        let totalPagini = Math.ceil(articoleFiltrate.length / PRODUSE_PER_PAGINA);
        containerPaginare.innerHTML = "";

        if (totalPagini > 1) {
            for(let i = 1; i <= totalPagini; i++) {
                let btn = document.createElement("button");
                btn.className = "btn fw-bold " + (i === paginaCurenta ? "btn-primary" : "btn-outline-primary");
                btn.innerText = i;
                btn.onclick = function() {
                    paginaCurenta = i;
                    renderPagina();
                    document.getElementById("filtre-produse").scrollIntoView({behavior: "smooth"});
                };
                containerPaginare.appendChild(btn);
            }
        }
    }

    function aplicaFiltre() {
        let valNume = inpNume.value.trim();
        let valDescriere = inpDesc.value.trim();
        let minPret = parseInt(rngMin.value);
        let maxPret = parseInt(rngMax.value);

        // Validări silențioase - nu oprim totul, dar prevenim blocaje
        if(minPret > maxPret) return; 

        let valCoperta = "toate";
        for(let rad of radioGrup) {
            if(rad.checked) { valCoperta = rad.value; break; }
        }

        let valDatalist = document.getElementById("inp-datalist").value.toLowerCase().trim();
        let valCuloare = document.getElementById("inp-culoare").value;

        let selLimbi = document.getElementById("inp-limbi");
        let limbiSelectate = Array.from(selLimbi.selectedOptions).map(opt => opt.value);

        let chkSemn = document.getElementById("inp-semn").checked;
        let chkFaraSemn = document.getElementById("inp-fara-semn").checked;

        articoleFiltrate = [];

        for(let art of articoleInitial) {
            let pNume = art.querySelector(".nume-produs a").innerHTML;
            let matchNume = false;
            if(valNume === "") {
                matchNume = true;
            } else if (valNume.includes("*")) {
                let parts = valNume.split("*");
                let start = parts[0];
                let end = parts[1];
                if (pNume.toLowerCase().startsWith(start.toLowerCase()) && pNume.toLowerCase().endsWith(end.toLowerCase())) {
                    matchNume = true;
                }
            } else {
                if (pNume.toLowerCase().includes(valNume.toLowerCase())) { matchNume = true; }
            }

            let pDescriere = art.querySelector(".descriere-produs").innerHTML.toLowerCase();
            let matchDescriere = valDescriere === "" || pDescriere.includes(valDescriere.toLowerCase());

            let pret = parseInt(art.querySelector(".val-pret").innerHTML);
            let matchPret = pret >= minPret && pret <= maxPret;

            let pCoperta = art.querySelector(".val-coperta").innerHTML;
            let matchCoperta = valCoperta === "toate" || valCoperta === pCoperta;

            let pCateg = art.querySelector(".categorie-produs span").innerHTML.toLowerCase();
            let matchDatalist = valDatalist === "" || pCateg === valDatalist;

            let pCuloare = art.querySelector(".val-culoare").innerHTML.toLowerCase();
            let matchCuloare = valCuloare === "toate" || valCuloare === pCuloare;

            let pLimbi = art.querySelector(".val-limbi").innerHTML.toLowerCase();
            let matchLimbi = limbiSelectate.some(l => pLimbi.includes(l));
            if(limbiSelectate.length === 0) matchLimbi = false;

            let pSemn = art.querySelector(".val-semn").innerHTML === 'Da';
            let matchSemn = (pSemn && chkSemn) || (!pSemn && chkFaraSemn);

            if(matchNume && matchDescriere && matchPret && matchCoperta && matchDatalist && matchCuloare && matchLimbi && matchSemn) {
                articoleFiltrate.push(art);
            }
        }

        paginaCurenta = 1;
        renderPagina();
    }

    // Fallback pt Buton filtrare (desi acum e automat)
    document.getElementById("btn-filtrare").onclick = aplicaFiltre;

    // Funcție utilitară pentru sortare
    function sorteaza(semn) {
        articoleFiltrate.sort(function(a, b) {
            let numeA = a.querySelector(".nume-produs a").innerHTML;
            let numeB = b.querySelector(".nume-produs a").innerHTML;
            
            if(numeA === numeB) {
                let descA = a.querySelector(".descriere-produs").innerHTML.length;
                let descB = b.querySelector(".descriere-produs").innerHTML.length;
                return semn * (descA - descB);
            }
            return semn * numeA.localeCompare(numeB);
        });
        paginaCurenta = 1;
        renderPagina();
    }

    // Sortare ASC
    document.getElementById("btn-sort-asc").onclick = function() { sorteaza(1); }

    // Sortare DESC
    document.getElementById("btn-sort-desc").onclick = function() { sorteaza(-1); }

    // Resetare
    document.getElementById("btn-reset").onclick = function() {
        if(confirm("Sunteți sigur că doriți să resetați filtrele?")) {
            inpNume.value = "";
            inpDesc.value = "";
            
            // Extragem valorile maxime initiale din DOM, ca sa nu punem 0-300 hardcodat mereu
            let defaultMin = rngMin.min;
            let defaultMax = rngMax.max;

            rngMin.value = defaultMin; valMin.innerHTML = `(${defaultMin})`;
            rngMax.value = defaultMax; valMax.innerHTML = `(${defaultMax})`;
            
            document.getElementById("inp-datalist").value = "";
            
            radioGrup[0].checked = true; // "toate"
            document.getElementById("inp-culoare").value = "toate";
            
            let options = document.getElementById("inp-limbi").options;
            for(let i=0; i<options.length; i++){ options[i].selected = true; }

            document.getElementById("inp-semn").checked = true;
            document.getElementById("inp-fara-semn").checked = true;

            // Resetam la toate articolele
            articoleFiltrate = [...articoleInitial];
            paginaCurenta = 1;
            renderPagina();
        }
    }

    // Calculare (Aplica doar pe cele filtrate, indiferent de pagina)
    document.getElementById("btn-calcul").onclick = function() {
        let minPret = null;
        let sumPret = 0;
        let count = 0;

        for(let art of articoleFiltrate) {
            let pret = parseFloat(art.querySelector(".val-pret").innerHTML);
            if(minPret === null || pret < minPret) {
                minPret = pret;
            }
            sumPret += pret;
            count++;
        }

        let textAfisat = "Nu sunt produse afișate.";
        if(count > 0) {
            textAfisat = `Din cele ${count} cărți filtrate, prețul minim este ${minPret} RON, iar suma totală este ${sumPret} RON.`;
        }

        let divCalcul = document.createElement("div");
        divCalcul.className = "toast-calcul";
        divCalcul.innerHTML = textAfisat;
        document.body.appendChild(divCalcul);

        setTimeout(function() {
            divCalcul.remove();
        }, 3000);
    }

    // Randare initiala (La load pagina)
    renderPagina();
});
