const grupos = [
  {
    elemento: "img/agua/agua.png",
    items: [
      { nombre: "Gill Grunt", imagen: "img/agua/Gill Grunt.png" },
      { nombre: "Slam Bam", imagen: "img/agua/Slam Bam.png" },
      { nombre: "Wham-Shell", imagen: "img/agua/Wham-Shell.png" },
      { nombre: "Zap", imagen: "img/agua/Zap.png" }
    ]
  },
  {
    elemento: "img/aire/aire.png",
    items: [
      { nombre: "Lightning Rod", imagen: "img/aire/Lightning Rod.png" },
      { nombre: "Sonic Boom", imagen: "img/aire/Sonic Boom.png" },
      { nombre: "Warnado", imagen: "img/aire/Warnado.png" },
      { nombre: "Whirlwind", imagen: "img/aire/Whirlwind.png" }
    ]
  },
  {
    elemento: "img/fuego/fuego.png",
    items: [
      { nombre: "Eruptor", imagen: "img/fuego/Eruptor.png" },
      { nombre: "Flameslinger", imagen: "img/fuego/Flameslinger.png" },
      { nombre: "Ignitor", imagen: "img/fuego/Ignitor.png" },
      { nombre: "Sunburn", imagen: "img/fuego/Sunburn.png" }
    ]
  },
  {
    elemento: "img/magia/magia.png",
    items: [
      { nombre: "Spyro", imagen: "img/magia/Spyro.png" },
      { nombre: "Voodood", imagen: "img/magia/Voodood.png" },
      { nombre: "Wrecking Ball", imagen: "img/magia/Wrecking Ball.png" },
      { nombre: "Double Trouble", imagen: "img/magia/Double Trouble.png" }
    ]
  },
  {
    elemento: "img/muertos/muertos.png",
    items: [
      { nombre: "Chop Chop", imagen: "img/muertos/Chop Chop.png" },
      { nombre: "Cynder", imagen: "img/muertos/Cynder.png" },
      { nombre: "Ghost Roaster", imagen: "img/muertos/Ghost Roaster.png" },
      { nombre: "Hex", imagen: "img/muertos/Hex.png" }
    ]
  },
  {
    elemento: "img/tecnologia/tecnologia.png",
    items: [
      { nombre: "Boomer", imagen: "img/tecnologia/Boomer.png" },
      { nombre: "Drill Sergeant", imagen: "img/tecnologia/Drill Sergeant.png" },
      { nombre: "Drobot", imagen: "img/tecnologia/Drobot.png" },
      { nombre: "Trigger Happy", imagen: "img/tecnologia/Trigger Happy.png" }
    ]
  },
  {
    elemento: "img/tierra/tierra.png",
    items: [
      { nombre: "Bash", imagen: "img/tierra/Bash.png" },
      { nombre: "Dino-Rang", imagen: "img/tierra/Dino-Rang.png" },
      { nombre: "Prism Break", imagen: "img/tierra/Prism Break.png" },
      { nombre: "Terrafin", imagen: "img/tierra/Terrafin.png" }
    ]
  },
  {
    elemento: "img/vida/vida.png",
    items: [
      { nombre: "Camo", imagen: "img/vida/Camo.png" },
      { nombre: "Stealth Elf", imagen: "img/vida/Stealth Elf.png" },
      { nombre: "Stump Smash", imagen: "img/vida/Stump Smash.png" },
      { nombre: "Zook", imagen: "img/vida/Zook.png" }
    ]
  }
];

const adivinados = [];

function cargarGrupos() {
  const contenedor = document.getElementById("contenedorGrupos");
  contenedor.innerHTML = "";

  grupos.forEach((grupo, grupoIndex) => {
    const grid = document.createElement("div");
    grid.classList.add("grid");

    grupo.items.forEach((item) => {
      const img = document.createElement("img");
      if (adivinados.includes(item.nombre)) {
        img.src = item.imagen;
      } else {
        img.src = grupo.elemento;
      }
      grid.appendChild(img);
    });

    contenedor.appendChild(grid);
  });
}

function buscar() {
  const inputField = document.getElementById('buscador');
  const input = inputField.value.trim().toLowerCase();
  let acierto = false;

  grupos.forEach((grupo) => {
    grupo.items.forEach((item) => {
      if (input === item.nombre.toLowerCase() && !adivinados.includes(item.nombre)) {
        adivinados.push(item.nombre);
        acierto = true;
      }
    });
  });

  if (acierto) {
    inputField.value = ''; // Solo borra el input si acertó
    console.log("Acierto");
    cargarGrupos();
  }

  const total = grupos.reduce((acc, grupo) => acc + grupo.items.length, 0);
  if (adivinados.length === total) {
    Swal.fire({
      title: "Felicitaciones!",
      text: "Has adivinado todos",
      icon: "success",
      showCloseButton: true,
    showConfirmButton: false
    });
  }
}


window.onload = function () {
  cargarGrupos();
  Swal.fire({
    title: "Information",
    text: "This is a beta we still working at the proyect, thanks",
    icon: "info",
    showCloseButton: true,
    showConfirmButton: false
  });
  document.getElementById('buscador').addEventListener('input', buscar);
};
