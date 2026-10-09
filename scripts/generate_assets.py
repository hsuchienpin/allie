"""Generate thirty different closed-outline SVG cards and ten stamps locally."""
import json
from pathlib import Path
from card_designs import cards
ROOT = Path(__file__).resolve().parents[1] / 'wwwroot'
directory = ROOT / 'assets/cards'
directory.mkdir(parents=True, exist_ok=True)
assert len(cards) == 30 and all(sum(c[2] == n for c in cards) == 10 for n in (1, 2, 3))
manifest=[]
for slug,name,level,body in cards:
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768"><title>{name}</title><g stroke="#000" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="#fff">{body}</g></svg>'
    (directory/f'{slug}.svg').write_text(svg, encoding='utf-8')
    english={'playground':'Slide','icecream':'Ice Cream Cart','fruitshop':'Fruit Shop'}
    manifest.append({'id':slug, 'name':english.get(slug,slug.title()), 'imagePath':f'/assets/cards/{slug}.svg', 'difficultyLevel':level})
# Delete only obsolete generated files referenced by the old manifest, within this folder.
old_manifest=ROOT/'gallery.json'
if old_manifest.exists():
    keep={f'{c[0]}.svg' for c in cards}
    for card in json.loads(old_manifest.read_text(encoding='utf-8')):
        old=(ROOT/card['imagePath'].lstrip('/')).resolve()
        if old.parent == directory.resolve() and old.suffix == '.svg' and old.name not in keep:
            old.unlink(missing_ok=True)
(ROOT/'gallery.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')

stamps={
 'star':('星星','M50 5 62 35 95 38 70 60 78 93 50 75 22 93 30 60 5 38 38 35Z'),
 'heart':('愛心','M50 90C-20 45 4-10 50 23C96-10 120 45 50 90Z'),
 'flower':('小花','M50 8C72-5 80 20 72 30C105 22 110 60 80 64C97 95 57 112 50 82C43 112 3 95 20 64C-10 60-5 22 28 30C20 20 28-5 50 8Z'),
 'moon':('月亮','M73 5C-13 5-13 98 73 95C27 75 27 25 73 5Z'),
 'balloon':('氣球','M50 3C5 3 7 62 43 74L37 84H63L57 74C93 62 95 3 50 3ZM48 82H52V100H48Z'),
 'crown':('皇冠','M10 80 5 20 32 44 50 7 68 44 95 20 90 80Z'),
 'bolt':('閃電','M58 2 15 56H44L35 98 86 40H56Z'),
 'leaf':('葉子','M88 6C15 3-6 48 22 77L8 94 16 100 31 85C79 110 98 53 88 6Z'),
 'music':('音符','M45 20 91 5V70C91 95 52 95 52 73C52 61 70 57 81 63V28L45 40V82C45 107 6 107 6 85C6 73 24 69 35 75V24Z'),
 'diamond':('寶石','M24 7H76L98 38 50 96 2 38ZM12 38H88M24 7 35 38 50 96 65 38 76 7')
}
stamp_manifest=[]
for slug,(name,d) in stamps.items():
    (ROOT/'assets/stamps'/f'{slug}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="{d}" fill="#253d3b"/></svg>',encoding='utf-8')
    stamp_manifest.append({'id':slug,'name':slug.title(),'path':f'/assets/stamps/{slug}.svg'})
(ROOT/'stamps.json').write_text(json.dumps(stamp_manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Generated {len(cards)} original cards and {len(stamp_manifest)} stamps.')
import runpy
runpy.run_path(str(Path(__file__).with_name('generate_allie_cards.py')))
