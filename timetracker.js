
var current_client;
var current_project;
var current_task;                  
var current_session;

var ttData;

var  client_select = document.getElementById('client-select'); 
var  project_select = document.getElementById('project-select');
var  task_select = document.getElementById('task-select');

var feedbackElement; 

var startDate;    
var nowDate;
var counterId;
var currentDuration;

var ttSettings = {
  "hide_completed_tasks" : true
}


function ttInit(){

    feedbackElement = document.getElementById('feedback');
    
    if(!localStorage.ttData){
      
      ttData = {
        "userKey" : newId(),
        "clients" : {}        
      }    
       
      $("#edit-popup").html('<h3>Bienvenue</h3>It looks like you haven\'t used the timetracker on this device before, or you\'ve cleared your local storage data. If you\'d like to synch this device with existing online data, enter your user key below.<form><input id="add-userkey-input" placeholder="Enter key"/><a class="button" onClick="saveUserKey()">Save</a></form>');
      
      $("#modal-bg").show();
      $("#edit-popup").show();
      
      return
                            
      localStorage.ttData = JSON.stringify(ttData);      
      
    }else{
      ttData = JSON.parse(localStorage.ttData);
      
      updateSelectOptionsFromData('client');
      
      if(getMemberCount(ttData.clients) < 1){
         addClientForm();
      }
      
      if(localStorage.ttClientId && typeof ttData.clients[localStorage.ttClientId] == "object"){
                 
        current_client = ttData.clients[localStorage.ttClientId];
                  
        setClient(localStorage.ttClientId);
       
        if(localStorage.ttProjectId && typeof current_client.projects[localStorage.ttProjectId] == "object"){ 
             
          current_project = current_client.projects[localStorage.ttProjectId];                    
          setProject(current_project.id);
      
          if(localStorage.ttTaskId && typeof current_project.tasks[localStorage.ttTaskId] == "object"){
                
            current_task = current_project.tasks[localStorage.ttTaskId];
            
            setTask(current_task.id);
            
            if(localStorage.ttSessionId){
              current_session = current_task.sessions[localStorage.ttSessionId];             
              ttDisplayUpdate('inSession');
            }            
          }
        }
      }
      
      dbg(ttData,'ttData parsed from localStorage');
    }
    
   $("form").bind("keypress", function(e) {
 
     if (e.keyCode == 13) {
        dbg(document.activeElement,'Active element');
        if(document.activeElement.id == 'new-task-input'){
           saveNewTask();
        }else if(document.activeElement.id == 'add-project-input'){
           saveProject();
        }else if(document.activeElement.id == 'add-client-input'){
           saveClient();
        }   
        return false;  
     }
     
   });

  
}

function addClientForm(){
   document.getElementById('add-client-form').style.display = "block";
   document.getElementById('select-client-form').style.display = "none"; 

}

function cancelAddClient(){
  document.getElementById('add-client-input').value = '';
  document.getElementById('add-client-form').style.display = "none";
  document.getElementById('select-client-form').style.display = "block";
}

function saveClient(){
  
  dbg('Calling setClient');
  
  new_client = {
      'id' : newId(),
      'name' : document.getElementById('add-client-input').value,
      'projects' : {}
  }
  
  
  ttData.clients[new_client.id] = new_client;
  
  ttSave();

  updateSelectOptionsFromData('client'); 
  
  setClient(new_client.id);
  
  cancelAddClient(); 
  
  setFeedback('Client saved','success'); 
  
}


function addProjectForm(){
   document.getElementById('add-project-form').style.display = "block";
   document.getElementById('select-project-form').style.display = "none"; 

}

function cancelAddProject(){
  document.getElementById('add-project-input').value = '';
  document.getElementById('add-project-form').style.display = "none";
  document.getElementById('select-project-form').style.display = "block";
}

function saveProject(){
  new_project = {
      'id' : newId(),
      'name' : document.getElementById('add-project-input').value,
      'tasks' : {}
  }
  
  dbg(new_project,'saving new project');
  
  ttData.clients[current_client.id].projects[new_project.id] = new_project;
  
  ttSave();
  
  updateSelectOptions(project_select,[[new_project.id,new_project.name]],true);
  
  setProject(new_project.id);
  
  cancelAddProject();
  
  setFeedback('Project saved','success'); 
  
}

function setClient(clientId){
  
  dbg(clientId,'SetClient called');

  client_select = document.getElementById('client-select');
  
  if(clientId){     
    client_select.value = clientId;  
  }
  
  dbg(client_select,'Client select');
  
  current_client = ttData.clients[client_select.value];
  
  current_project = '';  
  
  $("#edit-project-button").hide();
  
  
  
  dbg(current_client,'Current client in setCLient');
  
  // Count how many projects this client has
  project_count = 0;
  
  if(typeof current_client.projects == "object"){
    for (project_id in current_client.projects){
       project_count += 1;
    }
  }

  if(project_count > 0){
    updateSelectOptionsFromData('project');
    cancelAddProject();
  }else{
    addProjectForm();
    updateSelectOptionsFromData('project');
  }
  
  $('#project-controls').show();
                                           
  document.getElementById('task-controls').style.display = "none";
  
  ttSaveCurrent();
  
}


var types = ['user','client','project','task','session'];


function parentObjectOfCurrent(type){
  if(type == 'client'){
    if(typeof current_client == "object"){
      return ttData;
    }else{
      return false;
    }
  }else if(type == 'project'){
    if(typeof current_project == "object"){
      return current_client;
    }else{
      return false;
    }
  }else if(type == 'task'){
    if(typeof current_task == "object"){
      return current_project;
    }else{
      return false;
    }
  }
}

function getCurrent(type){

  dbg(type,'GetCurrent');

  if(type == 'client'){
    if(typeof current_client == "object"){
      return current_client;
    }else{
      return false;
    }
  }else if(type == 'project'){
    if(typeof current_project == "object"){
      return current_project;
    }else{
      return false;
    }
  }else if(type == 'task'){
    if(typeof current_task == "object"){
      return current_task;
    }else{
      return false;
    }
  }

}

function getParentType(type){
  for (var i = 0; i < types.length; i++) {
     if(types[(i+1)] == type){
        return types[i];
     }
  }
}

function getChildType(type){
  for (type_id in types){
     if(types[(type_id-1)] == type){
        return types[type_id];
     }
  }
}

function getMemberCount(object){
  member_count = 0;
  
  if(typeof object == "object"){
    for (item in object){
       member_count += 1;
    }
  }               
  
  return member_count;  
}

function getChildCount(type,object){

  if(typeof object != "object"){
    return false;
  }
       
  child_type = getChildType(type);
  children_obj = object[child_type+'s'];
  
  child_count = 0;
  
  if(typeof children_obj == "object"){
    for (id in children_obj){
       child_count += 1;
    }
  }               
  
  return child_count;  
}

function updateSectionFromData(type){

  if(!getCurrent(type)){
    $("#edit-"+type+"-button").hide();
  }else {
    $("#edit-"+type+"-button").show();
  }

   
  parent_type = getParentType(type);
  
  dbg(parent_type,'Get parent type of '+type);
  
  parent_current = getCurrent(parent_type);
  
  if(!parent_current && type != 'client'){
    $("#"+type+"-controls").hide();
  }else{
    $("#"+type+"-controls").show();
  }
  
  if (getChildCount(parent_type,parent_current) < 1){
     $("#"+type+"-select").hide();
     $("#add-"+type+"-form").show();
  }else{
     $("#"+type+"-select").show();
     $("#add-"+type+"-form").hide();  
  }
  
   
  /*
  Updates the entire controls section based on ttData and current objects
    - Determines whther to show the dropdown
    - Determines whether to show edit button
    - Updates contents of dropdown
    - Etc.
  */
  /* Possible situations: 
      parent is unset — hide entire section
      parent is set, no items exist — show add form (no dropdown or edit)
      parent is set, items exist, none selected — show dropdown, no edit
      parent is set, items exist, item selected — show dropdown, edit
  */

}

                     
function setProject(id){

  client_select = document.getElementById('client-select'); 
  project_select = document.getElementById('project-select'); 
  task_select = document.getElementById('task-select');
  
  if(id){
    project_select.value = id;
  }
  
  current_task = '';
  
  $("#session-start-button").hide();  
  $("#task-edit-button").hide(); 
  
  if(project_select.value != ''){  
   
    $("#edit-project-button").show();
  
    dbg(project_select);
  
    if(project_select[0].value == ''){
      project_select.remove(0);
    }
    
    current_project = ttData.clients[client_select.value].projects[project_select.value];
       
    document.getElementById('task-controls').style.display = "block";
    
    updateSelectOptionsFromData('task');
      
  }
  
  updateSectionFromData('task');
   
  ttSaveCurrent();
  
}

function setTask(id){
  if(id){
    task_id = id;
    task_select.value = id;
  }else{
    task_id = task_select.value;  
  }
  
  if(task_id){
    
    current_task = current_project.tasks[task_id];
    
    dbg(current_task,'Current task:'); 
    
    document.getElementById('session-start-button').style.display = 'inline';
    $("#task-edit-button").show();
      
    ttSaveCurrent();
    
  }else{
  
  }
}


function saveNewTask(){

  input = document.getElementById('new-task-input');

  task_name = input.value;
  
  var new_task = {
    'id' : newId(task_name,'task'),
    'name' : task_name,
    'status' : 'new',
    'sessions' : {}  
  }
  
  current_task = new_task;
  
  ttData.clients[current_client.id].projects[current_project.id].tasks[new_task.id] = new_task;  

  ttSave(); 
  
  updateSelectOptionsFromData('task');
  
  updateSectionFromData('task');
   
  setTask(new_task.id)
   
  input.value = '';
}

function properDateTime(dateObj){
   return pad(dateObj.getFullYear())+'-'+pad((dateObj.getMonth()+1))+'-'+pad(dateObj.getDate())+' '+pad(dateObj.getHours())+':'+pad(dateObj.getMinutes())+':'+pad(dateObj.getSeconds());
}

function updateDataObject(level,data){
  if(level == 'client'){
    ttData.clients[current_client.id] = data;
  }
  if(level == 'project'){
    ttData.clients[current_client.id].projects[current_project.id] = data;
  }
  if(level == 'task'){
    ttData.clients[current_client.id].projects[current_project.id].tasks[current_task.id] = data;
  }
  if(level == 'session'){
    if(typeof ttData.clients[current_client.id].projects[current_project.id].tasks[current_task.id].sessions != "object"){
       ttData.clients[current_client.id].projects[current_project.id].tasks[current_task.id].sessions = {};
    }
    ttData.clients[current_client.id].projects[current_project.id].tasks[current_task.id].sessions[data.id] = data;
  }
}

function startSession(){                                         
  
  var nowDate = new Date();
     
  current_session = {
    'id' : newId(),
    'start_time' : properDateTime(nowDate),  
  }
  

  updateDataObject('session',current_session);
  
  ttDisplayUpdate('inSession');
  
  ttSave(); 
  ttSaveCurrent();

} 
 
function endSession(){  

  clearInterval(counterId);                                      
  
  var nowDate = new Date(); 
     
  current_session.end_time = properDateTime(nowDate), 
  current_session.notes = $("#session-notes-input").value;
  
  if($("#task-complete-input").value == "on"){
  
    dbg('Task complete');
    
    current_task.status = "Completed";
    
    updateDataObject('task',current_task);
    task_complete_feedback = " <b>Task complete!<b>";
    feedback_class = "success";
    
    updateSelectOptionsFromData('task');
    
  }else{
    task_complete_feedback = ""; 
    feedback_class = "notice";
  } 
  
  updateDataObject('session',current_session);
  
  pastSessionId = current_session.id;
  
  current_session = '';
  
  delete localStorage.ttSessionId;
    
  ttDisplayUpdate('endSession');
  
  ttSave();
   
  ttSaveCurrent();
  
  edit_button = '<form style="display:inline"><input type="hidden" id="session_id-input" value="'+pastSessionId+'"/><a class="button" onClick="showEditForm(\'session\')">Edit session</a></form>';
  
  setFeedback("Session Ended. Duration was "+currentDuration+task_complete_feedback+edit_button,feedback_class);

}

function hideFeedback(){
  $('#feedback').hide();
}

function setFeedback(message,type){
  
  type || (type = "notice");
  
 
  
  feedbackElement.innerHTML = message; 
  feedbackElement.class = type;   
  feedbackElement.style.display = 'block';
  
  setTimeout(hideFeedback,8000);
  
}

function pad(n){return n<10 ? '0'+n : n}
    
function dateDiff(date1,date2){     

    date2 || (date2 = new Date());
    
    diffMs = date2.getTime() - date1.getTime();
    var date3 = new Date(diffMs);
    return pad(date3.getUTCHours()) + ':' + pad(date3.getUTCMinutes()) + ':' + pad(date3.getUTCSeconds());
        
}

function incrementCurrentDuration() {

    var current = new Date();
    
    currentDuration = dateDiff(startDate,current);
    
    dbg(startDate);

    document.getElementById('current_duration').innerHTML = currentDuration;
    
    document.title = currentDuration + ' - Timetracker';
    
}

function newId(name,type){
  
  id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
});
  
  return id;
}

function updateSelectOptions(target_element,new_options,append){

    if(!append){
       while (target_element.options.length) {
           target_element.remove(0);
       }    
    }
    
    
    for (var i = 0; i < new_options.length; i++) {
        var opt = new Option(new_options[i][1],new_options[i][0]);            
        target_element.options.add(opt);           
    }

}


function updateSelectOptionsFromData(type){

    dbg(type,'Updating select field from data...');
    
    options = [];
    

    
    setToCurrent = false;
    
    if(type == "client"){
       for (client_id in ttData.clients){           
           options.push([client_id,ttData.clients[client_id].name]);
       }
       if(typeof current_client == "object"){
          setToCurrent = current_client.id;
       }    
    }else if(type == "project"){
       for (project_id in current_client.projects){
           options.push([project_id,current_client.projects[project_id].name]);
       }
       if(typeof current_project == "object"){
          setToCurrent = current_project.id;
       }     
    }else if(type == "task"){
       for (task_id in current_project.tasks){
           if(current_project.tasks[task_id].status == "Completed"){
             name_prepend = "[DONE] ";
           }else{
             name_prepend = "";
           }            
           options.push([task_id,name_prepend+current_project.tasks[task_id].name]);
       }
       if(typeof current_task == "object"){
          setToCurrent = current_task.id;
       }      
    }

    options = options.sort(function(a, b) {return a[1] - b[1]}); 
    
    if(!setToCurrent){
      options.unshift(['','Select '+type+'...']);
    } 
          
    dbg(options,'options before update');
          
    select_element = document.getElementById(type+'-select')
          
    updateSelectOptions(select_element,options);
    
    if(setToCurrent){
       select_element.value = setToCurrent;
    }

}

function dbg(test_data,text){
  if(text){
    console.log(text);
  }
  
  console.log(test_data);
  
}


function ttSave(){

  localStorage.ttData = JSON.stringify(ttData);
                      
  console.log(ttData);   
  
}

function ttSaveCurrent(){
  
  if(current_client){
    
      localStorage.ttClientId = current_client.id;
   
      if(current_project){
         
          localStorage.ttProjectId = current_project.id;
      
          if(current_task){   
            localStorage.ttTaskId = current_task.id;
            
            if(current_session){
               localStorage.ttSessionId = current_session.id;
            }
            
            
          }else{
            dbg('No current task, but project and client')
          }
      
      }else{
        dbg('Client but no project found')
      }
    
  }else{
    dbg('No current client found');
  }  
  

  
}

function ttDisplayUpdate(preset){
  if(preset == 'inSession'){
      document.getElementById('active-session').innerHTML =  '<div id="current-info"><b>'+current_client.name+'</b> > <b>'+current_project.name+'</b> > <b>'+current_task.name+'</b></div><div id="current_duration"><span style="color:#dddddd">00:00:00</span></div><input type="text" id="session-notes-input" placeholder="Add notes" /><div><input type="checkbox"  id="task-complete-input"/><label for="task-complete-input">Task complete</label></div><a class="button" onClick="endSession()">End Session</a>';
      
      document.getElementById('active-session').style.display = 'block';
   
      startDate = new Date(current_session.start_time.replace(' ','T'));
      
      dbg(current_session.start_time.replace(' ','T'),'Start date input');
    
      counterId = setInterval(incrementCurrentDuration, 1000);
      
  }else if(preset == 'endSession'){
  
     document.getElementById('active-session').style.display = 'none';
     
     document.title = "Timetracker";
  
  }
}

function editJson(){

  document.getElementById('json-output').innerHTML = '<form><textarea id="edit-jason-textarea">'+JSON.stringify(ttData,null,'   ')+'</textarea></form><a class="button" onClick="saveJson()">Save</a>';
}

function saveJson(){
   input_json = $("#edit-jason-textarea").val();
   
   try{
      input_data = JSON.parse(input_json);
   }catch(err){
      setFeedback('Oops! JSON input is invalid. Error: '+err,'error');
      return
   }
   
   dbg(input_data);
   
   ttData = input_data;
   
   dbg(ttData,'ttData');
   
   ttSave();
       
}

function synchToServer(){
  
   $.ajax({
       url: 'http://photosynth.ca/timetracker/synch.php?action=synchToServer&key='+ttData.userKey,
       type: 'POST',
       contentType:'application/json',
       data: JSON.stringify(ttData),
       //dataType:'json',
       success : function(result){
          setFeedback('Data successfully sent to server');
          dbg(result)
          document.getElementById('json-output').innerHTML = result;
       },
       error: function(xhr, ajaxOptions, thrownError){
          setFeedback('Error synching to server: '+thrownError);
          dbg(xhr);
       },
       
       
  });

}


function synchFromServer(){
 
     $.ajax({
         //url: 'http://localhost/timetracker/tt2/synch.php?action=synchFromServer&key='+ttData.userKey,
         url: 'http://photosynth.ca/timetracker/synch.php?action=synchFromServer&key='+ttData.userKey,
         type: 'POST',
         contentType:'application/json',
         //dataType:'json',
         success : function(result){
         
            try{            
              server_data = JSON.parse(result);   
            }catch(err){
               setFeedback('Error parsing data from server.','error');
               throw 'JSON parsing exception';           
            }
            
            server_data.userKey = ttData.userKey; 
            ttData = server_data;  
            ttSave();                      
            setFeedback('Data successfully received from server.');

         },
         error: function(xhr, ajaxOptions, thrownError){
            setFeedback('Error synching to server: '+thrownError);
            dbg(xhr);
         },
         
         
    });
}

function cancelEditForm(){
  $('#edit-popup').html(''); 
  $('#modal-bg').hide(); 
  $('#edit-popup').hide();
}


function saveEditForm(type){

  if(type == 'client'){    
    properties = current_client;
  }else if(type == 'project'){
    properties = current_project;
  }else if(type == 'task'){
    properties = current_task;
  }else if(type == 'session'){
    session_id = $("#session_id-input").value;
    properties = current_task.sessions[session_id];
  }
   
  dbg(properties,'props before updating from form');
  for (key in properties){                                                                 
    if(typeof properties[key] != "object"){
      properties[key] = document.getElementById(type+"-"+key+"-edit-input").value;      
    }
  }
  
  dbg(properties,'Updating data obj with properties:');  
  
  updateDataObject(type,properties);  
              
  updateSelectOptionsFromData(type); 
  
  ttSave();
  
  setFeedback('Item updated');
  
  cancelEditForm();
}

function deleteFromEditForm(type){

  dbg(type,'Deleting type:')

  if(type == 'client'){
    delete ttData.clients[current_client.id];
    
    current_client = '';
    current_project = ''; 
    current_task = '';
    $("#task-controls").hide(); 
    $("#project-controls").hide();
           
  }else if(type == 'project'){
  
    delete current_client.projects[current_project.id];
    current_project = '';          
    update_type = 'client'; 
    update_data = current_client;
    
  }else if(type == 'task'){
  
    delete current_project.tasks[current_task.id]; 
    current_task = ''    
    update_type = 'project';    
    update_data = current_project;
    
  }else if(type == 'session'){
    session_id = $("#session_id-input").value;
    delete current_task.sessions[session_id];      
    update_type = 'task';
    update_data = current_task;
  }
  
  if(type != 'client'){
    updateDataObject(update_type,update_data);   
  } 
 
              
  updateSelectOptionsFromData(type); 
  
  ttSave();
  
  cancelEditForm();
  
  setFeedback(type+' deleted.');
}

function showEditForm(type){
   dbg('showEditForm called with type',type);
   
   edit_element = document.getElementById("edit-popup");
                      
  $("#edit-popup").html("<form>");
  
  dbg($("#edit-popup"));

  if(type == 'client'){    
    properties = current_client;
  }else if(type == 'project'){
    properties = current_project;
  }else if(type == 'task'){
    properties = current_task;
  }else if(type == 'session'){
    session_id = document.getElementById("session_id-input").value;
    properties = current_task.sessions[session_id];
  } 
  
  for (key in properties){                                                                 
    if(typeof properties[key] != "object"){
      $("#edit-popup").append('<div>'+key+' <input type="text" value="'+properties[key]+'" id="'+type+'-'+key+'-edit-input"/></div>');
    }
  }
  
  $("#edit-popup").append('<div><a class="button" onClick="saveEditForm(\''+type+'\')">Save</a><a class="button" onClick="cancelEditForm()">Cancel</a><a class="button red" onClick="deleteFromEditForm(\''+type+'\')">Delete Item</a></div></form>');
    
  $("#modal-bg").show(); 
  $("#edit-popup").show();                  


}

function saveUserKey(){

  key_val = $("#add-userkey-input").val();
  ttData.userKey = key_val;
  
  ttSave();
  
  $("#modal-bg").hide(); 
  $("#edit-popup").hide();  
  $("#edit-popup").html('');
  
  //ttInit();
  
}

function deleteLocalStorage(){

  delete localStorage.ttData;
  delete localStorage.ttClientId;   
  delete localStorage.ttProjectId;  
  delete localStorage.ttTaskId;    
  delete localStorage.ttSessionId;
  setFeedback('LocalStorage deleted. Refresh to see changes.');

}

                                          
