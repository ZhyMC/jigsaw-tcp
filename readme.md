## Jigsaw-TCP 文档

### 1.1 简介
  
这是使用Jigsaw重新封装的TCP套接字，提供服务端和客户端两种实例工厂  

### 1.2 动机
    
普通的,由操作系统接口提供的TCP套接字，虽然提供了keepAlive机制，但是间隔接近十分钟。   
不适用于对资源的分配要求苛刻的环境。使用jigsaw.js封装后，所有TCP连接自带心跳包机制，     
自动管理连接的存在，而通信仍然使用的是Node.js原生的TCP套接字。    
     
其次，封装后的TCP套接字，使用jigsaw.js网络获取网络地址,轻松的发现网络内的服务端,并建立连接。    
    
再者，由于jigsaw.js是基于JSON序列化与反序列化的，不适用于大量字节流的传送，   
故本模块提供了"透明传送"的基于TCP的可靠高效字节流传送通道,jigsaw仅管理连接的存在,所以    
不会影响到透传的性能。    

### 1.2 安装
  
在npm项目下执行命令    
```npm install ZhyMc/jigsaw-tcp --save```    
  
### 1.3 用例
  
#### 1.3.1 简单用例
    
server.js    
```
const {TCPClient,TCPServer} = require("jigsaw-tcp");
const {jigsaw} = require("jigsaw.js");

let jg=new jigsaw("jgtcpserver");
let server=new TCPServer(jg);

server.on("enter",(conn,id)=>{
	
	console.log(id,"客户端加入了连接");

	conn.on("data",(data)=>{
		console.log("收到来自客户端的数据",data);

		server.broadcast("欢迎你们");
	});
});

server.on("leave",(conn,id)=>{
	console.log(id,"客户端离开了连接");
});


```
  

client.js
```
const {TCPClient,TCPServer} = require("jigsaw-tcp");
const {jigsaw} = require("jigsaw.js");

let jg=new jigsaw();
let client=new TCPClient(jg,"jgtcpserver");

client.on("ready",()=>{
	console.log("连接TCP服务器成功");
	let sock=client.getSocket();

	sock.write("hello");
});

client.on("close",()=>{
	console.log("连接已断开");
})
```

### 1.3.2 流的分发
    
streamServer.js    
```
const {TCPClient,TCPServer} = require("jigsaw-tcp");
const {jigsaw} = require("jigsaw.js");

let jg=new jigsaw("streamserver");
let server=new TCPServer(jg);

server.on("enter",(conn,id)=>{
		conn.on("data",(data)=>{
			server.broadcast(data);
		});
});
```
    
streamPublisher.js    
```
const {TCPClient,TCPServer} = require("jigsaw-tcp");
const {jigsaw} = require("jigsaw.js");

let jg=new jigsaw("streampublisher");
let publisher=new TCPClient(jg,"streamserver");
let chunkid=0;

publisher.on("ready",()=>{
	let sock=publisher.getSocket();
	setInterval(()=>{
		sock.write("hello,i am chunk "+chunkid);
	},100);
});
```
     
streamPlayer.js    
```
const {TCPClient,TCPServer} = require("jigsaw-tcp");
const {jigsaw} = require("jigsaw.js");

let jg=new jigsaw();
let player=new TCPClient(jg,"streamserver");

player.on("ready",()=>{

	let sock=player.getSocket();

	sock.on("data",(data)=>{
		console.log(data.toString());
	})
});
```

