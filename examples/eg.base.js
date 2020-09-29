const {TCPClient,TCPServer}=require("../index");
const {jigsaw,domainserver}=require("jigsaw.js")("127.0.0.1","127.0.0.1");
let domserver=domainserver();

let jg=new jigsaw("jgtcpserver");
let server=new TCPServer(jg);

server.on("enter",(conn,connid)=>{
	console.log("连接进入",connid);
	conn.on("data",(data)=>{
		console.log(connid,"发来信息",data+"");
	});
});
server.on("leave",(conn,connid)=>{
	console.log("连接离开",connid);
});


let jg2=new jigsaw();
let client=new TCPClient(jg2,"jgtcpserver");


client.on("ready",()=>{
	let sock=client.getSocket();
	sock.write("how are you, i am sending data through TCP socket!");
	sock.on("data",(data)=>{
		console.log("收到来自服务器的信息",data+"");

		server.close();
		domserver.kill();
		jg.close();
		jg2.close();
	});
	server.broadcast("开始关闭一切");
})


