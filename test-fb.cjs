const { UAParser } = require('ua-parser-js');
const ua = "Mozilla/5.0 (Linux; Android 12; CPH2213 Build/SP1A.210812.017; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.7871.32 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/567.1.0.53.87;IABMV/1;]";
const p = new UAParser(ua);
console.log(p.getResult());
