/* =========================================================
   SKAQUINATOR - Conexión con Supabase
   =========================================================
   La tabla "personaje" tiene (entre otras) estas columnas:
     id       -> varchar, es el nombre del archivo de imagen (ej: "SW1")
     nombre   -> varchar, nombre del Skylander
     saga     -> int4, FK a la tabla "saga" (id, nombre)
     elemento -> int4, FK a la tabla "elemento" (id, nombre)
     edicion  -> int4, FK a la tabla "edicion" (id, nombre) o NULL
     serie    -> int4, número de serie/reedición (1, 2, 3...)

   Regla para "ediciones especiales":
   Se asume que un personaje es una edición especial (Legendary,
   Dark, etc.) cuando su columna "edicion" tiene un valor asignado.
   Los personajes "normales" tienen edicion = NULL.
   Si en tu base de datos es al revés, solo hay que tocar la función
   esEdicionEspecial() de aquí abajo.

   Estructura visual:
   Saga (tarjeta grande) -> Elemento (sub-grupo) -> Personajes (casillas)
   ========================================================= */

const SUPABASE_URL = "https://wtcdmpgembpkdaigmzmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_iMxNU9BPOvqNM8fe_z4KlA_kkIz0PST";

// Carpeta donde deben estar las imágenes, nombradas como <id>.png (ej: SW1.png)
const RUTA_IMAGENES = "img/personajes/";

function esEdicionEspecial(personaje) {
  return personaje.edicion !== null && personaje.edicion !== undefined;
}

let grupos = [];           // [{ id, nombre, items: [...], elementos: [{ id, nombre, items: [...] }] }]
let adivinados = new Set(); // ids de personajes adivinados (cada fila cuenta por separado)
let TOTAL_SKYLANDERS = 0;

/* ---------- Colores por elemento ---------- */

const ELEMENTOS_COLOR = {
  agua: "var(--c-agua)",
  aire: "var(--c-aire)",
  fuego: "var(--c-fuego)",
  magia: "var(--c-magia)",
  muertos: "var(--c-muertos)",
  tecnologia: "var(--c-tecnologia)",
  tierra: "var(--c-tierra)",
  vida: "var(--c-vida)"
};

const ELEMENTOS_ICONO = {
  agua: "img/elementos/agua.png",
  aire: "img/elementos/aire.png",
  fuego: "img/elementos/fuego.png",
  magia: "img/elementos/magia.png",
  muertos: "img/elementos/muertos.png",
  tecnologia: "img/elementos/tecnologia.png",
  tierra: "img/elementos/tierra.png",
  vida: "img/elementos/vida.png",
  luz: "img/elementos/luz.png",
  oscuridad: "img/elementos/oscuridad.png",
  kaos: "img/elementos/kaos.png"
};

function normalizar(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function colorElemento(nombre) {
  return ELEMENTOS_COLOR[normalizar(nombre)] || "var(--gold)";
}

function iconoElemento(nombre) {
  return ELEMENTOS_ICONO[normalizar(nombre)] || "img/portal.jpg";
}

// Texto exacto que hay que escribir para adivinar el personaje.
// Si tiene serie 2, hay que escribir "series X nombre" (ej: "series 2 spyro").
function claveBusqueda(item) {
  const nombreLower = item.nombre.toLowerCase();
  if (item.serie && item.serie > 1 && item.serie < 3) {
    return `series ${item.serie} ${nombreLower}`;
  }
  return nombreLower;
}

/* ---------- Carga de datos desde Supabase ---------- */

async function cargarDatosSupabase() {
  const url =
    `${SUPABASE_URL}/rest/v1/personaje` +
    `?select=id,nombre,edicion,serie,saga(id,nombre),elemento(id,nombre)` +
    `&order=nombre.asc`;

  const respuesta = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status} al consultar Supabase`);
  }

  const personajes = await respuesta.json();

  // Filtramos ediciones especiales y personajes sin saga asignada
  const validos = personajes.filter((p) => !esEdicionEspecial(p) && p.saga);

  const sagasMap = new Map();

  validos.forEach((p) => {
    const sagaId = p.saga.id;
    if (!sagasMap.has(sagaId)) {
      sagasMap.set(sagaId, {
        id: sagaId,
        nombre: p.saga.nombre,
        items: [],
        elementosMap: new Map()
      });
    }
    const sagaObj = sagasMap.get(sagaId);

    const item = {
      id: p.id,
      nombre: p.nombre,
      imagen: `img/${p.saga.nombre}/${p.id}.png`,
      serie: p.serie,
      elementoNombre: p.elemento ? p.elemento.nombre : "Otros"
    };

    sagaObj.items.push(item);

    const elKey = p.elemento ? p.elemento.id : "sin-elemento";
    if (!sagaObj.elementosMap.has(elKey)) {
      sagaObj.elementosMap.set(elKey, {
        id: elKey,
        nombre: item.elementoNombre,
        items: []
      });
    }
    sagaObj.elementosMap.get(elKey).items.push(item);
  });

  grupos = Array.from(sagasMap.values())
    .sort((a, b) => a.id - b.id)
    .map((saga) => ({
      id: saga.id,
      nombre: saga.nombre,
      items: saga.items,
      elementos: Array.from(saga.elementosMap.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      )
    }));

  TOTAL_SKYLANDERS = grupos.reduce((acc, g) => acc + g.items.length, 0);
}

/* ---------- Render ---------- */

function crearCasilla(item) {
  const casilla = document.createElement("div");
  casilla.classList.add("casilla-icono");

  const revelado = adivinados.has(item.id);

  casilla.title = revelado ? item.nombre : "???";

  const img = document.createElement("img");
  if (revelado) {
    casilla.classList.add("revelada");
    img.src = item.imagen;
    img.alt = item.nombre;
  } else {
    casilla.classList.add("oculta");
    img.src = iconoElemento(item.elementoNombre);
    img.alt = item.elementoNombre;
  }
  casilla.appendChild(img);

  return casilla;
}

function cargarGrupos() {
  const contenedor = document.getElementById("contenedorGrupos");
  contenedor.innerHTML = "";

  grupos.forEach((grupo) => {
    const grupoDiv = document.createElement("div");
    grupoDiv.classList.add("grupo");
    grupoDiv.dataset.saga = grupo.id;

    const titulo = document.createElement("h2");
    titulo.classList.add("grupo-titulo");
    titulo.textContent = grupo.nombre;
    grupoDiv.appendChild(titulo);

    const sagaElementos = document.createElement("div");
    sagaElementos.classList.add("saga-elementos");

    grupo.elementos.forEach((elemento) => {
      const elementoDiv = document.createElement("div");
      elementoDiv.classList.add("elemento-grupo");
      elementoDiv.dataset.elemento = elemento.id;
      elementoDiv.style.setProperty("--c-elemento", colorElemento(elemento.nombre));

      const elTitulo = document.createElement("h3");
      elTitulo.classList.add("elemento-titulo");
      elTitulo.textContent = elemento.nombre;
      elementoDiv.appendChild(elTitulo);

      const elItems = document.createElement("div");
      elItems.classList.add("elemento-items");

      elemento.items.forEach((item) => {
        elItems.appendChild(crearCasilla(item));
      });

      elementoDiv.appendChild(elItems);
      sagaElementos.appendChild(elementoDiv);
    });

    grupoDiv.appendChild(sagaElementos);
    contenedor.appendChild(grupoDiv);
  });

  actualizarProgreso();
}

function actualizarProgreso() {
  document.getElementById("contador").textContent = `${adivinados.size} / ${TOTAL_SKYLANDERS}`;
  const porcentaje = TOTAL_SKYLANDERS ? (adivinados.size / TOTAL_SKYLANDERS) * 100 : 0;
  document.getElementById("progresoRelleno").style.width = `${porcentaje}%`;
}

/* ---------- Búsqueda ---------- */

function existePrefijoValido(input) {
  if (!input) return true;
  return grupos.some((grupo) =>
    grupo.items.some(
      (item) =>
        !adivinados.has(item.id) &&
        claveBusqueda(item).startsWith(input)
    )
  );
}

function buscar() {
  const inputField = document.getElementById("buscador");
  const input = inputField.value.trim().toLowerCase();
  let acierto = false;

  grupos.forEach((grupo) => {
    grupo.items.forEach((item) => {
      if (input === claveBusqueda(item) && !adivinados.has(item.id)) {
        adivinados.add(item.id);
        acierto = true;
      }
    });
  });

  inputField.classList.remove("acierto", "error");

  if (acierto) {
    inputField.value = "";
    cargarGrupos();
    inputField.classList.add("acierto");
    setTimeout(() => inputField.classList.remove("acierto"), 500);
  } else if (input.length >= 3 && !existePrefijoValido(input)) {
    inputField.classList.add("error");
    setTimeout(() => inputField.classList.remove("error"), 350);
  }

  if (adivinados.size === TOTAL_SKYLANDERS && TOTAL_SKYLANDERS > 0) {
    setTimeout(() => {
      Swal.fire({
        title: "¡Portal completado!",
        text: "Has adivinado a todos los Skylanders. ¡Buen ojo, Portal Master!",
        icon: "success",
        confirmButtonText: "Genial",
        confirmButtonColor: "#d9b24c",
        background: "#10182b",
        color: "#f1f3fb"
      });
    }, 250);
  }
}

/* ---------- Reinicio ---------- */

function reiniciar() {
  Swal.fire({
    title: "¿Reiniciar el portal?",
    text: "Perderás todo tu progreso actual.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, reiniciar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ff5a36",
    cancelButtonColor: "#3a4560",
    background: "#10182b",
    color: "#f1f3fb"
  }).then((resultado) => {
    if (resultado.isConfirmed) {
      adivinados = new Set();
      cargarGrupos();
      document.getElementById("buscador").focus();
    }
  });
}

/* ---------- Arranque ---------- */

window.onload = async function () {
  const buscador = document.getElementById("buscador");
  buscador.disabled = true;

  Swal.fire({
    title: "Cargando portal...",
    allowOutsideClick: false,
    showConfirmButton: false,
    background: "#10182b",
    color: "#f1f3fb",
    didOpen: () => Swal.showLoading()
  });

  try {
    await cargarDatosSupabase();
    cargarGrupos();
    Swal.close();
  } catch (error) {
    console.error(error);
    Swal.fire({
      title: "Error al cargar",
      text: "No se pudo conectar con la base de datos de Skylanders.",
      icon: "error",
      confirmButtonText: "Reintentar",
      confirmButtonColor: "#ff5a36",
      background: "#10182b",
      color: "#f1f3fb"
    }).then(() => window.location.reload());
    return;
  }

  buscador.disabled = false;
  buscador.addEventListener("input", buscar);
  buscador.focus();

  document.getElementById("btnReiniciar").addEventListener("click", reiniciar);
};
