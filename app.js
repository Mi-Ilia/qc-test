/**
 * Habit Tracker Application
 */

const STORAGE_KEY = 'habit-tracker-data-v1';
const THEME_STORAGE_KEY = 'habit-tracker-theme';

const DEFAULT_HABITS = [
    { id: 'habit-1', name: 'Пить воду', icon: '💧', color: '#3b82f6', createdAt: new Date().toISOString() },
    { id: 'habit-2', name: 'Тренировка', icon: '🏃', color: '#10b981', createdAt: new Date().toISOString() },
    { id: 'habit-3', name: 'Читать', icon: '📚', color: '#f59e0b', createdAt: new Date().toISOString() },
    { id: 'habit-4', name: 'Сон до 23:00', icon: '😴', color: '#8b5cf6', createdAt: new Date().toISOString() }
];

const ICONS = ['💧', '📚', '🏃', '😴', '🥗', '🧘', '✍️', '🎯', '💪', '🚿', '🌿', '⭐'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

let state = { habits: [], completions: {}, currentWeekStart: null };

function generateId() { return 'habit-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9); }
function toISODate(date) { const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,'0'), d=String(date.getDate()).padStart(2,'0'); return y+'-'+m+'-'+d; }
function fromISODate(s) { const p=s.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
function getMondayOfWeek(date) { const d=new Date(date), day=d.getDay(), diff=d.getDate()-day+(day===0?-6:1); d.setDate(diff); d.setHours(0,0,0,0); return d; }
function addDays(date, days) { const r=new Date(date); r.setDate(r.getDate()+days); return r; }
function getWeekDates(ws) { const d=[]; for(let i=0;i<7;i++) d.push(addDays(ws,i)); return d; }
function formatWeekRange(ws) { const we=addDays(ws,6), sd=String(ws.getDate()).padStart(2,'0'), ed=String(we.getDate()).padStart(2,'0'), sm=ws.toLocaleString('ru',{month:'short'}), em=we.toLocaleString('ru',{month:'short'}); return sm===em?sd+'–'+ed+' '+sm:sd+' '+sm+' – '+ed+' '+em; }
function escapeHtml(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
function normalizeName(n) { return n.trim().toLowerCase(); }

function loadFromStorage() { try { const s=localStorage.getItem(STORAGE_KEY); if(s){const p=JSON.parse(s); if(isValidData(p))return p;} return null; } catch(e){console.error(e);return null;} }
function saveToStorage() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){console.error(e);showToast('Ошибка сохранения','error');} }
function isValidData(d) { if(!d||typeof d!=='object')return false; if(!Array.isArray(d.habits))return false; if(!d.completions||typeof d.completions!=='object')return false; for(const h of d.habits){if(!h.id||!h.name||!h.icon||!h.color)return false;} return true; }
function initializeDefaultData() { state={habits:JSON.parse(JSON.stringify(DEFAULT_HABITS)),completions:{}}; saveToStorage(); }

function loadTheme() { const st=localStorage.getItem(THEME_STORAGE_KEY), pd=window.matchMedia('(prefers-color-scheme:dark)').matches, t=st||(pd?'dark':'light'); applyTheme(t); return t; }
function applyTheme(t) { document.documentElement.setAttribute('data-theme',t); const si=document.querySelector('.icon-sun'), mi=document.querySelector('.icon-moon'); if(t==='dark'){if(si)si.classList.add('hidden');if(mi)mi.classList.remove('hidden');}else{if(si)si.classList.remove('hidden');if(mi)mi.classList.add('hidden');} }
function toggleTheme() { const ct=document.documentElement.getAttribute('data-theme')||'light', nt=ct==='light'?'dark':'light'; applyTheme(nt); localStorage.setItem(THEME_STORAGE_KEY,nt); }

function showToast(msg,type){if(type===undefined)type='info';const c=document.getElementById('toast-container'),t=document.createElement('div');t.className='toast toast-'+type;const icons={success:'✓',error:'✕',info:'ℹ'};t.innerHTML='<span class="toast-icon">'+icons[type]+'</span><span class="toast-message">'+escapeHtml(msg)+'</span>';c.appendChild(t);setTimeout(function(){t.classList.add('hiding');setTimeout(function(){t.remove();},300);},3000);}
function openModal(id){const m=document.getElementById(id);m.classList.remove('hidden');m.querySelector('.modal-overlay').addEventListener('click',function(){closeModal(id);});}
function closeModal(id){document.getElementById(id).classList.add('hidden');}

function updateDashboard(){const th=state.habits.length,today=toISODate(new Date());let ct=0;state.habits.forEach(function(h){if(state.completions[h.id]&&state.completions[h.id][today])ct++;});const wd=getWeekDates(state.currentWeekStart);let tc=0,pc=th*7;wd.forEach(function(d){const di=toISODate(d);state.habits.forEach(function(h){if(state.completions[h.id]&&state.completions[h.id][di])tc++;});});const wp=pc>0?Math.round((tc/pc)*100):0;document.getElementById('total-habits').textContent=th;document.getElementById('today-progress').textContent=ct+' / '+th;document.getElementById('weekly-progress').textContent=wp+'%';document.getElementById('weekly-bar').style.width=wp+'%';}

function renderTable(){const hr=document.getElementById('table-header-row'),tb=document.getElementById('table-body'),es=document.getElementById('empty-state'),tc=document.querySelector('.table-container');if(state.habits.length===0){es.classList.remove('hidden');tc.classList.add('hidden');return;}es.classList.add('hidden');tc.classList.remove('hidden');const wd=getWeekDates(state.currentWeekStart),today=toISODate(new Date());let hh='<th>Привычка</th>';wd.forEach(function(d){const di=toISODate(d),it=di===today,di2=(d.getDay()+6)%7;hh+='<th class="'+(it?'today-highlight':'')+'"><div>'+DAY_NAMES[di2]+'</div><div style="font-size:0.75rem;font-weight:normal;">'+d.getDate()+'</div>'+(it?'<span class="today-indicator">Сегодня</span>':'')+'</th>';});hh+='<th>Прогресс</th>';hr.innerHTML=hh;let bh='';state.habits.forEach(function(h){let wc=0;wd.forEach(function(d){const di=toISODate(d);if(state.completions[h.id]&&state.completions[h.id][di])wc++;});bh+='<tr data-habit-id="'+h.id+'"><td><div class="habit-cell"><span class="habit-icon">'+h.icon+'</span><span class="habit-name" title="'+escapeHtml(h.name)+'">'+escapeHtml(h.name)+'</span><div class="habit-actions"><button class="action-btn edit-btn" aria-label="Изменить" onclick="openEditModal(\''+h.id+'\')"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button><button class="action-btn delete-btn" aria-label="Удалить" onclick="openDeleteModal(\''+h.id+'\')"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div></div></td>';wd.forEach(function(d){const di=toISODate(d),ic=!!(state.completions[h.id]&&state.completions[h.id][di]);bh+='<td class="completion-cell"><button class="completion-btn '+(ic?'completed':'')+'" data-habit="'+h.id+'" data-date="'+di+'" style="--habit-color:'+h.color+'" aria-label="'+(ic?'Отметить как невыполненное':'Отметить как выполненное')+'"><svg class="completion-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></button></td>';});bh+='<td><span class="progress-indicator">'+wc+' / 7</span></td></tr>';});tb.innerHTML=bh;tb.querySelectorAll('.completion-btn').forEach(function(b){b.addEventListener('click',handleCompletionToggle);});}

function handleAddHabit(e){e.preventDefault();const ni=document.getElementById('habit-name'),ii=document.getElementById('selected-icon'),ci=document.getElementById('selected-color'),n=ni.value.trim(),i=ii.value,c=ci.value;if(!n){showToast('Введите название','error');return;}const nn=normalizeName(n),dup=state.habits.some(function(h){return normalizeName(h.name)===nn;});if(dup){showToast('Привычка уже существует','error');return;}const nh={id:generateId(),name:n,icon:i,color:c,createdAt:new Date().toISOString()};state.habits.push(nh);state.completions[nh.id]={};saveToStorage();ni.value='';ii.value='💧';ci.value='#3b82f6';resetIconPicker(document.getElementById('icon-picker'));resetColorPicker(document.getElementById('color-picker'));renderAll();showToast('Привычка добавлена','success');}

function openEditModal(hid){const h=state.habits.find(function(x){return x.id===hid;});if(!h)return;document.getElementById('edit-habit-id').value=h.id;document.getElementById('edit-habit-name').value=h.name;document.getElementById('edit-selected-icon').value=h.icon;document.getElementById('edit-selected-color').value=h.color;populateEditPickers(h.icon,h.color);openModal('edit-modal');}

function populateEditPickers(si,sc){const eip=document.getElementById('edit-icon-picker');let ih='';ICONS.forEach(function(ic){ih+='<button type="button" class="icon-option '+(ic===si?'selected':'')+'" data-icon="'+ic+'">'+ic+'</button>';});eip.innerHTML=ih;eip.querySelectorAll('.icon-option').forEach(function(b){b.addEventListener('click',function(){eip.querySelectorAll('.icon-option').forEach(function(x){x.classList.remove('selected');});b.classList.add('selected');document.getElementById('edit-selected-icon').value=b.dataset.icon;});});const ecp=document.getElementById('edit-color-picker');let ch='';COLORS.forEach(function(cl){ch+='<button type="button" class="color-option '+(cl===sc?'selected':'')+'" data-color="'+cl+'" style="background-color:'+cl+';"></button>';});ecp.innerHTML=ch;ecp.querySelectorAll('.color-option').forEach(function(b){b.addEventListener('click',function(){ecp.querySelectorAll('.color-option').forEach(function(x){x.classList.remove('selected');});b.classList.add('selected');document.getElementById('edit-selected-color').value=b.dataset.color;});});}

function handleEditHabit(e){e.preventDefault();const hid=document.getElementById('edit-habit-id').value,n=document.getElementById('edit-habit-name').value.trim(),i=document.getElementById('edit-selected-icon').value,c=document.getElementById('edit-selected-color').value;if(!n){showToast('Введите название','error');return;}const nn=normalizeName(n),dup=state.habits.some(function(h){return h.id!==hid&&normalizeName(h.name)===nn;});if(dup){showToast('Привычка уже существует','error');return;}const h=state.habits.find(function(x){return x.id===hid;});if(h){h.name=n;h.icon=i;h.color=c;saveToStorage();renderAll();closeModal('edit-modal');showToast('Привычка обновлена','success');}}

function openDeleteModal(hid){document.getElementById('delete-habit-id').value=hid;const h=state.habits.find(function(x){return x.id===hid;});if(h)document.getElementById('delete-confirm-text').textContent='Удалить привычку "'+h.name+'"?';openModal('delete-modal');}

function handleDeleteHabit(){const hid=document.getElementById('delete-habit-id').value,hi=state.habits.findIndex(function(x){return x.id===hid;});if(hi!==-1){const hn=state.habits[hi].name;state.habits.splice(hi,1);delete state.completions[hid];saveToStorage();renderAll();closeModal('delete-modal');showToast('Привычка удалена','success');}}

function handleCompletionToggle(e){const b=e.currentTarget,hid=b.dataset.habit,di=b.dataset.date;if(!state.completions[hid])state.completions[hid]={};if(state.completions[hid][di])delete state.completions[hid][di];else state.completions[hid][di]=true;saveToStorage();renderAll();}

function navigateWeek(dir){state.currentWeekStart=addDays(state.currentWeekStart,dir*7);renderAll();}
function goToToday(){state.currentWeekStart=getMondayOfWeek(new Date());renderAll();}
function updateWeekNav(){document.getElementById('week-range').textContent=formatWeekRange(state.currentWeekStart);}

function setupIconPicker(pid,iid){const p=document.getElementById(pid);p.querySelectorAll('.icon-option').forEach(function(b){b.addEventListener('click',function(){p.querySelectorAll('.icon-option').forEach(function(x){x.classList.remove('selected');});b.classList.add('selected');document.getElementById(iid).value=b.dataset.icon;});});}
function setupColorPicker(pid,iid){const p=document.getElementById(pid);p.querySelectorAll('.color-option').forEach(function(b){b.addEventListener('click',function(){p.querySelectorAll('.color-option').forEach(function(x){x.classList.remove('selected');});b.classList.add('selected');document.getElementById(iid).value=b.dataset.color;});});}
function resetIconPicker(p){p.querySelectorAll('.icon-option').forEach(function(b,i){b.classList.toggle('selected',i===0);});}
function resetColorPicker(p){p.querySelectorAll('.color-option').forEach(function(b,i){b.classList.toggle('selected',i===0);});}

function exportData(){const ds=JSON.stringify(state,null,2),blob=new Blob([ds],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='habit-tracker-'+toISODate(new Date())+'.json';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);showToast('Данные экспортированы','success');}

function importData(file){const reader=new FileReader();reader.onload=function(e){try{const id=JSON.parse(e.target.result);if(!isValidData(id)){showToast('Неверный формат','error');return;}window.pendingImport=id;openModal('import-confirm-modal');}catch(err){showToast('Ошибка чтения','error');}};reader.onerror=function(){showToast('Ошибка','error');};reader.readAsText(file);}
function confirmImport(){if(window.pendingImport){state=window.pendingImport;saveToStorage();renderAll();closeModal('import-confirm-modal');window.pendingImport=null;showToast('Данные импортированы','success');}}

function resetAllData(){if(confirm('Сбросить все данные?')){localStorage.removeItem(STORAGE_KEY);state={habits:[],completions:{},currentWeekStart:getMondayOfWeek(new Date())};renderAll();showToast('Данные сброшены','success');}}

function renderAll(){renderTable();updateDashboard();updateWeekNav();}

function setupEventListeners(){document.getElementById('theme-toggle').addEventListener('click',toggleTheme);document.getElementById('add-habit-form').addEventListener('submit',handleAddHabit);document.getElementById('edit-habit-form').addEventListener('submit',handleEditHabit);document.getElementById('cancel-edit').addEventListener('click',function(){closeModal('edit-modal');});document.getElementById('cancel-delete').addEventListener('click',function(){closeModal('delete-modal');});document.getElementById('confirm-delete').addEventListener('click',handleDeleteHabit);document.getElementById('cancel-import').addEventListener('click',function(){closeModal('import-confirm-modal');});document.getElementById('confirm-import').addEventListener('click',confirmImport);document.getElementById('prev-week').addEventListener('click',function(){navigateWeek(-1);});document.getElementById('next-week').addEventListener('click',function(){navigateWeek(1);});document.getElementById('today-btn').addEventListener('click',goToToday);document.getElementById('export-btn').addEventListener('click',exportData);document.getElementById('import-btn').addEventListener('click',function(){document.getElementById('import-file').click();});document.getElementById('import-file').addEventListener('change',function(e){const f=e.target.files[0];if(f){importData(f);e.target.value='';}});document.getElementById('reset-data-btn').addEventListener('click',resetAllData);document.getElementById('add-first-habit').addEventListener('click',function(){document.getElementById('habit-name').focus();});setupIconPicker('icon-picker','selected-icon');setupColorPicker('color-picker','selected-color');document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeModal('edit-modal');closeModal('delete-modal');closeModal('import-confirm-modal');}});}

function init(){loadTheme();const sd=loadFromStorage();if(sd){state=sd;if(!state.currentWeekStart)state.currentWeekStart=getMondayOfWeek(new Date());else if(typeof state.currentWeekStart==='string')state.currentWeekStart=fromISODate(state.currentWeekStart);}else{initializeDefaultData();state.currentWeekStart=getMondayOfWeek(new Date());}setupEventListeners();renderAll();}

document.addEventListener('DOMContentLoaded',init);
