(this["webpackJsonpclose-frontend"]=this["webpackJsonpclose-frontend"]||[]).push([[0],{184:function(e,t,n){e.exports=n.p+"static/media/logo.dba46384.png"},202:function(e,t,n){e.exports=n(341)},207:function(e,t,n){},307:function(e,t,n){},341:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),o=n(45),c=n.n(o),i=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,357)).then((function(t){var n=t.getCLS,a=t.getFID,r=t.getFCP,o=t.getLCP,c=t.getTTFB;n(e),a(e),r(e),o(e),c(e)}))},l=n(163),u=n(86),s=n(20),v=(n(207),n(208),n(15)),m=n(16),h=n(18),p=n(17),f=n(353),b=n(355),d=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(){return Object(v.a)(this,n),t.apply(this,arguments)}return Object(m.a)(n,[{key:"render",value:function(){return r.a.createElement(b.a,{style:{marginTop:"15px",marginLeft:"14mm"},size:"huge",inverted:this.props.inverted,subheader:this.props.subheader},this.props.children)}}]),n}(r.a.Component),E=(n(307),n(356)),y=n(87),O=n(115),g=function(){function e(){Object(v.a)(this,e)}return Object(m.a)(e,null,[{key:"rest",value:function(e){var t=this;return new Promise((function(n){fetch("".concat(t.host).concat(e),{headers:{Authorization:"Basic YWRtaW46c21hcnRob21l"}}).then((function(t){switch(t.status){case 200:return t.json();case 403:return console.error("Forbidden: ".concat(e)),void n();default:return console.error(t.status,t.text()),void n()}})).then((function(e){0!==e.error?(console.error(e.message),n()):n(e.data)})).catch((function(e){console.error(e),n()}))}))}},{key:"layoutList",value:function(){var e=this;return new Promise((function(t){e.rest("layout/list").then(t)}))}},{key:"layoutGet",value:function(e){var t=this;return new Promise((function(n){t.rest("layout/get?q=".concat(encodeURIComponent(e))).then(n)}))}},{key:"varList",value:function(){var e=this;return new Promise((function(t){e.rest("var/list").then(t)}))}},{key:"varGet",value:function(e){var t=this;return new Promise((function(n){t.rest("var/get?q=".concat(encodeURIComponent(e))).then(n)}))}},{key:"varSet",value:function(e,t){var n=this,a=arguments.length>2&&void 0!==arguments[2]&&arguments[2];return new Promise((function(r){n.rest("var/set?q=".concat(encodeURIComponent(e),"&v=").concat(encodeURIComponent(t),"&f=").concat(a?1:0)).then(r)}))}},{key:"varSubConnected",value:function(){return void 0!==this.subConnection&&null!==this.subConnection&&this.subConnection.readyState===this.subConnection.OPEN}},{key:"varSubConnect",value:function(){var e=this;return new Promise((function(t){e.varSubConnected()?t((function(e){})):(e.subConnection=new EventSource("".concat(e.host,"var/sub"),{withCredentials:!0}),e.varList().then((function(n){var a,r=Object(O.a)(n);try{var o=function(){var t=c=a.value;e.subConnection.addEventListener(c,(function(n){if(void 0!==e.varCb[t]){var a,r=Object(O.a)(e.varCb[t]);try{for(r.s();!(a=r.n()).done;){(0,a.value)(n.data)}}catch(o){r.e(o)}finally{r.f()}}console.log("".concat(t," -> ").concat(n.data))}))};for(r.s();!(a=r.n()).done;){var c;o()}}catch(i){r.e(i)}finally{r.f()}t((function(t){return e.subConnection.close()}))})))}))}},{key:"varSub",value:function(e,t){var n=this;void 0===this.varCb[e]&&(this.varCb[e]=[]);var a=this.varCb[e].push(t)-1;return function(t){return n.varCb[e][a]=void 0}}},{key:"setup",value:function(){var e=this;return new Promise((function(t){e.rest("setup").then(t)}))}}]),e}();g.host="/api/",g.varCb={};var k=g,j=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={value:0,last:0},a.props.var||console.error("CSlider: No var given"),a}return Object(m.a)(n,[{key:"componentDidMount",value:function(){var e=this;k.varGet(this.props.var).then((function(t){return e.setState({value:parseFloat(t),last:parseFloat(t)})})),this.closeSub=k.varSub(this.props.var,(function(t){return e.setState({value:parseFloat(t),last:parseFloat(t)})}))}},{key:"componentWillUnmount",value:function(){this.closeSub()}},{key:"startSend",value:function(){var e=this;this.send(),this.int=setInterval((function(t){return e.send()}),this.props.interval||500)}},{key:"stopSend",value:function(){this.int&&clearInterval(this.int)}},{key:"send",value:function(){this.props.var&&this.state.value!==this.state.last&&(k.varSet(this.props.var,this.state.value,this.props.forceSend),this.setState({last:this.state.value}))}},{key:"render",value:function(){var e=this,t=Math.pow(10,this.props.labelPrecision||0),n=this.props.min||0,a=this.props.max||100,o=(this.state.value-n)/(a-n)*100,c={WebkitAppearance:"none",background:"linear-gradient(to right, #9f35cc 0%, #b75bde ".concat(o,"%, #fff ").concat(o,"%, #fff 100%)"),width:"300px",height:"5px"};return r.a.createElement(r.a.Fragment,null,r.a.createElement("div",{className:"csliderroot"},this.props.rating?r.a.createElement(E.a,{icon:"star",maxRating:"10",clearable:!0,onRate:function(t,n){var a=n.rating,r=n.maxRating;return e.send(a/r)}},r.a.createElement("i",null,"hello")):r.a.createElement("input",{type:"range",className:"cslider",style:c,value:this.state.value,min:n,max:a,step:this.props.step||"any",onScroll:function(e){return console.log(e)},onMouseDown:function(t){return e.startSend()},onPointerDown:function(t){return e.startSend()},onMouseUp:function(t){return e.stopSend()},onPointerUp:function(t){return e.stopSend()},onChange:function(t){return e.setState({value:t.target.value})}}),!this.props.hideLabel&&r.a.createElement(y.a,null,(this.props.labelConv||function(e){return"".concat(e,"%")})(Math.round((o+Number.EPSILON)*t)/t))))}}]),n}(r.a.Component),S=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={},a.props.var||console.error("CButton: No var given"),a.props.value||console.error("CButton: No value given"),a}return Object(m.a)(n,[{key:"render",value:function(){var e=this;return r.a.createElement(r.a.Fragment,null,r.a.createElement(f.a,{style:{color:"#9f35cc"},icon:this.props.icon,onClick:function(t){return k.varSet(e.props.var,e.props.value,e.props.forceSend)}},this.props.content||this.props.children))}}]),n}(r.a.Component),C=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={value:0},a.props.var||console.error("CText: No var given"),a}return Object(m.a)(n,[{key:"componentDidMount",value:function(){var e=this;k.varGet(this.props.var).then((function(t){return e.setState({value:t})})),this.closeSub=k.varSub(this.props.var,(function(t){return e.setState({value:t})}))}},{key:"componentWillUnmount",value:function(){this.closeSub()}},{key:"render",value:function(){return r.a.createElement(r.a.Fragment,null,this.state.value)}}]),n}(r.a.Component),w=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={},a}return Object(m.a)(n,[{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(d,null,"Home"),r.a.createElement("p",null,"Balken Helligkeit"),r.a.createElement(j,{var:"balken_brightness"}),r.a.createElement("p",null,"Balken Schalter"),r.a.createElement(j,{var:"balken_switch",min:0,max:1,step:1,labelConv:function(e){return e>=.5?"On":"Off"}}),r.a.createElement("p",null,"Klotz Farbe"),r.a.createElement(j,{var:"klotz_hue",max:360}),r.a.createElement("p",null,"Klotz S\xe4ttigung"),r.a.createElement(j,{var:"klotz_saturation"}),r.a.createElement("p",null,"Klotz Helligkeit"),r.a.createElement(j,{var:"klotz_brightness"}),r.a.createElement("p",null,"R\xf6hre (Verbraucht ",r.a.createElement(C,{var:"m_stecki_sensor"}),"W)"),r.a.createElement(j,{var:"m_stecki_switch",min:0,max:1,step:1,labelConv:function(e){return e>=.5?"On":"Off"}}),r.a.createElement("p",null,"Rollladen"),r.a.createElement(f.a.Group,{secondary:!0},r.a.createElement(S,{forceSend:!0,var:"m_rolli",value:100,icon:"chevron up"}),r.a.createElement(S,{forceSend:!0,var:"m_rolli",value:"STOP",icon:"stop circle"}),r.a.createElement(S,{forceSend:!0,var:"m_rolli",value:0,icon:"chevron down"})),r.a.createElement("p",null,"Lucas Stecki (Verbraucht ",r.a.createElement(C,{var:"l_stecki_sensor"}),"W)"),r.a.createElement(j,{var:"l_stecki_switch",min:0,max:1,step:1,labelConv:function(e){return e>=.5?"On":"Off"}}),r.a.createElement("p",null,"Lucas Rolli"),r.a.createElement(f.a.Group,{secondary:!0},r.a.createElement(S,{forceSend:!0,var:"l_rolli",value:100,icon:"chevron up"}),r.a.createElement(S,{forceSend:!0,var:"l_rolli",value:"STOP",icon:"stop circle"}),r.a.createElement(S,{forceSend:!0,var:"l_rolli",value:0,icon:"chevron down"})))}}]),n}(r.a.Component),x=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={},a}return Object(m.a)(n,[{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(d,null,"Layout"))}}]),n}(r.a.Component),P=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={},a}return Object(m.a)(n,[{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(d,null,"Pages"))}}]),n}(r.a.Component),_=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={},a}return Object(m.a)(n,[{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(d,null,"Variables"))}}]),n}(r.a.Component),F=n(170),I=n.n(F),L=n(349),R=n(59),z=n(351),B=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={},a}return Object(m.a)(n,[{key:"render",value:function(){this.props.windowWidth;return r.a.createElement("div",null,r.a.createElement(d,null,"Settings"),r.a.createElement(L.a,null,r.a.createElement(y.a,null,r.a.createElement(R.a,{name:"columns"}),"Homepage"),r.a.createElement(z.a,{labeled:!0,options:[{text:"a",value:"a"}]})))}}]),n}(r.a.Component),H=I()(B),W=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={},a}return Object(m.a)(n,[{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(d,null,"About"))}}]),n}(r.a.Component),N=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(){return Object(v.a)(this,n),t.apply(this,arguments)}return Object(m.a)(n,[{key:"render",value:function(){return r.a.createElement("div",{style:{backgroundColor:"#000",position:"fixed",top:"0",left:"0",minWidth:"100vw",minHeight:"100vh",color:"#fff",textAlign:"center"}},r.a.createElement("h1",null,"404!"))}}]),n}(r.a.Component),A=n(41),M=n(352),U=n(354),T=n(189),D=n(181),G=n(184),V=n.n(G),q=function(e){Object(h.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(v.a)(this,n),(a=t.call(this,e)).state={setup:{},sidebar:"1"===(localStorage.getItem("sidebar")||"1")},a}return Object(m.a)(n,[{key:"componentDidMount",value:function(){var e=this;k.setup().then((function(t){return e.setState({setup:t||{}})}))}},{key:"toggleSidebar",value:function(){var e=this;this.setState({sidebar:!this.state.sidebar},(function(t){localStorage.setItem("sidebar",e.state.sidebar?"1":"0")}))}},{key:"render",value:function(){var e=this,t=document.location.pathname,n={position:"fixed",top:0,left:0,minWidth:"100vw",minHeight:"100vh"},a=Object(A.a)(Object(A.a)({},n),{},{backgroundColor:"#ddd"}),o={position:"fixed",top:"2mm",left:"2mm",zIndex:10,backgroundColor:"#9f35ccb0",transition:"opacity 1s"},c=Object(A.a)({},o),i=Object(A.a)(Object(A.a)({},o),{},{opacity:this.state.sidebar?0:1});return r.a.createElement(r.a.Fragment,null,r.a.createElement(D.a,null,r.a.createElement("title",null,this.state.setup.name||"closedHAB")),r.a.createElement(M.a.Pushable,{style:Object(A.a)(Object(A.a)({},n),{},{overflow:"hidden"})},r.a.createElement(M.a,{width:"thin",animation:"slide out",inverted:!0,vertical:!0,visible:this.state.sidebar,as:U.a},r.a.createElement(f.a,{style:c,size:"tiny",circular:!0,icon:"x",onClick:function(t){return e.toggleSidebar()}}),r.a.createElement(U.a.Header,null,r.a.createElement(b.a,{inverted:!0,textAlign:"center",style:{marginTop:"12mm",marginBottom:"10px"}},r.a.createElement(T.a,{src:V.a}),r.a.createElement("br",null),"closedHAB")),[{key:"/",name:"Home",icon:"home"},{key:"/pages",name:"Pages",icon:"columns"},{key:"/variables",name:"Variables",icon:"sitemap"},{key:"/settings",name:"Settings",icon:"settings"},{key:"/about",name:"About",icon:"info"}].map((function(e){return r.a.createElement(U.a.Item,{key:e.key,active:t===e.key,as:u.b,to:e.key},r.a.createElement(R.a,{name:e.icon}),e.name)}))),r.a.createElement(M.a.Pusher,{style:a},r.a.createElement(f.a,{style:i,size:"small",circular:!0,icon:"sidebar",onClick:function(t){return e.toggleSidebar()}}),this.props.children)))}}]),n}(r.a.Component),K={"/":w,"/layout":x,"/pages":P,"/variables":_,"/settings":H,"/about":W};k.varSubConnect(),c.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(u.a,null,r.a.createElement(s.c,null,Object.entries(K).map((function(e){return r.a.createElement(s.a,{path:e[0],exact:!0,key:e[0]},r.a.createElement(q,null,r.a.createElement(e[1])))})),r.a.createElement(s.a,{component:N})))),document.getElementById("root")),i(),Object(l.a)()}},[[202,1,2]]]);
//# sourceMappingURL=main.2c8a0e8a.chunk.js.map