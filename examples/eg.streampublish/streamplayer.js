const {TCPClient,TCPServer} = require("../../index");
const {jigsaw} = require("jigsaw.js")("127.0.0.1","127.0.0.1");

let jg=new jigsaw();
let player=new TCPClient(jg,"streamserver");

player.on("ready",()=>{

	let sock=player.getSocket();

	sock.on("data",(data)=>{
		console.log(data.toString());
	})
});
