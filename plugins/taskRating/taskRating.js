
  //alert("Loaded");
  
  //taskRating = {}
  
  //taskRating.starTask = function(rating) { 
  
  //    alert(rating); 
  
  //};
  
  //var ratingElements = document.getElementsByClassName('c-rating');
                                                                    
  var taskElements = document.getElementsByClassName('task-meta');
  
  dbg(taskElements);
  
  var ratingCallbacks = [];
  
  for (var eleId in taskElements){
    var el = taskElements[eleId];
    
    //dbg(el);
  
    //var id = el.getAttribute("data-task-id");
    
    //dbg("ID",id);
  
    //ratingCallbacks[id] = function(rating,id){
    //  dbg("rating",rating);                               
   //   dbg("ID",id);    
    //}
    
    //dbg(ratingCallbacks[id]);
  
    var ratingEle = document.createElement('i');
    ratingEle.classList.add('rating-star');                 
    ratingEle.classList.add('fa');           
    ratingEle.classList.add('fa-star-o');     
    ratingEle.classList.add('fa-lg');
    //ratingEle.setAttribute('data-task-id',id);    
    ratingEle.onClick = "taskRating.starTask()";
    
    
   
    //taskElements[eleId].appendChild(ratingEle);
    
    //r = rating(ratingEle,0,1,ratingCallbacks[id]); 
        
  } 



