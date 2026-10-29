-- Demo touches on top of the Barynt seed: English descriptions and four saved views.
update "Project" set "desc"='Board, list and everything that happens in the browser.' where slug='web-app';
update "Project" set "desc"='Confidential project, only for people invited by name.' where slug='vault';
update "Project" set "desc"='API, database and operations: the layer under everything.' where slug='platform';
update "Project" set "desc"='The app for iOS and Android.' where slug='mobile';
update "Workspace" set "desc"='Product and engineering for the Nimbus apps.' where slug='nimbus';
insert into "SavedView"(id,"workspaceId","ownerId",visibility,name,slug,icon,color,position,layout,filter,"groupBy","sortBy","sortDir",display,"updatedAt")
select 'vdemo1','nimbus',u.id,'WORKSPACE','Open bugs','open-bugs','lucide:bug','#e05252',1,'list', jsonb_build_object('op','and','rules',jsonb_build_array(jsonb_build_object('field','label','is','any','value',jsonb_build_array(l.id)))),'status','priority','desc','{}',now()
from "User" u, "Label" l where u.email='owner@nimbus.io' and l.name='Bug' limit 1;
insert into "SavedView"(id,"workspaceId","ownerId",visibility,name,slug,icon,color,position,layout,filter,"groupBy","sortBy","sortDir",display,"updatedAt")
select 'vdemo2','nimbus',u.id,'WORKSPACE','Frontend sprint','frontend-sprint','lucide:rocket','#3b7bd5',2,'board', jsonb_build_object('op','and','rules',jsonb_build_array(jsonb_build_object('field','label','is','any','value',jsonb_build_array(l.id)))),'status','manual','asc','{}',now()
from "User" u, "Label" l where u.email='owner@nimbus.io' and l.name='Frontend' limit 1;
insert into "SavedView"(id,"workspaceId","ownerId",visibility,name,slug,icon,color,position,layout,filter,"groupBy","sortBy","sortDir",display,"updatedAt")
select 'vdemo3','nimbus',u.id,'PRIVATE','Urgent & high','urgent-high','lucide:flame','#e8743b',3,'list','{"op":"and","rules":[{"field":"priority","is":"gte","value":3}]}','assignee','priority','desc','{}',now()
from "User" u where u.email='owner@nimbus.io';
insert into "SavedView"(id,"workspaceId","ownerId",visibility,name,slug,icon,color,position,layout,filter,"groupBy","sortBy","sortDir",display,"updatedAt")
select 'vdemo4','nimbus',u.id,'WORKSPACE','Design review','design-review','lucide:palette','#d369a2',4,'board', jsonb_build_object('op','and','rules',jsonb_build_array(jsonb_build_object('field','label','is','any','value',jsonb_build_array(l.id)))),'status','manual','asc','{}',now()
from "User" u, "Label" l where u.email='owner@nimbus.io' and l.name='Design' limit 1;
