"""Generate original simple schematic movement diagrams and the app's icon assets.
Requires Pillow for PNG icon rendering; SVG exercise diagrams use only the standard library.
These are orientation cues, not medical or individualised form advice.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]/'app'/'assets'
(ROOT/'exercises').mkdir(exist_ok=True)
# Coordinates are for one pose inside a 140 x 160 frame; separate start/end figures.
MOVEMENTS={
'squat': [('standing',0),('squat',1)],
'hinge':[('standing',0),('hinge',1)],
'press':[('bench',0),('bench-press',1)],
'fly':[('fly-wide',0),('fly-close',1)],
'extension':[('standing-bent',0),('standing-raised',1)],
'lunge':[('standing',0),('lunge',1)],
'curl':[('standing',0),('curl',1)],
'pull':[('pulldown-up',0),('pulldown-down',1)],
'row':[('row-long',0),('row-pull',1)],
'ohp':[('overhead-low',0),('overhead-high',1)],
'raise':[('standing',0),('side-raise',1)],
'pushdown':[('curl',0),('standing',1)],
'calf':[('standing',0),('calf-up',1)],
'core':[('plank',0),('plank',1)],
'carry':[('standing',0),('standing',1)],
'hip-thrust':[('hip-low',0),('hip-high',1)],
'thrust':[('hip-low',0),('hip-high',1)],
}
# Each pose: head (cx,cy); torso from shoulders -> hips; left/right arms and legs as polyline lists.
def pose(kind):
    p={
      'standing':((70,38),[(70,51),(70,92)], [[(70,56),(46,80),(43,106)],[(70,56),(96,79),(99,106)]], [[(70,92),(54,120),(51,145)],[(70,92),(89,120),(91,145)]]),
      'squat':((71,53),[(71,66),(62,107)], [[(69,72),(47,82),(48,103)],[(69,72),(96,84),(97,105)]], [[(62,107),(44,119),(32,143)],[(62,107),(92,119),(102,143)]]),
      'hinge':((111,65),[(99,75),(56,96)], [[(95,79),(107,111),(111,132)],[(90,82),(91,110),(98,131)]], [[(56,96),(53,123),(50,145)],[(56,96),(80,120),(83,144)]]),
      'bench':((30,103),[(43,104),(102,104)], [[(58,100),(61,74),(54,53)],[(58,100),(97,76),(99,54)]], [[(102,104),(115,123),(116,143)],[(102,104),(95,122),(95,141)]]),
      'bench-press':((30,103),[(43,104),(102,104)], [[(58,100),(57,69),(57,38)],[(58,100),(103,67),(103,38)]], [[(102,104),(115,123),(116,143)],[(102,104),(95,122),(95,141)]]),
      'fly-wide':((70,48),[(70,60),(70,106)], [[(70,62),(41,73),(17,88)],[(70,62),(100,73),(124,88)]], [[(70,106),(54,126),(51,147)],[(70,106),(88,127),(92,147)]]),
      'fly-close':((70,48),[(70,60),(70,106)], [[(70,62),(56,74),(65,78)],[(70,62),(84,74),(75,78)]], [[(70,106),(54,126),(51,147)],[(70,106),(88,127),(92,147)]]),
      'standing-bent':((70,35),[(70,48),(70,92)], [[(70,53),(45,78),(58,98)],[(70,53),(96,76),(85,98)]], [[(70,92),(55,120),(55,145)],[(70,92),(87,120),(87,145)]]),
      'standing-raised':((70,35),[(70,48),(70,92)], [[(70,53),(55,37),(53,14)],[(70,53),(85,37),(87,14)]], [[(70,92),(55,120),(55,145)],[(70,92),(87,120),(87,145)]]),
      'lunge':((70,34),[(70,47),(70,90)], [[(70,54),(51,73),(47,92)],[(70,54),(92,72),(97,92)]], [[(70,90),(97,112),(110,140)],[(70,90),(46,112),(39,140)]]),
      'curl':((70,35),[(70,48),(70,92)], [[(70,55),(47,77),(60,69)],[(70,55),(95,77),(82,69)]], [[(70,92),(56,120),(55,145)],[(70,92),(87,120),(87,145)]]),
      'pulldown-up':((70,50),[(70,64),(70,108)], [[(70,69),(42,42),(38,15)],[(70,69),(98,42),(102,15)]], [[(70,108),(52,127),(45,147)],[(70,108),(89,127),(97,147)]]),
      'pulldown-down':((70,50),[(70,64),(70,108)], [[(70,69),(42,72),(45,90)],[(70,69),(98,72),(95,90)]], [[(70,108),(52,127),(45,147)],[(70,108),(89,127),(97,147)]]),
      'row-long':((70,37),[(70,50),(70,92)], [[(70,57),(39,80),(20,96)],[(70,57),(101,80),(120,96)]], [[(70,92),(50,117),(48,141)],[(70,92),(90,117),(92,141)]]),
      'row-pull':((70,37),[(70,50),(70,92)], [[(70,57),(49,73),(64,87)],[(70,57),(91,73),(77,87)]], [[(70,92),(50,117),(48,141)],[(70,92),(90,117),(92,141)]]),
      'overhead-low':((70,38),[(70,51),(70,91)], [[(70,55),(45,75),(49,52)],[(70,55),(95,75),(91,52)]], [[(70,91),(54,119),(54,147)],[(70,91),(87,119),(88,147)]]),
      'overhead-high':((70,38),[(70,51),(70,91)], [[(70,55),(53,37),(53,13)],[(70,55),(87,37),(87,13)]], [[(70,91),(54,119),(54,147)],[(70,91),(87,119),(88,147)]]),
      'side-raise':((70,38),[(70,51),(70,91)], [[(70,55),(44,50),(18,43)],[(70,55),(97,50),(122,43)]], [[(70,91),(54,119),(54,147)],[(70,91),(87,119),(88,147)]]),
      'calf-up':((70,28),[(70,41),(70,81)], [[(70,46),(46,69),(43,96)],[(70,46),(96,69),(99,96)]], [[(70,81),(54,109),(54,136)],[(70,81),(87,109),(88,136)]]),
      'plank':((35,95),[(48,100),(103,93)], [[(55,102),(62,127),(83,128)],[(55,102),(70,124),(88,124)]], [[(103,93),(116,111),(120,121)],[(103,93),(129,107),(132,120)]]),
      'hip-low':((38,99),[(50,107),(85,113)], [[(57,107),(63,124),(80,124)],[(57,107),(74,117),(89,121)]], [[(85,113),(99,130),(102,147)],[(85,113),(119,127),(119,146)]]),
      'hip-high':((38,82),[(50,90),(85,85)], [[(57,90),(63,124),(80,124)],[(57,90),(74,117),(89,121)]], [[(85,85),(99,117),(102,143)],[(85,85),(119,116),(119,143)]])
    }
    return p[kind]
def person(kind,dx=0):
    (hx,hy),torso,arms,legs=pose(kind)
    def poly(coords,stroke='#284a42',sw=6):return f'<polyline points="{" ".join(f"{x+dx},{y}" for x,y in coords)}" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"/>'
    s=f'<circle cx="{hx+dx}" cy="{hy}" r="10" fill="#d0e3d6" stroke="#284a42" stroke-width="3"/>'
    s+=poly(torso,sw=9)
    for pts in legs:s+=poly(pts,sw=6)
    for pts in arms:s+=poly(pts,sw=6)
    if kind.startswith('bench'):
        s+=f'<path d="M{20+dx} 112h112" stroke="#abbfb1" stroke-width="6" stroke-linecap="round"/>'
    if kind.startswith('pulldown'):
        s+=f'<path d="M{27+dx} 12h86" stroke="#c18a66" stroke-width="5" stroke-linecap="round"/>'
    if kind.startswith('overhead'):
        y=47 if kind.endswith('low') else 13
        s+=f'<path d="M{40+dx} {y}h60" stroke="#b37b56" stroke-width="4" stroke-linecap="round"/>'
    return s
for name,positions in MOVEMENTS.items():
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 184" role="img" aria-label="Two positions for {name} movement"><rect width="340" height="184" rx="16" fill="#f1f7f2"/><rect x="7" y="7" width="155" height="170" rx="12" fill="#fbfdfb"/><rect x="178" y="7" width="155" height="170" rx="12" fill="#fbfdfb"/>{person(positions[0][0],14)}{person(positions[1][0],184)}<path d="M166 89h8m-4-4 4 4-4 4" fill="none" stroke="#70aa8e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'''
    (ROOT/'exercises'/f'{name}.svg').write_text(svg)
# A single editable icon source, tinted at build time.
(ROOT/'icon.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#ACCENT#"/><path d="M124 169h260M124 254h260M140 340h232" stroke="white" stroke-width="27" stroke-linecap="round" opacity=".3"/><path d="M129 312l82-79 65 34 104-112" fill="none" stroke="white" stroke-width="35" stroke-linecap="round" stroke-linejoin="round"/><path d="M319 153h61v61" fill="none" stroke="white" stroke-width="35" stroke-linecap="round" stroke-linejoin="round"/></svg>''')
for channel,color in [('prod',(181,51,71)),('dev',(36,87,173))]:
    for size in [32,180,192,512]:
        scale=4 if size<200 else 2
        N=size*scale
        im=Image.new('RGB',(N,N),'white');d=ImageDraw.Draw(im)
        # Rounded-square colored tile
        radius=round(N*110/512)
        d.rounded_rectangle((0,0,N-1,N-1),radius=radius,fill=color)
        def pts(seq):return [(round(x*N/512),round(y*N/512)) for x,y in seq]
        sw=round(32*N/512)
        for y in [169,254,340]:d.line(pts([(130,y),(380,y)]),fill=(*([255]*3),70),width=round(18*N/512),joint='curve')
        d.line(pts([(129,312),(211,233),(276,267),(380,155)]),fill='white',width=sw,joint='curve')
        for x,y in [(129,312),(211,233),(276,267),(380,155)]:
            rr=sw/2;cx=x*N/512;cy=y*N/512;d.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),fill='white')
        d.line(pts([(319,155),(380,155),(380,214)]),fill='white',width=sw,joint='curve')
        im.resize((size,size),Image.Resampling.LANCZOS).save(ROOT/f'icon-{channel}-{size}.png',optimize=True)
print(f'Created {len(MOVEMENTS)} exercise illustrations and both sets of PNG icons.')
