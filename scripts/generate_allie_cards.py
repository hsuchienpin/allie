"""Create original, closed-region coloring pages for Allie's shared memories."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]/'wwwroot'
def path(d):return f'<path d="{d}"/>'
def line(d):return f'<path d="{d}" fill="none"/>'
def ellipse(x,y,rx,ry):return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}"/>'
def circle(x,y,r):return ellipse(x,y,r,r)
def rect(x,y,w,h,r=20):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/>'
def eyes(x,y,gap=85):return ''.join(f'<circle cx="{x+d}" cy="{y}" r="10" fill="#000" stroke="none"/>' for d in [-gap/2,gap/2])
def heart(x,y,s=1):return f'<g transform="translate({x} {y}) scale({s})">'+path('M0 45 C-125 -30 -60 -125 0 -70 C60 -125 125 -30 0 45Z')+'</g>'
def star(x,y,s=1):return f'<g transform="translate({x} {y}) scale({s})">'+path('M0 -65 L20 -20 L65 -20 L30 10 L43 60 L0 33 L-43 60 L-30 10 L-65 -20 L-20 -20Z')+'</g>'
def unicorn(x,y,s=1):return f'<g transform="translate({x} {y}) scale({s})">'+path('M-160 30 Q-280 -130 -190 -210 Q-115 -205 -130 -95 L-35 -160 L45 -135 Q155 -120 175 -35 Q175 40 85 45 L10 95 V210 H-60 V120 H-120 V210 H-185 V105 Q-220 55 -160 30Z')+path('M-55 -155 L-30 -275 L18 -150Z')+path('M35 -130 L65 -205 L100 -125Z')+ellipse(80,-35,88,48)+eyes(67,-76,0)+line('M90 -20 Q120 0 146 -22')+path('M-25 -135 Q-135 -75 -85 60 Q-170 35 -140 -45 Q-160 -160 -25 -135Z')+heart(-120,35,.38)+'</g>'
def princess(x,y,s=1,flower=False):return f'<g transform="translate({x} {y}) scale({s})">'+path('M-85 -50 Q-135 -210 0 -235 Q145 -215 90 -50 L130 70 H-130Z')+ellipse(0,-115,80,92)+path('M-80 -145 Q-55 -215 0 -203 Q50 -160 80 -151 Q80 -220 0 -225 Q-100 -215 -80 -145Z')+eyes(0,-113)+line('M-20 -72 Q0 -52 20 -72')+path('M-60 -25 L-200 250 H200 L60 -25Z')+path('M-60 -25 Q0 55 60 -25 V40 Q0 72 -60 40Z')+path('M-65 -230 L-80 -285 L-30 -262 L0 -310 L30 -262 L80 -285 L65 -230Z')+line('M0 70 V250 M-95 250 L-28 93 M95 250 L28 93')+(heart(0,0,.3) if not flower else circle(0,10,25))+'</g>'
def sweet(x,y,s=1):return f'<g transform="translate({x} {y}) scale({s})">'+rect(-16,30,32,170,9)+path('M-80 65 Q-155 55 -135 -20 Q-180 -100 -95 -120 Q-105 -215 -20 -190 Q55 -260 100 -175 Q195 -175 170 -75 Q230 15 145 60Z')+star(0,-90,.45)+'</g>'
cards=[]
def add(slug,name,level,body):cards.append((slug,name,level,body))
add('allie-unicorn','Unicorn',1,unicorn(515,420,1.1)+star(225,185,.6)+star(817,250,.6))
add('allie-jellyfish','Jellyfish',1,path('M295 395 Q300 140 512 145 Q725 140 730 395 Q682 430 640 393 Q595 430 555 393 Q510 430 468 393 Q425 430 382 393 Q335 430 295 395Z')+eyes(512,305,130)+line('M484 342 Q512 365 540 342')+path('M345 412 Q290 510 365 550 Q430 590 350 650 Q295 685 330 700 L385 700 Q473 610 419 550 Q351 510 397 418Z')+path('M478 419 Q428 500 502 560 Q555 610 500 700 H552 Q612 610 555 553 Q498 510 530 418Z')+path('M610 414 Q570 510 650 555 Q700 590 654 674 L702 700 Q778 596 711 550 Q644 510 665 420Z')+circle(200,255,32)+circle(820,470,42))
add('allie-penguin','Penguin',1,ellipse(512,460,170,213)+ellipse(340,455,45,118)+ellipse(684,455,45,118)+ellipse(440,675,80,28)+ellipse(583,675,80,28)+ellipse(512,490,120,162)+eyes(512,380,135)+path('M474 419 H550 L512 454Z')+rect(350,455,325,47,16)+path('M617 494 L671 485 L703 610 L641 620Z')+heart(220,260,.6)+star(805,245,.6))
add('allie-balloons','Balloons',1,heart(290,305,1.1)+ellipse(565,265,105,140)+star(820,305,1.25)+line('M290 355 Q210 485 350 650 M565 405 Q635 560 510 680 M820 383 Q700 520 770 660')+path('M270 365 L310 365 L290 340Z')+path('M545 420 H585 L565 402Z')+circle(235,640,55)+circle(800,620,55))
add('allie-cotton','Cotton Candy',2,sweet(350,380,1)+sweet(735,380,.85)+star(145,175,.5)+heart(760,150,.4))
add('allie-cakes','Little Cakes',2,rect(140,540,745,100,40)+unicorn(310,360,.65)+ellipse(725,365,93,135)+ellipse(725,405,65,81)+eyes(725,335,65)+path('M698 360 H752 L725 385Z')+ellipse(650,468,50,20)+ellipse(800,468,50,20)+heart(512,430,.7))
add('allie-candy','Fruit Candy',2,rect(145,175,735,440,45)+line('M145 240 H880')+path('M235 395 Q250 340 325 340 Q400 340 415 395 L375 535 H275Z')+path('M250 345 L240 297 L300 320 L325 278 L352 320 L410 297 L400 345Z')+circle(560,405,92)+line('M560 313 V497 M468 405 H652 M495 340 L625 470 M625 340 L495 470')+circle(770,410,41)+circle(725,472,41)+circle(815,472,41)+circle(770,534,41)+line('M770 365 Q735 295 804 292')+ellipse(797,320,45,22))
add('allie-ice','Ice Cream',2,path('M190 470 H445 L317 700Z')+path('M180 460 Q160 395 220 365 Q165 315 237 278 Q211 211 280 199 Q276 115 343 120 Q315 188 367 219 Q421 253 389 307 Q463 335 425 385 Q478 426 445 470Z')+line('M225 365 H405 M220 278 H390 M250 470 L356 632 M388 470 L282 630')+rect(660,210,175,310,65)+rect(733,520,30,165,10)+heart(748,367,.6)+star(545,177,.5))
add('allie-princess','Rainbow Princess',3,princess(510,412,.94)+line('M140 380 Q512 -60 880 380 M165 400 Q512 0 855 400 M190 420 Q512 60 830 420')+star(160,555,.65)+heart(850,575,.65))
add('allie-flower-princess','Flower Princess',3,princess(510,415,.94,True)+''.join(rect(x-40,598,80,87,12)+line(f'M{x} 598 V522')+circle(x,493,45)+circle(x,493,18) for x in [155,855])+heart(190,190,.5)+star(840,187,.5))
add('allie-playhouse','Playhouse',3,rect(145,195,735,490,22)+rect(205,250,260,195,8)+line('M335 250 V445 M205 345 H465')+path('M630 490 V285 L735 210 L840 285 V490Z')+rect(681,295,109,105,15)+path('M795 490 Q700 500 675 575 Q650 625 485 625 V670 Q720 690 735 580 Q760 535 850 535Z')+rect(185,515,280,150,20)+''.join(circle(x,y,27) for x,y in [(225,550),(288,547),(355,552),(419,548),(255,612),(322,612),(389,610)])+heart(540,313,.6))
add('allie-park','Playground',3,path('M155 600 L275 225 L395 600Z')+line('M195 465 H355 M230 358 H322')+path('M120 225 H880 V265 H120Z')+line('M370 265 V480 M520 265 V480')+rect(350,480,190,40,10)+path('M610 600 V305 H730 V400 Q870 435 855 570 Q885 615 940 610 V665 Q805 680 793 579 Q795 480 730 460 V600Z')+rect(621,326,96,65,10)+line('M618 485 H718 M618 545 H718')+path('M580 305 L670 185 L755 305Z')+circle(185,665,50)+star(817,133,.65))
for slug,name,level,body in cards:
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768"><title>{name}</title><rect width="1024" height="768" fill="white"/><g fill="white" stroke="black" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">{body}</g></svg>'
 (ROOT/'assets/cards'/f'{slug}.svg').write_text(svg,encoding='utf-8')
gallery=json.loads((ROOT/'gallery.json').read_text(encoding='utf-8'))
new=[dict(id=slug,name=name,imagePath=f'/assets/cards/{slug}.svg',difficultyLevel=level) for slug,name,level,_ in cards]
gallery=new+[c for c in gallery if not c['id'].startswith('allie-')]
(ROOT/'gallery.json').write_text(json.dumps(gallery,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(new)} original Allie pages; {len(gallery)} total')
