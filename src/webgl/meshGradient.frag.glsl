precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uVoid;
uniform vec3 uFog;
uniform vec3 uAccent;

// cheap value noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
  return v;
}

void main(){
  vec2 uv=vUv;
  float t=uTime*0.04;
  float n=fbm(uv*3.0+vec2(t, t*0.6));
  float m=fbm(uv*1.5-vec2(t*0.3, t));
  vec3 col=mix(uVoid, uFog, smoothstep(0.2,0.9,n));
  col=mix(col, uAccent, smoothstep(0.75,0.95,m)*0.35);
  // vignette
  col *= 1.0 - 0.4*length(uv-0.5);
  gl_FragColor=vec4(col,1.0);
  #include <colorspace_fragment>
}
