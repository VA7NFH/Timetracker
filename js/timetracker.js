var current_client, current_project, current_task, current_session;

var ttData;

var  client_select = document.getElementById('client-select'); 
var  project_select = document.getElementById('project-select');
var  task_select = document.getElementById('task-select');

var feedbackElement; 

var startDate;    
var nowDate;
var counterId;
var currentDuration;

var view = "track";

var defaultSettings = {
  top_level_title : "Client",
  show_billability : true,
  reminder_interval : false,
  reminder_title : "Pomodoro Complete!",
  reminder_message : "Please take a five minute break. <b>Breathe, stretch, look around!</b>",
  reminder_delay : 1
};

var reminderDelay = 0;

var types = ['user','client','project','task','session'];

var editFields = {

  client : {
    name : {
      displayAs : "Name",
      type : "text"    
    },
    id : {
      displayAs : "ID",
      type : "text"    
    }  
  },
  project : {
    name : {
      displayAs : "Name",
      type : "text"    
    },
    id : {
      displayAs : "ID",
      type : "text"    
    }  
  },
  task : {
    name : {
      displayAs : "Name",
      type : "text"    
    },
    id : {
      displayAs : "ID",
      type : "text"    
    },    
    status : {
      displayAs : "Status",
      type : "select",
      options : ["Active","On hold","Completed"]    
    },   
    is_billable : {
      displayAs : "Billable",
      type : "select",
      options : [{text:"Yes", value:true},{text:"No",value:false}]    
    }  
  }
};

// Load Node HTTP module, if available
if(typeof require === "function"){
  var http = require('http'); 
}

Notification.requestPermission();


/* ############################# INITIALIZE ################################# */

function ttInit(){

    feedbackElement = document.getElementById('feedback');
    
    if(!localStorage.ttData){
      
      ttData = {
        "userKey" : newId(),
        "clients" : {},
        "settings" : defaultSettings        
      };    
       
      $("#edit-popup").html('<h3>Bienvenue</h3>It looks like you haven\'t used the timetracker on this device before, or you\'ve cleared your local storage data. If you\'d like to synch this device with existing online data, enter your user key below.<form><input id="add-userkey-input" placeholder="Enter key"/><a class="button" onClick="saveUserKey()">Save</a></form>');
      
      $("#modal-bg").show();
      $("#edit-popup").show();
      
      return;
                               
      
    }else{
      ttData = JSON.parse(localStorage.ttData);
      
      if(!ttData.settings){
         ttData.settings = defaultSettings;
         ttSave();
      }
      
      
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
              continueSession();
            }            
          }
        }
      }
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



/* ########################### TRACK CLIENT CONTROL ######################### */

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
  
  new_client = {
      'id' : newId(),
      'name' : document.getElementById('add-client-input').value,
      'projects' : {}
  };
   
  ttData.clients[new_client.id] = new_client; 
  ttSave();
  updateSelectOptionsFromData('client');  
  setClient(new_client.id); 
  cancelAddClient();  
  setFeedback('Client saved','success'); 
  
}


function setClient(clientId){

  client_select = document.getElementById('client-select');
  
  if(clientId){     
    client_select.value = clientId;  
  }
  
  current_client = ttData.clients[client_select.value];
  
  current_project = '';  
  
  $("#edit-project-button").hide();
  
  // Count how many projects this client has
  project_count = 0;
  
  if(typeof current_client.projects == "object"){
    for(project_id in current_client.projects){
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




/* ######################### TRACK PROJECT CONTROLS ######################### */


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
  };
  
  if(typeof ttData.clients[current_client.id].projects != "object"){
    ttData.clients[current_client.id].projects = {};
  }
  
  ttData.clients[current_client.id].projects[new_project.id] = new_project;  
  ttSave();   
  updateSelectOptionsFromData('project'); 
  cancelAddProject();            
  setProject(new_project.id);   
  setFeedback('Project saved','success');   
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




/* ########################### TRACK TASK CONTROLS ########################## */ 



function setTask(id){
  if(id){
    task_id = id;
    task_select.value = id;
  }else{
    task_id = task_select.value;  
  }
  
  if(task_id){
    
    current_task = current_project.tasks[task_id];
    document.getElementById('session-start-button').style.display = 'inline';
    $("#task-edit-button").show();
      
    ttSaveCurrent();
    
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
  };
  
  if(gebi("billable-input").checked == true){  
    new_task.billable = true;  
  }else{  
    new_task.billable = false;   
  }   
  
  current_task = new_task; 
  ttData.clients[current_client.id].projects[current_project.id].tasks[new_task.id] = new_task;  
  ttSave();   
  updateSelectOptionsFromData('task');  
  updateSectionFromData('task');   
  setTask(new_task.id);   
  input.value = '';
  
}




/* ######################### TRACK SESSION CONTROL ########################## */


function startSession(){                                         
  
  startDate = moment();
  
  current_session = {
    'id' : newId(),
    'start_time' : startDate.format("YYYY-MM-DD HH:mm:ss"),  
  };
  
  updateDataObject('session',current_session);   
  counterId = setInterval(incrementCurrentDuration, 1000);   
  showInSession();  
  ttSave();   
  ttSaveCurrent();
}

function continueSession(){   
  startDate = moment(current_session.start_time);     
  counterId = setInterval(incrementCurrentDuration, 1000);   
  showInSession();
}


function showInSession(){

  document.getElementById('active-session').innerHTML =  '<div class="centered-box"><div id="current-info"><b>'+current_client.name+'</b> > <b>'+current_project.name+'</b> > <b>'+current_task.name+'</b></div><div id="current_duration"><span style="color:#dddddd">00:00:00</span></div><input type="text" id="session-notes-input" placeholder="Add notes" /><div><input type="checkbox"  id="task-complete-input"/><label for="task-complete-input">Task complete</label></div><a class="button" onClick="endSession()">End Session</a></div>';
      
  document.getElementById('active-session').style.display = 'block';

}


function endSession(){  

  clearInterval(counterId);                                      
    
  current_session.end_time = moment().format("YYYY-MM-DD HH:mm:ss"); 
  
  current_session.notes = $("#session-notes-input").val();
  
  if(document.getElementById("task-complete-input").checked == true){

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
  ttSave();  
  ttSaveCurrent();   
  document.getElementById('active-session').style.display = 'none';     
  document.title = "Timetracker";  
  edit_button = '<form style="display:inline"><input type="hidden" id="session_id-input" value="'+pastSessionId+'"/><a class="button" onClick="showEditForm(\'session\')">Edit session</a></form>';  
  setFeedback("Session Ended. Duration was "+currentDuration+task_complete_feedback+edit_button,feedback_class);

}


/* ####################### FEEDBACK & NOTIFICATIONS ######################### */


function hideFeedback(){
  $('#feedback').hide();
}

function setFeedback(message,type,stayVisible){
  
  type || (type = "notice");
  
  stayVisible || (stayVisible = false);
  
  feedbackElement.innerHTML = message; 
  feedbackElement.class = type;   
  feedbackElement.style.display = 'block';
  
  if(!stayVisible){
    setTimeout(hideFeedback,8000);
  }
}

function desktopNotify(message,title,icon) {
  title || (title = "Timtracker notification");
  
  options = {
      body: message,
      icon: icon
  };
  new Notification(title,options);
}




/* ####################### TIME & DATE FUNCTIONS ########################## */


function timeFromSeconds(s){

    var hours = parseInt(s/3600) % 24;
    var minutes = parseInt(s/60) % 60;
    var seconds = parseInt(s) % 60;

    return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);

}

function timeDiffSecsFromString(dateStr1,dateStr2){

    date1 = new Date(dateStr1.replace(' ','T'));  
    date2 = new Date(dateStr2.replace(' ','T'));
    
    diffMs = date2.getTime() - date1.getTime();
    
    return (diffMs/1000);
 
}

function incrementCurrentDuration() {
    
    currentDurationSeconds = moment().diff(startDate)/1000;  
    currentDuration = timeFromSeconds(currentDurationSeconds); 
    document.getElementById('current_duration').innerHTML = currentDuration;   
    document.title = currentDuration + ' - Timetracker';
    
    if(getSetting('reminder_interval') && (currentDurationSeconds/60) > (parseFloat(getSetting('reminder_interval'))+reminderDelay)){
    
      desktopNotify(getSetting('reminder_message'),getSetting('reminder_title'));
      
      reminderDelay += parseFloat(getSetting('reminder_delay'));
    
    }    
    
        
}




/* ######################### UTILITY FUNCTIONS ########################## */


function gebi(id){
  return document.getElementById(id);
}


function pad(n){return n<10 ? '0'+n : n;}



function newId(name,type){
  
  id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
});
  
  return id;
}



function dbg(test_data,text){

  if(text){
    console.log(text);
  }
  
  console.log(test_data);
  
}

function getSetting(name){
  return ttData.settings[name];
}






/* ################### GENERAL VIEW UPDATING FUNCTIONS ##################### */ 



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


function updateSelectOptionsFromData(type,idSuffix){

    idSuffix || (idSuffix = '');

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


    options.sort(function(a, b) {   
      
      a = a[1].replace('[DONE]','zzzz');  
      b = b[1].replace('[DONE]','zzzz');
      return a.localeCompare(b);

    }); 
    
    
    if(!setToCurrent){
      options.unshift(['','Select '+type+'...']);
    } 
          
          
    select_element = document.getElementById(type+'-select'+idSuffix);
          
    updateSelectOptions(select_element,options);
    
    if(setToCurrent){
       select_element.value = setToCurrent;
    }

}




// I think the following seven functions should be removed. They attempt to be too abstract, and fail



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
}





/* ########################### DATA MODEL FUNCTIONS ######################### */


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


function ttSave(){

  localStorage.ttData = JSON.stringify(ttData);
  
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
            dbg('No current task, but project and client');
          }
      
      }else{
        dbg('Client but no project found');
      }
    
  }else{
    dbg('No current client found');
  }  
   
}


function saveUserKey(){

  key_val = $("#add-userkey-input").val();
  ttData.userKey = key_val;
  
  ttSave();
  
  $("#modal-bg").hide(); 
  $("#edit-popup").hide();  
  $("#edit-popup").html('');
  
  addClientForm();
  
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


/* ############################# EDIT FUNCTIONS ############################# */


function editJson(){

  document.getElementById('json-output').innerHTML = '<form><textarea id="edit-json-textarea">'+JSON.stringify(ttData,null,'   ')+'</textarea></form><a href="#void" class="button" onClick="saveJson()">Save</a>';
}

function saveJson(){
   input_json = $("#edit-json-textarea").val();
   
   try{
      input_data = JSON.parse(input_json);
   }catch(err){
      setFeedback('Oops! JSON input is invalid. Error: '+err,'error');
      return;
   }
     
   ttData = input_data;  
   ttSave();   
   setFeedback('JSON data saved.');
   $("#json-output").hide();    
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
    session_id = $("#session_id-input").val();
    properties = current_task.sessions[session_id];
  }else if(type == 'settings'){
    properties = ttData.settings;
  }
    
  for (key in properties){                                                                 
    if(typeof properties[key] != "object"){
      properties[key] = document.getElementById(type+"-"+key+"-edit-input").value;      
    }
  }
  
 
  updateDataObject(type,properties);
  
  if(type != "session" && type != "settings"){
    updateSelectOptionsFromData(type);  
  }                

     
  ttSave();  
  setFeedback('Item updated');  
  cancelEditForm();
  
}

function deleteFromEditForm(type){

  dbg(type,'Deleting type:');

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
    current_task = '';    
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
   
  if(type != "session"){
    updateSelectOptionsFromData(type);   
  }

   
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
  }else if(type == "settings"){  
    properties = ttData.settings;
  } 
  
  for (key in properties){                                                                 
    if(typeof properties[key] != "object"){
      $("#edit-popup").append('<div>'+key+' <input type="text" value="'+properties[key]+'" id="'+type+'-'+key+'-edit-input"/></div>');
    }
  }
  
  $("#edit-popup").append('<div>');
  $("#edit-popup").append('<a class="button" onClick="saveEditForm(\''+type+'\')">Save</a>');
  $("#edit-popup").append('<a class="button" onClick="cancelEditForm()">Cancel</a>');
  
  if(type != "settings"){
    $("#edit-popup").append('<a class="button red" onClick="deleteFromEditForm(\''+type+'\')">Delete Item</a></div></form>');
  }  
  
  $("#modal-bg").show(); 
  $("#edit-popup").show();                  


}





/* ############################ SERVER SYNCHING ############################  */





function synchToServer(){ 
      
  
   setFeedback('&nbsp;<i class="fa fa-info-circle fa-spin fa-lg"></i>&nbsp; &nbsp;Synching to server. This may take a minute....','notice',true);

   // Do normal Ajax synch if we're in the web version
   if(window.location.hostname.search("photosynth.ca") > -1){
   
     
     $.ajax({
         url: 'http://photosynth.ca/timetracker/synch.php?action=synchToServer&key='+ttData.userKey,
         type: 'POST',
         contentType:'application/json',
         data: JSON.stringify(ttData),
         //dataType:'json',
         success : function(result){
            setFeedback('Data successfully sent to server');
            document.getElementById('json-output').innerHTML = result;
         },
         error: function(xhr, ajaxOptions, thrownError){
            setFeedback('Error synching to server: '+thrownError);
         },
         
         
    });
   
   }else if(typeof http === "object"){   
   
      nodeRequest('to');      
   
   }else{
      setFeedback('Current environment doesn\'t allow server synching!');
   }
}


function synchFromServer(){    
   
   setFeedback('<i class="fa fa-lightbulb-o fa-spinner fa-lg"></i> Synching from server. This may take a minute....');

  if(window.location.hostname.search("photosynth.ca") > -1){
  
     $.ajax({
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
            setFeedback('Error synching from server: '+thrownError);
         },
                 
      });
      
   }else if(typeof http === "object"){
      
      nodeRequest('from');      
   
   }else{
      setFeedback('Current environment doesn\'t allow server synching!');
   }
}

function ajaxRequest(){


}

function nodeRequest(direction){

  if(direction == 'to'){
    var postData = JSON.stringify(ttData); 
    reqAction = 'synchToServer';
    
    dbg(postData,"Node synching to server with:");
    
  }else{
    reqAction = 'synchFromServer';
    var postData = '';
  }
  
  var options = {
    hostname: 'www.photosynth.ca',
    port: 80,
    path: '/timetracker/synch.php?action='+reqAction+'&key='+ttData.userKey,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var request = http.request(options, function(result){
  
    console.log('STATUS:'+result.statusCode);
    console.log('HEADERS:'+JSON.stringify(result.headers));
    
    result.setEncoding('utf8');
    
    var resultData = '';
    
    result.on('data', function(chunk){
      console.log('BODY:'+chunk);
      resultData += chunk;
    });
    
    result.on('end', function(){
      console.log('No more data in response.');
      console.log(result);     
      console.log(resultData);
      
      if(result.statusCode == 200){
         
         try{            
           server_data = JSON.parse(resultData);   
         }catch(err){
           setFeedback('Error parsing data from server. Error:'+err,'error');
           throw 'JSON parsing exception';           
         }                  
                                    
         if(direction == 'from'){                            
             server_data.userKey = ttData.userKey; 
             ttData = server_data;  
             ttSave();      
                             
             setFeedback('Data successfully received from server.');
          
        }else if(direction == 'to'){            
             setFeedback('Server synch complete. '+server_data.updateCount+" records updated, "+server_data.insertCount+" new records added");
        }        
                   
      }else{
        setFeedback('Server synch failed! Status:'+result.statusCode,'error',true);
      }
      
      
    });
    
  });

  request.on('error', function(e){
    console.log('problem with request:'+e.message);
    setFeedback('Error synching to server: '+e.message);
  });

  
  request.write(postData);
  request.end();                                          
}


/* ######################### Analyze View Functions ######################### */

function setFilterStartTime(){
  showSessions();
}

function setFilterEndTime(){
  showSessions();
}


function makeFlatData(){
  flatData = {};
  
  for (client_id in ttData.clients){
  
    if(typeof ttData.clients[client_id].projects == "object"){
       projects = ttData.clients[client_id].projects;
       for (project_id in projects){      
        if(typeof projects[project_id].tasks == "object"){
          tasks = projects[project_id].tasks;       
          for (task_id in tasks){ 
            if(typeof tasks[task_id].sessions == "object" && getMemberCount(tasks[task_id].sessions) > 0){           
              for (session_id in tasks[task_id].sessions){              
                session = tasks[task_id].sessions[session_id];
    
                flatData[session_id] = {
                
                  "client_id": client_id,
                  "client": ttData.clients[client_id].name,
                  "project" : projects[project_id].name,  
                  "project_id" : project_id,
                  "task" : tasks[task_id].name,           
                  "task_id" : task_id,
                  "billable" : tasks[task_id].billable,
                  "start_time" :  session.start_time, 
                  "end_time" :  session.end_time,
                  "duration" : timeDiffSecsFromString(session.start_time,session.end_time), 
                  "durationHMS" : timeFromSeconds(timeDiffSecsFromString(session.start_time,session.end_time))
                
                };                            
              }
            }
          }
        }
      }   
    }
  }
}


function showProjectTime(projectId){
   
  var prj = current_project;   
  
  gebi("analytics-view-title").innerHTML = "Project Time: "+current_project.name;

  $("#datatable").html(''); 
  
  addTableHeaders("datatable",["Task","Time"]);
      
  prj.totalTime = 0;  
  prj.totalBillableTime = 0;
  
  for (task_id in prj.tasks){
    taskTotalTime = 0;        
    taskSessionCount = 0;   
  
    task = prj.tasks[task_id]; 
    
    if(typeof task.sessions == "object"){
        
        if(getMemberCount(task.sessions) > 0){
        
          for (session_id in task.sessions){
            ses = task.sessions[session_id];
            if(ses.start_time && ses.end_time){
               duration = timeDiffSecsFromString(ses.start_time,ses.end_time);
               
               dbg('Getting time diff. Start:'+ses.start_time+" End: "+ses.end_time+" Diff: "+duration);
               
            }else{
              duration = 0;
            }            
            taskTotalTime += duration; 
            taskSessionCount += 1;      
          }
          
        
       
          if(task.billable == true){
             prj.totalBillableTime += taskTotalTime;
          }
          
          prj.totalTime = prj.totalTime+taskTotalTime;          
          
          addTableRow("datatable",[task.name+" ("+taskSessionCount+")",timeFromSeconds(taskTotalTime)]);
        }
     }
  }
                                                                                           
  addTableRow("datatable",["<b>Project billable time</b>","<b>"+timeFromSeconds(prj.totalBillableTime)+"</b>"]);
  addTableRow("datatable",["<b>Project total time</b>","<b>"+timeFromSeconds(prj.totalTime)+"</b>"]);
  
  $("#track-view").hide();
  $("#analytics-view").show();

}

function addTableHeaders(id,headers){
  table = gebi(id);
  header = table.createTHead();
  row = header.insertRow(0);
  
  count = 0;                                    

  for(text in headers){
     cell = row.insertCell(count);
     cell.innerHTML = headers[text];   
     count += 1;
  }  
 
  table.appendChild(document.createElement('tbody'));
        
}  
 
function addTableRow(id,data,position){

  position || (position = -1);    

  var tbody = gebi(id).getElementsByTagName('tbody')[0];
 
  row = tbody.insertRow(position);  
  
  count = 0;
  for(item in data){
     cell = row.insertCell(count);
     cell.innerHTML = data[item];   
     count += 1;
  }  
      
}



function makeSelectOptions(itemsObj,isForVue,prepend){

  options = [];

  if(prepend){
     options.push(prepend);
  }
  
  
  if(typeof itemsObj == "object"){
     if(getMemberCount(itemsObj) > 0){
      for (id in itemsObj){
        if(isForVue){
          option = {text:itemsObj[id].name,value:id};
        }else{
          option = [id,itemsObj[id].name];
        }
           
        options.push(option);
        
      }
      return options; 
    }else{
      return false;
    }
  }else{
    return false;
  }
}



function setView(view){

  if(view == "analyze"){
  
    makeFlatData();
  
    gebi("track-view").style.display = "none"; 
    gebi("organize-view").style.display = "none"; 
    gebi("analyze-view").style.display = "block";
    
    var tableFields = {
      client:"Client",
      project:"Project",
      task:"Task",
      start_time:"Start Time",
      duration:"Duration"
    };
    
    //addTableHeaders('datatable',tableFields);   
            
    analyzeView = '';
    
    var clientFilterSelVal;
    
    if(typeof current_client == "object"){
      clientFilterSelVal = current_client.id;
    }else{
      clientFilterSelVal = "all";
    }
     
    var analyzeView = new Vue({
      el: '#analyze-view',
      data: {
        client_select: {
            value: clientFilterSelVal,
            options: makeSelectOptions(ttData.clients,true,{text:"- All clients -",value:"all"})
        },
        
        project_select:{
          value : current_project.id || "all",
          options : makeSelectOptions(current_client.projects,true,{text:"- All projects -",value:"all"})    
        },
        
        totalTimeHMS: '',
        totalBillableTimeHMS: '', 
        
        tableData : flatData,
        
        filters : {
          clientId : current_client.id || "all",
          projectId : current_project.id || "all", 
          taskId : "all",
          startTime : "all",
          endTime : "all"       
        }
        
        
      },
      
      
      methods: {
        filter : function (){
        
           fs = analyzeView.filters;
    
           tempTableData = [];
           
           totalTime = 0;
           totalBillableTime = 0;
           
           for (row in flatData){          
           
             if (fs.clientId != "all" && flatData[row].client_id != fs.clientId){ continue; } 
             if (fs.projectId != "all" && flatData[row].project_id != fs.projectId){ continue; }
             //if (fs.taskId != "all"  && flatData[row].task_id != fs.taskId){ continue; }     
             if (fs.startTime != "all" && flatData[row].start_time < fs.startTime){ continue; }      
             if (fs.endTime && flatData[row].end_time > fs.endTime){ continue; } 
                                                                                            

             tempTableData.push(flatData[row]);
             
             totalTime += flatData[row].duration;
             
             if(flatData[row].billable){
                totalBillableTime += flatData[row].duration;
             }
                   
           }
           
                                                 
           analyzeView.totalTimeHMS = timeFromSeconds(totalTime);                                            
           analyzeView.totalBillableTimeHMS = timeFromSeconds(totalBillableTime);            
           analyzeView.tableData = tempTableData;
           
           if(!tempTableData[0]){
             document.getElementById("no-data-found-table").style.display = "table-row";
           }else{
             document.getElementById("no-data-found-table").style.display = "none";           
           } 
           
           console.log(analyzeView.tableData);            
        
        }     
      }      
    });
    
    analyzeView.$watch('client_select.value', function (newVal, oldVal) {
    
        console.log("New client select value detected: "+newVal);
        
        if(newVal == "all"){        
          analyzeView.project_select.options = [{text:"- All projects -",value:"all"}];        
        }else{
          analyzeView.project_select.options = makeSelectOptions(ttData.clients[newVal].projects,true,{text:"- All projects -",value:"all"});
        }
        analyzeView.project_select.value = 'all';
        
        analyzeView.filters.clientId = newVal;
        
        analyzeView.filter();    
        
    });    
      
    analyzeView.$watch('project_select.value', function (newVal, oldVal) {
    
        analyzeView.filters.projectId = newVal;
        
        analyzeView.filter();  
        
    });
   
        
    startPicker = new Pikaday({
        field: document.getElementById('filter-start-time'),
        format: 'YYYY-MM-DD',
        onSelect: function() {
           analyzeView.filters.startTime = document.getElementById('filter-start-time').value;
           analyzeView.filter();
        }
    });
    
    endPicker = new Pikaday({
        field: document.getElementById('filter-end-time'),
        format: 'YYYY-MM-DD',
        onSelect: function() {
           analyzeView.filters.endTime = document.getElementById('filter-end-time').value+" 23:23:59";
           analyzeView.filter();
        }
    });
    
    analyzeView.filter();           
    
  }else{
    endPicker.destroy();
    startPicker.destroy();
  
    gebi("track-view").style.display = "block"; 
    gebi("organize-view").style.display = "none"; 
    gebi("analyze-view").style.display = "none";
      
  }  
  
}