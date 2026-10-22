(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),name=document.body.dataset.game;
const names={"dungeon-escape":"Dungeon Escape","star-blaster":"Star Blaster","pixel-jumper":"Pixel Jumper","neon-pinball":"Neon Pinball","turbo-traffic":"Turbo Traffic","block-drop":"Block Drop","deep-sea-dive":"Deep Sea Dive","bubble-burst":"Bubble Burst","ninja-dash":"Ninja Dash","whack-a-bot":"Whack-a-Bot"};
const descriptions={"dungeon-escape":"Find the treasure and reach the green exit. Move with WASD or arrow keys.","star-blaster":"Move left and right, shoot incoming ships. Arrow keys/WASD + Space.","pixel-jumper":"Jump between platforms and grab coins. Move with arrows/A-D; Space to jump.","neon-pinball":"Keep the ball bouncing with the flippers. Use left/right arrows or tap the sides.","turbo-traffic":"Dodge the traffic for as long as possible. Move with arrows or A/D.","block-drop":"Move and rotate falling blocks to complete rows. Arrows move, Up rotates, Down drops.","deep-sea-dive":"Collect pearls and avoid sea mines. Move with arrows or WASD.","bubble-burst":"Click or tap bubbles before they float away. Build your score!","ninja-dash":"Jump between floating platforms and dodge traps. Space/Up or tap to jump.","whack-a-bot":"Whack the bots as they pop up from the arcade machine! Click or tap them. Slower pace, 45 seconds."};
const titleElement=document.getElementById("game-title");if(titleElement)titleElement.textContent=names[name]||"Mini Game";
document.getElementById("instructions").textContent=descriptions[name]||"Use the controls to play.";
let W=800,H=450,keys={},items=[],player={},score=0,lives=3,frame=0,running=false,over=false,time=30,grid=[],ball={},dir=1,dungeonLevel=1,nextBotFrame=0,lastBotSlot=-1,ninjaPlatforms=[],ninjaLevel=1,ninjaLevelStart=0,ninjaSpawnIndex=0,ninjaRotation=0,ninjaWasGrounded=true;
function resize(){const r=canvas.getBoundingClientRect();W=800;H=450;canvas.width=W;canvas.height=H;}resize();
function reset(){score=0;lives=3;frame=0;time=30;over=false;running=true;items=[];player={x:90,y:H-130,w:30,h:30,vx:0,vy:0};ninjaPlatforms=[];ninjaLevel=1;ninjaLevelStart=frame;ninjaSpawnIndex=0;ninjaRotation=0;ninjaWasGrounded=true;if(name==="ninja-dash")ninjaPlatforms=[];grid=Array.from({length:20},()=>Array(10).fill(0));ball={x:W/2,y:H/2,vx:3,vy:3};if(name==="dungeon-escape"){dungeonLevel=1;try{dungeonLevel=Math.max(1,Math.min(10,Number(localStorage.getItem("dungeonEscapeLevel"))||1));}catch(e){}score=(dungeonLevel-1)*150;createDungeonLevel();}if(name==="block-drop")spawnBlock();if(name==="whack-a-bot"){time=45;nextBotFrame=frame+25;lastBotSlot=-1;}document.getElementById("status").textContent=(name==="dungeon-escape"?"Floor: "+dungeonLevel+" / 10 · ":"")+"Score: "+score+" · Lives: 3";requestAnimationFrame(loop);}
function spawnBlock(){const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];player.shape=shapes[Math.floor(Math.random()*shapes.length)];player.x=3;player.y=0;}
function hit(a,b){return a.x<b.x+(b.w||22)&&a.x+(a.w||22)>b.x&&a.y<b.y+(b.h||22)&&a.y+(a.h||22)>b.y;}
function loop(){if(!running)return;frame++;ctx.clearRect(0,0,W,H);ctx.fillStyle="#080d1a";ctx.fillRect(0,0,W,H);
if(name==="dungeon-escape")dungeon();else if(name==="star-blaster")shooter();else if(name==="pixel-jumper")jumper();else if(name==="neon-pinball")pinball();else if(name==="turbo-traffic")traffic();else if(name==="block-drop")blockdrop();else if(name==="deep-sea-dive")sea();else if(name==="bubble-burst")bubbles();else if(name==="ninja-dash")ninja();else if(name==="whack-a-bot")whack();
document.getElementById("status").textContent=(name==="dungeon-escape"?"Floor: "+dungeonLevel+" / 10 · ":"")+"Score: "+score+" · Lives: "+lives+(name==="whack-a-bot"?" · Time: "+Math.max(0,Math.ceil(time)):"");
if(lives<=0||(name==="whack-a-bot"&&time<=0)){over=true;running=false;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="bold 38px system-ui";ctx.fillText("GAME OVER",W/2,H/2);ctx.font="20px system-ui";ctx.fillText("Final score: "+score+" · Press Restart",W/2,H/2+38);return;}requestAnimationFrame(loop);}
function text(t,x,y,size=20,color="#f5f7ff"){ctx.fillStyle=color;ctx.font="bold "+size+"px system-ui";ctx.fillText(t,x,y);}
function playerDraw(color="#38bdf8"){ctx.fillStyle=color;ctx.fillRect(player.x,player.y,player.w,player.h);}
function createDungeonLevel(){player.x=35;player.y=55;player.w=24;player.h=24;items=[{x:W-62,y:H-58,t:"exit",w:30,h:30},{x:W/2,y:H/2,t:"treasure",w:22,h:22}];const count=8+dungeonLevel;for(let i=0;i<count;i++){const w=25+Math.random()*42,h=20+Math.random()*35,x=55+Math.random()*(W-120-w),y=65+Math.random()*(H-130-h);if(Math.hypot(x-player.x,y-player.y)<75||Math.hypot(x-(W-62),y-(H-58))<70||Math.hypot(x-W/2,y-H/2)<45)continue;items.push({x,y,t:"wall",w,h});}items.push({x:W*.25,y:H*.72,t:"key",w:18,h:22});}
function dungeon(){text("DUNGEON FLOOR "+dungeonLevel+" / 10",20,30,18);ctx.fillStyle="#17243a";ctx.fillRect(15,45,W-30,H-60);items.filter(i=>i.t==="wall").forEach(i=>{ctx.fillStyle="#38445d";ctx.fillRect(i.x,i.y,i.w,i.h);});const exit=items.find(i=>i.t==="exit"),tre=items.find(i=>i.t==="treasure"),key=items.find(i=>i.t==="key");move(3.2+dungeonLevel*.12);if(tre){ctx.fillStyle="#facc15";ctx.fillRect(tre.x,tre.y,tre.w,tre.h);if(hit(player,tre)){score+=50;items=items.filter(i=>i!==tre);}}if(key){ctx.fillStyle="#67e8f9";ctx.fillRect(key.x,key.y,key.w,key.h);if(hit(player,key)){score+=25;items=items.filter(i=>i!==key);}}if(exit){ctx.fillStyle=items.some(i=>i.t==="treasure")?"#64748b":"#4ade80";ctx.fillRect(exit.x,exit.y,exit.w,exit.h);}playerDraw("#38bdf8");text("Collect treasure, then reach the green exit",20,H-14,14,"#b8c7e8");if(exit&&!items.some(i=>i.t==="treasure")&&hit(player,exit)){score+=100;document.getElementById("status").textContent="Floor "+dungeonLevel+" cleared! Loading next floor…";dungeonLevel++;if(dungeonLevel>10){running=false;over=true;try{localStorage.setItem("dungeonEscapeLevel","1");}catch(e){}ctx.fillStyle="rgba(5,10,20,.88)";ctx.fillRect(0,0,W,H);text("DUNGEON CONQUERED!",W/2-190,H/2-12,30,"#4ade80");text("All 10 floors cleared! Score: "+score,W/2-180,H/2+28,18);document.getElementById("status").textContent="🏆 You escaped the dungeon! Final score: "+score;return;}try{localStorage.setItem("dungeonEscapeLevel",String(dungeonLevel));}catch(e){}createDungeonLevel();}}
function shooter(){if(frame%48===0)items.push({x:30+Math.random()*(W-60),y:-20,t:"enemy",w:24,h:24});if(keys[" "]&&frame%10===0)items.push({x:player.x+12,y:player.y-8,t:"shot",w:5,h:14});move(5);player.y=H-55;items.forEach(i=>{i.y+=i.t==="shot"?-7:2.2;ctx.fillStyle=i.t==="shot"?"#facc15":"#fb5572";ctx.fillRect(i.x,i.y,i.w,i.h);if(i.t==="enemy"&&hit(player,i)){i.y=H+100;lives--;}});items.forEach(e=>{if(e.t==="shot")items.forEach(en=>{if(en.t==="enemy"&&hit(e,en)){en.y=H+100;e.y=-100;score+=10;}})});items=items.filter(i=>i.y>-40&&i.y<H+50);playerDraw("#7c9cff");text("SPACE = FIRE",20,30,16);}
function jumper(){ctx.fillStyle="#263a50";ctx.fillRect(0,H-25,W,25);for(let x=70;x<760;x+=130){ctx.fillStyle="#4b6078";ctx.fillRect(x,H-100-(x%3)*28,75,12);if(frame%75===0)items.push({x:x+30,y:H-130-(x%3)*28,t:"coin"});}player.vy=(player.vy||0)+.35;player.x+=((keys.ArrowRight||keys.d)?4:0)-((keys.ArrowLeft||keys.a)?4:0);player.y+=player.vy;if(player.y>H-55){player.y=H-55;player.vy=0;}if((keys[" "]||keys.ArrowUp||keys.w)&&player.vy===0)player.vy=-9;items.forEach(i=>{ctx.fillStyle="#facc15";ctx.beginPath();ctx.arc(i.x,i.y,9,0,7);ctx.fill();if(hit(player,{...i,w:18,h:18})){score+=10;i.y=H+100;}});items=items.filter(i=>i.y<H);playerDraw("#4ade80");text("COINS: "+score,20,30,18);}
function pinball(){ball.x+=ball.vx;ball.y+=ball.vy;if(ball.x<20||ball.x>W-20)ball.vx*=-1;if(ball.y<20)ball.vy*=-1;if(ball.y>H-55){if((ball.x<W/2&&keys.ArrowLeft)||(ball.x>=W/2&&keys.ArrowRight)||pointerDown){ball.vy=-Math.abs(ball.vy)-.3;score+=1;}else{lives--;ball.y=H/2;ball.vy=-3;}}if(frame%60===0){items.push({x:100+Math.random()*600,y:80+Math.random()*180,t:"bumper"});}items.forEach(i=>{ctx.fillStyle="#f43fda";ctx.beginPath();ctx.arc(i.x,i.y,18,0,7);ctx.fill();if(Math.hypot(ball.x-i.x,ball.y-i.y)<25){ball.vx*=-1;ball.vy*=-1;score+=5;}});items=items.filter(i=>frame-i.born<300);ctx.fillStyle="#38bdf8";ctx.fillRect(80,H-35,250,10);ctx.fillRect(470,H-35,250,10);ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(ball.x,ball.y,9,0,7);ctx.fill();text("LEFT / RIGHT FLIPPERS",20,30,16);}
function traffic(){if(frame%38===0)items.push({x:80+Math.floor(Math.random()*6)*105,y:-65,t:"car",w:38,h:58});move(4);player.y=H-80;player.x=Math.max(45,Math.min(W-75,player.x));ctx.fillStyle="#273247";ctx.fillRect(55,0,W-110,H);ctx.strokeStyle="#e5e7eb";ctx.setLineDash([22,18]);ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);items.forEach(i=>{i.y+=4;ctx.fillStyle="#fb7185";ctx.fillRect(i.x,i.y,i.w,i.h);if(hit(player,i)){i.y=H+100;lives--;}});items=items.filter(i=>i.y<H+80);score+=frame%20===0?1:0;playerDraw("#38bdf8");}
function blockCollision(shape,x,y){for(let dy=0;dy<shape.length;dy++)for(let dx=0;dx<shape[dy].length;dx++){if(!shape[dy][dx])continue;const gx=x+dx,gy=y+dy;if(gx<0||gx>=10||gy>=20)return true;if(gy>=0&&grid[gy][gx])return true;}return false;}
function lockBlock(){const s=player.shape;for(let dy=0;dy<s.length;dy++)for(let dx=0;dx<s[dy].length;dx++){if(s[dy][dx]){const gy=player.y+dy,gx=player.x+dx;if(gy<0){lives=0;return;}grid[gy][gx]=1;}}let cleared=0;grid=grid.filter(row=>{if(row.every(Boolean)){cleared++;return false;}return true;});while(grid.length<20)grid.unshift(Array(10).fill(0));if(cleared){score+=([0,100,300,500,800][cleared]||cleared*250);if(cleared>=4)score+=200;}spawnBlock();if(blockCollision(player.shape,player.x,player.y))lives=0;}
function hardDrop(){if(name!=="block-drop"||!running)return;while(!blockCollision(player.shape,player.x,player.y+1))player.y++;lockBlock();}
function blockdrop(){const cell=20,left=270,top=24;ctx.fillStyle="#111b2d";ctx.fillRect(left-2,top-2,cell*10+4,cell*20+4);for(let y=0;y<20;y++)for(let x=0;x<10;x++){ctx.fillStyle=grid[y][x]?"#38bdf8":"#18243a";ctx.fillRect(left+x*cell,top+y*cell,cell-1,cell-1);}const s=player.shape;if(frame%30===0){if(!blockCollision(s,player.x,player.y+1))player.y++;else lockBlock();}if(frame%7===0){if(keys.ArrowLeft&&!blockCollision(s,player.x-1,player.y))player.x--;if(keys.ArrowRight&&!blockCollision(s,player.x+1,player.y))player.x++;}if(keys.ArrowDown&&frame%3===0){if(!blockCollision(s,player.x,player.y+1)){player.y++;score++;}else lockBlock();}if(player.shape){player.shape.forEach((row,dy)=>row.forEach((v,dx)=>{if(v){ctx.fillStyle="#fb7185";ctx.fillRect(left+(player.x+dx)*cell,top+(player.y+dy)*cell,cell-1,cell-1);}}));}text("BLOCK DROP",20,30,18);text("← → MOVE",20,64,14);text("↑ ROTATE",20,88,14);text("↓ SOFT DROP",20,112,14);text("SPACE HARD DROP",20,136,14);text("LINES SCORE",580,64,14);text(String(score),580,94,24,"#4ade80");}
function sea(){ctx.fillStyle="#0b4260";ctx.fillRect(0,0,W,H);for(let i=0;i<8;i++){ctx.strokeStyle="#16769a";ctx.beginPath();ctx.arc((i*127+frame*1.2)%W,70+i*42,40,0,Math.PI);ctx.stroke();}if(frame%40===0)items.push({x:30+Math.random()*730,y:40+Math.random()*350,t:Math.random()<.72?"pearl":"mine"});move(4);items.forEach(i=>{ctx.fillStyle=i.t==="pearl"?"#fde68a":"#fb7185";ctx.beginPath();ctx.arc(i.x,i.y,12,0,7);ctx.fill();if(hit(player,{...i,w:24,h:24})){if(i.t==="pearl")score+=10;else lives--;i.y=-100;}});items=items.filter(i=>i.y>-50);playerDraw("#a5f3fc");}
function bubbles(){if(frame%18===0)items.push({x:25+Math.random()*750,y:H+20,t:"bubble",r:12+Math.random()*15,vy:1+Math.random()*2});items.forEach(i=>{i.y-=i.vy;ctx.fillStyle=["#38bdf8","#c084fc","#fb7185"][Math.floor(i.x)%3];ctx.beginPath();ctx.arc(i.x,i.y,i.r,0,7);ctx.fill();});items=items.filter(i=>{if(i.y< -30){lives--;return false;}return true;});text("TAP / CLICK BUBBLES",20,30,16);}
function ninja(){
 const ground=H-54,elapsed=frame-ninjaLevelStart;
 const colors=["#00e5ff","#b56bff","#ff4d9d","#a3ff4f","#ffb84d"];
 const levelNames=["STEREO START","NEON STEPS","SPIKE CITY","DANGER ZONE","FINAL PULSE"];
 const speed=5.2+ninjaLevel*.65,target=620+ninjaLevel*80;
 // Hand-authored obstacle timings make every level repeatable and learnable.
 const patterns=[
  [[65,1],[125,1],[205,2],[285,1],[345,1],[425,2],[515,1]],
  [[55,1],[105,2],[175,1],[225,1],[285,2],[365,1],[415,2],[505,1],[565,2]],
  [[45,2],[115,1],[165,2],[235,2],[315,1],[365,2],[445,1],[495,2],[555,2]],
  [[40,1],[90,2],[145,2],[205,1],[255,3],[345,2],[405,1],[455,3],[545,2],[595,1]],
  [[35,2],[85,3],[155,1],[205,2],[265,3],[345,2],[395,3],[465,1],[515,3],[585,2],[635,3]]
 ];
 const pattern=patterns[ninjaLevel-1];
 const pulse=1+Math.sin(frame*.12)*.06;
 ctx.fillStyle="#080b1b";ctx.fillRect(0,0,W,H);
 // Background grid and parallax light bands.
 ctx.strokeStyle="#15264a";ctx.lineWidth=1;
 for(let x=-(elapsed*speed*.45%40);x<W;x+=40){ctx.beginPath();ctx.moveTo(x,40);ctx.lineTo(x,H);ctx.stroke();}
 for(let y=55;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 ctx.globalAlpha=.14;ctx.fillStyle=colors[ninjaLevel-1];ctx.fillRect(0,75,W,90);ctx.globalAlpha=1;
 // Track.
 ctx.fillStyle="#111a35";ctx.fillRect(0,ground,W,H-ground);
 ctx.fillStyle=colors[ninjaLevel-1];ctx.fillRect(0,ground,W,4);
 ctx.fillStyle=colors[ninjaLevel-1];ctx.globalAlpha=.15;ctx.fillRect(0,ground+4,W,H-ground-4);ctx.globalAlpha=1;
 // Spawn only the authored sequence for this level.
 while(ninjaSpawnIndex<pattern.length&&elapsed>=pattern[ninjaSpawnIndex][0]){
   const count=pattern[ninjaSpawnIndex][1];
   for(let n=0;n<count;n++)items.push({x:W+18+n*31,y:ground-30,t:"spike",w:30,h:30});
   ninjaSpawnIndex++;
 }
 const wasGrounded=player.y+player.h>=ground-1&&player.vy===0;
 player.x=145;
 player.vy=(player.vy||0)+.62;player.y+=player.vy;
 if(player.y+player.h>=ground){player.y=ground-player.h;player.vy=0;}
 const grounded=player.vy===0&&player.y+player.h>=ground-1;
 if(grounded&&!ninjaWasGrounded)ninjaRotation=Math.round(ninjaRotation/(Math.PI/2))*(Math.PI/2);
 ninjaWasGrounded=grounded;
 if((keys[" "]||keys.ArrowUp||keys.w)&&grounded){player.vy=-12.4;ninjaWasGrounded=false;}
 let crashedThisFrame=false;
 items.forEach(i=>{
   i.x-=speed;
   ctx.save();ctx.shadowBlur=15;ctx.shadowColor="#ff367f";ctx.fillStyle="#ff367f";
   ctx.beginPath();ctx.moveTo(i.x,i.y+i.h);ctx.lineTo(i.x+i.w/2,i.y);ctx.lineTo(i.x+i.w,i.y+i.h);ctx.closePath();ctx.fill();
   ctx.shadowBlur=0;ctx.fillStyle="#ffd2e4";ctx.fillRect(i.x+i.w/2-2,i.y+8,4,i.h-8);ctx.restore();
   const overlap=player.x+player.w-5>i.x+5&&player.x+5<i.x+i.w-5&&player.y+player.h-4>i.y+5&&player.y+4<i.y+i.h;
   if(overlap&&running&&!crashedThisFrame){
     crashedThisFrame=true;lives--;items=[];player.y=ground-player.h;player.vy=0;ninjaLevelStart=frame;ninjaSpawnIndex=0;ninjaRotation=0;ninjaWasGrounded=true;
     if(lives<=0){running=false;over=true;ctx.fillStyle="rgba(4,8,20,.9)";ctx.fillRect(0,0,W,H);text("CRASH!",W/2-62,H/2-8,36,"#ff4d9d");text("Press RESTART to retry "+levelNames[ninjaLevel-1],W/2-190,H/2+28,16);return;}
   }
 });
 items=items.filter(i=>i.x+i.w>-10);
 if(!running)return;
 // HUD and progress.
 const progress=Math.min(1,elapsed/target);
 ctx.fillStyle="#202b4c";ctx.fillRect(20,18,250,10);
 ctx.fillStyle=colors[ninjaLevel-1];ctx.fillRect(20,18,250*progress,10);
 ctx.strokeStyle="#a9c7ff";ctx.strokeRect(20,18,250,10);
 text("LEVEL "+ninjaLevel+" / 5",20,53,18,"#ffffff");
 text(levelNames[ninjaLevel-1],W-230,30,14,colors[ninjaLevel-1]);
 text("✦ "+score,20,82,15,"#c7d2fe");
 // Rotating cube, with neon outline and face details.
 if(player.vy!==0)ninjaRotation+=.105*Math.sign(player.vy);
 ctx.save();ctx.translate(player.x+player.w/2,player.y+player.h/2);ctx.rotate(ninjaRotation);
 ctx.shadowBlur=22*pulse;ctx.shadowColor=colors[ninjaLevel-1];ctx.fillStyle=colors[ninjaLevel-1];ctx.fillRect(-15,-15,30,30);
 ctx.shadowBlur=0;ctx.strokeStyle="#ffffff";ctx.lineWidth=2.5;ctx.strokeRect(-10,-10,20,20);
 ctx.fillStyle="#081124";ctx.fillRect(-7,-5,4,4);ctx.fillRect(3,-5,4,4);ctx.fillRect(-5,4,10,3);ctx.restore();
 if(elapsed>=target){
   score+=100*ninjaLevel;
   if(ninjaLevel<5){ninjaLevel++;ninjaLevelStart=frame;ninjaSpawnIndex=0;ninjaRotation=0;ninjaWasGrounded=true;items=[];player.y=ground-player.h;player.vy=0;}
   else{running=false;over=true;ctx.fillStyle="rgba(4,8,20,.9)";ctx.fillRect(0,0,W,H);text("LEVEL PACK COMPLETE!",W/2-185,H/2-10,28,"#a3ff4f");text("All 5 levels cleared  •  Score: "+score,W/2-170,H/2+28,18);}
 }
}
function whack(){
 time-=1/60;
 // Draw a classic wooden whack-a-mole cabinet with six padded holes.
 const bx=105,by=66,bw=590,bh=340;
 ctx.fillStyle="#321b18";ctx.fillRect(bx-9,by-9,bw+18,bh+18);
 ctx.fillStyle="#8b4b2d";ctx.fillRect(bx,by,bw,bh);
 ctx.fillStyle="#b86b3d";ctx.fillRect(bx+10,by+10,bw-20,bh-20);
 ctx.fillStyle="#facc15";ctx.fillRect(bx+18,by+18,bw-36,45);
 ctx.fillStyle="#25151b";ctx.font="bold 25px system-ui";ctx.textAlign="center";ctx.fillText("WHACK-A-BOT",W/2,by+48);
 ctx.fillStyle="#111827";ctx.fillRect(bx+22,by+75,bw-44,205);
 const cols=[bx+120,bx+295,bx+470],rows=[by+120,by+220];
 for(const yy of rows)for(const xx of cols){
   ctx.fillStyle="#050914";ctx.beginPath();ctx.ellipse(xx,yy,57,39,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle="#d39a68";ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(xx,yy,57,39,0,0,Math.PI*2);ctx.stroke();
 }
 // Keep a bot up long enough to aim, then give a short breather before the next one.
 if(items.length && frame>=nextBotFrame){
   // Hide the current bot, then leave a short pause before the next one.
   items=[];
   nextBotFrame=frame+Math.floor(18+Math.random()*12);
 } else if(!items.length && frame>=nextBotFrame){
   let slot=Math.floor(Math.random()*6);
   if(lastBotSlot>=0){while(slot===lastBotSlot)slot=Math.floor(Math.random()*6);}
   lastBotSlot=slot;
   const xx=cols[slot%3],yy=rows[Math.floor(slot/3)];
   items=[{x:xx,y:yy-7,t:"bot",w:58,h:58,slot}];
   nextBotFrame=frame+Math.floor(60+Math.random()*20);
 }
 items.forEach(i=>{
   ctx.fillStyle="#38bdf8";ctx.beginPath();ctx.ellipse(i.x,i.y+10,34,28,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#93c5fd";ctx.beginPath();ctx.arc(i.x,i.y-7,25,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#071426";ctx.beginPath();ctx.arc(i.x-9,i.y-10,4,0,Math.PI*2);ctx.arc(i.x+9,i.y-10,4,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle="#071426";ctx.lineWidth=3;ctx.beginPath();ctx.arc(i.x,i.y,10,.15,Math.PI-.15);ctx.stroke();
 });
 ctx.fillStyle="#171923";ctx.fillRect(bx+22,by+291,bw-44,32);
 ctx.fillStyle="#facc15";ctx.font="bold 18px system-ui";ctx.textAlign="center";ctx.fillText("SCORE  "+score+"     TIME  "+Math.max(0,Math.ceil(time)),W/2,by+314);
 ctx.textAlign="left";text("TAP / CLICK THE BOT",20,30,17,"#e2e8f0");
}
let pointerDown=false;canvas.addEventListener("pointerdown",e=>{pointerDown=true;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;if(name==="bubble-burst"){items=items.filter(i=>{if(Math.hypot(i.x-x,i.y-y)<i.r+8){score+=10;return false;}return true;});}if(name==="whack-a-bot"&&items.some(i=>Math.hypot(i.x-x,i.y-y)<42)){score+=10;items=[];nextBotFrame=frame+Math.floor(45+Math.random()*25);}if(name==="pixel-jumper"||name==="ninja-dash"){if(player.vy===0)player.vy=-10;}if(name==="neon-pinball"){ball.vy=-Math.abs(ball.vy)-1;score++;}});canvas.addEventListener("pointerup",()=>pointerDown=false);
function move(speed){if(keys.ArrowLeft||keys.a)player.x-=speed;if(keys.ArrowRight||keys.d)player.x+=speed;if(keys.ArrowUp||keys.w)player.y-=speed;if(keys.ArrowDown||keys.s)player.y+=speed;player.x=Math.max(0,Math.min(W-player.w,player.x));player.y=Math.max(35,Math.min(H-player.h,player.y));}
document.addEventListener("keydown",e=>{keys[e.key]=true;if([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();if(name==="block-drop"&&e.key==="ArrowUp"){e.preventDefault();const rotated=player.shape[0].map((_,i)=>player.shape.map(row=>row[i]).reverse());if(!blockCollision(rotated,player.x,player.y))player.shape=rotated;}if(name==="block-drop"&&e.code==="Space"){e.preventDefault();hardDrop();}});document.addEventListener("keyup",e=>keys[e.key]=false);
document.getElementById("restart").addEventListener("click",reset);reset();
})();