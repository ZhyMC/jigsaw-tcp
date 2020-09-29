const {TCPClient,TCPServer} = require("../../index");
const {jigsaw} = require("jigsaw.js")("127.0.0.1","127.0.0.1");

let jg=new jigsaw("streampublisher");
let publisher=new TCPClient(jg,"streamserver");
let chunkid=0;

publisher.on("ready",()=>{
	let sock=publisher.getSocket();
	setInterval(()=>{
		sock.write("hello,i am chunk "+(chunkid++));
	},100);
});

