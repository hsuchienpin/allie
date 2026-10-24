(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DollCatalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const list = (names) => names.split('|').map((label, id) => ({ id, label }));
  const items = {
    gender: list('男生|女生|不指定'),
    height: list('很矮|稍矮|中等|稍高|很高'),
    body: list('纖細型|中等型|圓潤型|結實型'),
    skin: list('白皙色|淺膚色|中淺膚色|小麥色|古銅色|棕色|深棕色|深膚色'),
    hair: list('平頭|圓短髮|齊瀏海短髮|側分短髮|刺刺短髮|短捲髮|鮑伯頭|齊肩直髮|齊肩捲髮|長直髮|長波浪髮|蓬鬆捲髮|高馬尾|低馬尾|雙馬尾|單辮子|雙辮子|丸子頭|雙丸子頭|無頭髮'),
    eyes: list('圓眼|大圓眼|橢圓眼|杏仁眼|細長眼|下垂眼|微上揚眼|笑瞇瞇眼|星星眼|愛心眼'),
    glasses: list('不戴眼鏡|圓框眼鏡|方框眼鏡|橢圓框眼鏡|大框眼鏡|半框眼鏡|星星造型眼鏡|愛心造型眼鏡|太陽眼鏡'),
    nose: list('小圓鼻|小點鼻|小三角鼻|短鼻|長鼻|寬鼻|翹鼻|圓潤鼻'),
    mouth: list('閉嘴微笑|開口微笑|露齒大笑|小小平嘴|圓形驚訝嘴|嘟嘴|彎彎笑嘴|露出小虎牙|缺一顆門牙的笑容|吐舌頭'),
    ears: list('小圓耳|中圓耳|大圓耳|貼近頭部的耳朵|向外展開的耳朵|精靈尖耳'),
    earrings: list('不戴耳飾|小圓點耳飾|星星耳飾|愛心耳飾|花朵耳飾|蝴蝶耳飾|水果耳飾|小圓環耳飾'),
    necklace: list('不戴項鍊|細鍊|彩色串珠項鍊|星星吊墜項鍊|愛心吊墜項鍊|月亮吊墜項鍊|花朵吊墜項鍊|貝殼項鍊|彩虹吊墜項鍊|動物吊墜項鍊'),
    top: list('短袖 T 恤|長袖 T 恤|條紋上衣|拼色上衣|Polo 衫|襯衫|荷葉邊上衣|大學 T|連帽上衣|針織毛衣|運動上衣|棒球上衣|背心搭配內衣|牛仔外套搭配 T 恤|棒球外套搭配 T 恤|雨衣外套搭配內衣'),
    bottom: list('短褲|五分褲|休閒長褲|牛仔長褲|運動長褲|寬褲|工裝褲|內搭褲|A 字短裙|百褶裙|蓬蓬裙|長裙'),
    outfit: list('分開搭配|短袖洋裝|長袖洋裝|背心洋裝|吊帶褲|吊帶裙|連身工作服|運動套裝|睡衣套裝|公主裝|王子裝|太空人裝|魔法師裝|超級英雄裝|恐龍連身裝|兔子連身裝|小熊連身裝'),
    shoes: list('不穿鞋|帆布鞋|運動鞋|魔鬼氈鞋|高筒球鞋|休閒便鞋|包頭涼鞋|涼鞋|拖鞋|雨靴|短靴|長靴|圓頭皮鞋|角色造型室內鞋')
  };
  const categories = [
    { id:'gender', label:'性別', icon:'person', hint:'每一種造型，都可以自由搭配。' },
    { id:'height', label:'身高', icon:'ruler', hint:'選一個喜歡的高度吧。' },
    { id:'body', label:'體型', icon:'body', hint:'每一種身形，都有自己的可愛。' },
    { id:'skin', label:'膚色', icon:'palette', hint:'選一個溫暖的膚色。' },
    { id:'hair', label:'髮型', icon:'hair', palette:'hair', hint:'短短的、捲捲的，還是綁起來？' },
    { id:'eyes', label:'眼睛・眼鏡', icon:'eyes', parts:[['eyes','眼睛'],['glasses','眼鏡']], hint:'一雙眼睛，藏著好多小故事。' },
    { id:'nose', label:'鼻子', icon:'nose', hint:'小小的變化，也很有個性。' },
    { id:'mouth', label:'嘴巴', icon:'smile', hint:'今天的你，想露出什麼表情？' },
    { id:'ears', label:'耳朵・耳飾', icon:'ear', parts:[['ears','耳朵'],['earrings','耳飾']], hint:'添上一對小小的驚喜。' },
    { id:'necklace', label:'項鍊', icon:'necklace', palette:'jewelry', hint:'把喜歡的小東西，戴在身上。' },
    { id:'top', label:'上半身', icon:'shirt', palette:'top', hint:'挑一件今天想穿的上衣。' },
    { id:'bottom', label:'下半身', icon:'pants', palette:'bottom', hint:'褲子、裙子，怎麼搭都可以。' },
    { id:'outfit', label:'全身裝', icon:'dress', palette:'outfit', hint:'換上整套服裝，變成故事的主角。' },
    { id:'shoes', label:'鞋子', icon:'shoe', palette:'shoes', hint:'穿好鞋，一起去冒險。' }
  ];
  const skinColors = ['#f8ddc7','#edc8a6','#ddb38d','#cc9d74','#b8835e','#a16e4e','#83543e','#603e32'];
  const palettes = {
    hair: ['#49362f','#70513d','#a5794e','#d4ad69','#a45c45','#d3d1c8','#d994a2','#9d85b7','#789aaf','#7d9c85'],
    eyes: ['#40332e','#5b3d2d','#916a42','#6b91a3','#6c8a67','#839092','#9a80a5'],
    glasses: ['#524239','#856b4c','#bc706d','#d7b353','#7897a3','#9984ac','#d296a7'],
    top: ['#9cae95','#d99485','#c3adcc','#e1bd6d','#8bafbe','#dfadba','#eee3cb','#6d829c'],
    bottom: ['#a0b2bf','#bc8b7b','#b3a1bd','#6e886c','#d2ae69','#ddd1b8','#d59caa','#727b8b'],
    outfit: ['#d79a88','#a0ae95','#b5a2c4','#deb96c','#8dabbc','#d4a3b5','#e4d6bc','#758ca3'],
    shoes: ['#b57d69','#e8dcc8','#899f81','#b798b1','#6d8296','#d6b25f','#cc919c','#544941'],
    jewelry: ['#d2aa55','#bbc2c4','#d68f94','#9b88b5','#80a696','#8daec1','#f2d7a0','#eee2cf']
  };
  const patterns = list('素色|條紋|格紋|圓點|星星|愛心|彩虹|恐龍|貓咪|狗狗|水果');
  const defaults = {
    gender:2, height:2, body:1, skin:1, hair:16, eyes:0, glasses:0, nose:0, mouth:0,
    ears:1, earrings:0, necklace:0, top:6, bottom:9, outfit:0, shoes:1,
    colors:{hair:1,eyes:1,glasses:0,top:0,bottom:0,outfit:0,shoes:0,jewelry:0},
    patterns:{top:0,bottom:0,outfit:0}
  };
  return { items, categories, palettes, skinColors, patterns, defaults };
});
