const express= require("express");
const path= require("path");
 
app= express();
app.set("view engine", "ejs")
 
console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);
 
app.use("/resurse",express.static(path.join(__dirname,"resurse")));
app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, "index.html"));
});
 
app.get("/cale", (req, res)=>{
    res.send("Salut, ai accesat <b style='color: blue;'>calea</b> /cale");
    console.log("Am primit o cerere GET pe /cale");
});
 
app.get("/cale2", (req, res)=>{
    res.write("Raspuns la cererea GET pe /cale2\n");
    res.write("Raspuns 2 la cererea GET pe /cale2\n");
    res.end();
    console.log("Am primit o cerere GET pe /cale");
});
 
app.listen(8080);
console.log("Serverul a pornit!");