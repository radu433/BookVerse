const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createTableQuery = `
    DROP TABLE IF EXISTS carti;
    DROP TYPE IF EXISTS categorie_carte;

    CREATE TYPE categorie_carte AS ENUM ('fictiune', 'stiinta', 'istorie', 'arta', 'tehnologie');

    CREATE TABLE carti (
        id SERIAL PRIMARY KEY,
        nume VARCHAR(255) NOT NULL,
        descriere TEXT,
        imagine VARCHAR(255),
        categorie_mare categorie_carte,
        tip_coperta VARCHAR(50),
        pret NUMERIC(10, 2),
        numar_pagini INTEGER,
        data_adaugare DATE,
        culoare_coperta VARCHAR(50),
        limbi_disponibile VARCHAR(255),
        include_semn_carte BOOLEAN
    );
`;

const insertDataQuery = `
    INSERT INTO carti (nume, descriere, imagine, categorie_mare, tip_coperta, pret, numar_pagini, data_adaugare, culoare_coperta, limbi_disponibile, include_semn_carte) VALUES
    ('Harry Potter', 'O carte fantastica despre un baiat vrajitor. O aventura plina de magie si prietenie la Hogwarts.', '/resurse/imagini/produse/carte1.jpg', 'fictiune', 'Cartonata', 50.00, 300, '2023-01-15', 'albastru', 'romana,engleza', true),
    ('Stapanul Inelelor', 'O aventura epica in Pamantul de Mijloc scrisa de J.R.R. Tolkien, unde binele se lupta cu raul absolut.', '/resurse/imagini/produse/carte2.jpg', 'fictiune', 'Standard', 80.50, 1000, '2022-05-20', 'verde', 'romana', false),
    ('Scurta istorie a timpului', 'O explorare a universului de Stephen Hawking. Explicatii fascinante despre gauri negre si Big Bang.', '/resurse/imagini/produse/carte3.jpg', 'stiinta', 'eBook', 30.00, 250, '2021-11-10', 'negru', 'engleza', false),
    ('Arta razboiului', 'Tratat antic de strategie militara. Invataturile lui Sun Tzu se aplica atat pe campul de lupta cat si in afaceri.', '/resurse/imagini/produse/carte4.jpg', 'istorie', 'Cartonata', 45.00, 150, '2020-03-05', 'rosu', 'romana,chineza', true),
    ('Clean Code', 'Ghid de bune practici pentru programatori. Cum sa scrii cod lizibil si usor de intretinut de-a lungul timpului.', '/resurse/imagini/produse/carte5.jpg', 'tehnologie', 'Standard', 120.00, 400, '2023-08-01', 'alb', 'engleza', true),
    ('Design Patterns', 'Elemente de software orientat pe obiect. Abordari clasice pentru probleme frecvente de arhitectura in programare.', '/resurse/imagini/produse/carte6.jpg', 'tehnologie', 'Cartonata', 150.00, 450, '2019-12-12', 'albastru', 'engleza', false),
    ('Istoria Romanilor', 'O carte despre trecutul poporului roman, incepand din antichitate pana in perioada moderna, cu evenimentele cheie.', '/resurse/imagini/produse/carte7.jpg', 'istorie', 'Standard', 60.00, 500, '2022-10-10', 'maro', 'romana', true),
    ('Istoria Artei', 'Evolutia artelor vizuale din preistorie pana azi. Include picturi, sculpturi si arhitectura marilor civilizatii.', '/resurse/imagini/produse/carte8.jpg', 'arta', 'Cartonata', 200.00, 600, '2021-04-20', 'alb', 'romana,franceza', false),
    ('Dune', 'Un roman science fiction ecologic si complex. Actiunea are loc pe o planeta desertica esentiala pentru univers.', '/resurse/imagini/produse/carte9.jpg', 'fictiune', 'Cartonata', 75.00, 800, '2024-01-05', 'portocaliu', 'romana,engleza', true),
    ('Sapiens', 'Scurta istorie a omenirii de la vanatori-culegatori la zei ai lumii moderne, descrisa excelent de Yuval Noah Harari.', '/resurse/imagini/produse/carte10.jpg', 'istorie', 'Standard', 65.00, 400, '2020-09-09', 'galben', 'romana,engleza', false),
    ('JavaScript The Good Parts', 'Partea buna a limbajului JS. O privire profunda in partile elegante care fac acest limbaj atat de puternic.', '/resurse/imagini/produse/carte11.jpg', 'tehnologie', 'eBook', 40.00, 175, '2018-07-07', 'alb', 'engleza', false),
    ('Cosmos', 'Calatorie personala in spatiu. Carl Sagan ne invata despre locul nostru in imensitatea universului.', '/resurse/imagini/produse/carte12.jpg', 'stiinta', 'Cartonata', 90.00, 350, '2022-02-22', 'negru', 'romana,engleza', true),
    ('1984', 'Un roman distopic despre un viitor sub supraveghere continua, cenzura si puterea absoluta a Partidului.', '/resurse/imagini/produse/carte13.jpg', 'fictiune', 'Standard', 35.00, 320, '2021-06-15', 'gri', 'romana,engleza', true),
    ('Micul Print', 'O poveste filozofica ascunsa sub forma unei povesti pentru copii, despre ce e cu adevarat important in viata.', '/resurse/imagini/produse/carte14.jpg', 'fictiune', 'Cartonata', 45.00, 96, '2019-11-11', 'albastru', 'romana,franceza,engleza', false),
    ('Crima si Pedeapsa', 'Un roman psihologic profund despre crima, vinovatie si calea spre mantuire a lui Raskolnikov in Rusia tarista.', '/resurse/imagini/produse/carte15.jpg', 'fictiune', 'Standard', 55.00, 600, '2020-05-05', 'maro', 'romana,rusa', true)
`;

async function initDB() {
    try {
        await client.connect();
        console.log("Connected to DB...");
        
        await client.query(createTableQuery);
        console.log("Table 'carti' created.");

        await client.query(insertDataQuery);
        console.log("Dummy data inserted successfully.");

    } catch (err) {
        console.error("Error during DB init:", err);
    } finally {
        await client.end();
        console.log("Connection closed.");
    }
}

initDB();
