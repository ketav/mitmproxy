/*
css = "<style>.modal { display: none; position: fixed; z-index: 1; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgb(0,0,0); background-color: rgba(0,0,0,0.4); } .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%; } .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; } .close:hover, .close:focus { color: black; text-decoration: none; cursor: pointer; }</style>"

html  = '<div id="myModal" class="modal"><div class="modal-content"><span class="closeModal">&times;</span><p id="textM">Some text in the Modal..</p></div></div>';

var span = document.getElementsByClassName("closeModal")[0];
$('body').append(css+html);
var modal = document.getElementById("myModal");

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
$("#levelSwitch.plus").click(function()
{
$("#myModal").toggle()
})
*/

class Basetask
    {
        constructor()
        {
            this.desc = '';
            this.inputs = '';
            this.selectors = {'mil':
                               {'S':'div.g20>div',
                  'B':'div.g19>div',
                  'GB':'div.g29>div',
                  'GS':'div.g30>div'}
                              }
            this.troopres = {
                'club':'95,75,40,40'
            } 
            if(typeof localStorage.villageData == 'undefined' || localStorage.villageData == '' )
            {
                /*villageData ={'v1':{'res':{},'troops':{'s':{},'b':{},'gb':{},'gs':{}},'ts':0},
                              'v2':{'res':{},'troops':{'s':{},'b':{},'gb':{},'gs':{}},'ts':0},
                              'v3':{'res':{},'troops':{'s':{},'b':{},'gb':{},'gs':{}},'ts':0},
                              'ts':0
                             };*/
                this.villageData = {'sleep':-1,'sleep1':-1}
                localStorage.villageData = JSON.stringify(this.villageData);

            }
            else
            {
                this.villageData = JSON.parse(localStorage.villageData)

            }
            
            
        }
        get name()
        {
            return this.desc;
        }
        
        getActiveVillage()
        {
            return $('#sidebarBoxVillagelist').find('li.active>a[href]').attr('href').split('&')[0].split('=')[1];
        }
        getTimestamp()
         {
             var date = new Date();
             var timestamp = date.getTime();
             return timestamp
         }
        isActiveVillage(villageId)
        {
            return (villageId == this.getActiveVillage());
        }
        
        switchActiveVillage(villageId)
        {
            if(!this.isActiveVillage(villageId))
                {
                    console.log('Click to change village')
                    $('#sidebarBoxVillagelist').find('li>a[href]').each(
                        function(i,k)
                        {
                          if($(k).attr('href').indexOf("="+villageId+"&") > -1)
                              {
                                  k.click();
                                  return true;
                              }
                        }
                        )
                }
            else
                {
                    return false;
                }
        }
        
        gotodorf2()
        {
            if(window.location.href.indexOf('dorf2.php')==-1)
                {
                    $("#navigation > a.village.buildingView")[0].click();
                    return true;
                }
            else
                {
                    return false;
                }
        }
        
        update(villageId)
        {
        if(!this.switchActiveVillage(villageId))
            {
        let warehouse,granary,wood,clay,iron,crop;
        let data = {};
        warehouse = parseInt($($(".warehouse").find('div.value')[0]).text().replace(',','').match(/\d+/)[0]);
        granary = parseInt($($(".granary").find('div.value')[0]).text().replace(',','').match(/\d+/)[0]);
        wood = parseInt($($(".warehouse").find('div.value')[1]).text().replace(',',''));
        clay  =   parseInt($($(".warehouse").find('div.value')[2]).text().replace(',',''));
        iron =    parseInt($($(".warehouse").find('div.value')[3]).text().replace(',',''));
        crop = parseInt($($(".granary").find('div.value')[1]).text().replace(',',''));
        data = {'wood':wood,'clay':clay,'iron':iron,'wh':warehouse,'gr':granary,'crop':crop,ts:this.getTimestamp()};
        this.updateVillageData(villageId,'res',data)
                return true;
            }
            return false;
        }
        
        updateVillageData(villageId,dataType,data)
        {
            // Check if entry exist for village
            if (!(villageId in this.villageData))
                {
                    this.villageData[villageId] = {'res':{},'troops':{'s':{},'b':{},'gb':{},'gs':{}},'mil':{'s':-1,'b':-1,'gb':-1,'gs':-1},'ts':0,'t1':0,'t2':0}
                }
            
            if(dataType == 'res')
                {
                    this.villageData[villageId]['res'] = data;
                }
            else if(dataType == 'mil')
                {
                    this.villageData[villageId]['mil'] = data;
                }
            else if (dataType == 'sleep1')
                {
                    this.villageData['t1'] = data+this.getTimestamp();
                }
            else if (dataType == 'sleep2')
                {
                    this.villageData['t2'] = data+this.getTimestamp();
                }
            localStorage.villageData = JSON.stringify(this.villageData);
        }
        
  }
class Resource extends Basetask
{
    constructor()
    {
        super();
        this.desc = "This taks is to get resources for a village";
    }
    
    
}

class Militarybuildings extends Basetask
{
    constructor()
    {
        super();
        this.desc = "This taks is to get Military Buildings in any village and update in village data";
    }
    updateBuildings(villageId)
    {
        if(!this.gotodorf2())
        {
        if(!this.switchActiveVillage(villageId))
            {
        console.log(this.selectors.mil);
        console.log($(this.selectors.mil.B).length);
        let s = $(this.selectors.mil.S).length;
        let b = $(this.selectors.mil.B).length;
        let gs = $(this.selectors.mil.GS).length;
        let gb = $(this.selectors.mil.GB).length;
        let data = {'s':s,'b':b,'gb':gb,'gs':gs};
        console.log(data)
        this.updateVillageData(villageId,'mil',data)
                }
        }
    }
    gotoBarrack(villageId)
    {
        let x;
        for ( x in this.villageData[villageId]['mil'])
            {
                if(this.villageData[villageId]['mil'][x]==-1)
                    {
                        console.log('Call update');
                        this.updateBuildings(villageId)
                    }
            }
        if(!this.gotodorf2())
            {
        if(!this.switchActiveVillage(villageId))
            {
                    $(this.selectors.mil.B).click();
                    return true; 
            }
            }
    return false;
    }
    checkBarrack(villageId)
    {
        try
            {
                return ($('.titleInHeader').text().split(' ')[0] == "Barracks")
            }
        catch(e)
            {
                return false;
            }
    }
    queueBarrack(villageId,troops)
    {
        if(this.checkBarrack(villageId))
            {
               $('#nonFavouriteTroops').find('div.tit').each(function(i,k)
                                                                      {
                            if($(k).find("a").text().trim() == "Clubswinger")
                            {
                                $($(k).next().next().next().next().find('input')[0]).val(troops);
                            }
               })
                //$('.startTraining')[0].click();
                return true;
            }
        else
        {
             this.gotoBarrack(villageId);
             return false;
            
        }
        
    }
    // Need to adjust calculation according to the buildings
    calcTroops(villageId,buildings)
    {
        let barrackList =[]
        let barrackQ;
        let barrack = this.troopres['club'].split(',');
        let res = m.villageData[villageId]["res"];
        console.log(barrack)
        
        barrackList.push(parseInt(res.wood/barrack[0]))
        barrackList.push(parseInt(res.clay/barrack[1]))
        barrackList.push(parseInt(res.iron/barrack[2]))
        barrackList.push(parseInt(res.crop/barrack[3]))
        barrackQ = Math.min.apply(null, barrackList);
        console.log(barrackQ)
        let rcrop = parseInt(res.crop) - barrackQ*barrack[3];       
        if(rcrop>200)
            {
        
        return barrackQ;
            }
        else
        {
            return 0;
        }
    }
   
}

class farming extends Basetask
{    
       constructor()
        {
            super();
            this.desc = "This task is for random counter";
        }   
}
class Sleep extends Basetask
{
        constructor()
        {
            super();
            this.desc = "This task is for random counter";
        }
        randomSleep(min,callback)
        {
            randomTime = Math.random()*min*1000;
            this.updateVillageData('NA','sleep1',randomTime)
            setTimeout(function(){callback()},randomTime);
        }
        randomSleep1(min1,min2,callback)
        {
          randomTime = Math.random()*min*1000+min2*1000;
          this.updateVillageData('NA','sleep2',randomTime)
          setTimeout(function(){callback();},randomTime);
        }
       
}












class taskList
{
    constructor()
    {
        this.desc = 'list of tasks';
        this.isExecuting = false;
        if(typeof localStorage.masterQ == 'undefined' || localStorage.masterQ == '' )
        {

            this.masterQ ={'taskList':{},'ts':this.getTimestamp(),'executingTask':{'lastRunts':0}};
            localStorage.masterQ = JSON.stringify(this.masterQ);

        }
        else
        {
            this.masterQ = JSON.parse(localStorage.masterQ)

        }
        this.minTime = 0.5;
    }
    getTimestamp()
     {
         var date = new Date();
         var timestamp = date.getTime();
         return timestamp
     }
    updateMasterQ(taskName,randomTime,newTime)
    {
        
        
        console.log(taskList);
        
    }
    addTaskList(taskName,randomTime,intermediateTime)
    {
        console.log('Call to add TaskList');
        
        let newTime = this.getTimestamp()+parseInt(Math.random()*1000*randomTime*60)+parseInt(this.minTime*1000*60);
        let niTime = parseInt(Math.random()*1000*intermediateTime*60)+parseInt(this.minTime*1000*60);
        let niTime1 = parseInt(Math.random()*1000*intermediateTime*60)+parseInt(this.minTime*1000*60);
        let taskList = this.masterQ['taskList']
        if(taskList[taskName].status == 'C')
            {
                console.log('This task is completed');
                console.log('Removing the entry');
                delete this.masterQ['taskList'][taskName]; 
                localStorage.masterQ = JSON.stringify(this.masterQ);
                taskList = this.masterQ['taskList'];
                
            }
        
        if(!(taskName in taskList))
            {
                //console.log('TaskName Not found')
                switch(taskName)
                {
                    case 'Farm':
                            //this.updateMasterQ('Farm',randomTime,newTime);
                            this.masterQ['taskList'][taskName] = {
                                                                 'ran':randomTime,'ts':newTime,'status':'NS',
                                                                 'task':[
                                                                        {name:'Farm','ts':newTime,'status':'NS'}
                                                                        ]
                                                                 }
                            break;

                    case 'Queue':
                            
                            this.masterQ['taskList'][taskName] = {
                                                                 'ran':randomTime,'ts':newTime,'status':'NS',
                                                                 'task':[
                                                                        {name:'GetResource','ts':newTime,'status':'NS'},
                                                                        {name:'GotoBarrack','ts':newTime+niTime,'status':'NS'},
                                                                        {name:'QueueBarrack','ts':newTime+niTime+niTime1,'status':'NS'},
                                                                        ]
                                                                }
                            break;
                }
                
                localStorage.masterQ = JSON.stringify(this.masterQ);
                //console.log('Updateing masterQ');
                //console.log(localStorage.masterQ);
            }
        else
            {
                console.log('Tasks existing checking for freshness');
                if(parseInt(this.masterQ['taskList'][taskName]['ts'])+15*60*1000<this.getTimestamp() || this.masterQ['taskList'][taskName]['status']=='C')
                    {
                        //console.log('task is one minute old');
                        switch(taskName)
                        {
                            case 'Farm':
                                    //this.updateMasterQ('Farm',randomTime,newTime);
                                    this.masterQ['taskList'][taskName] = {
                                                                 'ran':randomTime,'ts':newTime,'status':'NS',
                                                                 'task':[
                                                                        {name:'Farm','ts':newTime,'status':'NS'}
                                                                        ]
                                                                 }
                            break;                                    break;

                            case 'Queue':
                                    this.masterQ['taskList'][taskName] = {
                                                                 'ran':randomTime,'ts':newTime,'status':'NS',
                                                                 'task':[
                                                                        {name:'GetResource','ts':newTime,'status':'NS'},
                                                                        {name:'GotoBarrack','ts':newTime+niTime,'status':'NS'},
                                                                        {name:'QueueBarrack','ts':newTime+niTime+niTime1,'status':'NS'},
                                                                        ]
                                                                }
                                    break;
                        }
                        
                        localStorage.masterQ = JSON.stringify(this.masterQ);
                    }
            }
    }
    showTaskList()
    {
        console.log('Call tos show Task List');
        let x,index;
        let taskList = this.masterQ['taskList']
        for ( x in taskList)
            {
                //console.log([x,parseInt((taskList[x]['ts']-this.getTimestamp())/1000),taskList[x]['ran'],taskList[x]['status']])
                console.log("....")
                console.log('TaskList Name is '+x+ ' and it has ' + taskList[x].task.length + ' Number of tasks');
                for(index=0;index<taskList[x].task.length;index++)
                    {
                        console.log('SubTask '+index+'::'+taskList[x].task[index].name+'. Time to run::'+parseInt((taskList[x].task[index].ts-this.getTimestamp())/1000).toString() )
                    }
                console.log("....")
            }
    }
    
    reseedAllTasks()
    {   
        console.log('Call to reseedAll Tasks');
        let taskbck = [];
        let taskList = this.masterQ['taskList'];
        for( x in taskList)
            {
                console.log(x);
                taskbck.push([x,taskList[x].ran])
            }
        this.masterQ ={'taskList':{},'ts':this.getTimestamp(),'executingTask':{'lastRunts':0}};
        for ( x in taskbck)
            {
                tl.addTaskList(taskbck[x][0],taskbck[x][1],this.minTime)
            }
        localStorage.masterQ = JSON.stringify(this.masterQ);
        
    }
    runTask(task,taskListName,x)
    {
        console.log('About to run the Task Now');
        console.log(task)
        let m,r,check;
        switch(task)
               {
                   case 'GetResource':
                       console.log('Executing GetResource');
                       this.masterQ['taskList'][taskListName].task[x].status ='S'
                       r = new Resource();
                       check = r.update('798'); // Village Id is hardcoded;
                       if (check == true)
                           {
                               console.log('Executed GetResource');
                               this.masterQ['taskList'][taskListName].task[x].status ='C';
                               //this.executeTaskList();
                           }
                       break;
                   case 'GotoBarrack':
                       console.log('Lets go to barracks now');
                       this.masterQ['taskList'][taskListName].task[x].status ='S'
                       
                       m = new Militarybuildings();
                       if(!m.checkBarrack("798"))
                           {
                                m.gotoBarrack("798");        
                           }
                       else if(m.checkBarrack("798"))
                           {
                               console.log('Executed GotoBarrack');
                               this.masterQ['taskList'][taskListName].task[x].status ='C';
                               //this.executeTaskList();
                           }

                       break;
                   case 'QueueBarrack':
                       m = new Militarybuildings();
                       if(m.isActiveVillage("798"))
                           {
                           if(m.checkBarrack("798"))
                               {
                                   if(m.queueBarrack("798","1"))
                                   {
                                        console.log('Executed Queue Barrack');
                                        this.masterQ['taskList'][taskListName].task[x].status ='C';
                                        //this.executeTaskList();
                                   }
                               }
                            }
                       else
                           {
                               m.switchActiveVillage("798");
                           }
                       break;
               }
        localStorage.masterQ = JSON.stringify(this.masterQ);
    }
    executeTask(task)
    {
        console.log('Call to execute Task');
        let taskList = this.masterQ['taskList'][task].task;
        console.log('Inside Execute Task List Finally');
        let x;
        let tasktr;
        let ts = 999999999999999;
        let notaskleft = -1;
        
        for(x in taskList)
            {
                console.log(JSON.stringify(taskList[x]))
                if(taskList[x].status =='C')
                    {
                        continue;
                    }
                notaskleft = -2;
                console.log('task to be picked::' +taskList[x].name)
                this.runTask(taskList[x].name,task,x);
                break;
            }
        if(notaskleft == -1)
            {
                this.masterQ['taskList'][task].status = 'C'
                console.log('All Tasks Completed for this TaskList');
                localStorage.masterQ = JSON.stringify(this.masterQ);
                this.addTaskList(task,this.masterQ['taskList'][task].ran,this.minTime)      
            }
        
        //this.addTaskList(task,this.masterQ['taskList'][task].ran,this.minTime)
        // Console log get New Time for this task List   
    }
    executeTaskList()
    {
        this.isExecuting = true;
        console.log('Call to execute Task List');
        let x,index;
        let taskList = this.masterQ['taskList'];
        let executionTasks = this.masterQ['executingTask']
        // Check for Older Expiring Tasks.
        if(executionTasks.lastRunts!=0)
            {
                if(parseInt(executionTasks.lastRunts) + 30*60000 < this.getTimestamp())
                    {
                        reseedAllTasks();
                    }
            }
        let ts = 999999999999999;
        let task ;
        for (x in taskList)
            {
                console.log("....")
                console.log('TaskList Name is '+x+ ' and it has ' + taskList[x].task.length + ' Number of tasks');
                if(ts>taskList[x].ts)
                    {
                        ts = taskList[x].ts;
                        task = x
                    }
                if(taskList[x].status == 'S')
                    {
                        ts = taskList[x].ts;
                        task = x;
                        break;
                    }
            }
        console.log('Next Task List to pick up :: '+ task)
        if(taskList[task].status != 'S')
            {
        if(ts<this.getTimestamp())
            {
                console.log(' Task to be executed now.')
                console.log([task,ts]);   
                this.masterQ['taskList'][task].status='S'
                this.executeTask(task);
            }
        else
            {
                console.log('Task in future');
                console.log(parseInt((ts-this.getTimestamp())/1000));
                /*setTimeout(function(){
                    console.log('Executing Again');
                    tl.executeTaskList();
                },ts-this.getTimestamp());*/
            }
            }
        else
            {
                this.executeTask(task);
            }
    this.isExecuting = false;
    }
}

tl = new taskList();
tl.addTaskList('Queue',0.25,0.5)
tl.executeTaskList();

p = setInterval(function(){
    if(!tl.isExecuting)
        {
            tl.executeTaskList();
        }
},5000)
