import {
    onGetTurnos, saveTurno, deleteTurno, getTurno, updateTurno, getUsuarios
  } from "./firebase.js";
  
  const turnosContainer = document.getElementById("turnos-container");
  const turnoForm = document.getElementById("turno-form");
  const authForm = document.getElementById("auth-form");
  const modalLogin = document.getElementById("modal-login");
  const mainContent = document.getElementById("main-content");
  
  // Elementos Desplegables
  const btnToggleForm = document.getElementById('toggle-form');
  const containerForm = document.getElementById('container-form-desplegable');
  
  // Edición
  const modalEdit = document.getElementById("modal-edit");
  const editForm = document.getElementById("edit-form");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");
  
  let idTurno = "";
  
  // --- LÓGICA DE LOGIN ---
  authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('auth-user').value;
      const pass = document.getElementById('auth-pass').value;
  
      try {
          const querySnapshot = await getUsuarios();
          let encontrado = false;
  
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.user === user && data.pass === pass) {
                  encontrado = true;
              }
          });
  
          if (encontrado) {
              modalLogin.style.display = "none";
              mainContent.style.display = "flex"; 
              iniciarApp();
          } else {
              alert("Acceso denegado: Usuario o contraseña incorrectos");
          }
      } catch (error) {
          console.error("Error en Auth:", error);
      }
  });
  
  // --- LÓGICA DESPLEGABLE FORMULARIO ---
  btnToggleForm.addEventListener('click', () => {
      const isHidden = containerForm.classList.contains('form-hidden');
      if (isHidden) {
          containerForm.classList.remove('form-hidden');
          btnToggleForm.innerText = "✕ Cancelar";
          btnToggleForm.style.background = "#ff7675";
      } else {
          containerForm.classList.add('form-hidden');
          btnToggleForm.innerText = "+ Nuevo Turno";
          btnToggleForm.style.background = "#0984e3";
      }
  });
  
  // --- FUNCIONES DE APOYO PARA FECHAS ---
  const obtenerFechaObj = (fechaStr, horaStr) => new Date(`${fechaStr}T${horaStr}`);

  // Validar si es horario comercial (L-V, 10-21hs)
  const esHorarioValido = (fechaStr, horaStr) => {
      // Usamos el formato YYYY/MM/DD para evitar problemas de zona horaria al detectar el día
      const [year, month, day] = fechaStr.split('-');
      const fecha = new Date(year, month - 1, day);
      const diaSemana = fecha.getDay(); // 0: Domingo, 6: Sábado
      
      const hora = parseInt(horaStr.split(':')[0]);

      if (diaSemana === 0 || diaSemana === 6) {
          alert("Lo sentimos, la barbería está cerrada los fines de semana.");
          return false;
      }
      if (hora < 10 || hora >= 21) {
          alert("El horario de atención es de 10:00 a 21:00 hs.");
          return false;
      }
      return true;
  };
  
  const esHoy = (fecha) => {
      const hoy = new Date();
      return fecha.getDate() === hoy.getDate() &&
             fecha.getMonth() === hoy.getMonth() &&
             fecha.getFullYear() === hoy.getFullYear();
  };
  
  const esEstaSemana = (fecha) => {
      const hoy = new Date();
      const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
      inicioSemana.setHours(0,0,0,0);
      const finSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 6));
      finSemana.setHours(23,59,59,999);
      return fecha >= inicioSemana && fecha <= finSemana;
  };
  
  const esEsteMes = (fecha) => {
      const hoy = new Date();
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  };
  
  // --- GESTIÓN DE TURNOS ---
  function iniciarApp() {
      onGetTurnos((querySnapshot) => {
          turnosContainer.innerHTML = "";
          
          let turnos = [];
          querySnapshot.forEach(doc => {
              turnos.push({ id: doc.id, ...doc.data() });
          });
  
          // Ordenar por fecha y hora
          turnos.sort((a, b) => obtenerFechaObj(a.fecha, a.hora) - obtenerFechaObj(b.fecha, b.hora));
  
          const grupos = {
              hoy: { titulo: "🔥 Hoy", items: [] },
              semana: { titulo: "📅 Esta Semana", items: [] },
              mes: { titulo: "🗓️ Resto del Mes", items: [] },
              futuro: { titulo: "🚀 Próximos Turnos", items: [] }
          };
  
          turnos.forEach(t => {
              const fechaT = obtenerFechaObj(t.fecha, t.hora);
              if (esHoy(fechaT)) grupos.hoy.items.push(t);
              else if (esEstaSemana(fechaT)) grupos.semana.items.push(t);
              else if (esEsteMes(fechaT)) grupos.mes.items.push(t);
              else grupos.futuro.items.push(t);
          });
  
          Object.keys(grupos).forEach(clave => {
              const grupo = grupos[clave];
              if (grupo.items.length > 0) {
                  const section = document.createElement("div");
                  section.className = "grupo-container";
                  section.innerHTML = `
                      <div class="grupo-header">
                          <strong>${grupo.titulo} (${grupo.items.length})</strong>
                          <span>▾</span>
                      </div>
                      <div class="grupo-contenido"></div>
                  `;
                  
                  const header = section.querySelector(".grupo-header");
                  const contenido = section.querySelector(".grupo-contenido");
                  header.onclick = () => contenido.classList.toggle('form-hidden');
  
                  grupo.items.forEach(t => {
                      const card = document.createElement("div");
                      card.className = "card-tarea";
                      card.innerHTML = `
                          <div>
                              <h3>${t.cliente}</h3>
                              <p>📅 ${t.fecha} | ⏰ ${t.hora} hs</p>
                              <p>✂️ Barbero: ${t.barbero}</p>
                          </div>
                          <div>
                              <button class="btn-edit" data-id="${t.id}">Editar</button>
                              <button class="btn-delete" data-id="${t.id}">Borrar</button>
                          </div>
                      `;
                      contenido.append(card);
                  });
                  turnosContainer.append(section);
              }
          });
          asignarEventosBotones();
      });
  }
  
  function asignarEventosBotones() {
      turnosContainer.querySelectorAll('.btn-delete').forEach(btn => {
          btn.onclick = (e) => { 
              e.stopPropagation();
              if(confirm("¿Eliminar turno?")) deleteTurno(btn.dataset.id); 
          };
      });
  
      turnosContainer.querySelectorAll('.btn-edit').forEach(btn => {
          btn.onclick = async (e) => {
              e.stopPropagation();
              const docSnap = await getTurno(btn.dataset.id);
              const data = docSnap.data();
              document.getElementById('edit-cliente').value = data.cliente;
              document.getElementById('edit-fecha').value = data.fecha;
              document.getElementById('edit-hora').value = data.hora;
              document.getElementById('edit-barbero').value = data.barbero;
              idTurno = btn.dataset.id;
              modalEdit.style.display = "flex";
          };
      });
  }
  
  turnoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fecha = document.getElementById('fecha').value;
      const hora = document.getElementById('hora').value;

      if (!esHorarioValido(fecha, hora)) return;

      await saveTurno({
          cliente: document.getElementById('cliente').value,
          fecha,
          hora,
          barbero: document.getElementById('barbero').value
      });
      turnoForm.reset();
      containerForm.classList.add('form-hidden');
      btnToggleForm.innerText = "+ Nuevo Turno";
      btnToggleForm.style.background = "#0984e3";
  });
  
  editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fecha = document.getElementById('edit-fecha').value;
      const hora = document.getElementById('edit-hora').value;

      if (!esHorarioValido(fecha, hora)) return;

      await updateTurno(idTurno, {
          cliente: document.getElementById('edit-cliente').value,
          fecha,
          hora,
          barbero: document.getElementById('edit-barbero').value
      });
      modalEdit.style.display = "none";
  });
  
  if(btnCancelEdit) btnCancelEdit.onclick = () => modalEdit.style.display = "none";
  document.getElementById('btn-logout').onclick = () => location.reload();