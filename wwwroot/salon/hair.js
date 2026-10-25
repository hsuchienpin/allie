(function () {
  'use strict';
  const C = SalonCore, makeCanvas = (w = 1200, h = 1440) => Object.assign(document.createElement('canvas'), {width:w, height:h});
  const face = new Image(), hair = new Image(), jewels = new Image(), source = makeCanvas();
  let loaded = false, engine, alpha;
  function load(image, url) {
    return new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Unable to load ' + url)); image.src = url; });
  }
  const ready = Promise.all([load(face, 'assets/princess-face.png'), load(hair, 'assets/princess-hair.png'), load(jewels, 'assets/princess-jewels.png')]).then(() => {
    const ctx = source.getContext('2d', {willReadFrequently:true});
    ctx.scale(2,2);
    ctx.drawImage(hair,42,35,516,619.2);
    alpha = ctx.getImageData(0,0,1200,1440).data;
    C.setHairVisibility((strand,t) => {
      const p = C.sourcePoint(strand,t), y = Math.round(p.y);
      return [-.4,0,.4].some(offset => {
        const x = Math.round(p.x + strand.width * offset);
        return x >= 0 && x < 600 && y >= 0 && y < 720 && alpha[(y*2*1200+x*2)*4+3] > 40;
      });
    });
    loaded = true;
  });
  function vertex(x,y,u,v,opacity=1) { return [x,y,u/600,v/720,opacity]; }
  function quad(vertices,a,b,c,d) { vertices.push(...a,...b,...c,...a,...c,...d); }
  function mesh(state,motion,chips) {
    const out = [];
    quad(out,vertex(42,35,42,35),vertex(558,35,558,35),vertex(558,130,558,130),vertex(42,130,42,130));
    function ribbon(s,from,to,bend,style,dx=0,dy=0,opacity=1) {
      const steps = Math.max(1,Math.ceil((to-from)*28)), half = s.width/2;
      for(let i=0;i<steps;i++) {
        const t0=from+(to-from)*i/steps,t1=from+(to-from)*(i+1)/steps;
        const u=C.sourcePoint(s,t0),v=C.sourcePoint(s,t1);
        const a=C.deformedPoint(state,motion,u.x-half,u.y),b=C.deformedPoint(state,motion,u.x+half,u.y),
          c=C.deformedPoint(state,motion,v.x+half,v.y),d=C.deformedPoint(state,motion,v.x-half,v.y);
        quad(out,vertex(a.x+dx,a.y+dy,u.x-half,u.y,opacity),vertex(b.x+dx,b.y+dy,u.x+half,u.y,opacity),
          vertex(c.x+dx,c.y+dy,v.x+half,v.y,opacity),vertex(d.x+dx,d.y+dy,v.x-half,v.y,opacity));
      }
    }
    for(const s of C.template) ribbon(s,0,state.lengths[s.id],motion[s.id]?.bend||0,state.styles[s.id]);
    for(const p of chips||[]) ribbon(p.strand,p.from,p.to,p.bend,p.style,p.dx,p.dy,Math.max(0,1-p.age/1.2));
    return new Float32Array(out);
  }
  class HairLayer {
    constructor() {
      this.canvas=makeCanvas(); this.cache=''; this.lost=false;
      const gl=this.canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:true});
      if(gl) {
        try { this.initGL(gl); } catch (_) { this.gl=null; }
        this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;this.cache='';});
        this.canvas.addEventListener('webglcontextrestored',()=>{try{this.initGL(gl);this.lost=false;this.cache='';}catch(_){this.gl=null;}});
      }
      // A complete 2D path also runs on devices where WebGL is unavailable/lost.
      this.fallback=makeCanvas();this.flat=this.fallback.getContext('2d');this.tint=makeCanvas();
    }
    initGL(gl) {
      this.gl=gl;
      const shader=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Hair shader');return s;};
      const program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;attribute vec2 uv;attribute float opacity;varying vec2 v;varying float a;void main(){gl_Position=vec4(p.x/300.0-1.0,1.0-p.y/360.0,0.0,1.0);v=uv;a=opacity;}'));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D tex;uniform vec3 dye;uniform float colored;varying vec2 v;varying float a;void main(){vec4 c=texture2D(tex,v);float l=dot(c.rgb,vec3(.299,.587,.114));vec3 tinted=dye*(.3+.7*l)+vec3(pow(l,9.0)*.19);gl_FragColor=vec4(mix(c.rgb,tinted,colored),c.a*a);}'));
      gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Hair program');
      gl.useProgram(program);this.program=program;this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
      for(const [name,size,offset] of [['p',2,0],['uv',2,8],['opacity',1,16]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,20,offset);}
      gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.viewport(0,0,1200,1440);
    }
    render2D(vertices,color) {
      const ctx=this.flat;
      if(this.tintColor!==color[0]) {
        const t=this.tint.getContext('2d');t.clearRect(0,0,1200,1440);t.drawImage(source,0,0);
        if(color[0]!=='gold') {
          const pixels=t.getImageData(0,0,1200,1440),rgb=[1,3,5].map(i=>parseInt(color[2].slice(i,i+2),16));
          for(let i=0;i<pixels.data.length;i+=4){
            const d=pixels.data,l=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)/255,shine=Math.pow(l,9)*.19*255;
            for(let channel=0;channel<3;channel++)d[i+channel]=rgb[channel]*(.3+.7*l)+shine;
          }
          t.putImageData(pixels,0,0);
        }
        this.tintColor=color[0];
      }
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1200,1440);
      // Piecewise affine triangles match the GPU mesh, including shared edges.
      for(let i=0;i<vertices.length;i+=15) {
        const p=[0,5,10].map(k=>({x:vertices[i+k],y:vertices[i+k+1],u:vertices[i+k+2]*600,v:vertices[i+k+3]*720}));
        const du1=p[1].u-p[0].u,dv1=p[1].v-p[0].v,du2=p[2].u-p[0].u,dv2=p[2].v-p[0].v,det=du1*dv2-du2*dv1;
        if(Math.abs(det)<.001)continue;
        const dx1=p[1].x-p[0].x,dy1=p[1].y-p[0].y,dx2=p[2].x-p[0].x,dy2=p[2].y-p[0].y;
        const a=(dx1*dv2-dx2*dv1)/det,b=(dy1*dv2-dy2*dv1)/det,c=(dx2*du1-dx1*du2)/det,d=(dy2*du1-dy1*du2)/det;
        ctx.save();ctx.setTransform(2,0,0,2,0,0);ctx.globalAlpha=vertices[i+4];
        const center={x:(p[0].x+p[1].x+p[2].x)/3,y:(p[0].y+p[1].y+p[2].y)/3};
        const edge=p.map(q=>{const dx=q.x-center.x,dy=q.y-center.y,length=Math.hypot(dx,dy)||1;return{x:q.x+dx/length*.8,y:q.y+dy/length*.8};});
        ctx.beginPath();ctx.moveTo(edge[0].x,edge[0].y);ctx.lineTo(edge[1].x,edge[1].y);ctx.lineTo(edge[2].x,edge[2].y);ctx.closePath();ctx.clip();
        ctx.transform(a,b,c,d,p[0].x-a*p[0].u-c*p[0].v,p[0].y-b*p[0].u-d*p[0].v);ctx.drawImage(this.tint,0,0,600,720);ctx.restore();
      }
      ctx.globalAlpha=1;
      return this.fallback;
    }
    draw(ctx,state,motion,chips) {
      const key=JSON.stringify([state.lengths,state.styles,state.hairColor,motion.map(m=>Math.round(m.bend*100)/100),chips]);
      if(key!==this.cache) {
        const data=mesh(state,motion,chips),color=C.hairColors.find(c=>c[0]===state.hairColor)||C.hairColors[0];
        if(this.gl&&!this.lost) {
          const gl=this.gl;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);
          gl.uniform3fv(gl.getUniformLocation(this.program,'dye'),[1,3,5].map(i=>parseInt(color[2].slice(i,i+2),16)/255));
          gl.uniform1f(gl.getUniformLocation(this.program,'colored'),color[0]==='gold'?0:1);
          gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,data.length/5);this.output=this.canvas;
        } else this.output=this.render2D(data,color);
        this.cache=key;
      }
      ctx.drawImage(this.output,0,0,600,720);
    }
  }
  const jewelIds=['tiara','royal','flowers','bow','butterfly','rose','pearls','stars','hearts','pearl','ruby','moon'];
  function jewel(ctx,id,x,y,w,h) {
    const index=jewelIds.indexOf(id);if(!loaded||index<0)return;
    const row=Math.floor(index/3),col=index%3,rows=[[85,378],[432,740],[766,1030],[1050,1350]];
    ctx.drawImage(jewels,col*362,rows[row][0],362,rows[row][1]-rows[row][0],x,y,w,h);
  }
  window.SalonHair={ready,get loaded(){return loaded;},face,jewel,
    draw(ctx,state,motion,chips){if(!loaded)return;engine ||= new HairLayer();engine.draw(ctx,state,motion,chips);}};
})();
