const {TCPClient,TCPServer} = require("../../index");
const {jigsaw,domainserver} = require("jigsaw.js")("127.0.0.1","127.0.0.1");
domainserver();

let jg=new jigsaw("streamserver");
let server=new TCPServer(jg);

server.on("enter",(conn,id)=>{
		conn.on("data",(data)=>{
			server.broadcast(data);
		});
});

