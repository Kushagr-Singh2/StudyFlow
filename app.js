const STORAGE_KEY = "studyflow.v1";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const state = loadState();
let toastTimer;
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{subjects:[],focus:[],sessionNote:""}}catch{return{subjects:[],focus:[],sessionNote:""}}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderAll()}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function allTopics(subject){return subject.items.filter(i=>i.kind==="topic")}
function flattenTopics(subject){return subject.items.filter(i=>i.kind==="topic")}
function progress(subject){const topics=allTopics(subject);return {total:topics.length,done:topics.filter(t=>t.done).length,pct:topics.length?Math.round(topics.filter(t=>t.done).length/topics.length*100):0}}
function totalStats(){const topics=state.subjects.flatMap(s=>allTopics(s));return{subjects:state.subjects.length,total:topics.length,done:topics.filter(t=>t.done).length,pct:topics.length?Math.round(topics.filter(t=>t.done).length/topics.length*100):0}}
function showToast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400)}
function openDialog(id){$(id).showModal()}
function closeDialog(id){$(id).close()}
function setView(view){$$(".view").forEach(v=>v.classList.toggle("active",v.id===view+"View"));$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("#pageTitle").textContent=({dashboard:"Dashboard",subjects:"Subjects & topics",today:"Today's focus"})[view];if(view==="today")renderFocus();if(view==="subjects")renderSubjects();window.scrollTo({top:0,behavior:"smooth"})}
function subjectIcon(name){return (name.trim()[0]||"S").toUpperCase()}
function subjectCard(s){const p=progress(s);return `<article class="subject-card"><div class="subject-card-top"><div class="subject-badge ${esc(s.color)}">${esc(subjectIcon(s.name))}</div><button class="more-btn" title="Delete subject" data-delete-subject="${s.id}">⋯</button></div><h3>${esc(s.name)}</h3><p class="description">${esc(s.description||"Keep building your knowledge.")}</p><div class="progress-row"><span>${p.done} of ${p.total} topics completed</span><strong>${p.pct}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${p.pct}%"></div></div><div class="subject-card-bottom"><span>${s.deadline?"Target: "+esc(s.deadline):"No target date"}</span><button data-open-subject="${s.id}">Open plan →</button></div></article>`}
function renderDashboard(){const stats=totalStats();$("#statSubjects").textContent=stats.subjects;$("#statCompleted").innerHTML=`${stats.done} <small>/ ${stats.total}</small>`;$("#statProgress").textContent=stats.pct+"%";$("#dashboardSubjects").innerHTML=state.subjects.slice(0,6).map(subjectCard).join("");$("#emptyDashboard").classList.toggle("show",!state.subjects.length);$("#dashboardSubjects").style.display=state.subjects.length?"grid":"none";$("#dashboardSubjects").style.marginBottom=state.subjects.length?"0":"0"}
function renderSubjects(){const container=$("#allSubjects");container.innerHTML=state.subjects.map(s=>{const p=progress(s);const phases=s.items.filter(i=>i.kind==="phase");const loose=s.items.filter(i=>i.kind==="topic"&&!i.phaseId);let inner="";phases.forEach(phase=>{const topics=s.items.filter(i=>i.kind==="topic"&&i.phaseId===phase.id);const done=topics.filter(t=>t.done).length;inner+=`<div class="phase"><div class="phase-header"><button class="phase-toggle" data-toggle-phase="${phase.id}" data-subject="${s.id}">⌄</button><span class="phase-title">${esc(phase.name)}</span><span class="phase-count">${done}/${topics.length}</span><button class="topic-tool" data-edit-topic="${phase.id}" data-subject="${s.id}" title="Edit phase">✎</button></div><div class="topic-list" data-phase-list="${phase.id}">${topics.map(t=>topicRow(t,s.id)).join("")||'<div class="no-topics">No topics in this phase yet.</div>'}<button class="add-topic-inline" data-add-topic="${s.id}" data-phase="${phase.id}">＋ Add topic to phase</button></div></div>`});if(loose.length){inner+=`<div class="phase"><div class="phase-header"><span class="phase-title">General topics</span><span class="phase-count">${loose.filter(t=>t.done).length}/${loose.length}</span></div><div class="topic-list">${loose.map(t=>topicRow(t,s.id)).join("")}</div></div>`}return `<section class="subject-block"><div class="subject-block-header"><div class="subject-badge ${esc(s.color)}">${esc(subjectIcon(s.name))}</div><div class="header-info"><h3>${esc(s.name)}</h3><p>${esc(s.description||"No description")} · ${p.done}/${p.total} topics complete</p></div><div class="progress-mini"><div class="progress-track"><div class="progress-fill" style="width:${p.pct}%"></div></div></div><div class="subject-block-actions"><button class="small-btn" data-add-phase="${s.id}">＋ Phase/topic</button><button class="small-btn" data-delete-subject="${s.id}">Delete</button></div></div>${inner||'<div class="topic-list"><div class="no-topics">Add a phase or topic to begin.</div></div>'}<div class="phase"><div class="topic-list"><button class="add-topic-inline" data-add-phase="${s.id}">＋ Add phase or topic</button></div></div></section>`}).join("");$("#emptySubjects").classList.toggle("show",!state.subjects.length);container.style.display=state.subjects.length?"block":"none"}
function topicRow(t,sid){return `<div class="topic-row ${t.done?"completed":""}"><input class="topic-check" type="checkbox" aria-label="Mark ${esc(t.name)} complete" data-toggle-topic="${t.id}" data-subject="${sid}" ${t.done?"checked":""}><div class="topic-copy"><strong>${esc(t.name)}</strong>${t.scheduleDate?`<div class="topic-schedule">📅 ${esc(t.scheduleDate)}</div>`:""}${t.details?`<div class="topic-details">${esc(t.details)}</div>`:""}</div><div class="topic-tools"><button class="topic-tool" data-edit-topic="${t.id}" data-subject="${sid}" title="Edit">✎</button></div></div>`}
function renderFocus(){const picker=$("#focusPicker");picker.innerHTML=state.subjects.map(s=>{const pending=allTopics(s).filter(t=>!t.done);return `<div class="picker-subject"><div class="picker-subject-title">${esc(s.name)}</div>${pending.length?pending.map(t=>`<label class="picker-topic"><input type="checkbox" data-focus-add="${t.id}" data-subject="${s.id}" ${state.focus.some(f=>f.topicId===t.id&&f.subjectId===s.id)?"checked":""}>${esc(t.name)}</label>`).join(""):'<div class="empty-small">All topics completed. Nice work!</div>'}</div>`}).join("")||'<div class="empty-small">Create a subject first, then select topics to focus on.</div>';$("#focusDate").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});$("#sessionNote").value=state.sessionNote||"";const items=state.focus.map(f=>{const s=state.subjects.find(x=>x.id===f.subjectId);const t=s?.items.find(x=>x.id===f.topicId&&x.kind==="topic");return s&&t?{s,t}:null}).filter(Boolean);$("#todayList").innerHTML=items.map(({s,t})=>`<div class="today-item"><input class="topic-check" type="checkbox" data-toggle-topic="${t.id}" data-subject="${s.id}" ${t.done?"checked":""}><div class="today-copy">${esc(t.name)}<small>${esc(s.name)}</small></div><button data-focus-remove="${t.id}" data-subject="${s.id}" title="Remove from focus">×</button></div>`).join("")||'<div class="empty-small">Nothing selected yet. Choose a few topics on the left.</div>'}
function renderAll(){renderDashboard();renderSubjects();if($("#todayView").classList.contains("active"))renderFocus()}
function addSubject(data){state.subjects.push({id:uid(),name:data.name,description:data.description,deadline:data.deadline,color:data.color,items:[]});save();showToast("Subject created")}
function openTopicDialog(subjectId,phaseId=""){const s=state.subjects.find(x=>x.id===subjectId);if(!s)return;$("#topicSubjectId").value=subjectId;$("#topicName").value="";$("#topicDetails").value="";$("#topicKind").value="phase";populatePhaseSelect(s,phaseId);$("#topicDialogTitle").textContent="Add a phase or topic";openDialog("#topicDialog")}
function populatePhaseSelect(s,selected=""){const select=$("#topicPhase");select.innerHTML='<option value="">No phase / top level</option>'+s.items.filter(i=>i.kind==="phase").map(p=>`<option value="${p.id}" ${selected===p.id?"selected":""}>${esc(p.name)}</option>`).join("");select.disabled=$("#topicKind").value==="phase"}
function createTopic(subjectId,kind,name,details,phaseId){const s=state.subjects.find(x=>x.id===subjectId);if(!s)return;s.items.push({id:uid(),kind,name,details,phaseId:kind==="topic"?phaseId:"",done:false});save();showToast(kind==="phase"?"Phase added":"Topic added")}
function findItem(sid,id){const s=state.subjects.find(x=>x.id===sid);return{s,item:s?.items.find(i=>i.id===id)}}
function editTopic(sid,id){const {s,item}=findItem(sid,id);if(!item)return;$("#editSubjectId").value=sid;$("#editTopicId").value=id;$("#editTopicName").value=item.name;$("#editTopicDetails").value=item.details||"";$("#deleteTopicBtn").dataset.deleteTopic=id;$("#deleteTopicBtn").dataset.subject=sid;openDialog("#editTopicDialog")}
function deleteTopic(sid,id){const s=state.subjects.find(x=>x.id===sid);if(!s)return;const item=s.items.find(i=>i.id===id);if(!item)return;if(item.kind==="phase")s.items=s.items.filter(i=>i.id!==id&&i.phaseId!==id);else s.items=s.items.filter(i=>i.id!==id);state.focus=state.focus.filter(f=>f.topicId!==id);save();showToast("Removed from plan")}
function deleteSubject(id){const s=state.subjects.find(x=>x.id===id);if(!s)return;if(!confirm(`Delete "${s.name}" and all its topics? This cannot be undone unless you have an export backup.`))return;state.subjects=state.subjects.filter(x=>x.id!==id);state.focus=state.focus.filter(f=>f.subjectId!==id);save();showToast("Subject deleted")}
function exportBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="semready-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(a.href);showToast("Backup exported")}
function importBackup(file){const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!data||!Array.isArray(data.subjects))throw Error();if(!confirm("Replace the current SemReady data with this backup? Export your current data first if you need it."))return;state.subjects=data.subjects;state.focus=Array.isArray(data.focus)?data.focus:[];state.sessionNote=data.sessionNote||"";save();showToast("Backup imported")}catch{alert("That file doesn't look like a valid SemReady backup.")}};reader.readAsText(file)}

$("#subjectForm").addEventListener("submit",e=>{e.preventDefault();const name=$("#subjectName").value.trim();if(!name)return;addSubject({name,description:$("#subjectDescription").value.trim(),deadline:$("#subjectDeadline").value,color:$("#subjectColor").value});$("#subjectDialog").close();e.target.reset()});
$("#topicForm").addEventListener("submit",e=>{e.preventDefault();const name=$("#topicName").value.trim();if(!name)return;createTopic($("#topicSubjectId").value,$("#topicKind").value,name,$("#topicDetails").value.trim(),$("#topicPhase").value);$("#topicDialog").close();e.target.reset()});
$("#editTopicForm").addEventListener("submit",e=>{e.preventDefault();const {item}=findItem($("#editSubjectId").value,$("#editTopicId").value);if(item){item.name=$("#editTopicName").value.trim();item.details=$("#editTopicDetails").value.trim();save();showToast("Changes saved")}$("#editTopicDialog").close()});
$("#topicKind").addEventListener("change",()=>{const s=state.subjects.find(x=>x.id===$("#topicSubjectId").value);if(s)populatePhaseSelect(s)});
$("#deleteTopicBtn").addEventListener("click",()=>{if(confirm("Delete this phase or topic?")){deleteTopic($("#deleteTopicBtn").dataset.subject,$("#deleteTopicBtn").dataset.deleteTopic);$("#editTopicDialog").close()}});
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.view)setView(b.dataset.view);if(b.dataset.close)closeDialog("#"+b.dataset.close);if(b.id==="addSubjectTop"||b.id==="addSubjectBtn"||b.id==="emptyAddSubject"||b.id==="emptyAddSubject2")openDialog("#subjectDialog");if(b.id==="viewAllSubjects")setView("subjects");if(b.id==="startTodayBtn")setView("today");if(b.dataset.openSubject){setView("subjects");document.querySelector(`[data-open-subject="${b.dataset.openSubject}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})}if(b.dataset.addPhase)openTopicDialog(b.dataset.addPhase);if(b.dataset.addTopic)openTopicDialog(b.dataset.addTopic,b.dataset.phase||"");if(b.dataset.editTopic)editTopic(b.dataset.subject,b.dataset.editTopic);if(b.dataset.deleteSubject)deleteSubject(b.dataset.deleteSubject);if(b.dataset.deleteTopic && b.id!=="deleteTopicBtn")deleteTopic(b.dataset.subject,b.dataset.deleteTopic);if(b.dataset.togglePhase){const list=document.querySelector(`[data-phase-list="${b.dataset.togglePhase}"]`);if(list){list.hidden=!list.hidden;b.textContent=list.hidden?"›":"⌄"}}if(b.dataset.focusRemove){state.focus=state.focus.filter(f=>!(f.topicId===b.dataset.focusRemove&&f.subjectId===b.dataset.subject));save()};if(b.id==="clearFocus"){state.focus=[];save();showToast("Today's list cleared")}});
document.addEventListener("change",e=>{const el=e.target;if(el.dataset.toggleTopic){const {item}=findItem(el.dataset.subject,el.dataset.toggleTopic);if(item){item.done=el.checked;save();showToast(item.done?"Topic completed":"Topic reopened")}}if(el.dataset.focusAdd){const f={topicId:el.dataset.focusAdd,subjectId:el.dataset.subject};if(el.checked){if(!state.focus.some(x=>x.topicId===f.topicId&&x.subjectId===f.subjectId))state.focus.push(f)}else state.focus=state.focus.filter(x=>!(x.topicId===f.topicId&&x.subjectId===f.subjectId));save()}});
$("#sessionNote").addEventListener("input",e=>{state.sessionNote=e.target.value;localStorage.setItem(STORAGE_KEY,JSON.stringify(state))});
$("#exportBtn").addEventListener("click",exportBackup);$("#importInput").addEventListener("change",e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value=""});
$("#todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
renderAll();


// AI syllabus-to-roadmap flow. Gemini creates a dated checklist; the user approves it before saving.
let generatedRoadmapDraft = null;
const roadmapFileInput = $("#syllabusFile");
const roadmapStatus = $("#roadmapStatus");
const roadmapSubmit = $("#generateRoadmapSubmit");
const roadmapStart = $("#roadmapStartDate");
const roadmapEnd = $("#roadmapEndDate");
function setRoadmapStatus(message, type="") {
  roadmapStatus.textContent = message;
  roadmapStatus.className = "import-status" + (type ? " " + type : "");
}
function openRoadmapDialog() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0,10);
  roadmapStart.value = localDate;
  roadmapEnd.value = localDate;
  roadmapFileInput.value = "";
  generatedRoadmapDraft = null;
  $("#roadmapReview").hidden = true;
  setRoadmapStatus("Choose a syllabus and your preparation dates.");
  openDialog("#roadmapDialog");
}
$("#generateRoadmapBtn").addEventListener("click", openRoadmapDialog);
$("#regenerateRoadmapBtn").addEventListener("click", () => {
  generatedRoadmapDraft = null;
  $("#roadmapReview").hidden = true;
  setRoadmapStatus("Choose a syllabus and dates, then generate again.");
});
function roadmapAllTopics(plan) {
  return [...(plan.topics || []), ...(plan.phases || []).flatMap(p => p.topics || [])];
}
function renderRoadmapPreview(plan) {
  const all = roadmapAllTopics(plan);
  $("#roadmapReviewName").textContent = plan.name || "Your study roadmap";
  $("#roadmapReviewCount").textContent = `${all.length} checklist items`;
  $("#roadmapReviewSummary").textContent = plan.summary || plan.description || "Review your generated roadmap before saving.";
  $("#roadmapReviewPhases").innerHTML = (plan.phases || []).map(phase =>
    `<div class="review-phase"><div class="review-phase-title">${esc(phase.name)}</div>${phase.details ? `<p>${esc(phase.details)}</p>` : ""}<ul>${(phase.topics || []).map(t => `<li><strong>${esc(t.scheduleDate)} · ${esc(t.name)}</strong>${t.details ? ` — ${esc(t.details)}` : ""}</li>`).join("")}</ul></div>`
  ).join("") + ((plan.topics || []).length ? `<div class="review-phase"><div class="review-phase-title">Other topics</div><ul>${plan.topics.map(t => `<li><strong>${esc(t.scheduleDate)} · ${esc(t.name)}</strong>${t.details ? ` — ${esc(t.details)}` : ""}</li>`).join("")}</ul></div>` : "");
  $("#roadmapReview").hidden = false;
  $("#roadmapReview").scrollIntoView({behavior:"smooth",block:"start"});
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Could not read that file. Try choosing it again."));
    reader.readAsDataURL(file);
  });
}
roadmapSubmit.addEventListener("click", async () => {
  const file = roadmapFileInput.files?.[0];
  const startDate = roadmapStart.value;
  const endDate = roadmapEnd.value;
  if (!file) return setRoadmapStatus("Choose your syllabus file first.", "error");
  if (!startDate || !endDate || startDate > endDate) return setRoadmapStatus("Choose a valid start date and finish date.", "error");
  if (!["application/pdf","image/png","image/jpeg","image/webp"].includes(file.type)) return setRoadmapStatus("Use a PDF, PNG, JPEG or WebP file.", "error");
  if (file.size > 3 * 1024 * 1024) return setRoadmapStatus("Keep the file under 3 MB. For a large syllabus, export selected pages or use screenshots.", "error");
  roadmapSubmit.disabled = true;
  $("#roadmapReview").hidden = true;
  try {
    setRoadmapStatus("Gemini is reading your syllabus and planning the available days…");
    let payload;
    if (file.type === "application/pdf") {
      payload = { mimeType:file.type, data:await fileToBase64(file), name:file.name };
    } else {
      payload = await fileToPayload(file);
      payload.mimeType = file.type;
      // Preserve the compressed image payload's JPEG mime type where applicable.
      if (payload.mimeType !== "image/jpeg") payload.mimeType = "image/jpeg";
    }
    const apiUrl = (location.hostname === "localhost" || location.hostname === "127.0.0.1") ? "http://localhost:3001/api/generate-roadmap" : "/api/generate-roadmap";
    const response = await fetch(apiUrl, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({file:payload,startDate,endDate}) });
    const result = await response.json().catch(() => ({error:"The server returned an unreadable response."}));
    if (!response.ok) throw new Error(result.error || "Could not generate the roadmap.");
    if (!result.plan || !Array.isArray(result.plan.phases)) throw new Error("Gemini returned an incomplete roadmap. Try again.");
    generatedRoadmapDraft = result.plan;
    renderRoadmapPreview(generatedRoadmapDraft);
    setRoadmapStatus("Roadmap generated. Review the dates and tasks before adding it to SemReady.", "success");
  } catch (error) {
    setRoadmapStatus(error.message || "Could not generate the roadmap. Try again.", "error");
  } finally {
    roadmapSubmit.disabled = false;
  }
});
$("#saveRoadmapBtn").addEventListener("click", () => {
  if (!generatedRoadmapDraft) return;
  const plan = generatedRoadmapDraft;
  const subject = { id:uid(), name:plan.name || "Study roadmap", description:plan.description || plan.summary || "", deadline:roadmapEnd.value, color:"violet", items:[] };
  (plan.phases || []).forEach(phase => {
    const phaseId = uid();
    subject.items.push({id:phaseId,kind:"phase",name:phase.name,details:phase.details||"",phaseId:"",done:false});
    (phase.topics || []).forEach(topic => subject.items.push({id:uid(),kind:"topic",name:topic.name,details:topic.details||"",scheduleDate:topic.scheduleDate||roadmapStart.value,phaseId,done:false}));
  });
  (plan.topics || []).forEach(topic => subject.items.push({id:uid(),kind:"topic",name:topic.name,details:topic.details||"",scheduleDate:topic.scheduleDate||roadmapStart.value,phaseId:"",done:false}));
  state.subjects.push(subject);
  save();
  closeDialog("#roadmapDialog");
  generatedRoadmapDraft = null;
  setView("subjects");
  showToast("AI study roadmap added");
});

// Screenshot import. The API key stays on the server, never in browser code.
let parsedPlanDraft = null;
let selectedPlanFiles = [];
const planImageInput = $("#planImageInput");
const parsePlanBtn = $("#parsePlanBtn");
const imageImportStatus = $("#imageImportStatus");
const imagePreviewList = $("#imagePreviewList");
const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];
const previewObjectUrls = new Set();

function setImportStatus(message, type="") {
  imageImportStatus.textContent = message;
  imageImportStatus.className = "import-status" + (type ? " " + type : "");
}
function clearPreviewUrls() {
  previewObjectUrls.forEach(url => URL.revokeObjectURL(url));
  previewObjectUrls.clear();
}
function resetPlanImport() {
  selectedPlanFiles = [];
  parsedPlanDraft = null;
  planImageInput.value = "";
  clearPreviewUrls();
  imagePreviewList.innerHTML = "";
  $("#planReview").hidden = true;
  parsePlanBtn.disabled = true;
  setImportStatus("Choose screenshots or paste them with Ctrl + V.");
}
function addPlanFiles(files) {
  const incoming = [...files].filter(file => allowedImageTypes.includes(file.type));
  if (!incoming.length) {
    if (files.length) setImportStatus("Use PNG, JPEG or WebP screenshots.", "error");
    return;
  }
  const existingKeys = new Set(selectedPlanFiles.map(file => `${file.name}|${file.size}|${file.lastModified}`));
  const uniqueIncoming = incoming.filter(file => {
    const key = `${file.name}|${file.size}|${file.lastModified}`;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });
  selectedPlanFiles.push(...uniqueIncoming);
  renderSelectedPlanFiles();
  $("#planReview").hidden = true;
  parsedPlanDraft = null;
  setImportStatus(`${selectedPlanFiles.length} screenshot(s) ready. Add more with Ctrl + V or Browse.`, selectedPlanFiles.length ? "" : "error");
}
function renderSelectedPlanFiles() {
  clearPreviewUrls();
  imagePreviewList.innerHTML = "";
  selectedPlanFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "image-preview-item";
    const img = document.createElement("img");
    img.className = "image-preview";
    img.alt = file.name || `Pasted screenshot ${index + 1}`;
    const url = URL.createObjectURL(file);
    previewObjectUrls.add(url);
    img.src = url;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-image-preview";
    remove.textContent = "×";
    remove.title = "Remove screenshot";
    remove.setAttribute("aria-label", `Remove screenshot ${index + 1}`);
    remove.addEventListener("click", () => {
      selectedPlanFiles.splice(index, 1);
      parsedPlanDraft = null;
      $("#planReview").hidden = true;
      renderSelectedPlanFiles();
      setImportStatus(selectedPlanFiles.length
        ? `${selectedPlanFiles.length} screenshot(s) ready. Add more with Ctrl + V or Browse.`
        : "Choose screenshots or paste them with Ctrl + V.");
    });
    const caption = document.createElement("span");
    caption.className = "image-preview-name";
    caption.textContent = file.name || `Pasted screenshot ${index + 1}`;
    item.append(img, remove, caption);
    imagePreviewList.appendChild(item);
  });
  parsePlanBtn.disabled = selectedPlanFiles.length === 0;
}
$("#importPlanBtn").addEventListener("click", () => {
  resetPlanImport();
  openDialog("#imageImportDialog");
});
planImageInput.addEventListener("change", () => {
  addPlanFiles([...planImageInput.files]);
  // Clear the input so the same file can be selected again if needed.
  planImageInput.value = "";
});

// Paste copied screenshots directly into the open import dialog with Ctrl+V.
document.addEventListener("paste", event => {
  const dialog = $("#imageImportDialog");
  if (!dialog?.open) return;
  const items = [...(event.clipboardData?.items || [])];
  const pastedImages = items
    .filter(item => item.kind === "file" && allowedImageTypes.includes(item.type))
    .map(item => item.getAsFile())
    .filter(Boolean);
  if (pastedImages.length) {
    event.preventDefault();
    const namedFiles = pastedImages.map((file, index) =>
      new File([file], `pasted-screenshot-${Date.now()}-${index + 1}.${file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"}`, { type: file.type, lastModified: Date.now() })
    );
    addPlanFiles(namedFiles);
  }
});

async function fileToPayload(file) {
  // Compress screenshots in the browser to stay within serverless request limits.
  const bitmap = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.78));
  if (!blob) throw new Error("This image could not be prepared. Try another screenshot.");
  if (blob.size > 900 * 1024) blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.58));
  if (!blob || blob.size > 900 * 1024) throw new Error("A screenshot is too detailed to upload. Try cropping it into smaller sections.");
  const reader = new FileReader();
  const dataUrl = await new Promise((resolve,reject) => { reader.onload=()=>resolve(String(reader.result)); reader.onerror=reject; reader.readAsDataURL(blob); });
  return { mimeType: "image/jpeg", data: dataUrl.split(",")[1], name: file.name };
}
function mergeExtractedPlans(plans) {
  const merged = { name: plans.find(plan => plan?.name)?.name || "Imported study plan", description: "", deadline: "", phases: [], topics: [] };
  for (const plan of plans) {
    if (!plan) continue;
    merged.phases.push(...(Array.isArray(plan.phases) ? plan.phases : []));
    merged.topics.push(...(Array.isArray(plan.topics) ? plan.topics : []));
    if (!merged.description && plan.description) merged.description = plan.description;
    if (!merged.deadline && plan.deadline) merged.deadline = plan.deadline;
  }
  return merged;
}
parsePlanBtn.addEventListener("click", async () => {
  if (!selectedPlanFiles.length) return;
  const filesToRead = [...selectedPlanFiles];
  parsePlanBtn.disabled = true;
  try {
    const apiUrl = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
      ? "http://localhost:3001/api/parse-plan"
      : "/api/parse-plan";
    // Keep each request small, but let the user import any number of screenshots.
    // Three images per request is a transport safeguard, not a user-facing limit.
    const batchSize = 3;
    const extractedPlans = [];
    const batchCount = Math.ceil(filesToRead.length / batchSize);
    for (let offset = 0; offset < filesToRead.length; offset += batchSize) {
      const batch = filesToRead.slice(offset, offset + batchSize);
      const batchNumber = Math.floor(offset / batchSize) + 1;
      setImportStatus(batchCount > 1
        ? `Reading screenshots — batch ${batchNumber} of ${batchCount}…`
        : "Reading your screenshots…");
      const images = await Promise.all(batch.map(fileToPayload));
      const response = await fetch(apiUrl, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({images})
      });
      const result = await response.json().catch(()=>({error:"The server returned an unreadable response."}));
      if (!response.ok) throw new Error(result.error || "Could not read the plan.");
      if (!result.plan || !Array.isArray(result.plan.phases)) throw new Error("The extracted plan was incomplete. Try clearer screenshots.");
      extractedPlans.push(result.plan);
    }
    parsedPlanDraft = mergeExtractedPlans(extractedPlans);
    if (!parsedPlanDraft.name || !Array.isArray(parsedPlanDraft.phases)) throw new Error("The extracted plan was incomplete. Try clearer screenshots.");
    renderPlanReview(parsedPlanDraft);
    setImportStatus(`Read ${filesToRead.length} screenshot(s). Review the combined plan below before importing.`, "success");
  } catch (err) {
    setImportStatus((err.message || "Something went wrong.") + (String(err.message).includes("fetch") ? ((location.hostname === "localhost" || location.hostname === "127.0.0.1") ? " Make sure the local server is running (npm start)." : " Please try again in a moment.") : ""), "error");
  } finally {
    parsePlanBtn.disabled = selectedPlanFiles.length === 0;
  }
});
function renderPlanReview(plan) {
  $("#reviewPlanName").textContent = plan.name;
  $("#reviewPlanDescription").value = plan.description || "";
  $("#reviewPlanDeadline").value = plan.deadline || "";
  const phases = plan.phases || [];
  const loose = plan.topics || [];
  const total = phases.reduce((n,p)=>n+(p.topics||[]).length,0)+loose.length;
  $("#reviewCount").textContent = `${phases.length} phases · ${total} topics`;
  $("#reviewPhases").innerHTML = phases.map(phase => `<div class="review-phase"><div class="review-phase-title">${esc(phase.name)}</div><ul>${(phase.topics||[]).map(t=>`<li><strong>${esc(t.name)}</strong>${t.details?` — ${esc(t.details)}`:""}</li>`).join("") || "<li>No topics detected</li>"}</ul></div>`).join("") + (loose.length ? `<div class="review-phase"><div class="review-phase-title">General topics</div><ul>${loose.map(t=>`<li><strong>${esc(t.name)}</strong>${t.details?` — ${esc(t.details)}`:""}</li>`).join("")}</ul></div>` : "");
  $("#planReview").hidden = false;
  $("#planReview").scrollIntoView({behavior:"smooth",block:"start"});
}
$("#backToUploadBtn").addEventListener("click", () => { $("#planReview").hidden = true; setImportStatus("Choose or reorder screenshots, then read them again."); });
$("#importParsedPlanBtn").addEventListener("click", () => {
  if (!parsedPlanDraft) return;
  const subject = {
    id:uid(), name:parsedPlanDraft.name, description:$("#reviewPlanDescription").value.trim(),
    deadline:$("#reviewPlanDeadline").value, color:"violet", items:[]
  };
  (parsedPlanDraft.phases||[]).forEach(phase => {
    const phaseId = uid();
    subject.items.push({id:phaseId,kind:"phase",name:phase.name,details:phase.details||"",phaseId:"",done:false});
    (phase.topics||[]).forEach(topic => subject.items.push({id:uid(),kind:"topic",name:topic.name,details:topic.details||"",phaseId,done:false}));
  });
  (parsedPlanDraft.topics||[]).forEach(topic => subject.items.push({id:uid(),kind:"topic",name:topic.name,details:topic.details||"",phaseId:"",done:false}));
  state.subjects.push(subject);
  save();
  closeDialog("#imageImportDialog");
  resetPlanImport();
  setView("subjects");
  showToast("Study plan imported successfully");
});
